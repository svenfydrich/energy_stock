import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");

    if (session?.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get date ranges
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now);
    monthStart.setMonth(monthStart.getMonth() - 1);
    monthStart.setHours(0, 0, 0, 0);

    // Get all purchases with drink info
    const allPurchases = await prisma.purchase.findMany({
      include: {
        drink: {
          select: {
            id: true,
            name: true,
            brand: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate statistics
    const totalPurchases = allPurchases.length;
    const purchasesToday = allPurchases.filter(
      (p) => new Date(p.createdAt) >= todayStart
    ).length;
    const purchasesThisWeek = allPurchases.filter(
      (p) => new Date(p.createdAt) >= weekStart
    ).length;
    const purchasesThisMonth = allPurchases.filter(
      (p) => new Date(p.createdAt) >= monthStart
    ).length;

    // Get top drinks
    const drinkCounts = new Map<number, { name: string; brand: string; count: number }>();
    allPurchases.forEach((purchase) => {
      const drinkId = purchase.drinkId;
      const existing = drinkCounts.get(drinkId);
      if (existing) {
        existing.count++;
      } else {
        drinkCounts.set(drinkId, {
          name: purchase.drink.name,
          brand: purchase.drink.brand,
          count: 1,
        });
      }
    });

    const topDrinks = Array.from(drinkCounts.entries())
      .map(([drinkId, data]) => ({
        drinkId,
        drinkName: data.name,
        drinkBrand: data.brand,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get recent purchases (last 20)
    const recentPurchases = allPurchases.slice(0, 20).map((purchase) => ({
      id: purchase.id,
      drinkName: purchase.drink.name,
      drinkBrand: purchase.drink.brand,
      customerName: purchase.customerName,
      createdAt: purchase.createdAt.toISOString(),
    }));

    return NextResponse.json({
      totalPurchases,
      purchasesToday,
      purchasesThisWeek,
      purchasesThisMonth,
      topDrinks,
      recentPurchases,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
