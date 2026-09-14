import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  contractTargetToDatabase,
  contractStatusToDatabase,
  paymentFrequencyToDatabase,
} from "@/lib/contractDbValues";
import type {
  Contract,
  ContractResponse,
  ContractsResponse,
  ContractStatus,
} from "@/types/contract";
import type { ApiErrorResponse } from "@/types/api-response";
import type { Database } from "@/types/database.types";
import { contractSchema } from "@/lib/validations/contract";

type ContractRow = Database["public"]["Tables"]["contracts"]["Row"];
import {CONTRACT_SELECT, toContract, type ContractRowWithRelations} from '@/lib/api/contractRows';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("pageSize") ?? 10);
  const status = searchParams.get("status") as ContractStatus | null;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  let query = supabase
    .from("contracts")
    .select(CONTRACT_SELECT)
    .order("created_at", { ascending: false }).order("id", { ascending: true })
    .range(from, to);

  if (status) {
    query = query.eq(
      "status",
      contractStatusToDatabase(status) as ContractRow["status"],
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 500, message: error.message, data: null },
      { status: 500 }
    );
  }

  const contracts: Contract[] = ((data ?? []) as ContractRowWithRelations[]).map(
    toContract,
  );

  return NextResponse.json<ContractsResponse>({
    code: 200,
    message: "Thành công",
    data: contracts,
  });
}

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      { code: 400, message: "Nội dung yêu cầu không hợp lệ", data: null },
      { status: 400 }
    );
  }

  const body = contractSchema.safeParse(json);
  if (!body.success) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 400, message: body.error.issues.map(issue => issue.message).join(". "), data: null },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const target = contractTargetToDatabase({
    land: body.data.land,
    plots: body.data.plots,
  });
  const { data, error } = await supabase
    .from("contracts")
    .insert({
      customer_id: body.data.customer.id,
      land_id: target.land_id,
      plot_id: target.plot_id,
      plot_ids: target.plot_ids,
      deposit_amount: body.data.deposit_amount,
      rent_amount: body.data.rent_amount,
      due_day: body.data.due_day,
      lease_duration_months: body.data.lease_duration_months,
      payment_frequency: paymentFrequencyToDatabase(
        body.data.payment_frequency,
      ) as ContractRow["payment_frequency"],
      payment_due_day: body.data.payment_due_day,
      next_payment_due_date: body.data.next_payment_due_date,
      start_date: body.data.start_date,
      end_date: body.data.end_date,
      status: contractStatusToDatabase(body.data.status) as ContractRow["status"],
      notes: body.data.notes,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json<ApiErrorResponse>(
      { code: error.code === "23505" ? 409 : error.code === "23514" ? 400 : 500, message: error.message, data: null },
      { status: error.code === "23505" ? 409 : error.code === "23514" ? 400 : 500 }
    );
  }

  // Read relations after the trigger has finished maintaining contract_plots.
  const {data: saved, error: readError} = await supabase.from('contracts')
    .select(CONTRACT_SELECT).eq('id', data.id).single();
  if (readError) return NextResponse.json<ApiErrorResponse>(
    {code: 500, message: readError.message, data: null}, {status: 500},
  );

  return NextResponse.json<ContractResponse>(
    {
      code: 201,
      message: "Đã tạo",
      data: toContract(saved as ContractRowWithRelations),
    },
    { status: 201 }
  );
}
