import { z } from "zod";
import type { SpatialNodeType } from "../model/spatial-node";

export const SPATIAL_NODE_TYPES = ["site", "building", "floor", "level", "zone", "area"] as const;
export type SpatialNodeTypeExtended = SpatialNodeType;

export const createSpatialNodeSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  type: z.enum(SPATIAL_NODE_TYPES),
  parentId: z.string().nullable().optional(),
  geometry: z
    .object({
      type: z.enum(["polygon", "line", "point"]),
      geojson: z.any(),
    })
    .optional(),
});

export type CreateSpatialNodeInput = z.infer<typeof createSpatialNodeSchema>;

export const VALID_PARENT_TYPES: Record<SpatialNodeType, SpatialNodeType[]> = {
  site: [],
  building: ["site"],
  floor: ["building"],
  level: ["building"],
  zone: ["floor", "level"],
  area: ["zone"],
};

export function validateSpatialHierarchy(
  childType: SpatialNodeType,
  parentType: SpatialNodeType | null
): { valid: boolean; reason?: string } {
  const allowed = VALID_PARENT_TYPES[childType];

  if (allowed.length === 0) {
    if (parentType !== null) {
      return { valid: false, reason: `"${childType}" must be a root node (no parent allowed)` };
    }
    return { valid: true };
  }

  if (childType === "building") {
    if (parentType === null || parentType === "site") return { valid: true };
    return { valid: false, reason: `"building" parent must be "site", got "${parentType}"` };
  }

  if (parentType === null) {
    return { valid: false, reason: `"${childType}" requires a parent of type: ${allowed.join(" or ")}` };
  }

  if (!allowed.includes(parentType)) {
    return {
      valid: false,
      reason: `"${childType}" requires a parent of type: ${allowed.join(" or ")}, got "${parentType}"`,
    };
  }

  return { valid: true };
}
