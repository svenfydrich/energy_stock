import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export async function POST(req: Request) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");

    if (session?.value !== "authenticated") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { drinkId } = await req.json();

    // Validate input
    if (!Number.isInteger(drinkId) || drinkId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid drinkId" },
        { status: 400 }
      );
    }

    try {
      // Delete all purchases related to this drink first (due to foreign key constraint)
      await prisma.purchase.deleteMany({
        where: { drinkId: drinkId },
      });

      // Then delete the drink itself
      await prisma.drink.delete({
        where: { id: drinkId },
      });

      return NextResponse.json({ success: true });
    } catch (err: unknown) {
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        return NextResponse.json(
          { success: false, error: "Drink not found" },
          { status: 404 }
        );
      }
      console.error("Delete drink error:", err);
      return NextResponse.json(
        { success: false, error: "Unexpected server error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Delete drink error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
