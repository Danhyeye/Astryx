import {AppFrame} from '@/components/app-frame/AppFrame';
import {QueryProvider} from '@/components/providers/query-provider';
import {ContractDetailClient} from '@/components/contracts/ContractDetailClient';

export default async function ContractDetailPage({params}: {params:Promise<{id:string}>}) {
  const {id} = await params;
  return <AppFrame contentPadding={0}><QueryProvider><ContractDetailClient id={id} /></QueryProvider></AppFrame>;
}
