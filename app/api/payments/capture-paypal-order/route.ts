import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { orderId, paymentId } = await req.json();

    if (!orderId || !paymentId) {
      return NextResponse.json(
        { success: false, error: "orderId and paymentId are required" },
        { status: 400 }
      );
    }

    // Get payment record
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      );
    }

    if (payment.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Payment already processed" },
        { status: 400 }
      );
    }

    // Verify with PayPal
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
      return NextResponse.json(
        { success: false, error: "Failed to authenticate with PayPal" },
        { status: 500 }
      );
    }

    const { access_token } = await authResponse.json();

    // Capture order
    const captureResponse = await fetch(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!captureResponse.ok) {
      const errorData = await captureResponse.json();
      console.error("PayPal capture error:", errorData);

      // Update payment status to failed
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "failed" },
      });

      return NextResponse.json(
        { success: false, error: "Failed to capture PayPal payment" },
        { status: 500 }
      );
    }

    const captureData = await captureResponse.json();

    if (captureData.status !== "COMPLETED") {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "failed" },
      });

      return NextResponse.json(
        { success: false, error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Update payment status and decrement stock
    await prisma.$transaction(async (tx) => {
      // Update payment
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: "paid" },
      });

      // Decrement stock
      await tx.drink.update({
        where: { id: payment.itemId },
        data: { stock: { decrement: 1 } },
      });

      // Create purchase record
      await tx.purchase.create({
        data: {
          drinkId: payment.itemId,
          customerName: payment.customerName,
        },
      });
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentId,
        status: "paid",
      },
    });
  } catch (error) {
    console.error("Capture PayPal order error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
