import 'dotenv/config';

import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DB_HOST: z.string().trim().min(1).default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().positive().max(65_535).default(3306),
  DB_USER: z.string().trim().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z
    .string()
    .trim()
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'must be a safe MySQL identifier'),
  DB_CONNECTION_LIMIT: z.coerce.number().int().min(1).max(50).default(10),
});

export interface AppConfig {
  environment: 'development' | 'test' | 'production';
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    connectionLimit: number;
  };
}

export function parseConfig(
  environment: Record<string, string | undefined> | NodeJS.ProcessEnv,
): AppConfig {
  const result = environmentSchema.safeParse(environment);

  if (!result.success) {
    const fields = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${fields}`);
  }

  return {
    environment: result.data.NODE_ENV,
    database: {
      host: result.data.DB_HOST,
      port: result.data.DB_PORT,
      user: result.data.DB_USER,
      password: result.data.DB_PASSWORD,
      database: result.data.DB_NAME,
      connectionLimit: result.data.DB_CONNECTION_LIMIT,
    },
  };
}

export function loadConfig(): AppConfig {
  return parseConfig(process.env);
}
