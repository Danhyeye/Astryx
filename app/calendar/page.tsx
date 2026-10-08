import {requireSession} from '@/lib/auth';
import {AppFrame} from '@/components/app-frame/AppFrame';
import {ContractCalendarClient} from '@/components/calendar/ContractCalendarClient';

export default async function CalendarPage() {
  const session = await requireSession();
  return (
    <AppFrame user={session.user} contentPadding={0}>

        <ContractCalendarClient />

    </AppFrame>
  );
}
