import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapImage, mapLand } from "@/lib/mappers";
import { landUpdateSchema } from "@/lib/validations/land";
import type { LandResponse } from "@/types/land";
import type { ApiErrorResponse } from "@/types/api-response";
import type { Database } from "@/types/database.types";

type LandRow = Database["public"]["Tables"]["lands"]["Row"];
type LandImageRow = Database["public"]["Tables"]["land_images"]["Row"];
type LandRowWithImages = LandRow & { land_images: LandImageRow[] };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lands")
    .select("*, land_images(*)")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 404, message: "Không tìm thấy khu đất", data: null },
      { status: 404 }
    );
  }

  const { land_images, ...landRow } = data as LandRowWithImages;
  const images = land_images.map((img: LandImageRow) =>
    mapImage(img, img.storage_path)
  );

  return NextResponse.json<LandResponse>({
    code: 200,
    message: "Thành công",
    data: mapLand(landRow, images),
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

  const body = landUpdateSchema.safeParse(json);
  if (!body.success) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 400, message: body.error.issues.map(issue => issue.message).join(". "), data: null },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { name, location, area_sqm, description, images } = body.data;

  const updatePayload: Partial<LandRow> = {};
  if (name !== undefined) updatePayload.name = name;
  if (location !== undefined) updatePayload.location = location;
  if (area_sqm !== undefined) updatePayload.area_sqm = area_sqm;
  if (description !== undefined) updatePayload.description = description;

  if (Object.keys(updatePayload).length > 0) {
    const { error: updateError } = await supabase
      .from("lands")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json<ApiErrorResponse>(
        { code: updateError.code === "PGRST116" ? 404 : 500, message: updateError.message, data: null },
        { status: updateError.code === "PGRST116" ? 404 : 500 }
      );
    }
  }

  if (images) {
    const { error: deleteError } = await supabase
      .from("land_images")
      .delete()
      .eq("land_id", id);

    if (deleteError) {
      return NextResponse.json<ApiErrorResponse>(
        { code: 500, message: deleteError.message, data: null },
        { status: 500 }
      );
    }

    if (images.length > 0) {
      const { error: insertError } = await supabase.from("land_images").insert(
        images.map((img, index) => ({
          land_id: id,
          storage_path: img.url,
          caption: img.caption,
          sort_order: index,
        }))
      );

      if (insertError) {
        return NextResponse.json<ApiErrorResponse>(
          { code: 500, message: insertError.message, data: null },
          { status: 500 }
        );
      }
    }
  }

  const { data, error } = await supabase
    .from("lands")
    .select("*, land_images(*)")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 404, message: "Không tìm thấy khu đất", data: null },
      { status: 404 }
    );
  }

  const { land_images, ...landRow } = data as LandRowWithImages;
  const responseImages = land_images.map((img) => mapImage(img, img.storage_path));

  return NextResponse.json<LandResponse>({
    code: 200,
    message: "Đã cập nhật",
    data: mapLand(landRow, responseImages),
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from("lands").delete().eq("id", id);

  if (error) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 500, message: error.message, data: null },
      { status: 500 }
    );
  }

  return NextResponse.json<LandResponse>({
    code: 200,
    message: "Đã xóa",
    data: null,
  });
}