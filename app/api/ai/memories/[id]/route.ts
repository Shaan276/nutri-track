import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AIMemoryService } from "@/lib/ai/memory-service";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/ai/memories/[id]
 * Updates an individual AI memory.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const updated = await AIMemoryService.updateMemory(session.user.id, id, {
      content: body.content,
      category: body.category,
      importance: body.importance,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PATCH /api/ai/memories/[id] error:", error);
    const status = error.message?.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: error.message || "Failed to update memory" }, { status });
  }
}

/**
 * DELETE /api/ai/memories/[id]
 * Deletes a specific AI memory with ownership validation.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    await AIMemoryService.deleteMemory(session.user.id, id);

    return NextResponse.json({ success: true, message: "Memory deleted" });
  } catch (error: any) {
    console.error("DELETE /api/ai/memories/[id] error:", error);
    const status = error.message?.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: error.message || "Failed to delete memory" }, { status });
  }
}
