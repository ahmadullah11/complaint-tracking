// Server-only environment helpers. Never import this from a client component.

const MONGO_URI_VARIABLES = ["MONGODB_URI", "DATABASE_URL"] as const;

export type MongoConnectionEnv = {
  uri: string;
  variable: (typeof MONGO_URI_VARIABLES)[number];
};

/**
 * Returns the first configured MongoDB connection string.
 * `MONGODB_URI` wins, with `DATABASE_URL` supported as an alias for hosts
 * (e.g. some Vercel integrations) that expose the connection under that name.
 */
export function getMongoConnectionEnv(): MongoConnectionEnv | null {
  for (const variable of MONGO_URI_VARIABLES) {
    const value = process.env[variable]?.trim();
    if (value) {
      return { uri: value, variable };
    }
  }

  return null;
}

export function requireMongoConnectionEnv(): MongoConnectionEnv {
  const env = getMongoConnectionEnv();

  if (!env) {
    throw new Error(
      "Database is not configured: set MONGODB_URI (or DATABASE_URL) in Vercel → Project Settings → Environment Variables (Production), then redeploy.",
    );
  }

  return env;
}

export type ServerEnvCheck =
  | { ok: true; mongo: MongoConnectionEnv }
  | { ok: false; missing: string[]; message: string };

/**
 * Validates the environment variables required by a route handler.
 *
 * Pass extra names in `required` when a route genuinely needs them. Only
 * variables that the route actually uses should be required, otherwise a
 * missing unused secret would take the endpoint down.
 */
export function checkServerEnv(required: readonly string[] = []): ServerEnvCheck {
  const mongo = getMongoConnectionEnv();
  const missing: string[] = [];

  if (!mongo) {
    missing.push("MONGODB_URI or DATABASE_URL");
  }

  for (const name of required) {
    if (!process.env[name]?.trim()) {
      missing.push(name);
    }
  }

  if (missing.length > 0 || !mongo) {
    const label = missing.length === 1 ? "variable" : "variables";
    const message =
      `Missing required environment ${label}: ${missing.join(", ")}. ` +
      "Add them in Vercel → Project Settings → Environment Variables (Production), then redeploy.";
    return { ok: false, missing, message };
  }

  return { ok: true, mongo };
}
