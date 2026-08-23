import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminService } from "@/lib/services/admin/admin.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const preApprovals = await AdminService.getPreApprovedUsers();
    return NextResponse.json({ success: true, preApprovals });
  } catch (error: any) {
    console.error("Admin pre-approvals list error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch pre-approvals" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { email, notes, password } = body;
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    if (password && password.trim().length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    const entry = await AdminService.addPreApproval(session.user.id, email, notes, password);
    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error: any) {
    console.error("Admin pre-approval creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to create pre-approval" }, { status: 500 });
  }
}