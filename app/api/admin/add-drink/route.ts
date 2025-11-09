import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

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

    const { name, stock, price, imageUrl } = await req.json();

    // Validate input
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        { success: false, error: "Stock must be a non-negative integer" },
        { status: 400 }
      );
    }

    if (typeof price !== "number" || price < 0 || !isFinite(price)) {
      return NextResponse.json(
        { success: false, error: "Price must be a valid positive number" },
        { status: 400 }
      );
    }

    if (imageUrl && typeof imageUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "ImageUrl must be a string" },
        { status: 400 }
      );
    }

    try {
      const drink = await prisma.drink.create({
        data: {
          name: name.trim(),
          stock,
          price,
          imageUrl: imageUrl?.trim() || null,
        },
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          imageUrl: true,
        },
      });

      return NextResponse.json({ success: true, drink });
    } catch (error) {
      console.error("Create drink error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create drink" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Add drink error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

