import {requireSession} from '@/lib/auth';
import {redirect} from 'next/navigation';

export default async function Home() {
  await requireSession();
  redirect('/dashboard');
}
