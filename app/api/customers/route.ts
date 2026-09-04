import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapCustomer } from "@/lib/mappers";
import type { CustomerResponse, CustomersResponse } from "@/types/customer";
import type { ApiErrorResponse } from "@/types/api-response";
import { customerSchema } from "@/lib/validations/customer";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("pageSize") ?? 10);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 500, message: error.message, data: null },
      { status: 500 }
    );
  }

  return NextResponse.json<CustomersResponse>({
    code: 200,
    message: "Success",
    data: data.map(mapCustomer),
  });
}

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      { code: 400, message: "Invalid JSON body", data: null },
      { status: 400 }
    );
  }

  const body = customerSchema.safeParse(json);
  if (!body.success) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 400, message: body.error.message, data: null },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: body.data.name,
      phone: body.data.phone,
      email: body.data.email,
      address: body.data.address,
      notes: body.data.notes,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 500, message: error.message, data: null },
      { status: 500 }
    );
  }

  return NextResponse.json<CustomerResponse>(
    { code: 201, message: "Created", data: mapCustomer(data) },
    { status: 201 }
  );
}
