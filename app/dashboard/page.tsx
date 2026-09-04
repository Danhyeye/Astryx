import {AppFrame} from '@/components/app-frame/AppFrame';
import {DashboardClient} from '@/components/dashboard/DashboardClient';
import {QueryProvider} from '@/components/providers/query-provider';

export default function DashboardPage() {
  return (
    <AppFrame contentPadding={0}>
      <QueryProvider>
        <DashboardClient />
      </QueryProvider>
    </AppFrame>
  );
}
