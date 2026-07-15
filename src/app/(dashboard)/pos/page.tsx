"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  X,
  Receipt,
  Barcode,
  Percent,
  Check,
  Package,
  PlusCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
  stock: number;
  category: { name: string; color: string } | null;
}

interface Customer {
  id: string;
  name: string;
  nit: string | null;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [discount, setDiscount] = useState(0);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [cashReceived, setCashReceived] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data);
    } catch {
      console.error("Error fetching products");
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      setCustomers(data);
    } catch {
      console.error("Error fetching customers");
    }
  };

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error("Stock insuficiente");
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      if (product.stock <= 0) {
        toast.error("Producto agotado");
        return prev;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          maxStock: product.stock,
        },
      ];
    });
  }, []);

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.maxStock) {
            toast.error("Stock insuficiente");
            return item;
          }
          return { ...item, quantity: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setSelectedCustomer(null);
    setCashReceived("");
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.19; // 19% IVA Colombia
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal + tax - discountAmount;
  const cashAmount = parseFloat(cashReceived) || 0;
  const change = cashAmount - total;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Agrega productos al carrito");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          customerId: selectedCustomer?.id || null,
          paymentMethod,
          discount: discountAmount,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      const sale = await res.json();
      setCompletedSale(sale);
      setShowCheckoutModal(false);
      clearCart();
      toast.success("¡Venta completada!");
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const printReceipt = (sale: any) => {
    const receiptWindow = window.open("", "_blank", "width=380,height=600");
    if (!receiptWindow) return;

    const itemsHtml = sale.items
      .map(
        (item: any) =>
          `<tr>
            <td style="padding:3px 0">${item.product.name}</td>
            <td style="padding:3px 8px;text-align:center">${item.quantity}</td>
            <td style="padding:3px 0;text-align:right">$${item.price.toLocaleString('es-CO', {minimumFractionDigits:0})}</td>
            <td style="padding:3px 0;text-align:right">$${item.subtotal.toLocaleString('es-CO', {minimumFractionDigits:0})}</td>
          </tr>`
      )
      .join("");

    receiptWindow.document.write(`
      <html><head><title>Ticket</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 15px; font-size: 11px; width: 300px; margin: 0 auto; }
        h2 { text-align: center; font-size: 16px; margin: 5px 0; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; font-size: 10px; border-bottom: 1px solid #000; }
        .total-row { font-weight: bold; font-size: 13px; }
        .footer { text-align: center; margin-top: 10px; font-size: 9px; }
      </style></head>
      <body>
        <h2>FreePOS</h2>
        <p style="text-align:center;font-size:10px;margin:0">Sistema de Punto de Venta</p>
        <div class="line"></div>
        <p style="margin:2px 0">Ticket: #${sale.id.slice(0,8).toUpperCase()}</p>
        <p style="margin:2px 0">${new Date(sale.createdAt).toLocaleString("es-CO")}</p>
        ${sale.customer ? `<p style="margin:2px 0">Cliente: ${sale.customer.name}</p>` : ""}
        <div class="line"></div>
        <table>
          <tr><th>Producto</th><th style="text-align:center">Cnt</th><th style="text-align:right">P/U</th><th style="text-align:right">Total</th></tr>
          ${itemsHtml}
        </table>
        <div class="line"></div>
        <p style="margin:2px 0">Subtotal: $${subtotal.toLocaleString('es-CO', {minimumFractionDigits:0})}</p>
        <p style="margin:2px 0">IVA (19%): $${tax.toLocaleString('es-CO', {minimumFractionDigits:0})}</p>
        ${discount > 0 ? `<p style="margin:2px 0">Descuento (${discount}%): -$${discountAmount.toLocaleString('es-CO', {minimumFractionDigits:0})}</p>` : ""}
        <p class="total-row" style="margin:4px 0">TOTAL: $${total.toLocaleString('es-CO', {minimumFractionDigits:0})}</p>
        <p style="margin:2px 0">Pago: ${paymentMethod === "CASH" ? "Efectivo" : paymentMethod === "CARD" ? "Tarjeta" : "Transferencia"}</p>
        ${paymentMethod === "CASH" && cashAmount > 0 ? `
        <p style="margin:2px 0">Recibido: $${cashAmount.toLocaleString('es-CO', {minimumFractionDigits:0})}</p>
        <p style="margin:2px 0;color:#059669;font-weight:bold">Vuelto: $${change.toLocaleString('es-CO', {minimumFractionDigits:0})}</p>
        ` : ""}
        <div class="line"></div>
        <div class="footer">
          <p>¡Gracias por su compra!</p>
        </div>
        <script>window.onload=function(){window.print();}<\\/script>
      </body></html>
    `);
    receiptWindow.document.close();
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.nit?.includes(customerSearch)
  );

  return (
    <div className="flex gap-4 h-[calc(100vh-4rem)] animate-fadeIn">
      {/* Products Section */}
      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Punto de Venta</h1>
          <p className="text-slate-500 text-sm mt-1">
            Busca y selecciona productos para agregar al carrito
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar producto por nombre o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <Package className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                No hay productos registrados
              </h3>
              <p className="text-sm text-slate-400 max-w-md mb-6">
                Agrega productos desde la sección de productos para empezar a vender.
                Necesitas al menos un producto con stock disponible.
              </p>
              <a
                href="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <PlusCircle className="w-4 h-4" />
                Ir a Productos
              </a>
              <p className="text-xs text-slate-300 mt-4">
                Recuerda: primero crea categorías, luego productos con stock
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {products
                .filter((p) => p.stock > 0)
                .map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white rounded-xl p-4 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all text-left group"
                  >
                    {product.category && (
                      <span
                        className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-2"
                        style={{
                          backgroundColor: `${product.category.color}15`,
                          color: product.category.color,
                        }}
                      >
                        {product.category.name}
                      </span>
                    )}
                    <p className="font-semibold text-slate-900 text-sm leading-tight group-hover:text-indigo-600 transition-colors">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      Stock: {product.stock}
                    </p>
                    <p className="text-lg font-bold text-indigo-600 mt-2">
                      {formatCurrency(product.price)}
                    </p>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600" />
              <h2 className="font-semibold text-slate-900">
                Carrito ({cart.length})
              </h2>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setShowCustomerModal(true)}
                className={`p-2 rounded-lg transition-colors ${
                  selectedCustomer
                    ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                }`}
                title="Seleccionar cliente"
              >
                <User className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDiscount((d) => (d > 0 ? 0 : 10))}
                className={`p-2 rounded-lg transition-colors ${
                  discount > 0
                    ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                }`}
                title="Agregar descuento"
              >
                <Percent className="w-4 h-4" />
              </button>
            </div>
          </div>
          {selectedCustomer && (
            <div className="flex items-center justify-between mt-2 bg-emerald-50 rounded-lg px-3 py-1.5 text-sm">
              <span className="text-emerald-700 font-medium">
                {selectedCustomer.name}
              </span>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-emerald-500 hover:text-emerald-700"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {discount > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-20 px-2 py-1 text-sm border border-slate-200 rounded-lg text-center"
                min="0"
                max="100"
              />
              <span className="text-sm text-slate-500">% descuento</span>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-400">Carrito vacío</p>
              <p className="text-xs text-slate-300 mt-1">
                Busca y selecciona productos
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.productId}
                className="bg-slate-50 rounded-xl p-3 group"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-sm text-slate-900 line-clamp-1">
                    {item.name}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-medium text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="font-semibold text-sm">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">               <span>IVA (19%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Descuento ({discount}%)</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-slate-900">Total</span>
            <span className="text-2xl font-bold text-indigo-600">
              {formatCurrency(total)}
            </span>
          </div>

          {/* Payment Method */}
          <div className="flex gap-2">
            {[
              { value: "CASH", icon: Banknote, label: "Efectivo" },
              { value: "CARD", icon: CreditCard, label: "Tarjeta" },
              { value: "TRANSFER", icon: Smartphone, label: "Transferencia" },
            ].map((method) => (
              <button
                key={method.value}
                onClick={() => setPaymentMethod(method.value)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  paymentMethod === method.value
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                <method.icon className="w-4 h-4" />
                {method.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={clearCart}
              className="flex-1 py-3 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Limpiar
            </button>
            <button
              onClick={() => {
                if (cart.length === 0) {
                  toast.error("Agrega productos al carrito");
                  return;
                }
                setShowCheckoutModal(true);
              }}
              disabled={cart.length === 0}
              className="flex-1 py-3 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Cobrar
            </button>
          </div>
        </div>
      </div>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fadeIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                Seleccionar Cliente
              </h2>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                autoFocus
              />
              <div className="max-h-64 overflow-y-auto space-y-1">
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setShowCustomerModal(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                >
                  <span className="font-medium">Mostrador (sin cliente)</span>
                </button>
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setShowCustomerModal(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-medium">{customer.name}</span>
                    {customer.nit && (
                      <span className="text-slate-400 ml-2">
                        NIT: {customer.nit}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Confirmation Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-fadeIn">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Confirmar Venta
              </h2>
              <div className="space-y-2 mb-6">
                <p className="text-3xl font-bold text-indigo-600">
                  {formatCurrency(total)}
                </p>
                <p className="text-sm text-slate-500">
                  {cart.length} producto(s) ·{" "}
                  {paymentMethod === "CASH" ? "Efectivo" : paymentMethod === "CARD" ? "Tarjeta" : "Transferencia"}
                  {selectedCustomer && ` · ${selectedCustomer.name}`}
                </p>
              </div>

              {/* Cash received input - only show for CASH */}
              {paymentMethod === "CASH" && (
                <div className="mb-6 space-y-3">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2 text-left">
                      Monto recibido
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                        Q
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  {cashAmount > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Total a pagar</span>
                        <span className="font-semibold">{formatCurrency(total)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Recibido</span>
                        <span className="font-semibold">{formatCurrency(cashAmount)}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-2">
                        <div className={`flex justify-between text-lg font-bold ${
                          cashAmount >= total ? "text-emerald-600" : "text-red-600"
                        }`}>
                          <span>Vuelto</span>
                          <span>{formatCurrency(Math.abs(change))}</span>
                        </div>
                        {cashAmount < total && (
                          <p className="text-xs text-red-500 mt-1">
                            Faltan {formatCurrency(total - cashAmount)}
                          </p>
                        )}
                        {cashAmount >= total && (
                          <p className="text-xs text-emerald-600 mt-1">
                            Cambio a devolver: {formatCurrency(change)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCheckoutModal(false)}
                  className="flex-1 py-3 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (paymentMethod === "CASH" && cashAmount < total) {
                      toast.error("El monto recibido debe ser mayor o igual al total");
                      return;
                    }
                    handleCheckout();
                  }}
                  disabled={processing || (paymentMethod === "CASH" && cashAmount < total)}
                  className="flex-1 py-3 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {paymentMethod === "CASH" ? "Pagar" : "Confirmar"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completed Sale Modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-fadeIn">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                ¡Venta Completada!
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Ticket #{completedSale.id.slice(0, 8).toUpperCase()}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    printReceipt(completedSale);
                    setCompletedSale(null);
                  }}
                  className="flex-1 py-3 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  Imprimir Ticket
                </button>
                <button
                  onClick={() => setCompletedSale(null)}
                  className="flex-1 py-3 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Nueva Venta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
