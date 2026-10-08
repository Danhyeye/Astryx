import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import {auth} from '@/auth';
import {hasSessionEmail} from '@/lib/authPolicy';
import {signInDestination} from '@/lib/signIn';
import {SignInScreen} from '@/components/auth/SignInScreen';

export const metadata: Metadata = {title: 'Đăng nhập · Quản lý đất đai'};

export default async function SignInPage({searchParams}: {
  searchParams: Promise<{error?: string; callbackUrl?: string}>;
}) {
  const params = await searchParams;
  const destination = signInDestination(typeof params.callbackUrl === 'string' ? params.callbackUrl : undefined);
  const session = await auth();
  if (hasSessionEmail(session?.user?.email)) redirect(destination);
  return <SignInScreen destination={destination} error={typeof params.error === 'string' ? params.error : undefined} />;
}
