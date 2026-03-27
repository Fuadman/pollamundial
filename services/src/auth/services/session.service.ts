import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../cache/redis.service';
import { User } from '../../entities/user.entity';

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class SessionService {
  private readonly sessionPrefix = 'session:';
  private readonly refreshTokenPrefix = 'refresh_token:';

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async createSession(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const expiresIn = parseInt(
      this.configService.get<string>('JWT_EXPIRATION', '3600'),
      10,
    );

    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      {
        expiresIn,
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        type: 'refresh',
      },
      {
        expiresIn: expiresIn * 7, // Refresh token valid for 7x longer
      },
    );

    // Store session in Redis
    await this.redisService.set(
      `${this.sessionPrefix}${user.id}`,
      JSON.stringify({
        userId: user.id,
        email: user.email,
        role: user.role,
        createdAt: new Date().toISOString(),
      }),
      expiresIn,
    );

    // Store refresh token in Redis
    await this.redisService.set(
      `${this.refreshTokenPrefix}${user.id}`,
      refreshToken,
      expiresIn * 7,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  async validateSession(token: string): Promise<SessionPayload | null> {
    try {
      const payload = this.jwtService.verify(token);

      // Check if session exists in Redis
      const session = await this.redisService.get(
        `${this.sessionPrefix}${payload.sub}`,
      );

      if (!session) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  async refreshSession(
    refreshToken: string,
  ): Promise<{
    accessToken: string;
    expiresIn: number;
  } | null> {
    try {
      const payload = this.jwtService.verify(refreshToken);

      if (payload.type !== 'refresh') {
        return null;
      }

      // Verify refresh token is in Redis
      const storedToken = await this.redisService.get(
        `${this.refreshTokenPrefix}${payload.sub}`,
      );

      if (storedToken !== refreshToken) {
        return null;
      }

      const expiresIn = parseInt(
        this.configService.get<string>('JWT_EXPIRATION', '3600'),
        10,
      );

      const newAccessToken = this.jwtService.sign(
        {
          sub: payload.sub,
          type: 'access',
        },
        {
          expiresIn,
        },
      );

      return {
        accessToken: newAccessToken,
        expiresIn,
      };
    } catch (error) {
      return null;
    }
  }

  async destroySession(userId: string): Promise<void> {
    await this.redisService.delete(`${this.sessionPrefix}${userId}`);
    await this.redisService.delete(`${this.refreshTokenPrefix}${userId}`);
  }

  async getSessionInfo(userId: string): Promise<any | null> {
    const session = await this.redisService.get(
      `${this.sessionPrefix}${userId}`,
    );

    if (!session) {
      return null;
    }

    return JSON.parse(session as string);
  }

  async isSessionActive(userId: string): Promise<boolean> {
    const session = await this.redisService.get(
      `${this.sessionPrefix}${userId}`,
    );

    return session !== null;
  }
}
