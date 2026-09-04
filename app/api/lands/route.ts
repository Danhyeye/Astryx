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
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("pageSize") ?? 10);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lands")
    .select("*, land_images(*)")
    .order("created_at", { ascending: false })
    .range(from, to);

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
    code: 200,
    message: "Success",
    data: lands,
  });
}

export async function POST(request: NextRequest) {
  const body = landSchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json<ApiErrorResponse>(
      { code: 400, message: body.error.message, data: null },
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
    { code: 201, message: "Created land successfully", data: mapLand(land, images) },
    { status: 201 }
  );
}
