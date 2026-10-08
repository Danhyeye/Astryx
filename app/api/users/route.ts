import {authorizeRequest} from '@/lib/auth';
import {createClient} from '@/lib/supabase/server';
import {listParams} from '@/lib/api/listParams';
import type {AppUsersResponse} from '@/types/app-user';

export async function GET(request: Request) {
  const denied = await authorizeRequest(request);
  if (denied) return denied;
  const {page, pageSize, from, to} = listParams(new URL(request.url).searchParams, 'app_users');
  const supabase = await createClient();
  const [users, active] = await Promise.all([
    supabase.from('app_users').select('email,is_active,created_at', {count: 'exact'})
      .order('email').range(from, to),
    supabase.from('app_users').select('email', {head: true, count: 'exact'}).eq('is_active', true),
  ]);
  if (users.error || active.error) {
    return Response.json({message: 'Không thể tải danh sách tài khoản. Vui lòng thử lại.'}, {status: 500});
  }
  const total = users.count ?? 0;
  const activeCount = active.count ?? 0;
  return Response.json({data: users.data ?? [], total, activeCount,
    disabledCount: Math.max(0, total - activeCount), page, pageSize} satisfies AppUsersResponse,
  {headers: {'Cache-Control': 'private, no-store'}});
}
