import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Trash2, ArrowRight, Check, Sparkles, AlertCircle, MapPin, CreditCard, Gift, PartyPopper } from 'lucide-react';
import { ActiveScreen, CartItem } from '../types';
import { cart as cartApi, orders as ordersApi } from '../lib/api';
import { getAuthToken } from '../lib/api';

interface CartScreenProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  setActiveScreen: (screen: ActiveScreen) => void;
  isLoggedIn: boolean;
}

type CheckoutStep = 'basket' | 'shipping' | 'success';

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

  const [cardFormattedNum, setCardFormattedNum] = React.useState('');
  const [orderId, setOrderId] = React.useState('');

  const subTotal = cart.reduce((acc, item) => acc + (item.itemPrice * item.quantity), 0);
  const discountAmount = activeDiscount ? subTotal * (activeDiscount.percent / 100) : 0;
  const shippingCost = subTotal > 150 || subTotal === 0 ? 0 : 35.00;
  const grandTotal = subTotal - discountAmount + shippingCost;

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
    const newQty = item.quantity + delta
    if (newQty <= 0) {
      setCart(prev => prev.filter((_, i) => i !== index))
      return
    }
    if (isLoggedIn) {
      try {
        const items = await cartApi.list()
        const apiItem = items.find((i: any) => i.product_id === item.product.id && i.selected_size === item.selectedSize)
        if (apiItem) await cartApi.update(apiItem.id, newQty)
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
        const apiItem = items.find((i: any) => i.product_id === item.product.id && i.selected_size === item.selectedSize)
        if (apiItem) await cartApi.remove(apiItem.id)
      } catch { /* ignore */ }
    }
    setCart(prev => prev.filter((_, i) => i !== index))
  };

  const handleCheckout = async () => {
    if (!fullName.trim() || !addressLine.trim() || !cityField.trim()) {
      setShippingError('Todos los campos de envío son obligatorios.');
      return;
    }
    setShippingError('');

    const token = getAuthToken()
    if (!token) {
      setActiveScreen('login')
      return
    }

    try {
      const result = await ordersApi.create({
        shipping_name: fullName,
        shipping_address: addressLine,
        shipping_city: cityField,
        promo_code: activeDiscount?.code
      })
      setOrderId(result.id)
      setCart([])
      setStep('success')
    } catch (err: any) {
      setShippingError(err.message || 'Error al procesar el pedido.')
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-headline font-extrabold text-gray-900">Tu Bolsa</h1>
            <p className="text-gray-500 mt-1 text-sm">{cart.length} artículos</p>
          </div>
          {step !== 'success' && (
            <div className="hidden sm:flex items-center space-x-2 text-sm">
              {(['basket', 'shipping', 'success'] as const).map((s, i) => (
                <React.Fragment key={s}>
                  {i > 0 && <div className="w-6 h-px bg-pink-200" />}
                  <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                    step === s ? 'bg-purple-100 text-purple-700' : 'text-gray-400'
                  }`}>
                    {i + 1}. {s === 'basket' ? 'Bolsa' : s === 'shipping' ? 'Envío' : 'Completado'}
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

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
              <p className="text-gray-500 mt-2">Tu pedido #<span className="font-mono font-bold text-purple-700">{orderId.slice(0, 8).toUpperCase()}</span> está siendo procesado.</p>
              <p className="text-sm text-gray-400 mt-1">Recibirás un correo con los detalles del envío.</p>
            </div>
            <button
              onClick={() => { setStep('basket'); setActiveDiscount(null); setActiveScreen('catalogo'); }}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg"
            >
              Seguir Comprando
            </button>
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
                    layout
                    className="flex items-start space-x-4 bg-pink-50/30 border border-pink-100 rounded-2xl p-4"
                  >
                    <img src={item.product.image_url} alt={item.product.name} className="w-20 h-20 rounded-xl object-cover bg-pink-100 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-headline font-bold text-sm text-gray-900 truncate">{item.product.name}</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">Tamaño: {item.selectedSize}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => handleQuantityChange(index, -1)} className="w-7 h-7 rounded-full border border-pink-200 text-gray-500 hover:bg-pink-100 transition-colors flex items-center justify-center text-sm font-bold">-</button>
                          <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                          <button onClick={() => handleQuantityChange(index, 1)} className="w-7 h-7 rounded-full border border-pink-200 text-gray-500 hover:bg-pink-100 transition-colors flex items-center justify-center text-sm font-bold">+</button>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-sm text-gray-900">${(item.itemPrice * item.quantity).toFixed(2)}</span>
                          <button onClick={() => handleRemoveItem(index)} className="text-pink-400 hover:text-pink-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Right - Summary */}
            {cart.length > 0 && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-pink-100 rounded-2xl p-6 space-y-4">
                  <h3 className="font-headline font-bold text-gray-900">Resumen</h3>

                  {/* Promo Code */}
                  {!activeDiscount ? (
                    <form onSubmit={handleApplyPromo} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Cupón"
                        className="flex-1 px-3 py-2 border border-pink-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-400 outline-none bg-white"
                      />
                      <button type="submit" className="px-3 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700">Aplicar</button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                      <span className="text-xs font-semibold text-emerald-700">{activeDiscount.code} (-{activeDiscount.percent}%)</span>
                      <button onClick={() => setActiveDiscount(null)} className="text-emerald-500 hover:text-emerald-700"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                  {promoError && <p className="text-[11px] text-red-500">{promoError}</p>}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">${subTotal.toFixed(2)}</span></div>
                    {discountAmount > 0 && <div className="flex justify-between text-emerald-600"><span>Descuento</span><span>-${discountAmount.toFixed(2)}</span></div>}
                    <div className="flex justify-between"><span className="text-gray-500">Envío</span><span className="font-semibold">{shippingCost === 0 ? 'GRATIS' : `$${shippingCost.toFixed(2)}`}</span></div>
                    <div className="border-t border-pink-200 pt-2 flex justify-between text-base"><span className="font-bold">Total</span><span className="font-bold text-purple-700">${grandTotal.toFixed(2)}</span></div>
                  </div>

                  <button
                    onClick={() => setStep('shipping')}
                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Proceder al Pago</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Shipping step */}
        {step === 'shipping' && (
          <div className="max-w-lg mx-auto space-y-6">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-pink-100 rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center space-x-3">
                <MapPin className="w-6 h-6 text-purple-600" />
                <h3 className="font-headline font-bold text-gray-900">Dirección de Envío</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nombre Completo</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre" className="w-full px-3.5 py-2.5 border border-pink-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Dirección</label>
                <input type="text" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder="Calle, número, colonia" className="w-full px-3.5 py-2.5 border border-pink-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ciudad</label>
                  <input type="text" value={cityField} onChange={(e) => setCityField(e.target.value)} placeholder="Ciudad" className="w-full px-3.5 py-2.5 border border-pink-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Teléfono</label>
                  <input type="tel" value={phoneField} onChange={(e) => setPhoneField(e.target.value)} placeholder="+52" className="w-full px-3.5 py-2.5 border border-pink-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none bg-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tarjeta de Crédito</label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={cardFormattedNum}
                    onChange={(e) => setCardFormattedNum(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19))}
                    placeholder="4242 4242 4242 4242"
                    className="w-full pl-11 pr-4 py-2.5 border border-pink-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none bg-white font-mono"
                  />
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
                <div className="flex justify-between"><span className="text-gray-600">Envío</span><span className="font-semibold">{shippingCost === 0 ? 'GRATIS' : `$${shippingCost.toFixed(2)}`}</span></div>
                <div className="border-t border-pink-300 pt-2 flex justify-between text-base"><span className="font-bold">Total</span><span className="font-bold text-purple-700">${grandTotal.toFixed(2)}</span></div>
              </div>

              <div className="flex space-x-3">
                <button onClick={() => setStep('basket')} className="flex-1 py-3 border border-pink-200 text-gray-600 font-semibold rounded-xl hover:bg-pink-50 transition-all text-sm">Volver</button>
                <button onClick={handleCheckout} className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center space-x-2">
                  <Gift className="w-4 h-4" />
                  <span>Confirmar Pedido</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
