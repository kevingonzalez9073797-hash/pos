"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  DollarSign,
  Calendar,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6"];

interface Stats {
  today: { total: number; count: number };
  month: { total: number; count: number };
  total: { total: number; count: number };
  products: { total: number; lowStock: number };
  customers: number;
  dailySales: { date: string; total: number; count: number }[];
  topProducts: { name: string; sku: string; quantity: number; total: number }[];
  paymentMethods: { paymentMethod: string; _sum: { total: number }; _count: number }[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/sales/stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const paymentMethodsMap: Record<string, string> = {
    CASH: "Efectivo",
    CARD: "Tarjeta",
    TRANSFER: "Transferencia",
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting()}, {session?.user?.name || "Usuario"}
        </h1>
        <p className="text-slate-500 mt-1">
          Aquí tienes un resumen de tu negocio hoy
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Ventas Hoy"
          value={formatCurrency(stats?.today.total || 0)}
          sub={`${stats?.today.count || 0} transacciones`}
          color="indigo"
        />
        <StatCard
          icon={Calendar}
          label="Ventas del Mes"
          value={formatCurrency(stats?.month.total || 0)}
          sub={`${stats?.month.count || 0} transacciones`}
          color="emerald"
        />
        <StatCard
          icon={Package}
          label="Productos"
          value={stats?.products.total || 0}
          sub={`${stats?.products.lowStock || 0} con stock bajo`}
          color="amber"
        />
        <StatCard
          icon={Users}
          label="Clientes"
          value={stats?.customers || 0}
          sub="Registrados"
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">
            Ventas de los Últimos 7 Días
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.dailySales || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  formatter={(value: any) => [
                    formatCurrency(Number(value) || 0),
                    "Total",
                  ]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar
                  dataKey="total"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">
            Métodos de Pago
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(stats?.paymentMethods || []).map((pm) => ({
                    name: paymentMethodsMap[pm.paymentMethod] || pm.paymentMethod,
                    value: pm._sum.total || 0,
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(stats?.paymentMethods || []).map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [
                    formatCurrency(Number(value) || 0),
                    "Total",
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products */}
      {stats?.topProducts && stats.topProducts.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">
            Productos Más Vendidos
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-500">
                  <th className="pb-3 font-medium">Producto</th>
                  <th className="pb-3 font-medium">SKU</th>
                  <th className="pb-3 font-medium text-right">Cantidad</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.topProducts.map((product, index) => (
                  <tr key={index} className="text-sm">
                    <td className="py-3 font-medium text-slate-900">
                      {product.name}
                    </td>
                    <td className="py-3 text-slate-500">{product.sku}</td>
                    <td className="py-3 text-right font-medium">
                      {product.quantity}
                    </td>
                    <td className="py-3 text-right font-medium text-emerald-600">
                      {formatCurrency(product.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Low Stock Alert */}
      {(stats?.products.lowStock || 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{stats?.products.lowStock} producto(s)</strong> tienen stock
            bajo. Ve a{" "}
            <a href="/products" className="underline font-medium">
              Productos
            </a>{" "}
            para revisar.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          <p className="text-xs text-slate-400 mt-1">{sub}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
