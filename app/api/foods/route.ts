import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FoodService } from "@/lib/services/food.service";
import { foodInputSchema, FoodCategory } from "@/lib/validations/food";

export const dynamic = "force-dynamic";

/**
 * GET /api/foods
 * List, search, and filter foods available to the authenticated user.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const category = (searchParams.get("category") as FoodCategory) || undefined;
    const status = (searchParams.get("status") as "active" | "archived" | "all") || "active";
    const favoritesOnly = searchParams.get("favorites") === "true";

    const foods = await FoodService.getUserFoods({
      userId: session.user.id,
      search,
      category,
      status,
      favoritesOnly,
    });

    return NextResponse.json({
      status: "success",
      count: foods.length,
      foods,
    });
  } catch (error: any) {
    console.error("GET /api/foods error:", error);
    return NextResponse.json({ error: "Failed to retrieve foods" }, { status: 500 });
  }
}

/**
 * POST /api/foods
 * Create a new food entry for the authenticated user.
 */
export async function POST(req: Request) {
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

    const food = await FoodService.createFood(session.user.id, parseResult.data);

    return NextResponse.json(
      {
        status: "success",
        message: "Food item created successfully",
        food,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/foods error:", error);
    return NextResponse.json({ error: "Failed to create food item" }, { status: 500 });
  }
}

/**
 * DELETE /api/foods?clearAll=true
 * Deletes all custom foods for the authenticated user (or all foods if admin).
 */
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clearAll = searchParams.get("clearAll") === "true";

    if (clearAll) {
      const pool = (await import("@/lib/db")).prisma as any;
      const isAdmin = (session.user as any).role === "ADMIN";
      const res = await pool.food.deleteMany(isAdmin ? {} : { where: { userId: session.user.id } });
      return NextResponse.json({
        status: "success",
        message: `Deleted ${res?.count || 0} food items.`,
      });
    }

    return NextResponse.json({ error: "clearAll parameter required" }, { status: 400 });
  } catch (error: any) {
    console.error("DELETE /api/foods error:", error);
    return NextResponse.json({ error: "Failed to delete foods" }, { status: 500 });
  }
}
