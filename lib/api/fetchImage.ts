import apiService from '@/lib/core';
import type {ImagesResponse, UploadedImage} from '@/types/image';

export const imageService = {
  upload: async (file: File): Promise<UploadedImage> => {
    const response = await apiService.upload<ImagesResponse>(
      '/images',
      file,
      'images',
    );
    const uploaded = response.data.data?.[0];

    if (uploaded == null) {
      throw new Error(response.data.message || 'No uploaded image returned');
    }

    return uploaded;
  },

  uploadMany: async (files: File[]): Promise<UploadedImage[]> => {
    if (files.length === 0) {
      return [];
    }

    const response = await apiService.upload<ImagesResponse>(
      '/images',
      files,
      'images',
    );
    return response.data.data ?? [];
  },
};
