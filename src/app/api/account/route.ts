import { NextResponse } from "next/server";
import { connectDB } from "@/db";
import { Complaint, User } from "@/db/schema";
import { normalizeCnic, normalizeMobile } from "@/lib/complaints";

export const dynamic = "force-dynamic";

// GET /api/account?cnic=...&mobile=...  → account details and all complaints of that account.
// Both CNIC and mobile must match so other people cannot read the account.
export async function GET(req: Request) {
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
    console.error("Failed to load account", err);
    return NextResponse.json({ error: "Server error. Please try again later." }, { status: 500 });
  }
}
