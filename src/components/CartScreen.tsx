import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Trash2, ArrowRight, AlertCircle, MapPin, CreditCard, PartyPopper, Landmark, MessageCircle, Check, Phone } from 'lucide-react';
import { ActiveScreen, CartItem } from '../types';
import { cart as cartApi, orders as ordersApi, payments as paymentsApi, homepage as homepageApi } from '../lib/api';
import { getAuthToken } from '../lib/api';
import { buildMensajePedido, waLink, DATOS_BANCO, WHATSAPP_NUMERO, WHATSAPP_NUMERO_1, WHATSAPP_NUMERO_2, setWhatsAppNumbers } from '../lib/whatsapp';

interface CartScreenProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  setActiveScreen: (screen: ActiveScreen) => void;
  isLoggedIn: boolean;
}

type CheckoutStep = 'basket' | 'checkout' | 'success';

export const CartScreen: React.FC<CartScreenProps> = ({ cart, setCart, setActiveScreen, isLoggedIn }) => {
  const [step, setStep] = React.useState<CheckoutStep>('basket');

  const [promoCode, setPromoCode] = React.useState('');
  const [activeDiscount, setActiveDiscount] = React.useState<{ code: string; percent: number } | null>(null);
  const [promoError, setPromoError] = React.useState('');

  const [fullName, setFullName] = React.useState('');
  const [addressLine, setAddressLine] = React.useState('');
  const [cityField, setCityField] = React.useState('');
  const [phoneField, setPhoneField] = React.useState('');
  const [shippingError, setShippingError] = React.useState('');
  const [orderId, setOrderId] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState<'mercadopago' | 'transferencia'>('mercadopago');
  const [lastOrderItems, setLastOrderItems] = React.useState<CartItem[]>([]);
  const [lastOrderTotal, setLastOrderTotal] = React.useState<number>(0);
  const [activePhone, setActivePhone] = React.useState<string>(WHATSAPP_NUMERO_1);

  React.useEffect(() => {
    homepageApi.getSettings().then((st) => {
      if (st) {
        const phone = st.active_phone || st.whatsapp_number_1 || WHATSAPP_NUMERO_1;
        setActivePhone(phone);
        setWhatsAppNumbers(st.whatsapp_number_1, st.whatsapp_number_2);
      }
    }).catch(() => {});
  }, []);

  const subTotal = cart.reduce((acc, item) => acc + (item.itemPrice * item.quantity), 0);
  const discountAmount = activeDiscount ? subTotal * (activeDiscount.percent / 100) : 0;
  const grandTotal = subTotal - discountAmount;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    const typed = promoCode.trim().toUpperCase();

    if (typed === 'DULCE2024') {
      setActiveDiscount({ code: 'DULCE2024', percent: 15 });
      setPromoCode('');
    } else if (typed === '') {
      setPromoError('Ingresa un cupón primero.');
    } else {
      setPromoError('Cupón inválido o expirado en el hiperespacio.');
    }
  };

  const handleQuantityChange = async (index: number, delta: number) => {
    const item = cart[index]

    if (item.weight_grams) {
      const step = 50 // Modificar de a 50 gramos
      const newWeight = (item.weight_grams || 0) + (delta > 0 ? step : -step)
      if (newWeight < 50) {
        await handleRemoveItem(index)
        return
      }
      const pricePerKg = Number(item.product.price_per_kg) || 0
      const newPrice = Math.round((newWeight / 1000) * pricePerKg * 100) / 100

      if (isLoggedIn) {
        try {
          const items = await cartApi.list()
          const apiItem = items.find((i: any) => i.product_id === item.product.id)
          if (apiItem) await cartApi.update(apiItem.id, { weight_grams: newWeight })
        } catch { /* ignore */ }
      }
      setCart(prev => {
        const updated = [...prev]
        updated[index] = { ...updated[index], weight_grams: newWeight, itemPrice: newPrice }
        return updated
      })
      return
    }

    const newQty = item.quantity + delta
    if (newQty <= 0) {
      await handleRemoveItem(index)
      return
    }
    if (isLoggedIn) {
      try {
        const items = await cartApi.list()
        const apiItem = items.find((i: any) => i.product_id === item.product.id && i.selected_size === item.selectedSize)
        if (apiItem) await cartApi.update(apiItem.id, { quantity: newQty })
      } catch { /* ignore */ }
    }
    setCart(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], quantity: newQty }
      return updated
    })
  };

  const handleRemoveItem = async (index: number) => {
    const item = cart[index]
    if (isLoggedIn) {
      try {
        const items = await cartApi.list()
        const apiItem = items.find((i: any) => i.product_id === item.product.id && (item.weight_grams ? true : i.selected_size === item.selectedSize))
        if (apiItem) await cartApi.remove(apiItem.id)
      } catch { /* ignore */ }
    }
    setCart(prev => prev.filter((_, i) => i !== index))
  };

  const handleCheckout = async () => {
    if (!fullName.trim()) {
      setShippingError('Ingresa tu nombre completo para continuar.');
      return;
    }
    setShippingError('');

    const token = getAuthToken()
    if (!token) {
      setActiveScreen('login')
      return
    }

    try {
      if (paymentMethod === 'transferencia') {
        const result = await ordersApi.create({
          shipping_name: fullName,
          shipping_address: addressLine,
          shipping_city: cityField,
          promo_code: activeDiscount?.code,
        })
        const finalTotal = Number(result.total) || grandTotal
        setLastOrderItems(cart)
        setLastOrderTotal(finalTotal)
        setOrderId(result.id)
        setCart([])
        setStep('success')
      } else {
        const result = await paymentsApi.createPreference({
          shipping_name: fullName,
          shipping_address: addressLine,
          shipping_city: cityField,
          promo_code: activeDiscount?.code,
        })
        window.location.href = result.init_point
      }
    } catch (err: any) {
      setShippingError(err.message || 'Error al procesar el pago.')
    }
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentId = params.get('payment_id') || params.get('collection_id')
    const preferenceId = params.get('preference_id') || ''
    const status = params.get('status') || params.get('collection_status')

    if (paymentId && (status === 'approved' || status === 'accredited')) {
      window.history.replaceState({}, '', window.location.pathname)

      const confirmOrder = async () => {
        try {
          const result = await ordersApi.confirm(paymentId, preferenceId)
          const finalTotal = Number(result.total) || 0
          setLastOrderTotal(finalTotal)
          setOrderId(result.id)
          setCart([])
          setStep('success')

          const itemsList = (result.order_items || []).map((i: any) =>
            `• ${i.quantity}x ${i.selected_size} - $${Number(i.unit_price).toFixed(2)}`
          ).join('\n')

          const msg = encodeURIComponent(
            `✅ *Compra confirmada!*\n\n*Pedido:* #${result.id.slice(0, 8).toUpperCase()}\n*Pago:* ${result.payment_id || paymentId}\n\n*Productos:*\n${itemsList}\n\n*Total:* $${finalTotal.toFixed(2)}\n\nGracias por tu compra! 🚀`
          )

          setTimeout(() => {
            window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${msg}`, '_blank')
          }, 1500)
        } catch (err: any) {
          setShippingError(err.message || 'Error al confirmar el pedido')
          setStep('checkout')
        }
      }
      confirmOrder()
    } else if (status === 'failure' || status === 'rejected') {
      setShippingError('El pago no fue procesado o fue rechazado. Intenta de nuevo.')
      setStep('checkout')
    }
  }, [])

  return (
    <div className="bg-white min-h-screen">
      {/* Header strip */}
      <div className="bg-gradient-to-r from-purple-900 to-pink-900 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="font-headline font-extrabold text-2xl sm:text-3xl">Tu Bolsa 🛍️</h1>
            <p className="text-purple-200 text-sm mt-1">{cart.length} artículo{cart.length !== 1 ? 's' : ''}</p>
          </div>
          {step !== 'success' && (
            <div className="hidden sm:flex items-center space-x-2 text-sm">
              {(['basket', 'checkout'] as const).map((s, i) => (
                <React.Fragment key={s}>
                  {i > 0 && <div className="w-6 h-px bg-white/30" />}
                  <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                    step === s ? 'bg-white/20 text-white' : 'text-white/40'
                  }`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step === s ? 'bg-pink-400' : 'bg-white/10'
                    }`}>{i + 1}</span>
                    <span>{s === 'basket' ? 'Bolsa' : 'Pago'}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {step === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 space-y-6"
          >
            <div className="w-24 h-24 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
              <PartyPopper className="w-12 h-12 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-headline font-bold text-gray-900">¡Pedido Confirmado!</h2>
              <p className="text-gray-500 mt-2">Tu pedido #<span className="font-mono font-bold text-purple-700">{orderId.slice(0, 8).toUpperCase()}</span> está listo.</p>
              <p className="text-sm text-gray-400 mt-1">{paymentMethod === 'transferencia' ? 'Te esperamos para confirmarlo con el comprobante.' : 'Te contactaremos por WhatsApp si hay novedades.'}</p>
            </div>

            {paymentMethod === 'transferencia' && (
              <div className="max-w-md mx-auto text-left bg-gradient-to-br from-purple-50 to-pink-50 border border-pink-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="font-headline font-bold text-gray-900 flex items-center space-x-2">
                  <Landmark className="w-5 h-5 text-purple-600" />
                  <span>Pagá por transferencia</span>
                </h3>
                <p className="text-sm text-gray-600">
                  Hacé la transferencia al alias y envianos el comprobante por WhatsApp para confirmar tu compra.
                </p>
                <div className="bg-white rounded-xl p-4 space-y-1.5 text-sm border border-pink-100">
                  <div className="flex justify-between"><span className="text-gray-500">Banco</span><span className="font-semibold">{DATOS_BANCO.banco}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Alias</span><span className="font-mono font-bold text-purple-700">{DATOS_BANCO.alias}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Titular</span><span className="font-semibold">{DATOS_BANCO.titular}</span></div>
                  {DATOS_BANCO.cbu && <div className="flex justify-between"><span className="text-gray-500">CBU</span><span className="font-mono">{DATOS_BANCO.cbu}</span></div>}
                </div>
                <div className="flex justify-between bg-white rounded-xl px-4 py-2.5 border border-pink-100 text-sm">
                  <span className="text-gray-500">Total a transferir</span>
                  <span className="font-bold text-purple-700">${lastOrderTotal.toFixed(2)}</span>
                </div>

                <a
                  href={waLink(
                    buildMensajePedido({
                      orderId,
                      items: lastOrderItems.length > 0 ? lastOrderItems : cart,
                      fullName,
                      addressLine,
                      cityField,
                      phoneField,
                      subTotal: lastOrderTotal,
                      discountAmount: 0,
                      grandTotal: lastOrderTotal,
                      formaPago: 'transferencia',
                    }),
                    activePhone
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer text-sm"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Enviar comprobante por WhatsApp</span>
                </a>
              </div>
            )}
            <a
              href={waLink(
                `Hola! Quiero consultar sobre mi pedido #${orderId.slice(0, 8).toUpperCase()}`,
                activePhone
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors shadow-md text-sm"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Contactar por WhatsApp</span>
            </a>
            <div className="pt-4">
              <button
                onClick={() => { setStep('basket'); setActiveDiscount(null); setActiveScreen('catalogo'); }}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg"
              >
                Seguir Comprando
              </button>
            </div>
          </motion.div>
        )}

        {/* Basket step */}
        {step === 'basket' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left - Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-gray-400 space-y-3">
                  <ShoppingBag className="w-16 h-16 mx-auto text-gray-200" />
                  <p className="text-lg font-semibold">Tu bolsa está vacía</p>
                  <p className="text-sm">¡Explora nuestro catálogo galáctico!</p>
                  <button
                    onClick={() => setActiveScreen('catalogo')}
                    className="mt-4 px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl text-sm shadow"
                  >
                    Explorar Catálogo
                  </button>
                </div>
              ) : (
                cart.map((item, index) => (
                  <motion.div
                    key={`${item.product.id}-${item.selectedSize}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    layout
                    className="flex items-start space-x-4 bg-white border border-pink-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <img src={item.product.image_url} alt={item.product.name} decoding="async" loading="lazy" className="w-20 h-20 rounded-xl object-cover bg-pink-100 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">{item.product.category}</span>
                          <h3 className="font-headline font-bold text-sm sm:text-base text-gray-900 leading-tight">{item.product.name}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{item.weight_grams ? `${item.weight_grams}g · Granel` : `Tamaño: ${item.selectedSize}`}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-1.5 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center bg-gray-100 rounded-full p-0.5 space-x-1">
                            <button
                              onClick={() => handleQuantityChange(index, -1)}
                              className="w-7 h-7 rounded-full bg-white shadow-sm text-gray-600 hover:text-red-500 transition-colors flex items-center justify-center font-bold text-sm"
                              title={item.weight_grams ? "Restar 50g" : "Restar 1"}
                            >
                              −
                            </button>
                            <span className="text-sm font-bold min-w-[3rem] text-center px-1">
                              {item.weight_grams ? `${item.weight_grams}g` : item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(index, 1)}
                              className="w-7 h-7 rounded-full bg-white shadow-sm text-gray-600 hover:text-purple-600 transition-colors flex items-center justify-center font-bold text-sm"
                              title={item.weight_grams ? "Sumar 50g" : "Sumar 1"}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <span className="font-bold text-base text-gray-900">
                          ${(item.weight_grams ? item.itemPrice : item.itemPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Right - Summary */}
            {cart.length > 0 && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-pink-100 rounded-2xl p-6 space-y-4 lg:sticky lg:top-24">
                  <h3 className="font-headline font-bold text-gray-900 text-lg">Resumen del pedido</h3>

                  {/* Promo Code */}
                  {!activeDiscount ? (
                    <form onSubmit={handleApplyPromo} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Cupón de descuento"
                        className="flex-1 px-3.5 py-2.5 border border-pink-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-400 outline-none bg-white"
                      />
                      <button type="submit" className="px-4 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition-colors">Aplicar</button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                      <span className="text-xs font-bold text-emerald-700">✅ {activeDiscount.code} (-{activeDiscount.percent}%)</span>
                      <button onClick={() => setActiveDiscount(null)} className="text-emerald-500 hover:text-emerald-700"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                  {promoError && <p className="text-[11px] text-red-500">{promoError}</p>}

                  <div className="space-y-2.5 text-sm pt-1">
                    <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-semibold text-gray-800">${subTotal.toFixed(2)}</span></div>
                    {discountAmount > 0 && <div className="flex justify-between text-emerald-600 font-semibold"><span>Descuento</span><span>-${discountAmount.toFixed(2)}</span></div>}
                    <div className="border-t border-purple-200 pt-2.5 flex justify-between text-base">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="font-extrabold text-purple-700 text-lg">${grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep('checkout')}
                    className="w-full py-3.5 candy-gradient-bg text-white font-bold rounded-xl shadow-lg shadow-purple-300/40 hover:shadow-purple-400/50 hover:opacity-95 transition-all flex items-center justify-center space-x-2 text-sm"
                  >
                    <span>Proceder al Pago</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-[10px] text-gray-400 text-center">🔒 Pago seguro — Tus datos están protegidos</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Checkout step */}
        {step === 'checkout' && (
          <div className="max-w-lg mx-auto space-y-6">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-pink-100 rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center space-x-3">
                <MapPin className="w-6 h-6 text-purple-600" />
                <h3 className="font-headline font-bold text-gray-900">Datos del Cliente</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nombre Completo *</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre y apellido" className="w-full px-3.5 py-2.5 border border-pink-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Teléfono (WhatsApp)</label>
                  <input type="tel" value={phoneField} onChange={(e) => setPhoneField(e.target.value)} placeholder="+54 9 ..." className="w-full px-3.5 py-2.5 border border-pink-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Notas / Referencia</label>
                  <input type="text" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder="Opcional" className="w-full px-3.5 py-2.5 border border-pink-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none bg-white" />
                </div>
              </div>

              {shippingError && (
                <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{shippingError}</span>
                </div>
              )}

              <div className="bg-purple-100/50 rounded-xl p-4 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-semibold">${subTotal.toFixed(2)}</span></div>
                {discountAmount > 0 && <div className="flex justify-between text-emerald-600"><span>Descuento</span><span>-${discountAmount.toFixed(2)}</span></div>}
                <div className="border-t border-pink-300 pt-2 flex justify-between text-base"><span className="font-bold">Total</span><span className="font-bold text-purple-700">${grandTotal.toFixed(2)}</span></div>
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <h3 className="font-headline font-bold text-gray-900">Forma de pago</h3>
                </div>
                <div className="space-y-2">
                  <label
                    className={`flex items-center justify-between border rounded-xl px-4 py-3 cursor-pointer transition-all text-sm ${paymentMethod === 'mercadopago' ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' : 'border-pink-200 bg-white hover:bg-pink-50/50'}`}
                  >
                    <span className="flex items-center space-x-3">
                      <input type="radio" name="payment-method" checked={paymentMethod === 'mercadopago'} onChange={() => setPaymentMethod('mercadopago')} className="accent-purple-600" />
                      <span>
                        <span className="block font-semibold text-gray-800">MercadoPago</span>
                        <span className="block text-[11px] text-gray-500">Tarjeta, débito, dinero en cuenta</span>
                      </span>
                    </span>
                    <span className="font-bold text-purple-700">${grandTotal.toFixed(2)}</span>
                  </label>
                  <label
                    className={`flex items-center justify-between border rounded-xl px-4 py-3 cursor-pointer transition-all text-sm ${paymentMethod === 'transferencia' ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' : 'border-pink-200 bg-white hover:bg-pink-50/50'}`}
                  >
                    <span className="flex items-center space-x-3">
                      <input type="radio" name="payment-method" checked={paymentMethod === 'transferencia'} onChange={() => setPaymentMethod('transferencia')} className="accent-purple-600" />
                      <span>
                        <span className="block font-semibold text-gray-800">Transferencia</span>
                        <span className="block text-[11px] text-gray-500">Alias {DATOS_BANCO.alias} — enviás comprobante</span>
                      </span>
                    </span>
                    <span className="font-bold text-purple-700">${grandTotal.toFixed(2)}</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3">
                <button onClick={() => setStep('basket')} className="flex-1 py-3 border border-pink-200 text-gray-600 font-semibold rounded-xl hover:bg-pink-50 transition-all text-sm">Volver</button>
                <button onClick={handleCheckout} className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center space-x-2">
                  {paymentMethod === 'transferencia' ? <Landmark className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                  <span>{paymentMethod === 'transferencia' ? 'Confirmar pedido' : 'Pagar con Mercado Pago'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
