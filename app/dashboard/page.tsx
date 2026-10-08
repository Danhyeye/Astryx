import {requireSession} from '@/lib/auth';
import {AppFrame} from '@/components/app-frame/AppFrame';
import {DashboardClient} from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  const session = await requireSession();
  return (
    <AppFrame user={session.user} contentPadding={0}>

        <DashboardClient />

    </AppFrame>
  );
}
