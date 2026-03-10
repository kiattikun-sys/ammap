import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser";

export interface UploadedFile {
  fileUrl: string;
  filePath: string;
  thumbnailUrl: string | null;
}

export async function uploadEvidenceFile(
  file: File,
  projectId: string
): Promise<UploadedFile> {
  const supabase = createSupabaseBrowser();
  const fileId = crypto.randomUUID();
  const ext = file.name.split(".").pop() ?? "bin";
  const filePath = `projects/${projectId}/evidence/${fileId}.${ext}`;

  const { error } = await supabase.storage
    .from("evidence-files")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from("evidence-files")
    .getPublicUrl(filePath);

  const fileUrl = urlData.publicUrl;

  return {
    fileUrl,
    filePath,
    thumbnailUrl: file.type.startsWith("image/") ? fileUrl : null,
  };
}

export function getEvidenceTypeFromFile(file: File): "photo" | "video" | "document" {
  if (file.type.startsWith("image/")) return "photo";
  if (file.type.startsWith("video/")) return "video";
  return "document";
}
