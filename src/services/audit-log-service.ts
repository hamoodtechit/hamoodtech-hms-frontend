import { api } from "@/lib/api";
import { AuditLogPaginatedResponse, AuditLogQueryParams } from "@/types/audit-log";

export const auditLogService = {
  getAuditLogs: async (params?: AuditLogQueryParams) => {
    const response = await api.get<AuditLogPaginatedResponse>('/settings/audit-logs/all', {
      params: {
        page: 1,
        limit: 10,
        ...params
      }
    });
    return response.data;
  }
};
