import { z } from "zod";

z.config(z.locales.vi());

const imageSchema = z.object({
  url: z.string().url().or(z.string().startsWith('/api/images?path=')),
  caption: z.string().nullable().optional(),
});

export const plotStatuses = ["AVAILABLE", "RENTED", "SOLD"] as const;

export const plotSchema = z.object({
  land_id: z.string().uuid(),
  plot_number: z.string().min(1),
  area_sqm: z.number().nonnegative().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(plotStatuses).default("AVAILABLE"),
  image: imageSchema.nullable().optional(),
  images: imageSchema.array().optional(),
});

export const plotUpdateSchema = plotSchema.partial().extend({
  images: imageSchema.array().optional(), // replaces all images when provided
});

export type PlotInput = z.infer<typeof plotSchema>;
export type PlotUpdateInput = z.infer<typeof plotUpdateSchema>;
