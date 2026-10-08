import type {Metadata} from 'next';
import {requireSession} from '@/lib/auth';
import {AppFrame} from '@/components/app-frame/AppFrame';
import {ProfileSettings} from '@/components/settings/ProfileSettings';

export const metadata: Metadata = {title: 'Cài đặt hồ sơ · Quản lý đất đai'};

export default async function ProfilePage() {
  const session = await requireSession();
  return <AppFrame user={session.user}><ProfileSettings user={session.user} /></AppFrame>;
}
