"use client";

import { useEffect, useState } from "react";
import {
  Receipt,
  Search,
  X,
  Eye,
  Ban,
  Printer,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface Sale {
  id: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: string;
  notes: string | null;
  createdAt: string;
  customer: { name: string } | null;
  user: { name: string };
  items: {
    quantity: number;
    price: number;
    subtotal: number;
    product: { name: string; sku: string };
  }[];
}

interface SalesResponse {
  sales: Sale[];
  total: number;
  page: number;
  totalPages: number;
}

export default function SalesPage() {
  const [data, setData] = useState<SalesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    fetchSales();
  }, [page, status]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" });
      if (status) params.set("status", status);
      const res = await fetch(`/api/sales?${params}`);
      const data = await res.json();
      setData(data);
    } catch {
      toast.error("Error al cargar ventas");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (saleId: string) => {
    if (!confirm("¿Estás seguro de cancelar esta venta? Se restaurará el stock."))
      return;

    try {
      const res = await fetch(`/api/sales/${saleId}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      toast.success("Venta cancelada");
      fetchSales();
      setSelectedSale(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const paymentMethodsMap: Record<string, string> = {
    CASH: "Efectivo",
    CARD: "Tarjeta",
    TRANSFER: "Transferencia",
  };

  const printReceipt = (sale: Sale) => {
    const receiptWindow = window.open("", "_blank", "width=400,height=600");
    if (!receiptWindow) return;

    const itemsHtml = sale.items
      .map(
        (item) =>
          `<tr>
            <td style="padding:4px 0">${item.product.name}</td>
            <td style="padding:4px 8px;text-align:center">${item.quantity}</td>
            <td style="padding:4px 0;text-align:right">$${item.price.toLocaleString('es-CO', {minimumFractionDigits:0})}</td>
            <td style="padding:4px 0;text-align:right">$${item.subtotal.toLocaleString('es-CO', {minimumFractionDigits:0})}</td>
          </tr>`
      )
      .join("");

    receiptWindow.document.write(`
      <html>
      <head><title>Ticket #${sale.id.slice(0, 8)}</title>
      <style>
        body { font-family: monospace; padding: 20px; font-size: 12px; }
        h1 { text-align: center; font-size: 16px; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; }
        .total { font-size: 14px; font-weight: bold; }
        .footer { text-align: center; margin-top: 16px; font-size: 10px; }
      </style>
      </head>
      <body>
        <h1>FreePOS</h1>
        <p style="text-align:center">Sistema de Punto de Venta</p>
        <div class="line"></div>
        <p><strong>Ticket #${sale.id.slice(0, 8).toUpperCase()}</strong></p>
        <p>${formatDate(sale.createdAt)}</p>
        ${sale.customer ? `<p>Cliente: ${sale.customer.name}</p>` : ""}
        <div class="line"></div>
        <table>
          <tr><th style="text-align:left">Producto</th><th style="text-align:center">Cnt</th><th style="text-align:right">Precio</th><th style="text-align:right">Subtotal</th></tr>
          ${itemsHtml}
        </table>
        <div class="line"></div>
        <p>Subtotal: $${sale.subtotal.toLocaleString('es-CO', {minimumFractionDigits:0})}</p>
        <p>IVA (19%): $${sale.tax.toLocaleString('es-CO', {minimumFractionDigits:0})}</p>
        ${sale.discount > 0 ? `<p>Descuento: -$${sale.discount.toLocaleString('es-CO', {minimumFractionDigits:0})}</p>` : ""}
        <p class="total">Total: $${sale.total.toLocaleString('es-CO', {minimumFractionDigits:0})}</p>
        <p>Método de pago: ${paymentMethodsMap[sale.paymentMethod]}</p>
        <div class="line"></div>
        <p>Atendido por: ${sale.user.name}</p>
        <div class="footer">
          <p>¡Gracias por su compra!</p>
        </div>
        <script>
          window.onload = function() { window.print(); }
        <\\/script>
      </body>
      </html>
    `);
    receiptWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ventas</h1>
        <p className="text-slate-500 mt-1">
          Historial de transacciones{" "}
          {data ? `(${data.total} totales)` : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">Todos los estados</option>
          <option value="COMPLETED">Completadas</option>
          <option value="CANCELLED">Canceladas</option>
        </select>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-500 bg-slate-50">
                <th className="py-3 px-4 font-medium">ID</th>
                <th className="py-3 px-4 font-medium">Fecha</th>
                <th className="py-3 px-4 font-medium">Cliente</th>
                <th className="py-3 px-4 font-medium">Productos</th>
                <th className="py-3 px-4 font-medium">Método</th>
                <th className="py-3 px-4 font-medium text-right">Total</th>
                <th className="py-3 px-4 font-medium text-center">Estado</th>
                <th className="py-3 px-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay ventas registradas</p>
                  </td>
                </tr>
              ) : (
                data?.sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedSale(sale)}
                  >
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      #{sale.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {sale.customer?.name || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {sale.items.length} producto(s)
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {paymentMethodsMap[sale.paymentMethod]}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          sale.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {sale.status === "COMPLETED"
                          ? "Completada"
                          : "Cancelada"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          printReceipt(sale);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Imprimir ticket"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(
            (p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  page === p
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
            className="p-2 text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Venta #{selectedSale.id.slice(0, 8).toUpperCase()}
                </h2>
                <p className="text-sm text-slate-500">
                  {formatDate(selectedSale.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Atendido por</span>
                  <p className="font-medium">{selectedSale.user.name}</p>
                </div>
                <div>
                  <span className="text-slate-500">Cliente</span>
                  <p className="font-medium">
                    {selectedSale.customer?.name || "Mostrador"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Método de pago</span>
                  <p className="font-medium">
                    {paymentMethodsMap[selectedSale.paymentMethod]}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Estado</span>
                  <p
                    className={`font-medium ${
                      selectedSale.status === "COMPLETED"
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {selectedSale.status === "COMPLETED"
                      ? "Completada"
                      : "Cancelada"}
                  </p>
                </div>
              </div>

              {selectedSale.notes && (
                <div className="bg-slate-50 rounded-xl p-3 text-sm">
                  <span className="text-slate-500">Notas:</span>
                  <p className="mt-1">{selectedSale.notes}</p>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4">
                <h3 className="font-medium text-slate-900 mb-3">Productos</h3>
                <div className="space-y-2">
                  {selectedSale.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {item.product.name}
                        </p>
                        <p className="text-slate-400 text-xs">
                          Q{item.price.toFixed(2)} x {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-1 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>IVA (19%)</span>
                  <span>{formatCurrency(selectedSale.tax)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Descuento</span>
                    <span>-{formatCurrency(selectedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-100">
                  <span>Total</span>
                  <span>{formatCurrency(selectedSale.total)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => printReceipt(selectedSale)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Ticket
                </button>
                {selectedSale.status === "COMPLETED" && (
                  <button
                    onClick={() => handleCancel(selectedSale.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Ban className="w-4 h-4" />
                    Cancelar Venta
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
