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

    const { drinkId, price } = await req.json();

    // Validate input
    if (!Number.isInteger(drinkId) || drinkId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid drinkId" },
        { status: 400 }
      );
    }

    if (typeof price !== "number" || price < 0 || !isFinite(price)) {
      return NextResponse.json(
        { success: false, error: "Price must be a valid positive number" },
        { status: 400 }
      );
    }

    try {
      const drink = await prisma.drink.update({
        where: { id: drinkId },
        data: { price },
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          imageUrl: true,
        },
      });

      return NextResponse.json({ success: true, drink });
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
      console.error("Update price error:", err);
      return NextResponse.json(
        { success: false, error: "Unexpected server error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Update price error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
