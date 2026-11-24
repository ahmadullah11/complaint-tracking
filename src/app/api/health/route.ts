import mongoose from "mongoose";
import { connectDB } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
    }
    return Response.json({ ok: true, database: "connected" });
  } catch (error) {
    console.error("Database health check failed", error);
    return Response.json({ ok: false, database: "disconnected" }, { status: 500 });
  }
}
