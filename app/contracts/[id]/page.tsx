import {requireSession} from '@/lib/auth';
import {AppFrame} from '@/components/app-frame/AppFrame';
import {ContractDetailClient} from '@/components/contracts/ContractDetailClient';

export default async function ContractDetailPage({params}: {params:Promise<{id:string}>}) {
  const session = await requireSession();
  const {id} = await params;
  return <AppFrame user={session.user} contentPadding={0}><ContractDetailClient id={id} /></AppFrame>;
}
