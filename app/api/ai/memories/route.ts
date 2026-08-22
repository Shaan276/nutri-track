import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AIMemoryService } from "@/lib/ai/memory-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/ai/memories
 * Retrieves all saved AI memories for the authenticated user.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memories = await AIMemoryService.getUserMemories(session.user.id);
    return NextResponse.json({ success: true, data: memories, memories });
  } catch (error: any) {
    console.error("GET /api/ai/memories error:", error);
    return NextResponse.json({ error: error.message || "Failed to load AI memories" }, { status: 500 });
  }
}

/**
 * POST /api/ai/memories
 * Adds a new custom AI memory for the authenticated user.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.content || typeof body.content !== "string") {
      return NextResponse.json({ error: "Memory content string is required" }, { status: 400 });
    }

    const memory = await AIMemoryService.addMemory(session.user.id, {
      content: body.content,
      category: body.category || "GENERAL",
      importance: body.importance || 1,
      source: "USER_STATED",
    });

    return NextResponse.json({ success: true, data: memory, memory });
  } catch (error: any) {
    console.error("POST /api/ai/memories error:", error);
    return NextResponse.json({ error: error.message || "Failed to save AI memory" }, { status: 400 });
  }
}

/**
 * DELETE /api/ai/memories[?id=...][?clearAll=true]
 * Deletes a single memory or clears all memories for the user.
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const clearAll = url.searchParams.get("clearAll") === "true";
    const id = url.searchParams.get("id");

    if (clearAll) {
      const count = await AIMemoryService.clearAllMemories(session.user.id);
      return NextResponse.json({ success: true, message: `Cleared ${count} memories` });
    }

    if (!id) {
      return NextResponse.json({ error: "Memory id or clearAll parameter is required" }, { status: 400 });
    }

    await AIMemoryService.deleteMemory(session.user.id, id);
    return NextResponse.json({ success: true, message: "Memory deleted" });
  } catch (error: any) {
    console.error("DELETE /api/ai/memories error:", error);
    const status = error.message?.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: error.message || "Failed to delete memory" }, { status });
  }
}
