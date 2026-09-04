import type { ApiResponse } from "./api-response";
import type { Images, Image } from "./image";

export type Land = {
  id: string;
  name: string;
  location: string;
  area_sqm: number;
  description: string;
  created_at: string;
  updated_at: string;
  images: Images[];
};

export type LandFilters = {
  page?: number;
  pageSize?: number;
}

export type CreateLandPayload = {
  name: string;
  location?: string | null;
  area_sqm?: number | null;
  description?: string | null;
  image?: Image;
  images?: Image[];
};

export type UpdateLandPayload = Partial<Omit<CreateLandPayload, "image" | "images">> & {
  images?: Image[];
};

export type LandResponse = ApiResponse<Land>;

export type LandsResponse = ApiResponse<Land[]>;
