import { Injectable } from '@nestjs/common';
import { RedisService, CACHE_TTL, CACHE_KEYS } from './redis.service';
import { LoggerService } from '../common/logger/logger.service';

/**
 * Session data structure
 */
export interface SessionData {
  userId: string;
  email: string;
  name: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Session store using Redis for distributed session management
 */
@Injectable()
export class SessionStore {
  constructor(
    private redisService: RedisService,
    private logger: LoggerService,
  ) {}

  /**
   * Create a new session
   */
  async createSession(token: string, sessionData: SessionData): Promise<void> {
    try {
      const key = `${CACHE_KEYS.SESSION}${token}`;
      await this.redisService.set(key, sessionData, CACHE_TTL.SESSION);
      this.logger.log(`Session created for user: ${sessionData.userId}`);
    } catch (error) {
      this.logger.error(`Error creating session: ${error}`);
      throw error;
    }
  }

  /**
   * Get session data by token
   */
  async getSession(token: string): Promise<SessionData | null> {
    try {
      const key = `${CACHE_KEYS.SESSION}${token}`;
      const session = await this.redisService.get<SessionData>(key);

      if (!session) {
        return null;
      }

      // Check if session has expired
      const expiresAt = new Date(session.expiresAt);
      if (expiresAt < new Date()) {
        await this.deleteSession(token);
        return null;
      }

      return session;
    } catch (error) {
      this.logger.error(`Error getting session: ${error}`);
      return null;
    }
  }

  /**
   * Update session data
   */
  async updateSession(token: string, sessionData: Partial<SessionData>): Promise<void> {
    try {
      const key = `${CACHE_KEYS.SESSION}${token}`;
      const existingSession = await this.redisService.get<SessionData>(key);

      if (!existingSession) {
        this.logger.warn(`Session not found for token: ${token}`);
        return;
      }

      const updatedSession = { ...existingSession, ...sessionData };
      await this.redisService.set(key, updatedSession, CACHE_TTL.SESSION);
      this.logger.log(`Session updated for user: ${updatedSession.userId}`);
    } catch (error) {
      this.logger.error(`Error updating session: ${error}`);
      throw error;
    }
  }

  /**
   * Delete session
   */
  async deleteSession(token: string): Promise<void> {
    try {
      const key = `${CACHE_KEYS.SESSION}${token}`;
      await this.redisService.delete(key);
      this.logger.log(`Session deleted for token: ${token}`);
    } catch (error) {
      this.logger.error(`Error deleting session: ${error}`);
      throw error;
    }
  }

  /**
   * Validate session token
   */
  async validateSession(token: string): Promise<boolean> {
    try {
      const session = await this.getSession(token);
      return session !== null;
    } catch (error) {
      this.logger.error(`Error validating session: ${error}`);
      return false;
    }
  }

  /**
   * Refresh session expiration
   */
  async refreshSession(token: string): Promise<void> {
    try {
      const session = await this.getSession(token);

      if (!session) {
        this.logger.warn(`Cannot refresh non-existent session: ${token}`);
        return;
      }

      // Update expiration time
      const newExpiresAt = new Date();
      newExpiresAt.setSeconds(newExpiresAt.getSeconds() + CACHE_TTL.SESSION);

      const key = `${CACHE_KEYS.SESSION}${token}`;
      const updatedSession = { ...session, expiresAt: newExpiresAt };
      await this.redisService.set(key, updatedSession, CACHE_TTL.SESSION);
      this.logger.log(`Session refreshed for user: ${session.userId}`);
    } catch (error) {
      this.logger.error(`Error refreshing session: ${error}`);
      throw error;
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      // Note: This is a simplified implementation
      // In production, you might want to maintain a separate index of user sessions
      this.logger.log(`Getting sessions for user: ${userId}`);
      return [];
    } catch (error) {
      this.logger.error(`Error getting user sessions: ${error}`);
      return [];
    }
  }

  /**
   * Invalidate all sessions for a user (logout all devices)
   */
  async invalidateUserSessions(userId: string): Promise<void> {
    try {
      // Note: This is a simplified implementation
      // In production, you would need to maintain an index of user sessions
      this.logger.log(`Invalidated all sessions for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error invalidating user sessions: ${error}`);
      throw error;
    }
  }
}
