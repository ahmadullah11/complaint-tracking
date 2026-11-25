import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Complaint, User } from "@/db/schema";
import { getPublicErrorMessage } from "@/lib/api-errors";
import { normalizeCnic, normalizeMobile } from "@/lib/complaints";
import { checkServerEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/account?cnic=...&mobile=...  → account details and all complaints of that account.
// Both CNIC and mobile must match so other people cannot read the account.
export async function GET(req: Request) {
  const env = checkServerEnv();
  if (!env.ok) {
    console.error(`[GET /api/account] Configuration error: ${env.message}`);
    return NextResponse.json({ error: env.message }, { status: 500 });
  }

  const params = new URL(req.url).searchParams;
  const cnic = normalizeCnic(params.get("cnic") ?? "");
  const mobile = normalizeMobile((params.get("mobile") ?? "").trim());

  if (!/^\d{13}$/.test(cnic) || !/^03\d{9}$/.test(mobile)) {
    return NextResponse.json(
      { error: "Enter a valid 13-digit CNIC and 11-digit mobile number." },
      { status: 400 },
    );
  }

  try {
    await connectDB();

    const user = await User.findOne({ cnic, mobile }).lean();

    if (!user) {
      return NextResponse.json(
        { error: "No account found for this CNIC and mobile number." },
        { status: 404 },
      );
    }

    const rows = await Complaint.find({ userId: user._id })
      .select("trackingNumber category subject status createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    const account = {
      fullName: user.fullName,
      cnic: user.cnic,
      mobile: user.mobile,
      email: user.email,
      createdAt: user.createdAt,
    };

    return NextResponse.json({ account, complaints: rows });
  } catch (err) {
    console.error(
      "[GET /api/account] Failed to load account:",
      err instanceof Error ? err.message : String(err),
    );
    console.error(
      "[GET /api/account] error.stack:",
      err instanceof Error ? err.stack : "(no stack available)",
    );
    return NextResponse.json({ error: getPublicErrorMessage(err) }, { status: 500 });
  }
}
