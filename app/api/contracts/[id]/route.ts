import {createAdminClient} from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  contractTargetPatchToDatabase,
  contractStatusFromDatabase,
  contractStatusToDatabase,
  paymentFrequencyFromDatabase,
  paymentFrequencyToDatabase,
} from "@/lib/contractDbValues";
import {
  contractUpdateSchema,
  validateContractUpdate,
  type ContractInput,
} from "@/lib/validations/contract";
import type { ContractResponse } from "@/types/contract";
import type { ApiErrorResponse } from "@/types/api-response";
import type { Database } from "@/types/database.types";

type ContractRow = Database["public"]["Tables"]["contracts"]["Row"];
import {CONTRACT_SELECT, toContract, type ContractRowWithRelations} from '@/lib/api/contractRows';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contracts")
    .select(CONTRACT_SELECT)
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 404, message: "Không tìm thấy hợp đồng", data: null },
      { status: 404 }
    );
  }

  return NextResponse.json<ContractResponse>({
    code: 200,
    message: "Thành công",
    data: toContract(data as ContractRowWithRelations),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      { code: 400, message: "Nội dung yêu cầu không hợp lệ", data: null },
      { status: 400 }
    );
  }

  const body = contractUpdateSchema.safeParse(json);
  if (!body.success) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 400, message: body.error.issues.map(issue => issue.message).join(". "), data: null },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {data: persistedData, error: persistedError} = await supabase
    .from('contracts')
    .select(CONTRACT_SELECT)
    .eq('id', id)
    .single();

  if (persistedError || persistedData == null) {
    return NextResponse.json<ApiErrorResponse>(
      {code: 404, message: 'Không tìm thấy hợp đồng.', data: null},
      {status: 404},
    );
  }

  const persisted = persistedData as ContractRowWithRelations;
  const persistedInput: ContractInput = {
    customer: {id: persisted.customer_id},
    land: {id: persisted.land_id!},
    plots: persisted.plot_ids.map(id => ({id})),
    deposit_amount: persisted.deposit_amount,
    rent_amount: persisted.rent_amount,
    due_day: persisted.due_day,
    lease_duration_months: persisted.lease_duration_months,
    payment_frequency: paymentFrequencyFromDatabase(
      persisted.payment_frequency,
    ),
    payment_due_day: persisted.payment_due_day,
    next_payment_due_date: persisted.next_payment_due_date,
    start_date: persisted.start_date,
    end_date: persisted.end_date,
    status: contractStatusFromDatabase(persisted.status),
    notes: persisted.notes,
  };
  const mergedValidation = validateContractUpdate(
    persistedInput,
    body.data,
    {hasPersistedPayments: (persisted.contract_payments?.length ?? 0) > 0},
  );

  if (!mergedValidation.success) {
    return NextResponse.json<ApiErrorResponse>(
      {code: 400, message: mergedValidation.error.issues.map(issue => issue.message).join(". "), data: null},
      {status: 400},
    );
  }

  const updatePayload: Partial<ContractRow> = {};
  const targetPatch = contractTargetPatchToDatabase({
    land: body.data.land,
    plots: body.data.plots,
  });

  if (body.data.customer !== undefined) updatePayload.customer_id = body.data.customer.id;
  if (targetPatch.land_id !== undefined) {
    updatePayload.land_id = targetPatch.land_id;
  }
  if (targetPatch.plot_ids !== undefined) updatePayload.plot_ids = targetPatch.plot_ids;
  if (targetPatch.plot_id !== undefined) {
    updatePayload.plot_id = targetPatch.plot_id;
  }
  if (body.data.deposit_amount !== undefined) updatePayload.deposit_amount = body.data.deposit_amount;
  if (body.data.rent_amount !== undefined) updatePayload.rent_amount = body.data.rent_amount;
  if (body.data.due_day !== undefined) updatePayload.due_day = body.data.due_day;
  if (body.data.lease_duration_months !== undefined) updatePayload.lease_duration_months = body.data.lease_duration_months;
  if (body.data.payment_frequency !== undefined) {
    updatePayload.payment_frequency = paymentFrequencyToDatabase(
      body.data.payment_frequency,
    ) as ContractRow["payment_frequency"];
  }
  if (body.data.payment_due_day !== undefined) updatePayload.payment_due_day = body.data.payment_due_day;
  if (body.data.next_payment_due_date !== undefined) updatePayload.next_payment_due_date = body.data.next_payment_due_date;
  if (body.data.start_date !== undefined) updatePayload.start_date = body.data.start_date;
  if (body.data.end_date !== undefined) updatePayload.end_date = body.data.end_date;
  if (body.data.status !== undefined) {
    updatePayload.status = contractStatusToDatabase(
      body.data.status,
    ) as ContractRow["status"];
  }
  if (body.data.notes !== undefined) updatePayload.notes = body.data.notes;

  const { error: updateError } = await supabase
    .from("contracts")
    .update(updatePayload)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json<ApiErrorResponse>(
      { code: updateError.code === "23505" ? 409 : updateError.code === "23514" ? 400 : updateError.code === "PGRST116" ? 404 : 500, message: updateError.message, data: null },
      { status: updateError.code === "23505" ? 409 : updateError.code === "23514" ? 400 : updateError.code === "PGRST116" ? 404 : 500 }
    );
  }

  const { data, error } = await supabase
    .from("contracts")
    .select(CONTRACT_SELECT)
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 404, message: "Không tìm thấy hợp đồng", data: null },
      { status: 404 }
    );
  }

  return NextResponse.json<ContractResponse>({
    code: 200,
    message: "Đã cập nhật",
    data: toContract(data as ContractRowWithRelations),
  });
}

export const PUT = PATCH;

export async function DELETE(request: NextRequest, {params}: {params:Promise<{id:string}>}) {
  const {id}=await params;
  const supabase=await createClient();
  const {data:contract,error:loadError}=await supabase.from('contracts').select('id').eq('id',id).maybeSingle();
  if(loadError || !contract) return NextResponse.json({message:'Không tìm thấy hợp đồng.'},{status:404});
  try {
    const admin=createAdminClient();
    const bucket=admin.storage.from('contract-file');
    const paths:string[]=[];
    for(let offset=0;;offset+=100){
      const {data,error}=await bucket.list(id,{limit:100,offset});
      if(error)throw error;
      paths.push(...data.filter(file=>file.id).map(file=>id+'/'+file.name));
      if(data.length<100)break;
    }
    if(paths.length){
      const {error}=await bucket.remove(paths);
      if(error)throw error;
    }
    // Keep external event mappings for selected-day sync cleanup after the contract is gone.
    const {error:mappingError}=await admin.from('calendar_sync_events')
      .update({contract_id:null,contract_payment_id:null}).eq('contract_id',id);
    if(mappingError)throw mappingError;
    const {data:deleted,error}=await supabase.from('contracts').delete().eq('id',id).select('id').maybeSingle();
    if(error)throw error;
    if(!deleted)return NextResponse.json({message:'Không thể xóa hợp đồng.'},{status:409});
    return NextResponse.json({data:{id},message:'Đã xóa hợp đồng.'});
  }catch{
    return NextResponse.json({message:'Không thể hoàn tất xóa hợp đồng. Vui lòng thử lại.'},{status:500});
  }
}
