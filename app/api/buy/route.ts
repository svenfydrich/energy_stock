import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { drinkId } = await req.json();

  const drink = await prisma.drink.update({
    where: { id: drinkId },
    data: { stock: { decrement: 1 } },
  });

  await prisma.purchase.create({
    data: { drinkId },
  });

  return NextResponse.json({ success: true, drink });
}
