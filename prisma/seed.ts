import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Inicializando base de datos...");

  // Limpiar datos existentes (en orden inverso por foreign keys)
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // Crear SOLO el usuario administrador
  const adminPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.create({
    data: { 
      name: "Admin Principal", 
      email: "admin@ejemplo.com", 
      password: adminPassword, 
      role: "ADMIN" 
    },
  });

  console.log("✅ Usuario administrador creado");
  console.log("");
  console.log("🎉 Base de datos inicializada correctamente");
  console.log("⚠️  El sistema está en blanco — sin productos, categorías ni clientes.");
  console.log("   El usuario debe agregar sus propios productos desde la interfaz.");
  console.log("");
  console.log("Credenciales:");
  console.log("   Admin: admin@ejemplo.com / admin123");
}

main().catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
