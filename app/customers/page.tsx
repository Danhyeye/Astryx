import {requireSession} from '@/lib/auth';
import {AppFrame} from '@/components/app-frame/AppFrame';
import TableFilterClient from '@/components/table-filter/TableFilterClient';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{selected?: string | string[]}>;
}) {
  const session = await requireSession();
  const {selected} = await searchParams;
  const selectedId = typeof selected === 'string' ? selected : null;

  return (
    <AppFrame user={session.user} contentPadding={0}>

        <TableFilterClient key={selectedId ?? 'customers'} initialDataset="customers" initialSelectedId={selectedId} />

    </AppFrame>
  );
}
