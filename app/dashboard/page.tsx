import {AppFrame} from '@/components/app-frame/AppFrame';
import {DashboardClient} from '@/components/dashboard/DashboardClient';

export default function DashboardPage() {
  return (
    <AppFrame contentPadding={0}>

        <DashboardClient />

    </AppFrame>
  );
}
