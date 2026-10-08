import 'server-only';
import {createAdminClient} from '@/lib/supabase/admin';
import {checkUserAccess} from './userAccess';

// Never cache membership across requests: deactivation must revoke sessions.
export async function hasAppAccess(email: unknown): Promise<boolean> {
  return checkUserAccess(email, async normalizedEmail => {
    const {data, error} = await createAdminClient().from('app_users')
      .select('is_active').eq('email', normalizedEmail).maybeSingle();
    if (error) {
      console.error('Unable to check app user access', {code: error.code});
      throw error;
    }
    return data;
  });
}
