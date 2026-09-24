import {listParams} from '@/lib/api/listParams';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapImage, mapLand, mapPlot } from "@/lib/mappers";
import { plotSchema } from "@/lib/validations/plot";
import type { PlotsResponse, PlotResponse } from "@/types/plot";
import type { ApiErrorResponse } from "@/types/api-response";
import type { Database } from "@/types/database.types";

type LandRow = Database["public"]["Tables"]["lands"]["Row"];
type PlotRow = Database["public"]["Tables"]["plots"]["Row"];
type LandImageRow = Database["public"]["Tables"]["land_images"]["Row"];
type PlotRowWithRelations = PlotRow & {
  lands: LandRow | null;
  land_images: LandImageRow[];
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const {page, pageSize, from, to, sort, ascending, sort2, ascending2, search} = listParams(searchParams, "plots");
  const status = searchParams.get("status");


  const supabase = await createClient();
  let query = supabase
    .from("plots")
    .select("*, lands(*), land_images(*)", {count: "exact"})
    .order(sort, {ascending}).order(sort2, {ascending: ascending2}).order("id", { ascending: true })
    .range(from, to);

  if (status) {
    query = query.eq("status", status.toLowerCase() as PlotRow["status"]);
  }


  if (search) {
    const terms = ["plot_number", "description"].map(column => `${column}.ilike.%${search}%`);
    const {data: matchingLands, error: landError} = await supabase.from("lands").select("id").or(`name.ilike.%${search}%,location.ilike.%${search}%`);
    if (landError) return NextResponse.json({message: landError.message}, {status: 500});
    if (matchingLands?.length) terms.push(`land_id.in.(${matchingLands.map(row => row.id).join(",")})`);
    query = query.or(terms.join(","));
  }
  if (searchParams.get("landId")) query = query.eq("land_id", searchParams.get("landId")!);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 500, message: error.message, data: null },
      { status: 500 }
    );
  }

  const plots = ((data ?? []) as PlotRowWithRelations[]).map((row) => {
    const { lands, land_images, ...plotRow } = row;
    const images = land_images.map((img) => mapImage(img, img.storage_path));
    return mapPlot(plotRow, lands ? [mapLand(lands)] : [], images);
  });

  return NextResponse.json<PlotsResponse>({
    total: count ?? 0, page, pageSize,
    code: 200,
    message: "Thành công",
    data: plots,
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

  const body = plotSchema.safeParse(json);
  if (!body.success) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 400, message: body.error.issues.map(issue => issue.message).join(". "), data: null },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: plot, error: plotError } = await supabase
    .from("plots")
    .insert({
      land_id: body.data.land_id,
      plot_number: body.data.plot_number,
      area_sqm: body.data.area_sqm,
      description: body.data.description,
      status: body.data.status.toLowerCase() as PlotRow["status"],
    })
    .select()
    .single();

  if (plotError) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 500, message: plotError.message, data: null },
      { status: 500 }
    );
  }

  const imageInputs =
    body.data.images ?? (body.data.image == null ? [] : [body.data.image]);
  let images: Parameters<typeof mapPlot>[2] = [];

  if (imageInputs.length > 0) {
    const { data: imageRows, error: imageError } = await supabase
      .from("land_images")
      .insert(
        imageInputs.map((image, index) => ({
          plot_id: plot.id,
          storage_path: image.url,
          caption: image.caption ?? null,
          sort_order: index,
        }))
      )
      .select();

    if (imageError) {
      return NextResponse.json<ApiErrorResponse>(
        { code: 500, message: imageError.message, data: null },
        { status: 500 }
      );
    }

    images = ((imageRows ?? []) as LandImageRow[]).map((imageRow) =>
      mapImage(imageRow, imageRow.storage_path)
    );
  }

  return NextResponse.json<PlotResponse>(
    { code: 201, message: "Đã tạo", data: mapPlot(plot, [], images) },
    { status: 201 }
  );
}
