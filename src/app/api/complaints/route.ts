import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Complaint, User } from "@/db/schema";
import { formatTrackingNumber, validateComplaintInput } from "@/lib/complaints";
import { getPublicErrorMessage } from "@/lib/api-errors";
import { checkServerEnv } from "@/lib/env";

// Mongoose needs the Node.js runtime (it cannot run on Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { code?: number };
  return anyErr.code === 11000;
}

// Submit a complaint: creates/updates the user account (by CNIC) and saves the complaint
// with a unique tracking number generated from the current date, time and seconds.
export async function POST(req: Request) {
  // Fail fast with a clear message when Vercel is missing required configuration.
  const env = checkServerEnv();
  if (!env.ok) {
    console.error(`[POST /api/complaints] Configuration error: ${env.message}`);
    return NextResponse.json({ error: env.message }, { status: 500 });
  }

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
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
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
    const message = getPublicErrorMessage(err);

    console.error("[POST /api/complaints] Failed to submit complaint.");
    console.error(
      "[POST /api/complaints] error.message:",
      err instanceof Error ? err.message : String(err),
    );
    console.error(
      "[POST /api/complaints] error.stack:",
      err instanceof Error ? err.stack : "(no stack available)",
    );

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
