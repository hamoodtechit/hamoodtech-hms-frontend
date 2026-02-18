import { api } from "@/lib/api";
import { Media, MediaListResponse } from "@/types/media";

export const mediaService = {
  getMedia: async (params?: { page?: number; limit?: number; type?: string; search?: string }): Promise<MediaListResponse> => {
    const response = await api.get<MediaListResponse>("/media", { params });
    return response.data;
  },

  getMediaById: async (id: string): Promise<{ success: boolean; data: Media }> => {
    const response = await api.get<{ success: boolean; data: Media }>(`/media/${id}`);
    return response.data;
  },

  uploadMedia: async (file: File): Promise<{ success: boolean; data: Media }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ success: boolean; data: Media }>("/media/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  uploadMultipleMedia: async (files: File[]): Promise<{ success: boolean; data: Media[] }> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    const response = await api.post<{ success: boolean; data: Media[] }>("/media/upload-multiple", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  updateMedia: async (id: string, data: any): Promise<{ success: boolean; data: Media }> => {
    const response = await api.patch<{ success: boolean; data: Media }>(`/media/${id}`, data);
    return response.data;
  },

  deleteMedia: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/media/${id}`);
    return response.data;
  },
};
