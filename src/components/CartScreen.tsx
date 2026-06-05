import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Trash2, ArrowRight, Check, Sparkles, AlertCircle, MapPin, CreditCard, Gift, PartyPopper } from 'lucide-react';
import { ActiveScreen, CartItem, Product } from '../types';

interface CartScreenProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  setActiveScreen: (screen: ActiveScreen) => void;
}

type CheckoutStep = 'basket' | 'shipping' | 'success';

export const CartScreen: React.FC<CartScreenProps> = ({
  cart,
  setCart,
  setActiveScreen
}) => {
  const [step, setStep] = React.useState<CheckoutStep>('basket');
  
  // Promo code
  const [promoCode, setPromoCode] = React.useState('');
  const [activeDiscount, setActiveDiscount] = React.useState<{ code: string; percent: number } | null>(null);
  const [promoError, setPromoError] = React.useState('');
  
  // Shipping details
  const [fullName, setFullName] = React.useState('');
  const [addressLine, setAddressLine] = React.useState('');
  const [cityField, setCityField] = React.useState('');
  const [phoneField, setPhoneField] = React.useState('');
  const [shippingError, setShippingError] = React.useState('');

  // Payment details
  const [cardFormattedNum, setCardFormattedNum] = React.useState('');
  
  // Track mock order ID for confirmation page
  const [orderId, setOrderId] = React.useState('');

  // Math totals calculation
  const subTotal = cart.reduce((acc, item) => acc + (item.itemPrice * item.quantity), 0);
  const discountAmount = activeDiscount ? subTotal * (activeDiscount.percent / 100) : 0;
  
  // Flat rate shipping: $35.00, or FREE shipping if cart exceeds $150
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

  const handleUpdateQty = (productId: string, selSize: string, change: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId && item.selectedSize === selSize) {
        const nextQty = item.quantity + change;
        return nextQty > 0 ? { ...item, quantity: nextQty } : item;
      }
      return item;
    }));
  };

  const handleRemoveProduct = (productId: string, selSize: string) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.selectedSize === selSize)));
  };

  const processToShipping = () => {
    if (cart.length === 0) return;
    setStep('shipping');
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setShippingError('');

    if (!fullName.trim() || !addressLine.trim() || !cityField.trim() || !phoneField.trim()) {
      setShippingError('Por favor completa todos los campos de envío galácticos.');
      return;
    }

    // Set order metadata
    const randomHex = Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase();
    setOrderId(`CV-${randomHex}`);
    setStep('success');
  };

  const handleClearAllAndExit = () => {
    setCart([]);
    setStep('basket');
    setActiveScreen('inicio');
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Step tracker ribbon */}
        <div className="max-w-xl mx-auto mb-10 bg-white rounded-full p-1.5 border border-slate-100 shadow-sm flex items-center justify-between text-xs sm:text-sm font-semibold">
          <button
            disabled={step === 'success'}
            onClick={() => setStep('basket')}
            className={`flex-1 text-center py-2 rounded-full cursor-pointer transition-all ${
              step === 'basket' 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Bolsa Dulce
          </button>
          <button
            disabled={step === 'success' || cart.length === 0}
            onClick={() => setStep('shipping')}
            className={`flex-1 text-center py-2 rounded-full cursor-pointer transition-all ${
              step === 'shipping' 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Envío Galáctico
          </button>
          <div
            className={`flex-1 text-center py-2 rounded-full ${
              step === 'success' 
                ? 'bg-emerald-600 text-white shadow-sm font-bold' 
                : 'text-slate-400'
            }`}
          >
            3. Compra Exitosa
          </div>
        </div>

        {/* Dynamic content rendering depending on steps */}
        <AnimatePresence mode="wait">
          {step === 'basket' && (
            <motion.div
              key="basket-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Product list */}
              <div className="lg:col-span-8 space-y-4">
                
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
                  <h1 className="font-headline font-black text-xl text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-pink-500" />
                    <span>Tu Bolsa Dulce</span>
                  </h1>
                  <span className="text-xs text-slate-550 font-bold bg-slate-100 px-3 py-1 rounded-full">
                    {cart.reduce((acc, item) => acc + item.quantity, 0)} productos en total
                  </span>
                </div>

                {cart.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm space-y-4">
                    <ShoppingBag className="w-14 h-14 text-slate-300 mx-auto animate-bounce" />
                    <h2 className="font-headline font-bold text-xl text-slate-950">
                      Tu Bolsa se encuentra vacía
                    </h2>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed font-sans">
                      Navega por nuestro catálogo galáctico, agrega tus gomitas, chocolates y sours para llenar tu bolsa espacial de felicidad.
                    </p>
                    <button
                      onClick={() => setActiveScreen('catalogo')}
                      className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl text-xs sm:text-sm shadow hover:opacity-95 cursor-pointer"
                    >
                      Explorar el Catálogo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div 
                        key={`${item.product.id}-${item.selectedSize}`}
                        className="bg-white rounded-2xl p-4 border border-slate-105 hover:border-pink-100 transition-colors shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        {/* Image + Title fields */}
                        <div className="flex items-center space-x-4">
                          <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-pink-600 font-extrabold uppercase leading-none">
                              {item.product.category}
                            </span>
                            <h3 className="font-headline font-bold text-sm sm:text-base text-slate-950 leading-tight">
                              {item.product.name}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-1 inline-flex items-center space-x-1.5 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                              <span>Tamaño / Peso:</span>
                              <span className="font-bold text-purple-700">{item.selectedSize}</span>
                            </p>
                          </div>
                        </div>

                        {/* Controls + Cost metric controls */}
                        <div className="flex items-center justify-between sm:justify-start gap-6 pt-3 sm:pt-0 border-t sm:border-transparent border-slate-50">
                          
                          {/* Unit price indicator */}
                          <div className="flex flex-col text-left sm:text-right">
                            <span className="text-[9px] text-slate-400">Precio Unitario:</span>
                            <span className="text-sm font-black text-slate-900">
                              ${item.itemPrice.toFixed(2)}
                            </span>
                          </div>

                          {/* Increments */}
                          <div className="flex items-center space-x-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                            <button
                              onClick={() => handleUpdateQty(item.product.id, item.selectedSize, -1)}
                              className="w-7 h-7 bg-white rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold font-mono cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQty(item.product.id, item.selectedSize, 1)}
                              className="w-7 h-7 bg-white rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold font-mono cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          {/* Line total estimation */}
                          <div className="flex flex-col text-right min-w-[70px]">
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Total:</span>
                            <span className="text-sm sm:text-base font-black text-purple-700">
                              ${(item.itemPrice * item.quantity).toFixed(2)}
                            </span>
                          </div>

                          {/* Trash delete */}
                          <button
                            onClick={() => handleRemoveProduct(item.product.id, item.selectedSize)}
                            className="p-2 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-xl transition-colors cursor-pointer"
                            title="Remover de la Bolsa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* Order total checkout metrics panel */}
              {cart.length > 0 && (
                <div className="lg:col-span-4 space-y-4">
                  
                  {/* Coupon evaluation card */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                    <h3 className="text-xs font-headline font-extrabold text-slate-700 uppercase tracking-widest flex items-center space-x-1">
                      <Gift className="w-4 h-4" />
                      <span>¿Tienes un cupón galáctico?</span>
                    </h3>
                    
                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Ej: DULCE2024"
                        className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 focus:outline-none focus:border-purple-500 rounded-xl text-xs uppercase"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </form>

                    {activeDiscount && (
                      <div className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-150 text-[11px] font-bold">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>¡Cupón {activeDiscount.code} (-{activeDiscount.percent}%) aplicado!</span>
                      </div>
                    )}

                    {promoError && (
                      <div className="flex items-center space-x-1 text-pink-700 bg-pink-50 px-2.5 py-1.5 rounded-lg border border-pink-150 text-[11px] font-bold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{promoError}</span>
                      </div>
                    )}
                  </div>

                  {/* Summary math calculations */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-110 shadow-sm space-y-4">
                    <h3 className="font-headline font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
                      Resumen del Pedido
                    </h3>

                    <div className="space-y-2.5 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Subtotal dulces:</span>
                        <span className="font-semibold text-slate-800">${subTotal.toFixed(2)}</span>
                      </div>
                      
                      {activeDiscount && (
                        <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50/50 p-1.5 rounded">
                          <span>Descuento ({activeDiscount.code}):</span>
                          <span>-${discountAmount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-1">
                          <span>Envío Express Climatizado:</span>
                          <span className="text-[9px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded leading-none font-bold">
                            {subTotal > 150 ? 'Gratis > $150' : '$35.00'}
                          </span>
                        </div>
                        <span className="font-semibold text-slate-800">
                          {shippingCost === 0 ? 'GRATIS' : `$${shippingCost.toFixed(2)}`}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-baseline justify-between">
                      <span className="text-sm font-bold text-slate-900">Gran Total:</span>
                      <span className="text-2xl font-black text-purple-700">
                        ${grandTotal.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 text-center font-sans leading-relaxed">
                      Lotes empacados bajo atmósfera modificada. Envíos climatizados de 24-48 horas.
                    </p>

                    <button
                      id="proceedToShipping"
                      onClick={processToShipping}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white rounded-xl font-bold text-sm shadow cursor-pointer transition-transform duration-100 active:scale-95"
                    >
                      <span>Proceder al Envío</span>
                      <ArrowRight className="w-4 h-4 animate-pulse" />
                    </button>
                  </div>

                </div>
              )}
            </motion.div>
          )}

          {step === 'shipping' && (
            <motion.div
              key="shipping-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm space-y-6"
            >
              <div>
                <h1 className="font-headline font-black text-xl text-slate-950 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  <span>Dirección del Envío Galáctico</span>
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Tu pedido viajará en compartimentos refrigerados térmicos para evitar deformación por humedad o calor.
                </p>
              </div>

              <form onSubmit={handlePlaceOrder} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-widest mb-1.5">
                    Nombre Completo del Receptor *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej: Valentina González"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-purple-500 focus:bg-white rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-widest mb-1.5">
                    Dirección de Entrega (Calle, Número e Interior) *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="Ej: Calzada de Tlalpan #3510 Int 4B"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-purple-500 focus:bg-white rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-widest mb-1.5">
                      Estado / Ciudad *
                    </label>
                    <input
                      type="text"
                      required
                      value={cityField}
                      onChange={(e) => setCityField(e.target.value)}
                      placeholder="Ej: CDMX"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-purple-500 focus:bg-white rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-widest mb-1.5">
                      Teléfono Móvil *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phoneField}
                      onChange={(e) => setPhoneField(e.target.value)}
                      placeholder="Ej: 5543210987"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-purple-500 focus:bg-white rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Simulated credit card input */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-widest mb-1.5">
                    Método de pago (Simulado) *
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                    <input
                      type="text"
                      required
                      value={cardFormattedNum}
                      onChange={(e) => setCardFormattedNum(e.target.value)}
                      placeholder="•••• •••• •••• 4242 (Tarjeta Visa/Mastercard)"
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-purple-500 focus:bg-white rounded-xl text-sm font-mono"
                    />
                  </div>
                </div>

                {shippingError && (
                  <div className="flex items-center space-x-1.5 text-pink-750 bg-pink-50 p-2.5 rounded border border-pink-100 text-xs font-bold leading-none">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-pink-600" />
                    <span>{shippingError}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex items-center space-x-3.5">
                  <button
                    type="button"
                    onClick={() => setStep('basket')}
                    className="flex-1 py-3 text-center border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Regresar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white rounded-xl text-xs font-bold shadow cursor-pointer transition-transform duration-105 active:scale-95"
                  >
                    Confirmar Pedido (${grandTotal.toFixed(2)})
                  </button>
                </div>

              </form>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-emerald-100 shadow-md text-center space-y-6 relative overflow-hidden"
            >
              {/* Confetti element decorations */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
              
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <PartyPopper className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h1 className="font-headline font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                  ¡Tu pedido ha despegado!
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-sans max-w-sm mx-auto leading-relaxed">
                  Gracias por tu compra en Candyverse, <span className="font-bold text-slate-800">{fullName}</span>. Nuestro maestro confitero está empacando tus delicias en este momento.
                </p>
              </div>

              {/* Order specifics */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 max-w-md mx-auto text-left space-y-3.5 text-xs">
                
                <div className="flex justify-between pb-2 border-b border-slate-200/60 font-mono text-slate-550">
                  <span>ID DE SEGUIMIENTO:</span>
                  <span className="font-bold text-purple-700">{orderId}</span>
                </div>

                <div className="space-y-1 text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                  <p className="font-bold text-slate-900 mb-1">Punto de Entrega:</p>
                  <p>{addressLine}</p>
                  <p>{cityField}</p>
                  <p>Móvil: {phoneField}</p>
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-slate-905 mb-1">Resumen:</p>
                  {cart.map((ct) => (
                    <div key={`${ct.product.id}-${ct.selectedSize}`} className="flex justify-between text-slate-550">
                      <span>{ct.product.name} (x{ct.quantity})</span>
                      <span>${(ct.itemPrice * ct.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  {activeDiscount && (
                    <div className="flex justify-between text-emerald-600 font-bold font-mono">
                      <span>Descuento {activeDiscount.code}:</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-100 font-black text-sm text-slate-900">
                    <span>Total Cobrado:</span>
                    <span className="text-purple-700">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>

              </div>

              <div className="space-y-3.5">
                <p className="text-[11px] text-slate-450 italic">
                  Recibirás una notificación simulada con los datos de rastreo para el servicio espacial climatizado de DHL/Estafeta en breve.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleClearAllAndExit}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer w-full sm:w-auto"
                  >
                    Regresar al Inicio
                  </button>
                  <button
                    onClick={() => {
                      setCart([]);
                      setStep('basket');
                      setActiveScreen('catalogo');
                    }}
                    className="px-6 py-3 border border-pink-200 text-purple-700 hover:bg-pink-50 rounded-xl text-xs font-bold transition-colors w-full sm:w-auto"
                  >
                    Seguir Comprando
                  </button>
                </div>

              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
