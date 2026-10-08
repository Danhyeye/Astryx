import {useQuery} from '@tanstack/react-query';
import {fetchAllPages} from '@/lib/api/fetchAllPages';
import type {RentalContract} from '@/lib/contractAvailability';

// One shared snapshot per form opening; changing land only filters cached data.
export function useContractAvailability(enabled: boolean) {
  return useQuery({
    queryKey: ['contractAvailability'],
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({signal}) => {
      const result = await fetchAllPages<RentalContract>(async (page, pageSize) => {
        const response = await fetch(`/api/contracts/availability?page=${page}&pageSize=${pageSize}`, {signal});
        if (!response.ok) throw new Error('Không thể tải tình trạng cho thuê. Vui lòng thử lại.');
        return response.json();
      }, signal);
      return result.data;
    },
  });
}
