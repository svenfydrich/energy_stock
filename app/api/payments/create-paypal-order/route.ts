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

    // Create PayPal order using PayPal REST API
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
    const PAYPAL_BASE_URL =
      process.env.PAYPAL_MODE === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return NextResponse.json(
        { success: false, error: "PayPal credentials not configured" },
        { status: 500 }
      );
    }

    // Get access token
    const authResponse = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!authResponse.ok) {
      console.error("PayPal auth error:", await authResponse.text());
      return NextResponse.json(
        { success: false, error: "Failed to authenticate with PayPal" },
        { status: 500 }
      );
    }

    const { access_token } = await authResponse.json();

    // Create order
    const orderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description: drink.name,
            amount: {
              currency_code: "EUR",
              value: amount.toFixed(2),
            },
          },
        ],
      }),
    });

    if (!orderResponse.ok) {
      console.error("PayPal order error:", await orderResponse.text());
      return NextResponse.json(
        { success: false, error: "Failed to create PayPal order" },
        { status: 500 }
      );
    }

    const order = await orderResponse.json();

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        itemId: drinkId,
        method: "paypal",
        status: "pending",
        paypalOrderId: order.id,
        amount: amount,
        customerName: customerName?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error("Create PayPal order error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
