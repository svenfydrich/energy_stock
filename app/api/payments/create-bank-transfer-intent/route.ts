import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { drinkId, amount, customerName } = await req.json();

    // Validate input
    if (!Number.isInteger(drinkId) || drinkId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid drinkId" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount <= 0 || !isFinite(amount)) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Verify drink exists and get price
    const drink = await prisma.drink.findUnique({
      where: { id: drinkId },
      select: { id: true, name: true, price: true, stock: true },
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

    // Verify amount matches drink price
    if (Math.abs(amount - drink.price) > 0.01) {
      return NextResponse.json(
        { success: false, error: "Amount does not match drink price" },
        { status: 400 }
      );
    }

    // Create payment intent (will be completed when user confirms)
    await prisma.payment.create({
      data: {
        itemId: drinkId,
        method: "bank_transfer",
        status: "pending_bank_transfer",
        referenceCode: null,
        amount: amount,
        customerName: customerName?.trim() || null,
      },
    });

    // Get bank transfer details from env
    const bankDetails = {
      iban: process.env.BANK_IBAN || "DE89 3704 0044 0532 0130 00",
      bic: process.env.BANK_BIC || "COBADEFFXXX",
      accountHolder: process.env.BANK_ACCOUNT_HOLDER || "Energy Stock",
      amount: amount.toFixed(2),
      currency: "EUR",
    };

    return NextResponse.json({
      success: true,
      bankDetails,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
