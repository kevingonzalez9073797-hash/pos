"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { formatCurrency, formatDateShort } from "@/lib/utils";
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
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#8b5cf6"];

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

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");

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

  const paymentMethodsMap: Record<string, string> = {
    CASH: "Efectivo",
    CARD: "Tarjeta",
    TRANSFER: "Transferencia",
  };

  const paymentData = (stats?.paymentMethods || []).map((pm) => ({
    name: paymentMethodsMap[pm.paymentMethod] || pm.paymentMethod,
    value: pm._sum.total || 0,
    count: pm._count,
  }));

  const averageTicket =
    stats?.total.count && stats.total.count > 0
      ? (stats.total.total || 0) / stats.total.count
      : 0;

  const topProductsData = (stats?.topProducts || []).slice(0, 7).map((p) => ({
    name: p.name.length > 20 ? p.name.slice(0, 20) + "..." : p.name,
    quantity: p.quantity,
    total: p.total,
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
          <p className="text-slate-500 mt-1">
            Analiza el rendimiento de tu negocio
          </p>
        </div>
        <div className="flex gap-2">
          {["7d", "30d", "90d"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                period === p
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {p === "7d" ? "7 días" : p === "30d" ? "30 días" : "90 días"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl">
              <DollarSign className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-sm text-slate-500">Total Ventas</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(stats?.total.total || 0)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm text-slate-500">Ticket Promedio</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(averageTicket)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-amber-50 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm text-slate-500">Total Transacciones</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {stats?.total.count || 0}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-purple-50 rounded-xl">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm text-slate-500">Productos Vendidos</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {(stats?.topProducts || []).reduce(
              (sum, p) => sum + p.quantity,
              0
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-1">
            Ventas Diarias
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Últimos 7 días
          </p>
          <div className="h-80">
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
                  labelFormatter={(label: any) => `Fecha: ${label}`}
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
          <h3 className="font-semibold text-slate-900 mb-1">
            Métodos de Pago
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Distribución de ventas por método de pago
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {paymentData.map((_, index) => (
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-1">
            Productos Más Vendidos
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Por cantidad vendida
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProductsData}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  width={120}
                />
                <Tooltip
                  formatter={(value: any) => [Number(value) || 0, "Cantidad"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar
                  dataKey="quantity"
                  fill="#22c55e"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Transactions Count */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-1">
            Transacciones Diarias
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Número de ventas por día
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.dailySales || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value: any) => [Number(value) || 0, "Transacciones"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: "#f59e0b", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
