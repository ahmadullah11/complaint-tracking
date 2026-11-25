import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Complaint, IUser } from "@/db/schema";
import { getPublicErrorMessage } from "@/lib/api-errors";
import { isTrackingNumber } from "@/lib/complaints";
import { checkServerEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/complaints/track?number=CMP20260315143045
export async function GET(req: Request) {
  const env = checkServerEnv();
  if (!env.ok) {
    console.error(`[GET /api/complaints/track] Configuration error: ${env.message}`);
    return NextResponse.json({ error: env.message }, { status: 500 });
  }

  const number = (new URL(req.url).searchParams.get("number") ?? "").trim().toUpperCase();

  if (!isTrackingNumber(number)) {
    return NextResponse.json(
      { error: "Invalid tracking number. It looks like CMP followed by 14 digits." },
      { status: 400 },
    );
  }

  try {
    await connectDB();

    const row = await Complaint.findOne({ trackingNumber: number })
      .populate<{ userId: IUser }>("userId", "fullName")
      .lean();

    if (!row) {
      return NextResponse.json(
        { error: "No complaint found with this tracking number." },
        { status: 404 },
      );
    }

    const complaint = {
      trackingNumber: row.trackingNumber,
      category: row.category,
      subject: row.subject,
      description: row.description,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      fullName: row.userId?.fullName ?? "Unknown",
    };

    return NextResponse.json({ complaint });
  } catch (err) {
    console.error(
      "[GET /api/complaints/track] Failed to track complaint:",
      err instanceof Error ? err.message : String(err),
    );
    console.error(
      "[GET /api/complaints/track] error.stack:",
      err instanceof Error ? err.stack : "(no stack available)",
    );
    return NextResponse.json({ error: getPublicErrorMessage(err) }, { status: 500 });
  }
}
