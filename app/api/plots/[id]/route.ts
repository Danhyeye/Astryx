import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapImage, mapLand, mapPlot } from "@/lib/mappers";
import { plotUpdateSchema } from "@/lib/validations/plot";
import type { PlotResponse } from "@/types/plot";
import type { ApiErrorResponse, ApiResponse } from "@/types/api-response";
import type { Database } from "@/types/database.types";

type LandRow = Database["public"]["Tables"]["lands"]["Row"];
type PlotRow = Database["public"]["Tables"]["plots"]["Row"];
type LandImageRow = Database["public"]["Tables"]["land_images"]["Row"];
type PlotRowWithRelations = PlotRow & {
  lands: LandRow | null;
  land_images: LandImageRow[];
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("plots")
    .select("*, lands(*), land_images(*)")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 404, message: "Không tìm thấy lô đất", data: null },
      { status: 404 }
    );
  }

  const { lands, land_images, ...plotRow } = data as PlotRowWithRelations;
  const images = land_images.map((img) => mapImage(img, img.storage_path));

  return NextResponse.json<PlotResponse>({
    code: 200,
    message: "Thành công",
    data: mapPlot(plotRow, lands ? [mapLand(lands)] : [], images),
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

  const body = plotUpdateSchema.safeParse(json);
  if (!body.success) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 400, message: body.error.issues.map(issue => issue.message).join(". "), data: null },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { land_id, plot_number, area_sqm, description, status, images } = body.data;

  const updatePayload: Partial<PlotRow> = {};
  if (land_id !== undefined) updatePayload.land_id = land_id;
  if (plot_number !== undefined) updatePayload.plot_number = plot_number;
  if (area_sqm !== undefined) updatePayload.area_sqm = area_sqm;
  if (description !== undefined) updatePayload.description = description;
  if (status !== undefined) updatePayload.status = status.toLowerCase() as PlotRow["status"];

  if (Object.keys(updatePayload).length > 0) {
    const { error: updateError } = await supabase
      .from("plots")
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
      .eq("plot_id", id);

    if (deleteError) {
      return NextResponse.json<ApiErrorResponse>(
        { code: 500, message: deleteError.message, data: null },
        { status: 500 }
      );
    }

    if (images.length > 0) {
      const { error: insertError } = await supabase.from("land_images").insert(
        images.map((img, index) => ({
          plot_id: id,
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
    .from("plots")
    .select("*, lands(*), land_images(*)")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 404, message: "Không tìm thấy lô đất", data: null },
      { status: 404 }
    );
  }

  const { lands, land_images, ...plotRow } = data as PlotRowWithRelations;
  const responseImages = land_images.map((img) => mapImage(img, img.storage_path));

  return NextResponse.json<PlotResponse>({
    code: 200,
    message: "Đã cập nhật",
    data: mapPlot(plotRow, lands ? [mapLand(lands)] : [], responseImages),
  });
}

export const PUT = PATCH;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from("plots").delete().eq("id", id);

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
