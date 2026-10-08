import 'server-only';
import {requireSession} from '@/lib/auth';
import {createAdminClient} from './admin';

// NextAuth authenticates the request before server-side database access.
// Never expose the service-role key or a Supabase session to the browser.
export async function createClient() {
  await requireSession();
  return createAdminClient();
}
