import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Wishlist API
 *
 * GET - Fetch all wishlisted drinks
 * POST - Add a new wishlisted drink
 *   {
 *     "name": string,
 *     "imageUrl": string | null
 *   }
 */

export async function GET() {
  try {
    const wishlistDrinks = await prisma.wishlistDrink.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, drinks: wishlistDrinks });
  } catch (error) {
    console.error("GET /wishlist error:", error);
    return NextResponse.json(
      { success: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name, imageUrl } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    if (imageUrl && typeof imageUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "ImageUrl must be a string" },
        { status: 400 }
      );
    }

    const wishlistDrink = await prisma.wishlistDrink.create({
      data: {
        name: name.trim(),
        imageUrl: imageUrl?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, drink: wishlistDrink });
  } catch (error) {
    console.error("POST /wishlist error:", error);
    return NextResponse.json(
      { success: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
