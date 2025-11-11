import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

/**
 * Wishlist Item API
 *
 * DELETE - Delete a wishlisted drink
 */

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const wishlistId = parseInt(id, 10);

    if (!Number.isInteger(wishlistId) || wishlistId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid wishlist ID" },
        { status: 400 }
      );
    }

    try {
      await prisma.wishlistDrink.delete({
        where: { id: wishlistId },
      });

      return NextResponse.json({ success: true });
    } catch (err: unknown) {
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        return NextResponse.json(
          { success: false, error: "Wishlist item not found" },
          { status: 404 }
        );
      }
      console.error("Delete wishlist error:", err);
      return NextResponse.json(
        { success: false, error: "Unexpected server error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("DELETE /wishlist/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
