import {authorizeRequest} from '@/lib/auth';
import {listParams} from '@/lib/api/listParams';
import {fetchAllPages} from '@/lib/api/fetchAllPages';
import {landMatchesRentalStatus} from '@/lib/landAvailability';
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapImage, mapLand } from "@/lib/mappers";
import type { LandsResponse, LandResponse } from "@/types/land";
import type { ApiErrorResponse } from "@/types/api-response";
import type { Database } from "@/types/database.types";
import { landSchema } from "@/lib/validations/land";

type LandRow = Database["public"]["Tables"]["lands"]["Row"];
type LandImageRow = Database["public"]["Tables"]["land_images"]["Row"];
type LandRowWithImages = LandRow & { land_images: LandImageRow[] };

export async function GET(request: NextRequest) {
  const denied = await authorizeRequest(request);
  if (denied) return denied;
  const { searchParams } = request.nextUrl;
  const {page, pageSize, from, to, sort, ascending, sort2, ascending2, search} = listParams(searchParams, "lands");


  const supabase = await createClient();
  const status = searchParams.get('status');
  if (status && !['AVAILABLE', 'RENTED', 'PENDING', 'SOLD'].includes(status)) {
    return NextResponse.json({message: 'Trạng thái không hợp lệ'}, {status: 400});
  }
  if (status) {
    try {
      const all = await fetchAllPages(async (batch, size) => {
        let filtered = supabase.from('lands')
          .select('*, land_images(*), plots(id, land_id, status), contracts(id, land_id, plot_ids, status, start_date, end_date, lease_duration_months)')
          .order(sort, {ascending}).order(sort2, {ascending: ascending2}).order('id', {ascending: true})
          .range((batch - 1) * size, batch * size - 1);
        if (search) filtered = filtered.or(['name', 'location', 'description'].map(column => `${column}.ilike.%${search}%`).join(','));
        const {data, error} = await filtered;
        if (error) throw new Error(error.message);
        return {data};
      });
      const matching = all.data.filter(land => landMatchesRentalStatus(land.id, land.plots, land.contracts, status));
      const data = matching.slice(from, to + 1).map(land =>
        mapLand(land, land.land_images.map(image => mapImage(image, image.storage_path))));
      return NextResponse.json<LandsResponse>({total: matching.length, page, pageSize, code: 200, message: 'Thành công', data});
    } catch (error) {
      return NextResponse.json({message: error instanceof Error ? error.message : 'Không thể tải khu đất'}, {status: 500});
    }
  }
  let query = supabase
    .from("lands")
    .select("*, land_images(*)", {count: "exact"})
    .order(sort, {ascending}).order(sort2, {ascending: ascending2}).order("id", { ascending: true })
    .range(from, to);
  if (search) {
    const terms = ["name", "location", "description"].map(column => `${column}.ilike.%${search}%`);
    query = query.or(terms.join(","));
  }

  const {data, error, count} = await query;

  if (error) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 500, message: error.message, data: null },
      { status: 500 }
    );
  }

  const lands = ((data ?? []) as LandRowWithImages[]).map((row) => {
    const { land_images, ...landRow } = row;
    const images = land_images.map((img: LandImageRow) =>
      mapImage(img, img.storage_path)
    );
    return mapLand(landRow, images);
  });

  return NextResponse.json<LandsResponse>({
    total: count ?? 0, page, pageSize,
    code: 200,
    message: "Thành công",
    data: lands,
  });
}

export async function POST(request: NextRequest) {
  const denied = await authorizeRequest(request);
  if (denied) return denied;
  const body = landSchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 400, message: body.error.issues.map(issue => issue.message).join(". "), data: null },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: land, error: landError } = await supabase
    .from("lands")
    .insert({
      name: body.data.name,
      location: body.data.location,
      area_sqm: body.data.area_sqm,
      description: body.data.description,
    })
    .select()
    .single();

  if (landError) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 500, message: landError.message, data: null },
      { status: 500 }
    );
  }

  const imageInputs =
    body.data.images ?? (body.data.image == null ? [] : [body.data.image]);
  let images: Parameters<typeof mapLand>[1] = [];

  if (imageInputs.length > 0) {
    const { data: imageRows, error: imageError } = await supabase
      .from("land_images")
      .insert(
        imageInputs.map((image, index) => ({
          land_id: land.id,
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

  return NextResponse.json<LandResponse>(
    { code: 201, message: "Đã tạo khu đất", data: mapLand(land, images) },
    { status: 201 }
  );
}
