import {redirect} from 'next/navigation';
import {AppFrame} from '@/components/app-frame/AppFrame';
import {QueryProvider} from '@/components/providers/query-provider';
import TableFilterClient from '@/components/table-filter/TableFilterClient';

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{selected?: string | string[]}>;
}) {
  const {selected} = await searchParams;
  const selectedId = typeof selected === 'string' ? selected : null;
  if (selectedId) redirect('/contracts/' + encodeURIComponent(selectedId));

  return (
    <AppFrame contentPadding={0}>
      <QueryProvider>
        <TableFilterClient key={selectedId ?? 'contracts'} initialDataset="contracts" initialSelectedId={selectedId} />
      </QueryProvider>
    </AppFrame>
  );
}
