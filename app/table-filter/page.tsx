import {QueryProvider} from '@/components/providers/query-provider';
import TableFilterClient from '@/components/table-filter/TableFilterClient';

export default function TableFilterPage() {
  return (
    <QueryProvider>
      <TableFilterClient />
    </QueryProvider>
  );
}
