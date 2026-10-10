import { api } from "@/lib/api"

export interface BackupOverview {
    provider: string | null
    connected: boolean
    autoBackupEnabled: boolean
    cronExpression: string | null
    timezone: string
    retentionCount: number
    googleDriveRetentionCount: number
    lastSuccessfulBackup: any | null
    lastFailedBackup: any | null
    currentJob: any | null
}

export interface BackupHistoryItem {
    id: string
    status: "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED" | "INTERRUPTED"
    startedAt: string | null
    completedAt: string | null
    fileSize: number | null
    error: string | null
    googleDriveFileId: string | null
    createdAt: string
}

export interface BackupConfig {
    autoBackupEnabled: boolean
    cronExpression: string
    timezone: string
    retentionCount: number
    googleDriveRetentionCount: number
}

export interface DriveStatus {
    connected: boolean
    provider: string | null
    folderId: string | null
    email: string | null
}

export const backupService = {
    // --- Overview & History ---
    getOverview: async () => {
        const response = await api.get<{ success: boolean; data: BackupOverview }>('/backups/overview')
        return response.data
    },

    getHistory: async () => {
        const response = await api.get<{ success: boolean; data: BackupHistoryItem[] }>('/backups/history')
        return response.data
    },

    getHistoryItem: async (id: string) => {
        const response = await api.get<{ success: boolean; data: BackupHistoryItem }>(`/backups/history/${id}`)
        return response.data
    },

    // --- Configuration ---
    updateConfig: async (config: Partial<BackupConfig>) => {
        const response = await api.put('/backups/config', config)
        return response.data
    },

    // --- Manual Trigger ---
    triggerBackup: async () => {
        const response = await api.post('/backups/trigger')
        return response.data
    },

    // --- Google Drive OAuth ---
    startOAuth: async () => {
        const response = await api.get<{ success: boolean; data: { authorizationUrl: string; state: string } }>('/backups/google-drive/oauth/start')
        return response.data
    },

    completeOAuth: async (code: string, state: string, folderId: string) => {
        const response = await api.post('/backups/google-drive/oauth/callback', { code, state, folderId })
        return response.data
    },

    // --- Google Drive Service Account ---
    connectServiceAccount: async (folderId: string, serviceAccount: { client_email: string; private_key: string }) => {
        const response = await api.post('/backups/google-drive/service-account', { folderId, serviceAccount })
        return response.data
    },

    // --- Google Drive Status / Test / Disconnect ---
    getDriveStatus: async () => {
        const response = await api.get<{ success: boolean; data: DriveStatus }>('/backups/google-drive/status')
        return response.data
    },

    testDriveConnection: async () => {
        const response = await api.post('/backups/google-drive/test')
        return response.data
    },

    disconnectDrive: async () => {
        const response = await api.delete('/backups/google-drive')
        return response.data
    },
}
