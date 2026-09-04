import type { Database } from "@/types/database.types";
import type { Customer } from "@/types/customer";
import type { Images } from "@/types/image";
import type { Land } from "@/types/land";
import type { Plot, Status } from "@/types/plot";

type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
type LandRow = Database["public"]["Tables"]["lands"]["Row"];
type PlotRow = Database["public"]["Tables"]["plots"]["Row"];
type ImageRow = Database["public"]["Tables"]["land_images"]["Row"];

export function mapImage(row: ImageRow, publicUrl: string): Images {
  return {
    id: row.id,
    path: row.storage_path,
    url: publicUrl,
    caption: row.caption ?? "",
    sort_order: row.sort_order,
    created_at: row.created_at,
  };
}

export function mapCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? "",
    email: row.email ?? "",
    address: row.address ?? "",
    notes: row.notes ?? "",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapLand(row: LandRow, images: Images[] = []): Land {
  return {
    id: row.id,
    name: row.name,
    location: row.location ?? "",
    area_sqm: row.area_sqm ?? 0,
    description: row.description ?? "",
    created_at: row.created_at,
    updated_at: row.updated_at,
    images,
  };
}

export function mapPlot(
  row: PlotRow,
  lands: Land[] = [],
  images: Images[] = []
): Plot {
  return {
    id: row.id,
    land_id: row.land_id,
    plot_number: row.plot_number,
    area_sqm: row.area_sqm ?? 0,
    status: row.status.toUpperCase() as Status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    description: row.description ?? "",
    lands,
    images,
  };
}
