import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/index.js";

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

    const { wishlistId, price, stock } = await req.json();

    // Validate input
    if (!Number.isInteger(wishlistId) || wishlistId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid wishlistId" },
        { status: 400 }
      );
    }

    if (typeof price !== "number" || price < 0 || !isFinite(price)) {
      return NextResponse.json(
        { success: false, error: "Price must be a valid positive number" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        { success: false, error: "Stock must be a non-negative integer" },
        { status: 400 }
      );
    }

    try {
      // Get the wishlist item
      const wishlistItem = await prisma.wishlistDrink.findUnique({
        where: { id: wishlistId },
      });

      if (!wishlistItem) {
        return NextResponse.json(
          { success: false, error: "Wishlist item not found" },
          { status: 404 }
        );
      }

      // Create the drink from wishlist item
      const result = await prisma.$transaction(async (tx) => {
        // Create the drink in inventory
        const drink = await tx.drink.create({
          data: {
            name: wishlistItem.name,
            price,
            stock,
            imageUrl: wishlistItem.imageUrl,
          },
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            imageUrl: true,
          },
        });

        return drink;
      });

      const drink = result;

      // Delete the wishlist item
      await prisma.wishlistDrink.delete({
        where: { id: wishlistId },
      });

      return NextResponse.json({ success: true, drink });
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        return NextResponse.json(
          { success: false, error: "Wishlist item not found" },
          { status: 404 }
        );
      }
      console.error("Convert wishlist error:", err);
      return NextResponse.json(
        { success: false, error: "Unexpected server error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Convert wishlist error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
