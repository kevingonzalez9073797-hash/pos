import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
        customer: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error fetching sale:", error);
    return NextResponse.json(
      { error: "Error al obtener venta" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      );
    }

    if (sale.status === "CANCELLED") {
      return NextResponse.json(
        { error: "La venta ya está cancelada" },
        { status: 400 }
      );
    }

    // Cancel sale and restore stock in transaction
    await prisma.$transaction(async (tx) => {
      await tx.sale.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      // Restore stock
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling sale:", error);
    return NextResponse.json(
      { error: "Error al cancelar venta" },
      { status: 500 }
    );
  }
}
