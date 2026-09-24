import {AppFrame} from '@/components/app-frame/AppFrame';
import {LandDetailClient} from '@/components/lands/LandDetailClient';

export default async function LandDetailPage({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  return <AppFrame><LandDetailClient id={id} /></AppFrame>;
}
