import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's stats
    const todaySales = await prisma.sale.aggregate({
      where: {
        createdAt: { gte: todayStart },
        status: "COMPLETED",
      },
      _sum: { total: true },
      _count: true,
    });

    // Monthly stats
    const monthSales = await prisma.sale.aggregate({
      where: {
        createdAt: { gte: monthStart },
        status: "COMPLETED",
      },
      _sum: { total: true },
      _count: true,
    });

    // Total stats
    const totalStats = await prisma.sale.aggregate({
      where: { status: "COMPLETED" },
      _sum: { total: true },
      _count: true,
    });

    const totalProducts = await prisma.product.count({ where: { active: true } });
    const totalCustomers = await prisma.customer.count();

    // Low stock products - use raw query to compare columns correctly
    // Note: COUNT(*) returns bigint in PostgreSQL, we cast to integer
    const lowStockResult = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*)::int as count FROM "Product" WHERE active = true AND stock <= "minStock"`
    );
    const lowStockProducts = Number(lowStockResult[0]?.count || 0);

    // Daily sales for chart (last 7 days)
    const last7Days: { date: string; total: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayStats = await prisma.sale.aggregate({
        where: {
          createdAt: { gte: date, lt: nextDate },
          status: "COMPLETED",
        },
        _sum: { total: true },
        _count: true,
      });

      last7Days.push({
        date: date.toLocaleDateString("es-CO", { weekday: "short", day: "numeric" }),
        total: dayStats._sum.total || 0,
        count: dayStats._count,
      });
    }

    // Top products
    const topProducts = await prisma.saleItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    });

    const topProductsWithNames = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, sku: true },
        });
        return {
          name: product?.name || "Unknown",
          sku: product?.sku || "",
          quantity: item._sum.quantity || 0,
          total: item._sum.subtotal || 0,
        };
      })
    );

    // Sales by payment method
    const paymentMethods = await prisma.sale.groupBy({
      by: ["paymentMethod"],
      where: { status: "COMPLETED" },
      _sum: { total: true },
      _count: true,
    });

    return NextResponse.json({
      today: {
        total: todaySales._sum.total || 0,
        count: todaySales._count,
      },
      month: {
        total: monthSales._sum.total || 0,
        count: monthSales._count,
      },
      total: {
        total: totalStats._sum.total || 0,
        count: totalStats._count,
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts,
      },
      customers: totalCustomers,
      dailySales: last7Days,
      topProducts: topProductsWithNames,
      paymentMethods,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
