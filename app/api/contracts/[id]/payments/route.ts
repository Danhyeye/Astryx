import {z} from 'zod';
import {authorizeRequest} from '@/lib/auth';
import {createClient} from '@/lib/supabase/server';
import {CONTRACT_SELECT, toContract, type ContractRowWithRelations} from '@/lib/api/contractRows';
import {buildContractPaymentSchedule} from '@/lib/contractPaymentSchedule';
import {validatePaymentPeriod} from '@/lib/paymentPeriod';

const schema = z.object({
  originalDate: z.string(), dueDate: z.string(), amount: z.number().finite(),
  expectedAmount: z.number().finite(),
});

export async function PATCH(request: Request, {params}: {params: Promise<{id: string}>}) {
  const denied = await authorizeRequest(request);
  if (denied) return denied;
  const {id} = await params;
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!z.string().uuid().safeParse(id).success || !body.success) return Response.json({message: 'Thông tin kỳ thanh toán không hợp lệ.'}, {status: 400});
  const supabase = await createClient();
  const {data: row, error: loadError} = await supabase.from('contracts').select(CONTRACT_SELECT).eq('id', id).single();
  if (loadError || !row) return Response.json({message: 'Không tìm thấy hợp đồng.'}, {status: 404});
  const contract = toContract(row as ContractRowWithRelations);
  const payment = buildContractPaymentSchedule(contract, body.data.originalDate.slice(0, 7)).find(payment => payment.due_date === body.data.originalDate);
  if (!payment) return Response.json({message: 'Kỳ thanh toán đã thay đổi. Vui lòng tải lại hợp đồng.'}, {status: 409});
  if (payment.amount !== body.data.expectedAmount) return Response.json({message: 'Kỳ thanh toán đã thay đổi. Vui lòng tải lại hợp đồng.'}, {status: 409});
  const validation = validatePaymentPeriod({contract, payment, ...body.data});
  if (validation) return Response.json({message: validation}, {status: 400});
  const {data, error} = await supabase.rpc('edit_contract_payment', {
    p_contract_id: id, p_original_date: body.data.originalDate, p_due_date: body.data.dueDate,
    p_amount: body.data.amount, p_expected_amount: body.data.expectedAmount,
  });
  if (error) return Response.json({message: error.code === '23505' ? 'Ngày đến hạn đã có kỳ thanh toán khác.' : error.message}, {status: error.code === 'P0002' ? 404 : error.code === '40001' || error.code === '23505' ? 409 : error.code === '22023' ? 400 : 500});
  return Response.json({data});
}
