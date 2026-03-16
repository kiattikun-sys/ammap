import { z } from "zod";

const storageUrlSchema = z
  .string()
  .url("Must be a valid URL")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return (
          parsed.protocol === "https:" &&
          parsed.hostname.includes("supabase")
        );
      } catch {
        return false;
      }
    },
    { message: "file_url must be an HTTPS Supabase storage URL" }
  );

export const createEvidenceSchema = z.object({
  type: z.enum(["photo", "video", "document"]),
  title: z.string().min(1, "Title is required").max(255),
  fileUrl: storageUrlSchema,
  thumbnailUrl: z.string().url().nullable().optional(),
  description: z.string().nullable().optional(),
  spatialNodeId: z.string().nullable().optional(),
  workItemId: z.string().nullable().optional(),
  defectId: z.string().nullable().optional(),
  locationLng: z.number().min(-180).max(180).nullable().optional(),
  locationLat: z.number().min(-90).max(90).nullable().optional(),
  capturedBy: z.string().nullable().optional(),
  capturedAt: z.coerce.date().nullable().optional(),
});

export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;
