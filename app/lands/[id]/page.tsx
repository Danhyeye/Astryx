import {requireSession} from '@/lib/auth';
import {AppFrame} from '@/components/app-frame/AppFrame';
import {LandDetailClient} from '@/components/lands/LandDetailClient';

export default async function LandDetailPage({params, searchParams}: {
  params: Promise<{id: string}>;
  searchParams: Promise<{plot?: string | string[]}>;
}) {
  const session = await requireSession();
  const {id} = await params;
  const {plot} = await searchParams;
  const initialPlotId = typeof plot === 'string' && plot ? plot : null;
  return <AppFrame user={session.user}><LandDetailClient key={`${id}:${initialPlotId ?? ''}`} id={id} initialPlotId={initialPlotId} /></AppFrame>;
}
