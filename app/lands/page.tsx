import {AppFrame} from '@/components/app-frame/AppFrame';
import TableFilterClient from '@/components/table-filter/TableFilterClient';

export default async function LandsPage({
  searchParams,
}: {
  searchParams: Promise<{selected?: string | string[]}>;
}) {
  const {selected} = await searchParams;
  const selectedId = typeof selected === 'string' ? selected : null;

  return (
    <AppFrame contentPadding={0}>

        <TableFilterClient key={selectedId ?? 'lands'} initialDataset="lands" initialSelectedId={selectedId} />

    </AppFrame>
  );
}
