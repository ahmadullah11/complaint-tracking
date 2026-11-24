import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Complaint, IUser } from "@/db/schema";
import { isTrackingNumber } from "@/lib/complaints";

export const dynamic = "force-dynamic";

// GET /api/complaints/track?number=CMP20260315143045
export async function GET(req: Request) {
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
    console.error("Failed to track complaint", err);
    return NextResponse.json({ error: "Server error. Please try again later." }, { status: 500 });
  }
}
