import mongoose from "mongoose";
import { connectDB } from "@/db";
import { getPublicErrorMessage } from "@/lib/api-errors";
import { checkServerEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const env = checkServerEnv();
  if (!env.ok) {
    console.error(`[GET /api/health] Configuration error: ${env.message}`);
    return Response.json(
      { ok: false, database: "not-configured", error: env.message },
      { status: 500 },
    );
  }

  try {
    await connectDB();
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
    }
    return Response.json({ ok: true, database: "connected" });
  } catch (error) {
    console.error(
      "[GET /api/health] Database health check failed:",
      error instanceof Error ? error.message : String(error),
    );
    console.error(
      "[GET /api/health] error.stack:",
      error instanceof Error ? error.stack : "(no stack available)",
    );
    return Response.json(
      { ok: false, database: "disconnected", error: getPublicErrorMessage(error) },
      { status: 500 },
    );
  }
}
