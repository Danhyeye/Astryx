import {useQuery} from '@tanstack/react-query';
import {createClient} from '@/lib/supabase/client';
import type {Database} from '@/types/database.types';
import type {RentalContract} from '@/lib/contractAvailability';

// One shared snapshot per form opening; changing land only filters cached data.
export function useContractAvailability(enabled: boolean) {
  return useQuery({
    queryKey: ['contractAvailability'],
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async ({signal}) => {
      const supabase = createClient();
      const rentals: RentalContract[] = [];
      for (let offset = 0; ; offset += 500) {
        const {data, error} = await supabase.from('contracts')
          .select('id, land_id, plot_ids, status, start_date, end_date, lease_duration_months')
          .in('status', ['active', 'pending', 'completed', 'cancelled'] as unknown as Database['public']['Tables']['contracts']['Row']['status'][])
          .order('id').range(offset, offset + 499).abortSignal(signal);
        if (error) throw new Error('Không thể tải tình trạng cho thuê. Vui lòng thử lại.');
        rentals.push(...data);
        if (data.length < 500) return rentals;
      }
    },
  });
}
