export const authConfig = {
  sessionMaxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  jwtSecret: process.env.JWT_SECRET ?? "",
  providers: {
    credentials: true,
  },
} as const;
