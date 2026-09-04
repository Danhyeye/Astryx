import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapCustomer, mapImage, mapLand, mapPlot } from "@/lib/mappers";
import {
  contractTargetPatchToDatabase,
  contractStatusFromDatabase,
  contractStatusToDatabase,
  paymentFrequencyFromDatabase,
  paymentFrequencyToDatabase,
} from "@/lib/contractDbValues";
import { contractUpdateSchema } from "@/lib/validations/contract";
import type { Contract, ContractResponse } from "@/types/contract";
import type { ApiErrorResponse } from "@/types/api-response";
import type { Database } from "@/types/database.types";

type ContractRow = Database["public"]["Tables"]["contracts"]["Row"];
type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
type LandRow = Database["public"]["Tables"]["lands"]["Row"];
type PlotRow = Database["public"]["Tables"]["plots"]["Row"];
type LandImageRow = Database["public"]["Tables"]["land_images"]["Row"];
type ContractRowWithRelations = ContractRow & {
  customers: CustomerRow | null;
  lands: (LandRow & { land_images: LandImageRow[] | null }) | null;
  plots:
    | (PlotRow & {
        land_images: LandImageRow[] | null;
        lands: LandRow | null;
      })
    | null;
};

function toContract(row: ContractRowWithRelations): Contract {
  const { customers, lands, plots, ...c } = row;
  const landImages = (lands?.land_images ?? []).map((img) => mapImage(img, img.storage_path));
  const plotImages = (plots?.land_images ?? []).map((img) => mapImage(img, img.storage_path));
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
    customers: customers ? [mapCustomer(customers)] : [],
    lands: lands ? [mapLand(lands, landImages)] : [],
    plots: plots ? [mapPlot(plots, plotLand ? [plotLand] : [], plotImages)] : [],
  };
}

const CONTRACT_SELECT = `*,
  customers (*),
  lands (*, land_images(*)),
  plots (*, land_images(*), lands(*))`;

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
      { code: 404, message: "Contract not found", data: null },
      { status: 404 }
    );
  }

  return NextResponse.json<ContractResponse>({
    code: 200,
    message: "Success",
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
      { code: 400, message: "Invalid JSON body", data: null },
      { status: 400 }
    );
  }

  const body = contractUpdateSchema.safeParse(json);
  if (!body.success) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 400, message: body.error.message, data: null },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const updatePayload: Partial<ContractRow> = {};
  const targetPatch = contractTargetPatchToDatabase({
    land: body.data.land,
    plot: body.data.plot,
  });

  if (body.data.customer !== undefined) updatePayload.customer_id = body.data.customer.id;
  if (targetPatch.land_id !== undefined) {
    updatePayload.land_id = targetPatch.land_id;
  }
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
      { code: updateError.code === "PGRST116" ? 404 : 500, message: updateError.message, data: null },
      { status: updateError.code === "PGRST116" ? 404 : 500 }
    );
  }

  const { data, error } = await supabase
    .from("contracts")
    .select(CONTRACT_SELECT)
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 404, message: "Contract not found", data: null },
      { status: 404 }
    );
  }

  return NextResponse.json<ContractResponse>({
    code: 200,
    message: "Updated",
    data: toContract(data as ContractRowWithRelations),
  });
}

export const PUT = PATCH;
