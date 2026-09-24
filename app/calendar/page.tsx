import {AppFrame} from '@/components/app-frame/AppFrame';
import {ContractCalendarClient} from '@/components/calendar/ContractCalendarClient';

export default function CalendarPage() {
  return (
    <AppFrame contentPadding={0}>

        <ContractCalendarClient />

    </AppFrame>
  );
}
