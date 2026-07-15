import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash("admin123", 10);
  const cashierPassword = await bcrypt.hash("cajero123", 10);

  const admin = await prisma.user.create({
    data: { name: "Admin Principal", email: "admin@ejemplo.com", password: adminPassword, role: "ADMIN" },
  });
  const cashier1 = await prisma.user.create({
    data: { name: "María García", email: "maria@ejemplo.com", password: cashierPassword, role: "CASHIER" },
  });
  const cashier2 = await prisma.user.create({
    data: { name: "Carlos López", email: "carlos@ejemplo.com", password: cashierPassword, role: "CASHIER" },
  });
  console.log("✅ Users created");

  const categories = await Promise.all([
    prisma.category.create({ data: { name: "Bebidas", description: "Bebidas frías y calientes", color: "#3b82f6" } }),
    prisma.category.create({ data: { name: "Comida Rápida", description: "Snacks y comidas rápidas", color: "#f59e0b" } }),
    prisma.category.create({ data: { name: "Lácteos", description: "Productos lácteos", color: "#22c55e" } }),
    prisma.category.create({ data: { name: "Panadería", description: "Pan y productos de repostería", color: "#ec4899" } }),
    prisma.category.create({ data: { name: "Limpieza", description: "Productos de limpieza", color: "#6366f1" } }),
    prisma.category.create({ data: { name: "Electrónicos", description: "Accesorios y electrónicos", color: "#8b5cf6" } }),
  ]);
  console.log("✅ Categories created");

  const products = await Promise.all([
    prisma.product.create({ data: { name: "Coca-Cola 500ml", description: "Refresco carbonatado sabor cola", price: 5000, cost: 3500, sku: "BEB001", barcode: "7501055301010", stock: 100, minStock: 20, categoryId: categories[0].id } }),
    prisma.product.create({ data: { name: "Agua Pura 600ml", description: "Agua purificada embotellada", price: 2500, cost: 1500, sku: "BEB002", barcode: "7501055301020", stock: 150, minStock: 30, categoryId: categories[0].id } }),
    prisma.product.create({ data: { name: "Café Americano", description: "Café americano recién preparado", price: 8000, cost: 3000, sku: "BEB003", stock: 50, minStock: 10, categoryId: categories[0].id } }),
    prisma.product.create({ data: { name: "Hamburguesa Clásica", description: "Hamburguesa con carne, queso y vegetales", price: 18000, cost: 9000, sku: "COM001", stock: 40, minStock: 10, categoryId: categories[1].id } }),
    prisma.product.create({ data: { name: "Papas Fritas Grandes", description: "Papas fritas crujientes", price: 10000, cost: 4000, sku: "COM002", stock: 60, minStock: 15, categoryId: categories[1].id } }),
    prisma.product.create({ data: { name: "Pizza Pepperoni", description: "Pizza personal de pepperoni", price: 22000, cost: 11000, sku: "COM003", stock: 25, minStock: 5, categoryId: categories[1].id } }),
    prisma.product.create({ data: { name: "Leche Entera 1L", description: "Leche pasteurizada entera", price: 6000, cost: 4000, sku: "LAC001", barcode: "7501055301030", stock: 80, minStock: 20, categoryId: categories[2].id } }),
    prisma.product.create({ data: { name: "Yogurt Natural", description: "Yogurt natural sin sabor", price: 4000, cost: 2500, sku: "LAC002", stock: 45, minStock: 10, categoryId: categories[2].id } }),
    prisma.product.create({ data: { name: "Queso Fresco 200g", description: "Queso fresco tradicional", price: 7000, cost: 4500, sku: "LAC003", stock: 35, minStock: 8, categoryId: categories[2].id } }),
    prisma.product.create({ data: { name: "Pan Francés", description: "Pan francés artesanal", price: 2000, cost: 1000, sku: "PAN001", stock: 200, minStock: 50, categoryId: categories[3].id } }),
    prisma.product.create({ data: { name: "Croissant de Mantequilla", description: "Croissant horneado fresco", price: 4000, cost: 2000, sku: "PAN002", stock: 30, minStock: 5, categoryId: categories[3].id } }),
    prisma.product.create({ data: { name: "Pastel de Chocolate", description: "Rebanada de pastel de chocolate", price: 9000, cost: 5000, sku: "PAN003", stock: 15, minStock: 5, categoryId: categories[3].id } }),
    prisma.product.create({ data: { name: "Jabón Líquido 500ml", description: "Jabón líquido antibacterial", price: 8000, cost: 4500, sku: "LIM001", stock: 40, minStock: 10, categoryId: categories[4].id } }),
    prisma.product.create({ data: { name: "Cloro 1L", description: "Cloro para limpieza general", price: 5000, cost: 3000, sku: "LIM002", stock: 25, minStock: 8, categoryId: categories[4].id } }),
    prisma.product.create({ data: { name: "Audífonos Bluetooth", description: "Audífonos inalámbricos básicos", price: 45000, cost: 25000, sku: "ELE001", stock: 12, minStock: 3, categoryId: categories[5].id } }),
    prisma.product.create({ data: { name: "Cable USB-C", description: "Cable USB-C a USB-A 1m", price: 10000, cost: 4000, sku: "ELE002", stock: 50, minStock: 10, categoryId: categories[5].id } }),
    prisma.product.create({ data: { name: "Cargador de Pared", description: "Cargador USB de pared 2A", price: 15000, cost: 7000, sku: "ELE003", stock: 3, minStock: 5, categoryId: categories[5].id } }),
  ]);
  console.log("✅ Products created");

  const customers = await Promise.all([
    prisma.customer.create({ data: { name: "Juan Pérez", email: "juan@email.com", phone: "5555-1234", address: "1a Calle, Zona 1, Ciudad", nit: "12345678-9" } }),
    prisma.customer.create({ data: { name: "Ana Martínez", email: "ana@email.com", phone: "5555-5678", address: "2a Avenida, Zona 10, Ciudad", nit: "98765432-1" } }),
    prisma.customer.create({ data: { name: "Pedro Ramírez", email: "pedro@email.com", phone: "5555-9012", nit: "45678901-2" } }),
    prisma.customer.create({ data: { name: "Laura Hernández", email: "laura@email.com", phone: "5555-3456", address: "3a Calle, Zona 14, Ciudad" } }),
  ]);
  console.log("✅ Customers created");

  const users = [admin, cashier1, cashier2];
  for (let i = 0; i < 20; i++) {
    const randomProducts = products.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 4) + 1);
    const subtotal = randomProducts.reduce((sum, p) => sum + p.price * (Math.floor(Math.random() * 3) + 1), 0);
    const tax = subtotal * 0.19;
    const total = subtotal + tax;
    const saleDate = new Date();
    saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 7));
    saleDate.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));
    const paymentMethods = ["CASH", "CARD", "TRANSFER"];
    const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
    await prisma.sale.create({
      data: {
        subtotal, tax, total,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        status: "COMPLETED",
        customerId: Math.random() > 0.5 ? randomCustomer.id : null,
        userId: users[Math.floor(Math.random() * users.length)].id,
        createdAt: saleDate,
        items: {
          create: randomProducts.map((p) => {
            const qty = Math.floor(Math.random() * 3) + 1;
            return { productId: p.id, quantity: qty, price: p.price, subtotal: p.price * qty };
          }),
        },
      },
    });
  }
  console.log("✅ Sales created (20 sample transactions)");
  console.log("");
  console.log("🎉 Database seeding complete!");
  console.log("Credentials:");
  console.log("   Admin:  admin@ejemplo.com / admin123");
  console.log("   Cajero: maria@ejemplo.com / cajero123");
  console.log("   Cajero: carlos@ejemplo.com / cajero123");
}

main().catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
