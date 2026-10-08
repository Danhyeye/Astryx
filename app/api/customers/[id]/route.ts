import {authorizeRequest} from '@/lib/auth';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapCustomer } from "@/lib/mappers";
import { customerUpdateSchema } from "@/lib/validations/customer";
import type { CustomerResponse } from "@/types/customer";
import type { ApiErrorResponse, ApiResponse } from "@/types/api-response";
import type { Database } from "@/types/database.types";

type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await authorizeRequest(request);
  if (denied) return denied;
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 404, message: "Không tìm thấy khách hàng", data: null },
      { status: 404 }
    );
  }

  return NextResponse.json<CustomerResponse>({
    code: 200,
    message: "Thành công",
    data: mapCustomer(data),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await authorizeRequest(request);
  if (denied) return denied;
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

  const body = customerUpdateSchema.safeParse(json);
  if (!body.success) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 400, message: body.error.issues.map(issue => issue.message).join(". "), data: null },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const updatePayload: Partial<CustomerRow> = {};
  if (body.data.name !== undefined) updatePayload.name = body.data.name;
  if (body.data.phone !== undefined) updatePayload.phone = body.data.phone;
  if (body.data.email !== undefined) updatePayload.email = body.data.email;
  if (body.data.address !== undefined) updatePayload.address = body.data.address;
  if (body.data.notes !== undefined) updatePayload.notes = body.data.notes;

  const { data, error } = await supabase
    .from("customers")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json<ApiErrorResponse>(
      { code: error.code === "PGRST116" ? 404 : 500, message: error.message, data: null },
      { status: error.code === "PGRST116" ? 404 : 500 }
    );
  }

  return NextResponse.json<CustomerResponse>({
    code: 200,
    message: "Đã cập nhật",
    data: mapCustomer(data),
  });
}

export const PUT = PATCH;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await authorizeRequest(request);
  if (denied) return denied;
  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from("customers").delete().eq("id", id);

  if (error) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 500, message: error.message, data: null },
      { status: 500 }
    );
  }

  return NextResponse.json<ApiResponse<null>>({
    code: 200,
    message: "Đã xóa",
    data: null,
  });
}
