import { api } from "@/lib/api"
import { SettingName, SettingsResponse, SingleSettingResponse } from "@/types/settings"

export const settingsService = {
    getSettings: async () => {
        const response = await api.get<SettingsResponse>('/settings')
        return response.data
    },

    getSetting: async <T>(name: SettingName) => {
        const response = await api.get<SingleSettingResponse<T>>(`/settings/${name}`)
        return response.data
    },

    updateSetting: async <T>(name: SettingName, configs: Partial<T>) => {
        const response = await api.patch<SingleSettingResponse<T>>(`/settings/${name}`, { configs })
        return response.data
    }
}
