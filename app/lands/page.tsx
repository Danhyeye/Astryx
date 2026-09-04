import {AppFrame} from '@/components/app-frame/AppFrame';
import {QueryProvider} from '@/components/providers/query-provider';
import TableFilterClient from '@/components/table-filter/TableFilterClient';

export default function LandsPage() {
  return (
    <AppFrame contentPadding={0}>
      <QueryProvider>
        <TableFilterClient initialDataset="lands" />
      </QueryProvider>
    </AppFrame>
  );
}
