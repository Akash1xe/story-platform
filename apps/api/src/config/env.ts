import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32)
    .refine(
      (secret) => secret !== "replace-this-with-a-random-secret-at-least-32-characters",
      "Generate a unique BETTER_AUTH_SECRET before starting the API.",
    ),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid API environment: ${details}`);
}

export const env = parsedEnv.data;
