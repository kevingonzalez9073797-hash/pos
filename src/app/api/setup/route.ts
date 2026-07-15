import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check if already has an admin user
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      return NextResponse.json({
        message: "⚠️ La base de datos ya tiene usuarios. No se duplicaron.",
        users: existingUsers,
      });
    }

    console.log("🌱 Inicializando base de datos via API...");

    // Create ONLY the admin user - everything else stays blank
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
      message: "✅ Sistema inicializado correctamente. Solo se creó el usuario administrador.",
      info: "El sistema está en blanco. Agrega productos, categorías y clientes desde la interfaz.",
      data: {
        users: await prisma.user.count(),
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
    console.error("Error initializing database:", error);
    return NextResponse.json(
      { error: "Error al inicializar: " + (error as Error).message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
