import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { drinkId, name, stock, price, imageUrl } = await req.json();

    // Validate input
    if (!Number.isInteger(drinkId) || drinkId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid drinkId" },
        { status: 400 }
      );
    }

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

    // Verify drink exists
    const existingDrink = await prisma.drink.findUnique({
      where: { id: drinkId },
    });

    if (!existingDrink) {
      return NextResponse.json(
        { success: false, error: "Drink not found" },
        { status: 404 }
      );
    }

    // Update the drink
    const updatedDrink = await prisma.drink.update({
      where: { id: drinkId },
      data: {
        name: name.trim(),
        stock,
        price,
        imageUrl: imageUrl && imageUrl.trim() ? imageUrl.trim() : null,
      },
    });

    return NextResponse.json({
      success: true,
      drink: updatedDrink,
    });
  } catch (error) {
    console.error("Error updating drink:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
