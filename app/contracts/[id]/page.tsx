import {AppFrame} from '@/components/app-frame/AppFrame';
import {ContractDetailClient} from '@/components/contracts/ContractDetailClient';

export default async function ContractDetailPage({params}: {params:Promise<{id:string}>}) {
  const {id} = await params;
  return <AppFrame contentPadding={0}><ContractDetailClient id={id} /></AppFrame>;
}
