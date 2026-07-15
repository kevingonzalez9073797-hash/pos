import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("🧹 Limpiando base de datos...");

    // 1. Eliminar TODOS los datos existentes (orden inverso por foreign keys)
    await prisma.saleItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();

    console.log("🌱 Inicializando base de datos via API...");

    // 2. Crear SOLO el usuario administrador
    const adminPassword = await bcrypt.hash("admin123", 10);

    await prisma.user.create({
      data: { 
        name: "Admin Principal", 
        email: "admin@ejemplo.com", 
        password: adminPassword, 
        role: "ADMIN" 
      },
    });

    return NextResponse.json({
      success: true,
      message: "✅ Sistema reiniciado completamente. Solo se creó el usuario administrador.",
      info: "Todos los datos anteriores fueron eliminados. El sistema está en blanco.",
      data: {
        users: 1,
        categories: 0,
        products: 0,
        customers: 0,
        sales: 0,
      },
      credentials: {
        admin: "admin@ejemplo.com / admin123",
      },
    });
  } catch (error) {
    console.error("Error resetting database:", error);
    return NextResponse.json(
      { error: "Error al reiniciar: " + (error as Error).message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
