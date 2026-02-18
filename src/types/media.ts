export interface Media {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  publicId?: string;
  type?: string;
  metadata?: any;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaListResponse {
  success: boolean;
  data: Media[];
  meta: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
