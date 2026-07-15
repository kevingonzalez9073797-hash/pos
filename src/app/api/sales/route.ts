import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          items: {
            include: { product: { select: { name: true, sku: true } } },
          },
          customer: { select: { name: true } },
          user: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ]);

    return NextResponse.json({ sales, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Error al obtener ventas" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { items, customerId, paymentMethod, discount, notes } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "La venta debe tener al menos un producto" },
        { status: 400 }
      );
    }

    // Calculate totals
    let subtotal = 0;
    type SaleItemInput = {
      productId: string;
      quantity: number;
      price: number;
      subtotal: number;
    };
    const saleItems: SaleItemInput[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Producto ${item.productId} no encontrado` },
          { status: 404 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}` },
          { status: 400 }
        );
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      saleItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        subtotal: itemSubtotal,
      });
    }

    const discountAmount = discount ? parseFloat(discount) : 0;
    const tax = subtotal * 0.19; // 19% IVA Colombia
    const total = subtotal + tax - discountAmount;

    // Create sale and update stock in transaction
    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          subtotal,
          tax,
          discount: discountAmount,
          total,
          paymentMethod: paymentMethod || "CASH",
          status: "COMPLETED",
          notes,
          customerId: customerId || null,
          userId: session.user.id,
          items: {
            create: saleItems,
          },
        },
        include: {
          items: {
            include: { product: { select: { name: true, sku: true } } },
          },
          customer: { select: { name: true } },
          user: { select: { name: true } },
        },
      });

      // Update stock
      for (const item of saleItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newSale;
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear venta" },
      { status: 500 }
    );
  }
}
