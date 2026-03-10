export const featureFlags = {
  aiAssistant: process.env.NEXT_PUBLIC_FEATURE_AI === "true",
  mapView: process.env.NEXT_PUBLIC_FEATURE_MAP === "true",
  evidenceCapture: process.env.NEXT_PUBLIC_FEATURE_EVIDENCE === "true",
} as const;
