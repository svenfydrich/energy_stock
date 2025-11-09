import { NextResponse } from "next/server";

export async function GET() {
  const paypalAccountHolder = process.env.PAYPAL_ACCOUNT_HOLDER;

  if (!paypalAccountHolder) {
    console.warn(
      "PAYPAL_ACCOUNT_HOLDER environment variable not set, using default"
    );
  }

  return NextResponse.json({
    paypalAccountHolder: paypalAccountHolder || "@MichaelFlathe",
  });
}
