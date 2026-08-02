import React, { useState } from 'react';
import { Search, Eye, Trash2, X, MessageCircle, AlertCircle, ShoppingBag, User, Calendar, CheckCircle2 } from 'lucide-react';
import { WHATSAPP_NUMERO } from '../lib/whatsapp';

interface AdminOrdersSectionProps {
  orders: any[];
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
}

export const AdminOrdersSection: React.FC<AdminOrdersSectionProps> = ({
  orders,
  onUpdateStatus,
  onDeleteOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.shipping_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.profiles?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.shipping_address || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Pagado</span>;
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-headline font-bold text-slate-900">Gestión de Pedidos</h1>
          <p className="text-xs text-slate-500 mt-0.5">{orders.length} pedidos registrados en total</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ID, cliente o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
            />
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'pending', label: 'Pendientes' },
            { id: 'paid', label: 'Pagados' },
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

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3">ID Pedido</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Productos</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Fecha</th>
                <th className="text-right px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No se encontraron pedidos.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const customerName = o.shipping_name || o.profiles?.name || 'Cliente sin nombre';
                  const itemsCount = o.order_items?.length || 0;
                  return (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
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
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
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
                            <option value="shipped">Enviado</option>
                            <option value="delivered">Entregado</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                          <button
                            onClick={() => onDeleteOrder(o.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                  <span className="text-slate-500">Estado del Pago: </span>
                  <span className="font-bold text-purple-700 capitalize">{selectedOrder.status}</span>
                </div>
                {selectedOrder.shipping_address && (
                  <div className="col-span-2">
                    <span className="text-slate-500">Notas / Referencia: </span>
                    <span className="font-semibold text-slate-800">{selectedOrder.shipping_address}</span>
                  </div>
                )}
              </div>
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

            {/* Total + Actions */}
            <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500">Monto Total</span>
                <p className="text-2xl font-black text-purple-700">${Number(selectedOrder.total || 0).toFixed(2)}</p>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(
                    `Hola! Te contactamos desde Chamical Candy Shop sobre tu pedido #${selectedOrder.id.slice(0, 8).toUpperCase()}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Contactar por WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
