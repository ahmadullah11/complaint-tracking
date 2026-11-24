import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Complaint, User } from "@/db/schema";
import { formatTrackingNumber, validateComplaintInput } from "@/lib/complaints";

export const dynamic = "force-dynamic";

function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { code?: number };
  return anyErr.code === 11000;
}

// Submit a complaint: creates/updates the user account (by CNIC) and saves the complaint
// with a unique tracking number generated from the current date, time and seconds.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validated = validateComplaintInput(body);
  if (!validated.ok) {
    return NextResponse.json(
      { error: "Please correct the highlighted fields.", errors: validated.errors },
      { status: 400 },
    );
  }
  const data = validated.data;

  try {
    await connectDB();

    // 1. Save / update the account for this CNIC.
    const user = await User.findOneAndUpdate(
      { cnic: data.cnic },
      {
        $set: {
          fullName: data.fullName,
          mobile: data.mobile,
          email: data.email,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // 2. Create the complaint with a unique tracking number (date + time + seconds).
    //    If the same second is already taken, move to the next second.
    let complaint;
    const base = Date.now();
    for (let i = 0; i < 300 && !complaint; i++) {
      const trackingNumber = formatTrackingNumber(new Date(base + i * 1000));
      try {
        complaint = await Complaint.create({
          trackingNumber,
          userId: user._id,
          ...(data.category ? { category: data.category } : {}),
          subject: data.subject,
          description: data.description,
          status: "Pending",
        });
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
      }
    }

    if (!complaint) {
      return NextResponse.json(
        { error: "Could not generate a tracking number. Please try again." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        message: "Complaint submitted successfully.",
        trackingNumber: complaint.trackingNumber,
        status: complaint.status,
        createdAt: complaint.createdAt,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Failed to submit complaint", err);
    return NextResponse.json({ error: "Server error. Please try again later." }, { status: 500 });
  }
}
