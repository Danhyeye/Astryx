import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {googleCalendarService} from '@/lib/api/fetchGoogleCalendar';

export function useGoogleCalendarStatus() {
  return useQuery({
    queryKey: ['googleCalendarStatus'],
    queryFn: googleCalendarService.getStatus,
  });
}

export function useSyncGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: googleCalendarService.sync,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['googleCalendarStatus']});
    },
  });
}
