import {authorizeRequest} from '@/lib/auth';
import {createClient} from '@/lib/supabase/server';
import {listParams} from '@/lib/api/listParams';

export async function GET(request: Request) {
  const denied = await authorizeRequest(request);
  if (denied) return denied;
  const {from, to} = listParams(new URL(request.url).searchParams, 'contracts');
  const supabase = await createClient();
  const {data, error} = await supabase.from('contracts')
    .select('id, land_id, plot_ids, status, start_date, end_date, lease_duration_months')
    .order('id').range(from, to);
  if (error) return Response.json({message: 'Không thể tải tình trạng cho thuê.'}, {status: 500});
  return Response.json({data});
}
