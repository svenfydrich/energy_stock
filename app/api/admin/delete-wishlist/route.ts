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

    const { wishlistId } = await req.json();

    // Validate input
    if (!Number.isInteger(wishlistId) || wishlistId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid wishlistId" },
        { status: 400 }
      );
    }

    try {
      // Delete the wishlist drink
      await prisma.wishlistDrink.delete({
        where: { id: wishlistId },
      });

      return NextResponse.json({ success: true });
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
      console.error("Delete wishlist item error:", err);
      return NextResponse.json(
        { success: false, error: "Unexpected server error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Delete wishlist item error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
