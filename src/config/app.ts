export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "Construction Platform",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  environment: process.env.NODE_ENV ?? "development",
} as const;
