import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FeatureRequestService } from "@/lib/services/feature-request.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const requests = await FeatureRequestService.getUserRequests(session.user.id);
    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error("User feature requests fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch feature requests" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, category, priority } = body;

    const request = await FeatureRequestService.createRequest(session.user.id, {
      title,
      description,
      category,
      priority,
    });

    return NextResponse.json({ success: true, request }, { status: 201 });
  } catch (error: any) {
    console.error("User feature request creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit feature request" }, { status: 500 });
  }
}