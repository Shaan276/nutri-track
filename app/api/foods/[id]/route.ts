import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FoodService } from "@/lib/services/food.service";
import { foodInputSchema } from "@/lib/validations/food";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/foods/[id]
 * Fetch one specific food by ID with ownership verification.
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const food = await FoodService.getFoodById(params.id, session.user.id);
    if (!food) {
      return NextResponse.json({ error: "Food item not found" }, { status: 404 });
    }

    return NextResponse.json({ status: "success", food });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED_ACCESS") {
      return NextResponse.json({ error: "Forbidden: You cannot access this food item" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch food" }, { status: 500 });
  }
}

/**
 * PUT /api/foods/[id]
 * Update a specific food item owned by the authenticated user.
 */
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = foodInputSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid food data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const updatedFood = await FoodService.updateFood(params.id, session.user.id, parseResult.data);

    return NextResponse.json({
      status: "success",
      message: "Food item updated successfully",
      food: updatedFood,
    });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Food item not found" }, { status: 404 });
    }
    if (error.message === "UNAUTHORIZED_ACCESS") {
      return NextResponse.json({ error: "Forbidden: You cannot edit this food item" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update food" }, { status: 500 });
  }
}

/**
 * DELETE /api/foods/[id]
 * Archives or safely removes a food item.
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const hardDelete = searchParams.get("permanent") === "true";

    if (hardDelete) {
      await FoodService.deleteFood(params.id, session.user.id);
      return NextResponse.json({ status: "success", message: "Food item permanently deleted" });
    } else {
      const archived = await FoodService.archiveFood(params.id, session.user.id);
      return NextResponse.json({ status: "success", message: "Food item archived", food: archived });
    }
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Food item not found" }, { status: 404 });
    }
    if (error.message === "UNAUTHORIZED_ACCESS") {
      return NextResponse.json({ error: "Forbidden: You cannot modify this food item" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete food" }, { status: 500 });
  }
}
