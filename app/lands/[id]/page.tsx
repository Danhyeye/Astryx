import {AppFrame} from '@/components/app-frame/AppFrame';
import {QueryProvider} from '@/components/providers/query-provider';
import {LandDetailClient} from '@/components/lands/LandDetailClient';

export default async function LandDetailPage({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  return <AppFrame><QueryProvider><LandDetailClient id={id} /></QueryProvider></AppFrame>;
}
