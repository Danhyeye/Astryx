import {useQuery} from '@tanstack/react-query';
import type {ApiResponse} from '@/types/api-response';

export function useEntityPage<T>(entity: string, params: {page: number; pageSize: number; q?: string; status?: string; sort?: string; direction?: string; sort2?: string; direction2?: string; landId?: string}, enabled: boolean) {
  return useQuery({
    queryKey: [entity, 'page', params],
    enabled,
    queryFn: async ({signal}): Promise<ApiResponse<T[]>> => {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {if (value !== undefined && value !== '') search.set(key, String(value));});
      const response = await fetch(`/api/${entity}?${search}`, {signal});
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? 'Không thể tải dữ liệu.');
      return result;
    },
  });
}
