import {listParams} from '@/lib/api/listParams';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapCustomer } from "@/lib/mappers";
import type { CustomerResponse, CustomersResponse } from "@/types/customer";
import type { ApiErrorResponse } from "@/types/api-response";
import { customerSchema } from "@/lib/validations/customer";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const {page, pageSize, from, to, sort, ascending, sort2, ascending2, search} = listParams(searchParams, "customers");


  const supabase = await createClient();
  let query = supabase
    .from("customers")
    .select("*", {count: "exact"})
    .order(sort, {ascending}).order(sort2, {ascending: ascending2}).order("id", { ascending: true })
    .range(from, to);
  if (search) {
    const terms = ["name", "phone", "email", "address"].map(column => `${column}.ilike.%${search}%`);
    query = query.or(terms.join(","));
  }

  const {data, error, count} = await query;

  if (error) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 500, message: error.message, data: null },
      { status: 500 }
    );
  }

  return NextResponse.json<CustomersResponse>({
    total: count ?? 0, page, pageSize,
    code: 200,
    message: "Thành công",
    data: data.map(mapCustomer),
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

  const body = customerSchema.safeParse(json);
  if (!body.success) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 400, message: body.error.issues.map(issue => issue.message).join(". "), data: null },
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
    { code: 201, message: "Đã tạo", data: mapCustomer(data) },
    { status: 201 }
  );
}
