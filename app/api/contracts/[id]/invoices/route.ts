import {z} from 'zod';
import {authorizeRequest} from '@/lib/auth';
import {createClient} from '@/lib/supabase/server';

const invoiceSchema = z.object({
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().finite().positive(),
  invoiceId: z.string().uuid(),
});

export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  const denied = await authorizeRequest(request);
  if (denied) return denied;
  const {id} = await params;
  const body = invoiceSchema.safeParse(await request.json().catch(() => null));
  if (!z.string().uuid().safeParse(id).success || !body.success) {
    return Response.json({code: '22023', message: 'Thông tin thanh toán không hợp lệ.'}, {status: 400});
  }
  const supabase = await createClient();
  const {data, error} = await supabase.rpc('pay_contract_invoice', {
    p_contract_id: id, p_due_date: body.data.dueDate,
    p_payment_date: body.data.paymentDate, p_amount: body.data.amount,
    p_invoice_id: body.data.invoiceId,
  });
  if (error) return Response.json({code: error.code, message: error.message}, {
    status: error.code === 'P0002' ? 404 : error.code === '22023' ? 400 : 500,
  });
  return Response.json({data});
}
