import React, { useState, useEffect } from 'react';
import { Search, Eye, Trash2, X, MessageCircle, AlertCircle, ShoppingBag, User, Calendar, CheckCircle2, Filter, ArrowUpDown, Plus, DollarSign, Check, Minus, Clock } from 'lucide-react';
import { WHATSAPP_NUMERO, buildMensajeEstadoPedido, buildMensajeEnPreparacion, buildMensajeListo, extractCustomerPhone, waLink } from '../lib/whatsapp';
import { admin as adminApi, products as productsApi } from '../lib/api';
import { useModal } from '../context/ModalContext';

interface AdminOrdersSectionProps {
  orders: any[];
  products?: any[];
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
  onRefreshOrders?: () => Promise<void>;
}

export const AdminOrdersSection: React.FC<AdminOrdersSectionProps> = ({
  orders,
  products = [],
  onUpdateStatus,
  onDeleteOrder,
  onRefreshOrders,
}) => {
  const { showConfirm, showAlert } = useModal();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Local products fallback if prop is empty
  const [availableProducts, setAvailableProducts] = useState<any[]>(products);

  useEffect(() => {
    if (products && products.length > 0) {
      setAvailableProducts(products);
    } else {
      productsApi.list().then(setAvailableProducts).catch(console.error);
    }
  }, [products]);

  // Manual Sale Modal State
  const [showManualSaleModal, setShowManualSaleModal] = useState(false);

  useEffect(() => {
    if (showManualSaleModal && availableProducts.length === 0) {
      productsApi.list().then(setAvailableProducts).catch(console.error);
    }
  }, [showManualSaleModal, availableProducts]);
  const [manualCustomerName, setManualCustomerName] = useState('Venta Presencial');
  const [manualAddress, setManualAddress] = useState('Venta en Mostrador (Efectivo / Posnet)');
  const [manualStatus, setManualStatus] = useState('paid');
  const [manualPaymentMethod, setManualPaymentMethod] = useState('Efectivo');
  const [manualItems, setManualItems] = useState<any[]>([]);

  // Current item builder & Search
  const [manualProdSearchTerm, setManualProdSearchTerm] = useState('');
  const [manualCategoryFilter, setManualCategoryFilter] = useState('all');
  const [selectedProdId, setSelectedProdId] = useState('');
  const [builderQty, setBuilderQty] = useState(1);
  const [builderWeightGrams, setBuilderWeightGrams] = useState(250);
  const [builderUnitPrice, setBuilderUnitPrice] = useState(0);
  const [submittingManualOrder, setSubmittingManualOrder] = useState(false);

  const handleSelectProduct = (prodId: string) => {
    setSelectedProdId(prodId);
    const prod = availableProducts.find(p => p.id === prodId);
    if (prod) {
      setBuilderUnitPrice(prod.base_price || 0);
      if (prod.unit_type === 'weight') {
        setBuilderWeightGrams(prod.min_weight || 250);
      } else {
        setBuilderQty(1);
      }
    }
  };

  const handleAddItemToManualSale = () => {
    if (!selectedProdId) {
      showAlert({ title: 'Atención', message: 'Selecciona un producto del catálogo.', type: 'warning' });
      return;
    }
    const prod = availableProducts.find(p => p.id === selectedProdId);
    if (!prod) return;

    const isWeight = prod.unit_type === 'weight';
    const quantity = isWeight ? 1 : Math.max(1, Number(builderQty));
    const weightGrams = isWeight ? Math.max(50, Number(builderWeightGrams)) : undefined;

    // Calculate effective item price
    let itemPrice = Number(builderUnitPrice);
    if (isWeight) {
      itemPrice = (Number(prod.base_price) * weightGrams!) / 1000;
    }

    setManualItems(prev => [
      ...prev,
      {
        product_id: prod.id,
        name: prod.name,
        image_url: prod.image_url,
        quantity,
        weight_grams: weightGrams,
        unit_price: itemPrice,
        unit_type: prod.unit_type,
      }
    ]);

    // Reset selector
    setSelectedProdId('');
    setBuilderUnitPrice(0);
  };

  const handleRemoveManualItem = (index: number) => {
    setManualItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveManualOrder = async () => {
    if (!manualItems.length) {
      showAlert({ title: 'Error', message: 'Agrega al menos un producto a la venta manual.', type: 'warning' });
      return;
    }
    setSubmittingManualOrder(true);
    try {
      await adminApi.createManualOrder({
        shipping_name: manualCustomerName || 'Venta Presencial',
        shipping_address: manualAddress || 'Mostrador',
        status: manualStatus,
        payment_method: manualPaymentMethod,
        items: manualItems,
      });
      showAlert({ title: '¡Venta Registrada!', message: 'La venta manual fue registrada con éxito y el stock fue actualizado.', type: 'info' });
      setShowManualSaleModal(false);
      setManualItems([]);
      if (onRefreshOrders) await onRefreshOrders();
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message || 'Error al guardar la venta manual', type: 'error' });
    } finally {
      setSubmittingManualOrder(false);
    }
  };

  const now = new Date().getTime();
  const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

  const filteredOrders = orders
    .filter((o) => {
      const matchesSearch =
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.shipping_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.profiles?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.shipping_address || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;

      const orderTime = new Date(o.created_at).getTime();
      let matchesDate = true;
      if (dateFilter === 'today') matchesDate = orderTime >= todayStart;
      else if (dateFilter === '7days') matchesDate = orderTime >= sevenDaysAgo;
      else if (dateFilter === '30days') matchesDate = orderTime >= thirtyDaysAgo;

      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'amount_desc') return Number(b.total || 0) - Number(a.total || 0);
      if (sortBy === 'amount_asc') return Number(a.total || 0) - Number(b.total || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const handleSelectAllOrders = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteOrders = async () => {
    if (!selectedOrderIds.length) return;
    const confirmed = await showConfirm({
      title: '¿Eliminar pedidos seleccionados?',
      message: `Se eliminarán ${selectedOrderIds.length} pedidos seleccionados permanentemente.`,
      confirmText: `Eliminar (${selectedOrderIds.length})`,
      type: 'danger',
    });
    if (!confirmed) return;

    try {
      await adminApi.bulkDeleteOrders(selectedOrderIds);
      setSelectedOrderIds([]);
      if (onRefreshOrders) await onRefreshOrders();
    } catch (e: any) {
      showAlert({ title: 'Error', message: e.message || 'Error al eliminar pedidos', type: 'error' });
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (!selectedOrderIds.length || !newStatus) return;
    try {
      await adminApi.bulkUpdateOrderStatus(selectedOrderIds, newStatus);
      setSelectedOrderIds([]);
      if (onRefreshOrders) await onRefreshOrders();
    } catch (e: any) {
      showAlert({ title: 'Error', message: e.message || 'Error al actualizar estados', type: 'error' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Pagado</span>;
      case 'preparing':
      case 'en_preparacion':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">En preparación</span>;
      case 'ready':
      case 'listo':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800">Listo</span>;
      case 'shipped':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Enviado</span>;
      case 'delivered':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">Entregado</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">Cancelado</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Pendiente</span>;
    }
  };

  const getStepProgress = (status: string) => {
    switch (status) {
      case 'paid':
        return 1;
      case 'preparing':
      case 'en_preparacion':
        return 2;
      case 'ready':
      case 'listo':
      case 'shipped':
        return 3;
      case 'delivered':
        return 4;
      case 'cancelled':
        return 0;
      default:
        return 1;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-headline font-bold text-slate-900">Pedidos <span className="text-purple-600">({orders.length})</span></h1>
          <p className="text-xs text-slate-500 mt-0.5">{orders.length} pedidos registrados en total</p>
        </div>
        <button
          onClick={() => setShowManualSaleModal(true)}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-200/60 transition-all hover:-translate-y-0.5 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Venta Presencial / Manual</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative col-span-1 sm:col-span-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ID, cliente o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-400 outline-none"
            />
          </div>

          {/* Date Filter Dropdown */}
          <div className="flex items-center space-x-2 border border-slate-200 rounded-xl px-3 py-1.5 bg-white">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full text-xs font-semibold text-slate-700 outline-none bg-transparent cursor-pointer"
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Creados Hoy</option>
              <option value="7days">Últimos 7 Días</option>
              <option value="30days">Este Mes (30 días)</option>
            </select>
          </div>

          {/* Sort Filter Dropdown */}
          <div className="flex items-center space-x-2 border border-slate-200 rounded-xl px-3 py-1.5 bg-white">
            <ArrowUpDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full text-xs font-semibold text-slate-700 outline-none bg-transparent cursor-pointer"
            >
              <option value="newest">Más recientes primero</option>
              <option value="oldest">Más antiguos primero</option>
              <option value="amount_desc">Monto: Mayor a Menor</option>
              <option value="amount_asc">Monto: Menor a Mayor</option>
            </select>
          </div>
        </div>

        {/* Status Filters Pills */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
          {[
            { id: 'all', label: 'Todos los Estados' },
            { id: 'pending', label: 'Pendientes' },
            { id: 'paid', label: 'Pagados' },
            { id: 'preparing', label: 'En preparación' },
            { id: 'ready', label: 'Listos' },
            { id: 'shipped', label: 'Enviados' },
            { id: 'delivered', label: 'Entregados' },
            { id: 'cancelled', label: 'Cancelados' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Action Bar for Orders */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-purple-900 text-white p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2 px-2">
            <span className="w-6 h-6 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold">
              {selectedOrderIds.length}
            </span>
            <span className="text-xs font-semibold">pedidos seleccionados</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-1.5 bg-purple-800 rounded-xl px-3 py-1.5 border border-purple-700">
              <span className="text-xs text-purple-200 font-medium">Cambiar estado:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) handleBulkStatusChange(e.target.value);
                  e.target.value = '';
                }}
                defaultValue=""
                className="bg-white text-purple-950 text-xs font-bold rounded-lg px-2 py-1 outline-none cursor-pointer"
              >
                <option value="" disabled>Seleccionar estado</option>
                <option value="pending">Pendiente</option>
                <option value="paid">Pagado</option>
                <option value="preparing">En preparación</option>
                <option value="ready">Listo</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <button
              onClick={handleBulkDeleteOrders}
              className="flex items-center space-x-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl shadow transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar</span>
            </button>

            <button
              onClick={() => setSelectedOrderIds([])}
              className="px-3 py-2 bg-purple-800 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Desmarcar
            </button>
          </div>
        </div>
      )}

      {/* Orders Mobile: Card List */}
      <div className="sm:hidden space-y-2">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400 text-sm shadow-sm">
            No se encontraron pedidos.
          </div>
        ) : (
          filteredOrders.map((o) => {
            const customerName = o.shipping_name || o.profiles?.name || 'Cliente sin nombre';
            const isSelected = selectedOrderIds.includes(o.id);
            return (
              <div key={o.id} className={`bg-white rounded-2xl border p-4 shadow-sm ${
                isSelected ? 'border-purple-200 bg-purple-50/30' : 'border-slate-100'
              }`}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectOrder(o.id)}
                    className="rounded text-purple-600 w-4 h-4 mt-0.5 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-xs font-black text-purple-700">#{o.id.slice(0, 8).toUpperCase()}</span>
                      {getStatusBadge(o.status)}
                    </div>
                    <p className="font-bold text-slate-900 text-sm truncate">{customerName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{o.shipping_address || 'Retiro en tienda'}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-black text-slate-900 text-base">${Number(o.total || 0).toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400">{new Date(o.created_at).toLocaleDateString('es-AR')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                  <button
                    onClick={() => setSelectedOrder(o)}
                    className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-colors border border-purple-200"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Detalle</span>
                  </button>
                  <select
                    value={o.status}
                    onChange={(e) => onUpdateStatus(o.id, e.target.value)}
                    className="flex-1 text-xs border border-slate-200 rounded-xl px-2 py-2 bg-white font-medium focus:ring-1 focus:ring-purple-400 outline-none"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="paid">Pagado</option>
                    <option value="preparing">En preparación</option>
                    <option value="ready">Listo</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                  <button
                    onClick={() => onDeleteOrder(o.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Orders Desktop: Table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3.5 text-left w-10">
                  <input
                    type="checkbox"
                    checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    onChange={handleSelectAllOrders}
                    className="rounded text-purple-600 focus:ring-purple-400 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="text-left px-4 py-3.5">ID Pedido</th>
                <th className="text-left px-4 py-3.5">Cliente</th>
                <th className="text-left px-4 py-3.5 hidden md:table-cell">Productos</th>
                <th className="text-left px-4 py-3.5">Total</th>
                <th className="text-left px-4 py-3.5">Estado</th>
                <th className="text-left px-4 py-3.5 hidden lg:table-cell">Fecha</th>
                <th className="text-right px-4 py-3.5">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No se encontraron pedidos.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const customerName = o.shipping_name || o.profiles?.name || 'Cliente sin nombre';
                  const itemsCount = o.order_items?.length || 0;
                  const isSelected = selectedOrderIds.includes(o.id);
                  return (
                    <tr key={o.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-purple-50/40' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOrder(o.id)}
                          className="rounded text-purple-600 focus:ring-purple-400 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-purple-700">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{customerName}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px] sm:max-w-xs">
                          {o.shipping_address || 'Retiro en tienda'}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                          {itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                        ${Number(o.total || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(o.status)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell whitespace-nowrap">
                        {new Date(o.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
                            title="Ver Detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <select
                            value={o.status}
                            onChange={(e) => onUpdateStatus(o.id, e.target.value)}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white font-medium focus:ring-1 focus:ring-purple-400 outline-none"
                          >
                            <option value="pending">Pendiente</option>
                            <option value="paid">Pagado</option>
                            <option value="preparing">En preparación</option>
                            <option value="ready">Listo</option>
                            <option value="shipped">Enviado</option>
                            <option value="delivered">Entregado</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                          <button
                            onClick={() => onDeleteOrder(o.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Eliminar Pedido"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-purple-700 uppercase">
                  Pedido #{selectedOrder.id.slice(0, 8).toUpperCase()}
                </span>
                <h3 className="font-headline font-bold text-xl text-slate-900 mt-0.5">
                  Detalle del Pedido
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Creado el {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Info */}
            <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-xs uppercase text-purple-800 tracking-wider flex items-center space-x-1.5">
                <User className="w-4 h-4" />
                <span>Información del Cliente</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Nombre: </span>
                  <span className="font-bold text-slate-900">
                    {selectedOrder.shipping_name || selectedOrder.profiles?.name || 'No especificado'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Estado del Pedido: </span>
                  <span className="font-bold text-purple-700">
                    {selectedOrder.status === 'preparing' || selectedOrder.status === 'en_preparacion'
                      ? 'En preparación'
                      : selectedOrder.status === 'ready' || selectedOrder.status === 'listo'
                      ? 'Listo para retirar'
                      : selectedOrder.status === 'paid'
                      ? 'Pagado'
                      : selectedOrder.status === 'pending'
                      ? 'Pendiente de pago'
                      : selectedOrder.status}
                  </span>
                </div>
                {selectedOrder.shipping_address && (
                  <div className="col-span-2">
                    <span className="text-slate-500">Notas / Referencia: </span>
                    <span className="font-semibold text-slate-800">{selectedOrder.shipping_address}</span>
                  </div>
                )}
                {selectedOrder.receipt_url && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between col-span-2 mt-1">
                    <div className="flex items-center space-x-3">
                      <img
                        src={selectedOrder.receipt_url}
                        alt="Comprobante"
                        className="w-12 h-12 rounded-lg object-cover bg-white border border-emerald-200 cursor-pointer"
                        onClick={() => window.open(selectedOrder.receipt_url, '_blank')}
                      />
                      <div>
                        <span className="text-xs font-bold text-emerald-900 block">Comprobante de Pago Adjuntado 📑</span>
                        <span className="text-[11px] text-emerald-700">Subido por el cliente desde su panel</span>
                      </div>
                    </div>
                    <a
                      href={selectedOrder.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow transition-colors inline-flex items-center space-x-1"
                    >
                      <span>Ver Original</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Admin Progress Stepper & All-State Switcher */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase text-slate-700 tracking-wider flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>Cambiar Estado del Pedido (1 Clic - Avanzar o Retroceder)</span>
                </h4>
                <span className="text-[10px] font-semibold text-slate-400">Toca cualquier estado para aplicarlo</span>
              </div>

              {/* All 7 Status Quick Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { id: 'pending', label: 'Pendiente', badge: 'bg-amber-100 text-amber-900 border-amber-300', active: 'bg-amber-500 text-white ring-2 ring-amber-300 shadow-md' },
                  { id: 'paid', label: 'Pagado', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300', active: 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-md' },
                  { id: 'preparing', label: 'En preparación', badge: 'bg-indigo-100 text-indigo-900 border-indigo-300', active: 'bg-indigo-600 text-white ring-2 ring-indigo-300 shadow-md' },
                  { id: 'ready', label: 'Listo para retirar', badge: 'bg-cyan-100 text-cyan-900 border-cyan-300', active: 'bg-cyan-600 text-white ring-2 ring-cyan-300 shadow-md' },
                  { id: 'shipped', label: 'En camino / Enviado', badge: 'bg-blue-100 text-blue-900 border-blue-300', active: 'bg-blue-600 text-white ring-2 ring-blue-300 shadow-md' },
                  { id: 'delivered', label: 'Entregado', badge: 'bg-purple-100 text-purple-900 border-purple-300', active: 'bg-purple-600 text-white ring-2 ring-purple-300 shadow-md' },
                  { id: 'cancelled', label: 'Cancelado', badge: 'bg-red-100 text-red-900 border-red-300', active: 'bg-red-600 text-white ring-2 ring-red-300 shadow-md' },
                ].map((st) => {
                  const isCurrent = selectedOrder.status === st.id || 
                    (st.id === 'preparing' && selectedOrder.status === 'en_preparacion') ||
                    (st.id === 'ready' && selectedOrder.status === 'listo');
                  
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={async () => {
                        const updated = await onUpdateStatus(selectedOrder.id, st.id);
                        if (updated && updated.status) {
                          setSelectedOrder(updated);
                        } else {
                          setSelectedOrder((prev: any) => prev ? { ...prev, status: st.id } : null);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                        isCurrent
                          ? `${st.active} scale-105`
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {isCurrent && <Check className="w-3.5 h-3.5" />}
                      <span>{st.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Visual Progress Stepper Line */}
              {(() => {
                const currentStep = getStepProgress(selectedOrder.status);
                return (
                  <div className="grid grid-cols-4 gap-2 text-center relative pt-3 border-t border-slate-200/60 mt-2">
                    {/* Connector Line */}
                    <div className="absolute top-6 left-[12.5%] right-[12.5%] h-1 bg-slate-200 -z-0">
                      <div 
                        className="h-full candy-gradient-bg transition-all duration-300 rounded-full"
                        style={{ width: `${Math.max(0, (currentStep - 1) * 33.33)}%` }}
                      />
                    </div>

                    {/* Step 1: Pagado */}
                    <button
                      type="button"
                      onClick={async () => {
                        const updated = await onUpdateStatus(selectedOrder.id, 'paid');
                        if (updated && updated.status) {
                          setSelectedOrder(updated);
                        } else {
                          setSelectedOrder((prev: any) => prev ? { ...prev, status: 'paid' } : null);
                        }
                      }}
                      className="flex flex-col items-center space-y-1.5 relative z-10 group cursor-pointer"
                      title="Marcar como Pagado / Confirmado"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        selectedOrder.status === 'paid' || selectedOrder.status === 'pending'
                          ? 'candy-gradient-bg text-white shadow-md shadow-purple-300 ring-4 ring-purple-100'
                          : currentStep > 1
                          ? 'candy-gradient-bg text-white'
                          : 'bg-slate-200 text-slate-500 group-hover:bg-purple-200'
                      }`}>
                        {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
                      </div>
                      <span className={`text-[10px] font-bold ${currentStep >= 1 ? 'text-purple-900' : 'text-slate-400'}`}>
                        Pagado
                      </span>
                    </button>

                    {/* Step 2: En Preparación */}
                    <button
                      type="button"
                      onClick={async () => {
                        const updated = await onUpdateStatus(selectedOrder.id, 'preparing');
                        if (updated && updated.status) {
                          setSelectedOrder(updated);
                        } else {
                          setSelectedOrder((prev: any) => prev ? { ...prev, status: 'preparing' } : null);
                        }
                      }}
                      className="flex flex-col items-center space-y-1.5 relative z-10 group cursor-pointer"
                      title="Marcar como En Preparación"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        selectedOrder.status === 'preparing' || selectedOrder.status === 'en_preparacion'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-300 ring-4 ring-indigo-100'
                          : currentStep > 2
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 text-slate-500 group-hover:bg-indigo-200'
                      }`}>
                        {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
                      </div>
                      <span className={`text-[10px] font-bold ${currentStep >= 2 ? 'text-indigo-900' : 'text-slate-400'}`}>
                        En Preparación
                      </span>
                    </button>

                    {/* Step 3: Listo para Retirar */}
                    <button
                      type="button"
                      onClick={async () => {
                        const updated = await onUpdateStatus(selectedOrder.id, 'ready');
                        if (updated && updated.status) {
                          setSelectedOrder(updated);
                        } else {
                          setSelectedOrder((prev: any) => prev ? { ...prev, status: 'ready' } : null);
                        }
                      }}
                      className="flex flex-col items-center space-y-1.5 relative z-10 group cursor-pointer"
                      title="Marcar como Listo para Retirar"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        selectedOrder.status === 'ready' || selectedOrder.status === 'listo' || selectedOrder.status === 'shipped'
                          ? 'bg-cyan-600 text-white shadow-md shadow-cyan-300 ring-4 ring-cyan-100'
                          : currentStep > 3
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-200 text-slate-500 group-hover:bg-cyan-200'
                      }`}>
                        {currentStep > 3 ? <Check className="w-3.5 h-3.5" /> : '3'}
                      </div>
                      <span className={`text-[10px] font-bold ${currentStep >= 3 ? 'text-cyan-900' : 'text-slate-400'}`}>
                        Listo / Camino
                      </span>
                    </button>

                    {/* Step 4: Entregado */}
                    <button
                      type="button"
                      onClick={async () => {
                        const updated = await onUpdateStatus(selectedOrder.id, 'delivered');
                        if (updated && updated.status) {
                          setSelectedOrder(updated);
                        } else {
                          setSelectedOrder((prev: any) => prev ? { ...prev, status: 'delivered' } : null);
                        }
                      }}
                      className="flex flex-col items-center space-y-1.5 relative z-10 group cursor-pointer"
                      title="Marcar como Entregado"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        selectedOrder.status === 'delivered'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-300 ring-4 ring-emerald-100'
                          : 'bg-slate-200 text-slate-500 group-hover:bg-emerald-200'
                      }`}>
                        {currentStep >= 4 ? <Check className="w-3.5 h-3.5" /> : '4'}
                      </div>
                      <span className={`text-[10px] font-bold ${currentStep >= 4 ? 'text-emerald-900' : 'text-slate-400'}`}>
                        Entregado
                      </span>
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Purchased Items */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase text-slate-500 tracking-wider flex items-center space-x-1.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Productos Comprados ({selectedOrder.order_items?.length || 0})</span>
              </h4>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {(selectedOrder.order_items || []).map((item: any, idx: number) => {
                  const prod = item.products || {};
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        {prod.image_url && (
                          <img
                            src={prod.image_url}
                            alt={prod.name || 'Producto'}
                            className="w-10 h-10 rounded-lg object-cover bg-white border border-slate-200"
                          />
                        )}
                        <div>
                          <p className="font-bold text-slate-900">{prod.name || `Producto #${item.product_id.slice(0,6)}`}</p>
                          <p className="text-slate-500 mt-0.5">
                            {item.weight_grams ? `${item.weight_grams}g` : item.selected_size || 'Estándar'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">${(Number(item.unit_price) * item.quantity).toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400">
                          {item.quantity}x ${Number(item.unit_price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total + 2 WhatsApp Action Buttons */}
            <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500">Monto Total</span>
                <p className="text-2xl font-black text-purple-700">${Number(selectedOrder.total || 0).toFixed(2)}</p>
              </div>

              {(() => {
                const targetCustomerPhone = extractCustomerPhone(selectedOrder) || WHATSAPP_NUMERO;
                return (
                  <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                    <a
                      href={waLink(
                        buildMensajeEnPreparacion(
                          selectedOrder.shipping_name || selectedOrder.profiles?.name || 'Cliente',
                          selectedOrder.id
                        ),
                        targetCustomerPhone
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all hover:scale-105"
                    >
                      <MessageCircle className="w-4 h-4 text-indigo-200" />
                      <span>Avisar: En Preparación</span>
                    </a>

                    <a
                      href={waLink(
                        buildMensajeListo(
                          selectedOrder.shipping_name || selectedOrder.profiles?.name || 'Cliente',
                          selectedOrder.id
                        ),
                        targetCustomerPhone
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all hover:scale-105"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>Avisar: Listo para Retirar</span>
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Manual Sale Creation Modal */}
      {showManualSaleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                    <DollarSign className="w-5 h-5" />
                  </span>
                  <h3 className="font-headline font-bold text-xl text-slate-900">
                    Registrar Venta Presencial / Manual
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Registra compras en mostrador, eventos o ventas directas actualizando el inventario automáticamente.
                </p>
              </div>
              <button
                onClick={() => setShowManualSaleModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sale Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <h4 className="font-bold text-xs uppercase text-slate-700 tracking-wider">
                1. Información de la Venta
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nombre / Cliente:</label>
                  <input
                    type="text"
                    value={manualCustomerName}
                    onChange={(e) => setManualCustomerName(e.target.value)}
                    placeholder="Ej: Venta Mostrador / Juan"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium outline-none focus:ring-1 focus:ring-purple-400 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Notas / Referencia de Pago:</label>
                  <input
                    type="text"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="Ej: Efectivo caja mostrador"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium outline-none focus:ring-1 focus:ring-purple-400 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Método de Pago:</label>
                  <select
                    value={manualPaymentMethod}
                    onChange={(e) => setManualPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold outline-none bg-white"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Posnet / Tarjeta">Posnet / Tarjeta</option>
                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                    <option value="Mercado Pago QR">Mercado Pago QR</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Estado Inicial del Pedido:</label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold outline-none bg-white text-emerald-800"
                  >
                    <option value="paid">Pagado (Ingreso Confirmado)</option>
                    <option value="preparing">En preparación</option>
                    <option value="ready">Listo para retirar</option>
                    <option value="delivered">Entregado</option>
                    <option value="pending">Pendiente de Pago</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Selector with Visual Card Grid & Quick Presets */}
            <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h4 className="font-bold text-xs uppercase text-purple-950 tracking-wider flex items-center space-x-1.5">
                  <ShoppingBag className="w-4 h-4 text-purple-600" />
                  <span>2. Catálogo & Selección de Productos</span>
                </h4>
                {selectedProdId && (
                  <button
                    onClick={() => setSelectedProdId('')}
                    className="text-xs text-purple-600 hover:text-purple-800 font-semibold underline"
                  >
                    Deseleccionar producto
                  </button>
                )}
              </div>

              {/* Search & Category Filter Bar */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                  <input
                    type="text"
                    placeholder="Buscar producto por nombre o categoría..."
                    value={manualProdSearchTerm}
                    onChange={(e) => setManualProdSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-purple-200 rounded-xl text-xs bg-white font-medium outline-none focus:ring-2 focus:ring-purple-400 shadow-sm"
                  />
                  {manualProdSearchTerm && (
                    <button
                      onClick={() => setManualProdSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                  <button
                    onClick={() => setManualCategoryFilter('all')}
                    className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
                      manualCategoryFilter === 'all'
                        ? 'bg-purple-700 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    Todas las categorías
                  </button>
                  {[...new Set(availableProducts.map((p) => p.category).filter(Boolean))].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setManualCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
                        manualCategoryFilter === cat
                          ? 'bg-purple-700 text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Products Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {availableProducts
                  .filter((p) => {
                    const matchesSearch =
                      (p.name || '').toLowerCase().includes(manualProdSearchTerm.toLowerCase()) ||
                      (p.category || '').toLowerCase().includes(manualProdSearchTerm.toLowerCase());
                    const matchesCat = manualCategoryFilter === 'all' || p.category === manualCategoryFilter;
                    return matchesSearch && matchesCat;
                  })
                  .map((p) => {
                    const isSelected = selectedProdId === p.id;
                    const isWeight = p.unit_type === 'weight';
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p.id)}
                        className={`cursor-pointer rounded-xl p-2.5 border transition-all flex items-center space-x-3 ${
                          isSelected
                            ? 'bg-white border-purple-600 ring-2 ring-purple-600/30 shadow-md'
                            : 'bg-white border-purple-100 hover:border-purple-300 hover:shadow-sm'
                        }`}
                      >
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-purple-700 truncate">
                              {p.category || 'Golosinas'}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                p.stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {p.stock}{isWeight ? 'g' : ' uds'}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-slate-900 truncate">{p.name}</p>
                          <p className="font-black text-xs text-purple-900">
                            ${p.base_price.toFixed(2)}{isWeight ? ' / 1k' : ''}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Selected Product Builder & Presets */}
              {selectedProdId &&
                (() => {
                  const selectedProd = products.find((p) => p.id === selectedProdId);
                  if (!selectedProd) return null;
                  const isWeight = selectedProd.unit_type === 'weight';

                  return (
                    <div className="bg-white border border-purple-200 rounded-xl p-3.5 space-y-3 shadow-md animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-purple-900">{selectedProd.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
                            {isWeight ? 'Venta por Peso (g)' : 'Venta por Unidad'}
                          </span>
                        </div>
                        <span className="text-xs font-black text-slate-900">${selectedProd.base_price}</span>
                      </div>

                      {/* Presets Row */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                          {isWeight ? 'Seleccionar Peso Rápido:' : 'Seleccionar Cantidad Rápida:'}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {isWeight ? (
                            [100, 250, 500, 1000].map((grams) => (
                              <button
                                key={grams}
                                onClick={() => {
                                  setBuilderWeightGrams(grams);
                                  setBuilderUnitPrice((selectedProd.base_price * grams) / 1000);
                                }}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                                  builderWeightGrams === grams
                                    ? 'bg-purple-700 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-700 hover:bg-purple-100'
                                }`}
                              >
                                {grams >= 1000 ? `${grams / 1000}kg` : `${grams}g`}
                              </button>
                            ))
                          ) : (
                            [1, 2, 5, 10].map((qty) => (
                              <button
                                key={qty}
                                onClick={() => {
                                  setBuilderQty(qty);
                                  setBuilderUnitPrice(selectedProd.base_price * qty);
                                }}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                                  builderQty === qty
                                    ? 'bg-purple-700 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-700 hover:bg-purple-100'
                                }`}
                              >
                                {qty} {qty === 1 ? 'unidad' : 'unidades'}
                              </button>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Custom Input & Price Adjust */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        {isWeight ? (
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">Gramos exactos (g):</label>
                            <input
                              type="number"
                              step={50}
                              value={builderWeightGrams}
                              onChange={(e) => {
                                const weight = Number(e.target.value);
                                setBuilderWeightGrams(weight);
                                setBuilderUnitPrice((selectedProd.base_price * weight) / 1000);
                              }}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">Cantidad exactas:</label>
                            <input
                              type="number"
                              min={1}
                              value={builderQty}
                              onChange={(e) => {
                                const qty = Math.max(1, Number(e.target.value));
                                setBuilderQty(qty);
                                setBuilderUnitPrice(selectedProd.base_price * qty);
                              }}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                            />
                          </div>
                        )}

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Subtotal de Ítem ($):</label>
                          <input
                            type="number"
                            step={0.01}
                            value={builderUnitPrice}
                            onChange={(e) => setBuilderUnitPrice(Number(e.target.value))}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white text-purple-700"
                          />
                        </div>

                        <div className="flex items-end">
                          <button
                            onClick={handleAddItemToManualSale}
                            className="w-full px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center space-x-1"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Agregar (${builderUnitPrice.toFixed(2)})</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </div>

            {/* Added Items Table */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase text-slate-700 tracking-wider">
                3. Productos Agregados a la Venta ({manualItems.length})
              </h4>
              {manualItems.length === 0 ? (
                <div className="p-6 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                  Aún no agregaste productos a esta venta.
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {manualItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                      <div className="flex items-center space-x-3">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.name} className="w-9 h-9 rounded-lg object-cover bg-white border border-slate-200" />
                        )}
                        <div>
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <span className="text-slate-500 text-[11px]">
                            {item.weight_grams ? `${item.weight_grams}g` : `${item.quantity} uds`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-black text-slate-900">${item.unit_price.toFixed(2)}</span>
                        <button
                          onClick={() => handleRemoveManualItem(idx)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total and Submit */}
            {(() => {
              const totalAmount = manualItems.reduce((sum, item) => sum + Number(item.unit_price || 0), 0);
              return (
                <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-500">Monto Total de la Venta</span>
                    <p className="text-3xl font-black text-emerald-700">${totalAmount.toFixed(2)}</p>
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <button
                      onClick={() => setShowManualSaleModal(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      disabled={submittingManualOrder || manualItems.length === 0}
                      onClick={handleSaveManualOrder}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg transition-colors disabled:opacity-50"
                    >
                      {submittingManualOrder ? (
                        <span>Guardando Venta...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Finalizar y Registrar Venta</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

