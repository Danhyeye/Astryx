import {authorizeRequest} from '@/lib/auth';
import {listParams} from '@/lib/api/listParams';
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
  const denied = await authorizeRequest(request);
  if (denied) return denied;
  const { searchParams } = request.nextUrl;
  const {page, pageSize, from, to, sort, ascending, sort2, ascending2, search} = listParams(searchParams, "contracts");
  const status = searchParams.get("status");
  const landId = searchParams.get('landId');
  const plotId = searchParams.get('plotId');
  const uuid = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
  if ((landId && !uuid.test(landId)) || (plotId && !uuid.test(plotId))) {
    return NextResponse.json({message: 'Mã khu đất hoặc lô đất không hợp lệ.'}, {status: 400});
  }


  const supabase = await createClient();
  let query = supabase
    .from("contracts")
    .select(CONTRACT_SELECT, {count: "exact"})
    .order(sort, {ascending}).order(sort2, {ascending: ascending2}).order("id", { ascending: true })
    .range(from, to);

  if (landId) query = query.eq('land_id', landId);
  if (plotId) query = query.or(`plot_ids.cs.{${plotId}},plot_ids.eq.{}`);

  if (status) {
    query = query.eq(
      "status",
      contractStatusToDatabase(status as ContractStatus) as ContractRow["status"],
    );
  }


  if (search) {
    const terms = ["notes"].map(column => `${column}.ilike.%${search}%`);
    const {data: matchingLands, error: landError} = await supabase.from("lands").select("id").or(`name.ilike.%${search}%,location.ilike.%${search}%`);
    if (landError) return NextResponse.json({message: landError.message}, {status: 500});
    if (matchingLands?.length) terms.push(`land_id.in.(${matchingLands.map(row => row.id).join(",")})`);
    const [{data: matchingCustomers, error: customerError}, {data: matchingPlots, error: plotError}] = await Promise.all([supabase.from("customers").select("id").ilike("name", `%${search}%`), supabase.from("plots").select("id").ilike("plot_number", `%${search}%`)]);
    if (customerError || plotError) return NextResponse.json({message: "Không thể tìm kiếm hợp đồng"}, {status: 500});
    if (matchingCustomers?.length) terms.push(`customer_id.in.(${matchingCustomers.map(row => row.id).join(",")})`);
    if (matchingPlots?.length) terms.push(`plot_ids.ov.{${matchingPlots.map(row => row.id).join(",")}}`);
    query = query.or(terms.join(","));
  }

  const { data, error, count } = await query;

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
    total: count ?? 0, page, pageSize,
    code: 200,
    message: "Thành công",
    data: contracts,
  });
}

export async function POST(request: NextRequest) {
  const denied = await authorizeRequest(request);
  if (denied) return denied;
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
