import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

/**
 * Restock API
 *
 * POST
 *  - Single restock:
 *      {
 *        "drinkId": number,
 *        "amount": number = 1
 *      }
 *  - Batch restock:
 *      {
 *        "items": [
 *          { "drinkId": number, "amount": number = 1 },
 *          ...
 *        ]
 *      }
 *
 *    Notes:
 *      - Amounts must be positive integers.
 *      - Duplicate drinkIds in batch will be aggregated before updating.
 *
 * GET
 *  - Fetch one drink's current stock:
 *      /api/restock?drinkId=123
 *  - Fetch all drinks (id, name, stock):
 *      /api/restock
 *
 * Responses:
 *  200: { success: true, ... }
 *  400: { success: false, error: string }
 *  404: { success: false, error: string }
 *  500: { success: false, error: string }
 */

/* ------------------------- GET: Fetch stock info ------------------------- */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const drinkIdParam = url.searchParams.get("drinkId");

    if (drinkIdParam !== null) {
      const drinkId = Number(drinkIdParam);
      if (!Number.isInteger(drinkId) || drinkId <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid drinkId query parameter" },
          { status: 400 }
        );
      }

      const drink = await prisma.drink.findUnique({
        where: { id: drinkId },
        select: {
          id: true,
          name: true,
          brand: true,
          stock: true,
          price: true,
          imageUrl: true,
          sugarFree: true,
        },
      });

      if (!drink) {
        return NextResponse.json(
          { success: false, error: "Drink not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, drink });
    }

    // List all drinks
    const drinks = await prisma.drink.findMany({
      select: {
        id: true,
        name: true,
        brand: true,
        stock: true,
        price: true,
        imageUrl: true,
        sugarFree: true,
      },
      orderBy: { purchases: { _count: "desc" } },
    });

    return NextResponse.json({ success: true, drinks });
  } catch (err) {
    console.error("GET /restock error:", err);
    return NextResponse.json(
      { success: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

/* -------------------- POST: Restock single or multiple ------------------- */
export async function POST(req: Request) {
  // Define request body shapes (narrow types to remove any)
  type SingleRestockBody = { drinkId: number; amount?: number };
  type BatchRestockBody = { items: { drinkId: number; amount?: number }[] };

  function isBatchBody(b: unknown): b is BatchRestockBody {
    return (
      typeof b === "object" &&
      b !== null &&
      Array.isArray((b as { items?: unknown }).items)
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Distinguish between single vs batch using the type guard
  if (!isBatchBody(body)) {
    const single = body as Partial<SingleRestockBody>;
    const drinkId = single?.drinkId;
    const amount = single?.amount ?? 1;

    // Validate single input
    if (!Number.isInteger(drinkId) || (drinkId as number) <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing drinkId" },
        { status: 400 }
      );
    }
    if (!Number.isInteger(amount) || (amount as number) <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be a positive integer" },
        { status: 400 }
      );
    }

    try {
      const drink = await prisma.drink.update({
        where: { id: drinkId as number },
        data: { stock: { increment: amount as number } },
      });

      return NextResponse.json({ success: true, drink });
    } catch (err: unknown) {
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        return NextResponse.json(
          { success: false, error: "Drink not found" },
          { status: 404 }
        );
      }
      console.error("Single restock error:", err);
      return NextResponse.json(
        { success: false, error: "Unexpected server error" },
        { status: 500 }
      );
    }
  }

  // Batch flow (body now guaranteed to satisfy BatchRestockBody)
  const rawItems = body.items;
  if (rawItems.length === 0) {
    return NextResponse.json(
      { success: false, error: "Items array must not be empty" },
      { status: 400 }
    );
  }

  // Normalize and validate items, aggregate duplicates
  const aggregateMap = new Map<number, number>();
  for (const [index, item] of rawItems.entries()) {
    const drinkId = item?.drinkId;
    const amount = item?.amount ?? 1;

    if (!Number.isInteger(drinkId) || drinkId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid drinkId at items[${index}]`,
        },
        { status: 400 }
      );
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid amount at items[${index}] - must be positive integer`,
        },
        { status: 400 }
      );
    }

    aggregateMap.set(drinkId, (aggregateMap.get(drinkId) ?? 0) + amount);
  }

  const aggregatedItems = [...aggregateMap.entries()].map(
    ([drinkId, amount]) => ({
      drinkId,
      amount,
    })
  );

  try {
    // Run updates in a transaction to keep things consistent
    const updatedDrinks = await prisma.$transaction(
      aggregatedItems.map(({ drinkId, amount }) =>
        prisma.drink.update({
          where: { id: drinkId },
          data: { stock: { increment: amount } },
        })
      )
    );

    return NextResponse.json({
      success: true,
      count: updatedDrinks.length,
      drinks: updatedDrinks,
    });
  } catch (err: unknown) {
    if (err instanceof PrismaClientKnownRequestError && err.code === "P2025") {
      // One of the drink updates failed due to missing record
      return NextResponse.json(
        { success: false, error: "One or more drinkIds not found" },
        { status: 404 }
      );
    }

    console.error("Batch restock error:", err);
    return NextResponse.json(
      { success: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
