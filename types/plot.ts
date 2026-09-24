import type { ApiResponse } from "./api-response";
import type { Land } from "./land";
import type { Images } from "./image";

export type Status = "AVAILABLE" | "RENTED" | "SOLD";

export type Plot = {
  id: string;
  land_id: string;
  plot_number: string;
  area_sqm: number;
  status: Status;
  created_at: string;
  updated_at: string;
  description: string;
  lands: Land[];
  images: Images[];
};

export type PlotFilters = {
  landId?: string;
  page?: number;
  pageSize?: number;
  status?: Status;
}

export type CreatePlotPayload = {
  land_id: string;
  plot_number: string;
  area_sqm?: number | null;
  status: Status;
  description?: string | null;
  image?: PlotImagePayload | null;
  images?: PlotImagePayload[];
};

export type PlotImagePayload = {
  url: string;
  caption?: string | null;
};

export type UpdatePlotPayload = Partial<Omit<CreatePlotPayload, "image" | "images">> & {
  images?: PlotImagePayload[];
};

export type PlotsResponse = ApiResponse<Plot[]>;

export type PlotResponse = ApiResponse<Plot>;
