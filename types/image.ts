import type { ApiResponse } from "./api-response";

export type Images = {
  id: string;
  path: string;
  url: string;
  caption: string;
  sort_order: number;
  created_at: string;
};

export type Image = {
  url: string;
  caption?: string | null;
};

export type UploadedImage = Image;

export type ImagesResponse = ApiResponse<UploadedImage[]>;
