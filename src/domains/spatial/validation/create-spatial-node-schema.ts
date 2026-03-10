import { z } from "zod";

export const createSpatialNodeSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  type: z.enum(["site", "building", "floor", "zone", "area"]),
  parentId: z.string().nullable().optional(),
  geometry: z
    .object({
      type: z.enum(["polygon", "line", "point"]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      geojson: z.any(),
    })
    .optional(),
});

export type CreateSpatialNodeInput = z.infer<typeof createSpatialNodeSchema>;
