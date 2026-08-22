import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, Search, Clock, CheckCircle2, ShoppingBag, Upload, FileText, 
  ExternalLink, Copy, Check, ArrowLeft, RefreshCw, AlertCircle, MessageCircle, 
  ChevronDown, ChevronUp, Sparkles, Building2, CreditCard
} from 'lucide-react';
import { ActiveScreen, UserSession } from '../types';
import { orders as ordersApi, upload as uploadApi, homepage as homepageApi } from '../lib/api';
import { DATOS_BANCO, WHATSAPP_NUMERO, waLink, setBankData } from '../lib/whatsapp';
import { useModal } from '../context/ModalContext';

interface MyOrdersScreenProps {
  setActiveScreen: (screen: ActiveScreen) => void;
  session: UserSession;
}

export const MyOrdersScreen: React.FC<MyOrdersScreenProps> = ({
  setActiveScreen,
  session,
}) => {
  const { showAlert } = useModal();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchedOrder, setSearchedOrder] = useState<any | null>(null);
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [bankData, setBankDataState] = useState(DATOS_BANCO);

  useEffect(() => {
    homepageApi.getSettings().then((st) => {
      if (st) {
        setBankData(st);
        setBankDataState({
          alias: st.bank_alias || DATOS_BANCO.alias,
          banco: st.bank_name || DATOS_BANCO.banco,
          titular: st.bank_holder || DATOS_BANCO.titular,
          cbu: st.bank_cbu || DATOS_BANCO.cbu,
        });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (session.isLoggedIn) {
      fetchMyOrders();
    }
  }, [session.isLoggedIn]);

  const fetchMyOrders = async () => {
    setLoading(true);
    try {
      const data = await ordersApi.get('');
      if (Array.isArray(data)) {
        setOrders(data);
        if (data.length > 0) {
          setExpandedOrderId(data[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error al cargar pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setSearching(true);
    try {
      const result = await ordersApi.searchByCode(searchCode.trim());
      if (result && result.id) {
        setSearchedOrder(result);
        setExpandedOrderId(result.id);
      } else {
        showAlert({ title: 'Pedido no encontrado', message: 'No encontramos un pedido registrado con esa clave o código.', type: 'warning' });
      }
    } catch (err: any) {
      showAlert({ title: 'No encontrado', message: err.message || 'No se encontró el pedido solicitado.', type: 'error' });
    } finally {
      setSearching(false);
    }
  };

  const handleUploadReceipt = async (orderId: string, file: File) => {
    setUploadingOrderId(orderId);
    try {
      // 1. Upload file image
      const uploadRes = await uploadApi.single(file);
      if (!uploadRes.url) throw new Error('No se pudo subir la imagen del comprobante');

      // 2. Attach receipt_url to order
      const updatedOrder = await ordersApi.uploadReceipt(orderId, uploadRes.url);

      // Update state
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, receipt_url: uploadRes.url, shipping_address: updatedOrder.shipping_address } : o));
      if (searchedOrder && searchedOrder.id === orderId) {
        setSearchedOrder(prev => ({ ...prev, receipt_url: uploadRes.url, shipping_address: updatedOrder.shipping_address }));
      }

      showAlert({ title: 'Comprobante Subido', message: 'Tu comprobante de pago fue recibido con éxito. El equipo de la tienda lo revisará en breve.', type: 'success' });
    } catch (err: any) {
      showAlert({ title: 'Error al subir', message: err.message || 'Ocurrió un error al subir el comprobante. Intentá nuevamente.', type: 'error' });
    } finally {
      setUploadingOrderId(null);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
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

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">Pagado</span>;
      case 'preparing':
      case 'en_preparacion':
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">En preparación 🍬</span>;
      case 'ready':
      case 'listo':
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-cyan-100 text-cyan-800 border border-cyan-200">Listo para retirar 🛍️</span>;
      case 'shipped':
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-200">En camino 🚚</span>;
      case 'delivered':
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-200">Entregado 🎉</span>;
      case 'cancelled':
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-800 border border-red-200">Cancelado</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">Pendiente de Pago</span>;
    }
  };

  const displayOrdersList = searchedOrder ? [searchedOrder] : orders;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/50 via-white to-pink-50/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveScreen('inicio')}
            className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-purple-700 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm transition-all hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Tienda</span>
          </button>

          {session.isLoggedIn && (
            <button
              onClick={fetchMyOrders}
              disabled={loading}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 p-2 rounded-xl hover:bg-purple-50 transition-colors"
              title="Actualizar lista de pedidos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          )}
        </div>

        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-pink-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,_rgba(236,72,153,0.3),transparent_60%)] pointer-events-none" />
          
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-bold text-pink-200">
              <Package className="w-4 h-4 text-pink-400" />
              <span>Centro de Seguimiento de Compras</span>
            </div>
            <h1 className="font-headline font-black text-2xl sm:text-4xl">
              Estado de tus Pedidos
            </h1>
            <p className="text-purple-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Consultá el progreso de tus compras en tiempo real, subí tu comprobante de pago por transferencia y comunicate directo con la tienda.
            </p>
          </div>
        </div>

        {/* Search Bar for non-logged in or searching specific order */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
          <form onSubmit={handleSearchOrder} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ingresá tu N° de Pedido (Ej: #4F165DE0)..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !searchCode.trim()}
              className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Buscar Pedido</span>
            </button>
          </form>

          {searchedOrder && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500">Mostrando resultado para la búsqueda: <b className="text-purple-700">#{searchedOrder.id.slice(0, 8).toUpperCase()}</b></span>
              <button
                onClick={() => setSearchedOrder(null)}
                className="text-purple-600 font-bold hover:underline"
              >
                Ver todos mis pedidos
              </button>
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
            <p className="text-xs sm:text-sm font-bold text-slate-600">Cargando tus pedidos registrados...</p>
          </div>
        ) : displayOrdersList.length === 0 ? (
          /* Empty state */
          <div className="bg-white p-10 sm:p-14 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg text-slate-900">No encontramos pedidos registrados</h3>
              <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-md mx-auto">
                {!session.isLoggedIn 
                  ? 'Iniciá sesión con tu cuenta o ingresá el código de tu pedido en el buscador de arriba.'
                  : 'Aún no has realizado ninguna compra en Chamical Candy Shop. ¡Explorá nuestro catálogo!'}
              </p>
            </div>
            <button
              onClick={() => setActiveScreen('catalogo')}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-purple-200 transition-all transform hover:scale-105"
            >
              <Package className="w-4.5 h-4.5" />
              <span>Explorar Catálogo</span>
            </button>
          </div>
        ) : (
          /* Orders List */
          <div className="space-y-6">
            {displayOrdersList.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const currentStep = getStepProgress(order.status);
              const itemsCount = order.order_items?.length || 0;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-md hover:shadow-lg transition-all overflow-hidden"
                >
                  {/* Order Top Bar */}
                  <div 
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    className="p-5 sm:p-6 bg-gradient-to-r from-slate-50 to-purple-50/30 flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none border-b border-slate-100"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-xs font-black text-purple-700 bg-purple-100/80 px-2.5 py-1 rounded-lg">
                          PEDIDO #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        {renderStatusBadge(order.status)}
                      </div>
                      <p className="text-xs text-slate-500">
                        Realizado el {new Date(order.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 font-semibold block">Monto Total</span>
                        <span className="text-xl font-black text-purple-900">${Number(order.total || 0).toFixed(2)}</span>
                      </div>

                      <button className="p-2 text-slate-400 hover:text-slate-700 bg-white rounded-xl border border-slate-200 shadow-sm">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Order Content */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-5 sm:p-7 space-y-6"
                      >
                        {/* 1. Visual Progress Stepper Bar */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                          <h4 className="font-headline font-bold text-xs uppercase text-slate-600 tracking-wider flex items-center space-x-1.5">
                            <Clock className="w-4 h-4 text-purple-600" />
                            <span>Progreso del Pedido</span>
                          </h4>

                          <div className="grid grid-cols-4 gap-2 text-center relative">
                            {/* Connector Line */}
                            <div className="absolute top-4 left-[12.5%] right-[12.5%] h-1 bg-slate-200 -z-0">
                              <div 
                                className="h-full candy-gradient-bg transition-all duration-500"
                                style={{ width: `${Math.max(0, (currentStep - 1) * 33.33)}%` }}
                              />
                            </div>

                            {/* Step 1 */}
                            <div className="flex flex-col items-center space-y-1.5 relative z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                currentStep >= 1 ? 'candy-gradient-bg text-white shadow-md shadow-purple-300' : 'bg-slate-200 text-slate-500'
                              }`}>
                                {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
                              </div>
                              <span className={`text-[11px] font-bold leading-tight ${currentStep >= 1 ? 'text-purple-900' : 'text-slate-400'}`}>
                                Confirmado
                              </span>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col items-center space-y-1.5 relative z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                currentStep >= 2 ? 'candy-gradient-bg text-white shadow-md shadow-purple-300' : 'bg-slate-200 text-slate-500'
                              }`}>
                                {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
                              </div>
                              <span className={`text-[11px] font-bold leading-tight ${currentStep >= 2 ? 'text-purple-900' : 'text-slate-400'}`}>
                                En Preparación
                              </span>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-center space-y-1.5 relative z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                currentStep >= 3 ? 'candy-gradient-bg text-white shadow-md shadow-purple-300' : 'bg-slate-200 text-slate-500'
                              }`}>
                                {currentStep > 3 ? <Check className="w-4 h-4" /> : '3'}
                              </div>
                              <span className={`text-[11px] font-bold leading-tight ${currentStep >= 3 ? 'text-purple-900' : 'text-slate-400'}`}>
                                Listo / En Camino
                              </span>
                            </div>

                            {/* Step 4 */}
                            <div className="flex flex-col items-center space-y-1.5 relative z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                currentStep >= 4 ? 'candy-gradient-bg text-white shadow-md shadow-purple-300' : 'bg-slate-200 text-slate-500'
                              }`}>
                                {currentStep >= 4 ? <Check className="w-4 h-4" /> : '4'}
                              </div>
                              <span className={`text-[11px] font-bold leading-tight ${currentStep >= 4 ? 'text-purple-900' : 'text-slate-400'}`}>
                                Entregado
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2. WhatsApp Transfer Receipt Box & Bank Details (Only visible when order status is pending) */}
                        {order.status === 'pending' && (
                          <>
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50/60 p-5 rounded-2xl border border-emerald-200 space-y-4">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-md">
                                    <MessageCircle className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <h4 className="font-headline font-bold text-sm text-emerald-950">
                                      Envío de Comprobante de Pago por Transferencia
                                    </h4>
                                    <p className="text-xs text-emerald-800/80 mt-0.5">
                                      El comprobante de pago se envía directamente al chat de WhatsApp de la tienda.
                                    </p>
                                  </div>
                                </div>

                                <a
                                  href={waLink(`Hola! Adjunto el comprobante de transferencia bancaria para mi pedido #${order.id.slice(0, 8).toUpperCase()} por el monto total de $${Number(order.total || 0).toFixed(2)}.`)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                                >
                                  <MessageCircle className="w-4.5 h-4.5" />
                                  <span>Enviar Comprobante por WhatsApp</span>
                                </a>
                              </div>
                            </div>

                            {/* 3. Bank Transfer Info */}
                            <div className="bg-purple-50/60 p-5 rounded-2xl border border-purple-100 space-y-3">
                              <h4 className="font-headline font-bold text-xs uppercase text-purple-900 tracking-wider flex items-center space-x-1.5">
                                <Building2 className="w-4 h-4 text-purple-700" />
                                <span>Datos Bancarios para la Transferencia</span>
                              </h4>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="bg-white p-3 rounded-xl border border-purple-100 flex items-center justify-between">
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Alias CBU:</span>
                                    <span className="font-extrabold text-purple-900 text-sm font-mono">{bankData.alias}</span>
                                  </div>
                                  <button
                                    onClick={() => copyToClipboard(bankData.alias, 'alias')}
                                    className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors cursor-pointer"
                                    title="Copiar Alias"
                                  >
                                    {copiedField === 'alias' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                  </button>
                                </div>

                                <div className="bg-white p-3 rounded-xl border border-purple-100 flex items-center justify-between">
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Titular:</span>
                                    <span className="font-extrabold text-slate-800">{bankData.titular}</span>
                                  </div>
                                  <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">{bankData.banco}</span>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* 4. Products List */}
                        <div className="space-y-3">
                          <h4 className="font-headline font-bold text-xs uppercase text-slate-600 tracking-wider flex items-center space-x-1.5">
                            <ShoppingBag className="w-4 h-4 text-purple-600" />
                            <span>Detalle de Productos ({itemsCount})</span>
                          </h4>

                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {(order.order_items || []).map((item: any, idx: number) => {
                              const prod = item.products || {};
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs"
                                >
                                  <div className="flex items-center space-x-3">
                                    {prod.image_url && (
                                      <img
                                        src={prod.image_url}
                                        alt={prod.name || 'Producto'}
                                        className="w-11 h-11 rounded-lg object-cover bg-white border border-slate-200"
                                      />
                                    )}
                                    <div>
                                      <p className="font-bold text-slate-900">{prod.name || `Producto #${item.product_id?.slice(0,6)}`}</p>
                                      <p className="text-slate-500 mt-0.5">
                                        {item.weight_grams ? `${item.weight_grams}g` : item.selected_size || 'Estándar'}
                                      </p>
                                      {item.combo_selections && item.combo_selections.length > 0 && (
                                        <div className="mt-1 space-y-0.5">
                                          {item.combo_selections.map((sel: any, idxSel: number) => (
                                            <p key={idxSel} className="text-[10px] text-slate-500">
                                              • {sel.name || sel.product?.name} ({sel.quantity}{sel.isWeight ? 'g' : ' un.'})
                                            </p>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-extrabold text-slate-900">${(Number(item.unit_price) * item.quantity).toFixed(2)}</p>
                                    <p className="text-[10px] text-slate-400">
                                      {item.quantity}x ${Number(item.unit_price).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 5. Direct WhatsApp Action */}
                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                          <span className="text-xs text-slate-500">¿Tenés alguna duda sobre la entrega de tu pedido?</span>
                          <a
                            href={waLink(`Hola! Me comunico sobre mi pedido #${order.id.slice(0,8).toUpperCase()}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all transform hover:scale-105"
                          >
                            <MessageCircle className="w-4 h-4 text-emerald-200" />
                            <span>Consultar por WhatsApp</span>
                          </a>
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
