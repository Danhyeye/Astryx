import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapCustomer, mapImage, mapLand, mapPlot } from "@/lib/mappers";
import {
  contractTargetToDatabase,
  contractStatusFromDatabase,
  contractStatusToDatabase,
  paymentFrequencyFromDatabase,
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
type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
type LandRow = Database["public"]["Tables"]["lands"]["Row"];
type PlotRow = Database["public"]["Tables"]["plots"]["Row"];
type LandImageRow = Database["public"]["Tables"]["land_images"]["Row"];
type ContractRowWithRelations = ContractRow & {
  contract_payments: Database['public']['Tables']['contract_payments']['Row'][] | null;
  customers: CustomerRow | null;
  lands: (LandRow & { land_images: LandImageRow[] | null }) | null;
  plots:
    | (PlotRow & {
        land_images: LandImageRow[] | null;
        lands: LandRow | null;
      })
    | null;
};

const CONTRACT_SELECT = `*,
  contract_payments (*), customers (*),
  lands (*, land_images(*)),
  plots (*, land_images(*), lands(*))`;

function toContract(row: ContractRowWithRelations): Contract {
  const { customers, lands, plots, ...c } = row;

  const landImages = (lands?.land_images ?? []).map((img: LandImageRow) =>
    mapImage(img, img.storage_path)
  );
  const plotImages = (plots?.land_images ?? []).map((img: LandImageRow) =>
    mapImage(img, img.storage_path)
  );
  const plotLand = plots?.lands ? mapLand(plots.lands) : null;

  return {
    id: c.id,
    deposit_amount: c.deposit_amount,
    rent_amount: c.rent_amount,
    due_day: c.due_day,
    lease_duration_months: c.lease_duration_months ?? 0,
    payment_frequency: paymentFrequencyFromDatabase(c.payment_frequency),
    payment_due_day: c.payment_due_day ?? 0,
    next_payment_due_date: c.next_payment_due_date ?? "",
    start_date: c.start_date,
    end_date: c.end_date ?? "",
    status: contractStatusFromDatabase(c.status),
    notes: c.notes ?? "",
    created_at: c.created_at,
    updated_at: c.updated_at,
    payments: row.contract_payments ?? [],
    customers: customers ? [mapCustomer(customers)] : [],
    lands: lands ? [mapLand(lands, landImages)] : [],
    plots: plots ? [mapPlot(plots, plotLand ? [plotLand] : [], plotImages)] : [],
  };
}

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
    plot: body.data.plot,
  });
  const { data, error } = await supabase
    .from("contracts")
    .insert({
      customer_id: body.data.customer.id,
      land_id: target.land_id,
      plot_id: target.plot_id,
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
    .select(CONTRACT_SELECT)
    .single();

  if (error) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 500, message: error.message, data: null },
      { status: 500 }
    );
  }

  return NextResponse.json<ContractResponse>(
    {
      code: 201,
      message: "Đã tạo",
      data: toContract(data as ContractRowWithRelations),
    },
    { status: 201 }
  );
}
