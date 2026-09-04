import {useMutation, useQuery} from '@tanstack/react-query';
import type {UploadedImage} from '@/types/image';

import {imageService} from '@/lib/api/fetchImage';

export function useUploadImages(files: File[], enabled: boolean = true) {
  return useQuery<UploadedImage[]>({
    queryKey: ['images', ...files.map(f => f.name)],
    queryFn: () => imageService.uploadMany(files),
    enabled,
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: (file: File) => imageService.upload(file),
  });
}
