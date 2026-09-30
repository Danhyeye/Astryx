import { useMutation } from '@tanstack/react-query';

import { imageService } from '@/lib/api/fetchImage';

export function useUploadImage() {
  return useMutation({
    mutationFn: (file: File) => imageService.upload(file),
  });
}
