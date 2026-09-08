import {AppFrame} from '@/components/app-frame/AppFrame';
import {QueryProvider} from '@/components/providers/query-provider';
import TableFilterClient from '@/components/table-filter/TableFilterClient';

export default async function PlotsPage({
  searchParams,
}: {
  searchParams: Promise<{selected?: string | string[]}>;
}) {
  const {selected} = await searchParams;
  const selectedId = typeof selected === 'string' ? selected : null;

  return (
    <AppFrame contentPadding={0}>
      <QueryProvider>
        <TableFilterClient key={selectedId ?? 'plots'} initialDataset="plots" initialSelectedId={selectedId} />
      </QueryProvider>
    </AppFrame>
  );
}
