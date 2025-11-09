import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST() {
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

    try {
      // Reset all drink stock to 0
      await prisma.drink.updateMany({
        data: {
          stock: 0,
        },
      });

      return NextResponse.json({ success: true });
    } catch (err: unknown) {
      console.error("Reset stock error:", err);
      return NextResponse.json(
        { success: false, error: "Failed to reset stock" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Reset stock error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
