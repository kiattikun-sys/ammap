"use client";

import { EvidenceUpload } from "./evidence-upload";

interface EvidenceUploadModalProps {
  projectId: string;
  spatialNodeId?: string | null;
  defectId?: string | null;
  workItemId?: string | null;
  locationLng?: number | null;
  locationLat?: number | null;
  onClose: () => void;
  onUploaded?: () => void;
}

export function EvidenceUploadModal({
  projectId,
  spatialNodeId,
  defectId,
  workItemId,
  locationLng,
  locationLat,
  onClose,
  onUploaded,
}: EvidenceUploadModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-500 shadow hover:text-slate-800"
        >
          ✕
        </button>
        <EvidenceUpload
          projectId={projectId}
          spatialNodeId={spatialNodeId}
          defectId={defectId}
          workItemId={workItemId}
          locationLng={locationLng}
          locationLat={locationLat}
          onUploaded={() => {
            onUploaded?.();
            onClose();
          }}
        />
      </div>
    </div>
  );
}
