export type AppEnv = {
  DATABASE_URL: string;
};

type EnvSource = {
  DATABASE_URL?: string;
};

function assertDatabaseUrl(value: string): string {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error("DATABASE_URL must be a valid URL.");
  }

  if (!["postgres:", "postgresql:"].includes(parsedUrl.protocol)) {
    throw new Error("DATABASE_URL must start with postgres:// or postgresql://.");
  }

  return value;
}

export function readAppEnv(source?: EnvSource): AppEnv {
  const env = source ?? (process.env as unknown as EnvSource);
  const databaseUrl = env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }

  return {
    DATABASE_URL: assertDatabaseUrl(databaseUrl),
  };
}
