import {AppFrame} from '@/components/app-frame/AppFrame';
import {ContractCalendarClient} from '@/components/calendar/ContractCalendarClient';
import {QueryProvider} from '@/components/providers/query-provider';

export default function CalendarPage() {
  return (
    <AppFrame contentPadding={0}>
      <QueryProvider>
        <ContractCalendarClient />
      </QueryProvider>
    </AppFrame>
  );
}
