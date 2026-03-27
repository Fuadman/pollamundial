import { SetMetadata } from '@nestjs/common';

export interface AuditLogMetadata {
  action: string;
  resource: string;
}

export const AuditLog = (metadata: AuditLogMetadata) =>
  SetMetadata('auditLog', metadata);
