import 'server-only';
import {redirect} from 'next/navigation';
import {auth} from '@/auth';
import {hasSessionEmail, requestAccessStatus} from '@/lib/authPolicy';

export async function requireSession() {
  const session = await auth();
  if (!session?.user || !hasSessionEmail(session.user.email)) redirect('/signin');
  return {...session, user: session.user};
}

export async function authorizeRequest(request: Request) {
  const status = requestAccessStatus(request, await auth(), process.env.AUTH_URL);
  if (status) return Response.json({
    code: status,
    message: status === 401 ? 'Vui lòng đăng nhập để tiếp tục.' : 'Bạn không có quyền truy cập.',
    data: null,
  }, {status, headers: {'Cache-Control': 'no-store'}});
  return null;
}
