"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Users,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Store,
  ChevronLeft,
  ChevronRight,
  UserCircle,
} from "lucide-react";
import { useState } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: ShoppingCart, label: "Punto de Venta", href: "/pos" },
  { icon: Package, label: "Productos", href: "/products" },
  { icon: Tags, label: "Categorías", href: "/categories" },
  { icon: Users, label: "Clientes", href: "/customers" },
  { icon: Receipt, label: "Ventas", href: "/sales" },
  { icon: BarChart3, label: "Reportes", href: "/reports" },
  { icon: Settings, label: "Usuarios", href: "/users", adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const userRole = session?.user?.role;

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out h-screen sticky top-0`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
            <Store className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg tracking-tight">FreePOS</h1>
              <p className="text-xs text-slate-400">Sistema de Venta</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems
          .filter((item) => !item.adminOnly || userRole === "ADMIN")
          .map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? "bg-indigo-500/15 text-indigo-300 font-medium"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
                {isActive && !collapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-400 rounded-full" />
                )}
                {collapsed && isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-400 rounded-full" />
                )}
              </Link>
            );
          })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-slate-700/50 space-y-2">
        {!collapsed && session?.user && (
          <div className="px-3 py-2 flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-slate-400">
                {session.user.role === "ADMIN" ? "Administrador" : "Cajero"}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm"
          title={collapsed ? "Cerrar Sesión" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center px-3 py-2 w-full rounded-xl text-slate-500 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
