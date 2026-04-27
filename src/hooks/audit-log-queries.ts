import { useQuery } from "@tanstack/react-query";
import { auditLogService } from "@/services/audit-log-service";
import { AuditLogQueryParams } from "@/types/audit-log";

export const AUDIT_LOG_KEYS = {
  all: ["audit-logs"] as const,
  list: (params?: AuditLogQueryParams) => [...AUDIT_LOG_KEYS.all, "list", params] as const,
};

export function useAuditLogs(params?: AuditLogQueryParams) {
  return useQuery({
    queryKey: AUDIT_LOG_KEYS.list(params),
    queryFn: () => auditLogService.getAuditLogs(params),
  });
}
