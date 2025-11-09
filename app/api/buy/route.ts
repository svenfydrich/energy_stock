import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { drinkId, customerName } = await req.json();

    if (!Number.isInteger(drinkId) || drinkId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid drinkId" },
        { status: 400 }
      );
    }

    // Verify drink exists and has stock
    const drink = await prisma.drink.findUnique({
      where: { id: drinkId },
      select: { id: true, name: true, stock: true },
    });

    if (!drink) {
      return NextResponse.json(
        { success: false, error: "Drink not found" },
        { status: 404 }
      );
    }

    if (drink.stock <= 0) {
      return NextResponse.json(
        { success: false, error: "Drink is out of stock" },
        { status: 400 }
      );
    }

    // Update stock and create purchase in transaction
    await prisma.$transaction(async (tx) => {
      await tx.drink.update({
        where: { id: drinkId },
        data: { stock: { decrement: 1 } },
      });

      await tx.purchase.create({
        data: {
          drinkId,
          customerName: customerName?.trim() || null,
        },
      });
    });

    const updatedDrink = await prisma.drink.findUnique({
      where: { id: drinkId },
    });

    return NextResponse.json({ success: true, drink: updatedDrink });
  } catch (error) {
    console.error("Buy error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
