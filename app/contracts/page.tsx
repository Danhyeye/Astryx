import {AppFrame} from '@/components/app-frame/AppFrame';
import {QueryProvider} from '@/components/providers/query-provider';
import TableFilterClient from '@/components/table-filter/TableFilterClient';

export default function ContractsPage() {
  return (
    <AppFrame contentPadding={0}>
      <QueryProvider>
        <TableFilterClient initialDataset="contracts" />
      </QueryProvider>
    </AppFrame>
  );
}
