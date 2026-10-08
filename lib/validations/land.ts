import { z } from "zod";

z.config(z.locales.vi());

const imageSchema = z.object({
  url: z.string().url().or(z.string().startsWith('/api/images?path=')),
  caption: z.string().nullable().optional(),
});

export const landSchema = z.object({
  name: z.string().min(1),
  location: z.string().nullable().optional(),
  area_sqm: z.number().nonnegative().nullable().optional(),
  description: z.string().nullable().optional(),
  image: imageSchema.nullable().optional(),
  images: imageSchema.array().optional(),
});

export const landUpdateSchema = landSchema.partial().extend({
  images: imageSchema.array().optional(),
});

export type LandInput = z.infer<typeof landSchema>;
export type LandUpdateInput = z.infer<typeof landUpdateSchema>;
