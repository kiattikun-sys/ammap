"use client";

import { useRef, useState } from "react";
import { uploadEvidenceFile, getEvidenceTypeFromFile } from "@/domains/evidence/services/evidence-upload-service";
import { createEvidence } from "@/domains/evidence/actions/create-evidence";

interface EvidenceUploadProps {
  projectId: string;
  spatialNodeId?: string | null;
  defectId?: string | null;
  workItemId?: string | null;
  locationLng?: number | null;
  locationLat?: number | null;
  onUploaded?: () => void;
}

export function EvidenceUpload({
  projectId,
  spatialNodeId,
  defectId,
  workItemId,
  locationLng,
  locationLat,
  onUploaded,
}: EvidenceUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview({ file, url });
    setTitle(file.name.replace(/\.[^.]+$/, ""));
    setProgress("idle");
    setErrorMsg(null);
  }

  async function handleUpload() {
    if (!preview || !title.trim()) return;
    setProgress("uploading");
    setErrorMsg(null);
    try {
      const uploaded = await uploadEvidenceFile(preview.file, projectId);
      await createEvidence(projectId, {
        type: getEvidenceTypeFromFile(preview.file),
        title: title.trim(),
        fileUrl: uploaded.fileUrl,
        thumbnailUrl: uploaded.thumbnailUrl ?? undefined,
        spatialNodeId: spatialNodeId ?? undefined,
        defectId: defectId ?? undefined,
        workItemId: workItemId ?? undefined,
        locationLng: locationLng ?? undefined,
        locationLat: locationLat ?? undefined,
        capturedBy: null,
        capturedAt: new Date(),
      });
      setProgress("done");
      setPreview(null);
      setTitle("");
      if (inputRef.current) inputRef.current.value = "";
      onUploaded?.();
    } catch (err) {
      setProgress("error");
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
    }
  }

  function handleCancel() {
    setPreview(null);
    setTitle("");
    setProgress("idle");
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">Upload Evidence</h3>

      {!preview ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 py-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <span className="text-2xl">📎</span>
          <span className="text-sm font-medium text-slate-600">Click to select file</span>
          <span className="text-xs text-slate-400">Photo, video, or document</span>
        </button>
      ) : (
        <div className="space-y-3">
          {/* Preview */}
          <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {preview.file.type.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.url}
                alt="Preview"
                className="max-h-48 w-full object-contain"
              />
            ) : preview.file.type.startsWith("video/") ? (
              <video
                src={preview.url}
                controls
                className="max-h-48 w-full"
              />
            ) : (
              <div className="flex h-24 items-center justify-center gap-2">
                <span className="text-3xl">📄</span>
                <span className="text-sm text-slate-600">{preview.file.name}</span>
              </div>
            )}
          </div>

          {/* Title input */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Describe the evidence"
            />
          </div>

          {/* Location info */}
          {locationLng != null && locationLat != null && (
            <p className="text-xs text-slate-400">
              📍 {locationLat.toFixed(5)}, {locationLng.toFixed(5)}
            </p>
          )}

          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {errorMsg}
            </div>
          )}

          {progress === "done" && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-600">
              ✓ Uploaded successfully
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={progress === "uploading" || !title.trim()}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {progress === "uploading" ? "Uploading…" : "Upload"}
            </button>
            <button
              onClick={handleCancel}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
