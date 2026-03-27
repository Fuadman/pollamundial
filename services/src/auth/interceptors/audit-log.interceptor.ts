import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../../common/logger/logger.service';
import { AuditLogMetadata } from '../decorators/audit-log.decorator';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditLog = this.reflector.get<AuditLogMetadata>(
      'auditLog',
      context.getHandler(),
    );

    if (!auditLog) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const { action, resource } = auditLog;

    const startTime = Date.now();

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - startTime;
        this.logger.log(
          `AUDIT: User ${user?.id} performed action "${action}" on resource "${resource}" in ${duration}ms`,
        );
      }),
    );
  }
}
