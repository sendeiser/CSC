import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, Sparkles, Truck, Check, ChevronRight } from 'lucide-react';
import { CartItem } from '../types';
import { cart as cartApi, optimizeImageUrl } from '../lib/api';

interface CartSlideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onCheckout: () => void;
  onViewCatalog: () => void;
  isLoggedIn: boolean;
  freeDeliveryOver?: number;
}

function getItemPrice(item: CartItem): number {
  if (typeof item.itemPrice === 'number' && !isNaN(item.itemPrice) && item.itemPrice > 0) {
    return item.itemPrice;
  }
  if (item.weight_grams) {
    const pricePerKg = Number(item.product?.price_per_kg || item.product?.base_price || 0);
    return Math.round((item.weight_grams / 1000) * pricePerKg * 100) / 100;
  }
  return Number(item.product?.base_price || 0);
}

export const CartSlideDrawer: React.FC<CartSlideDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  setCart,
  onCheckout,
  onViewCatalog,
  isLoggedIn,
  freeDeliveryOver = 0,
}) => {
  // Lock body scroll on open for optimal mobile responsiveness without background scroll jank
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      const prevTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.touchAction = prevTouchAction;
      };
    }
  }, [isOpen]);

  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subTotal = cart.reduce((sum, item) => {
    const p = getItemPrice(item);
    return sum + (p * (item.quantity || 1));
  }, 0);

  const handleUpdateQty = (index: number, delta: number) => {
    const item = cart[index];
    if (!item) return;

    if (item.weight_grams) {
      const step = 50; // Modificar de a 50 gramos
      const newWeight = (item.weight_grams || 0) + (delta > 0 ? step : -step);
      if (newWeight < 50) {
        handleRemoveItem(index);
        return;
      }
      const pricePerKg = Number(
        item.product?.price_per_kg || 
        item.product?.base_price || 
        (item.itemPrice && item.weight_grams ? (item.itemPrice / item.weight_grams) * 1000 : 0)
      );
      const newPrice = Math.round((newWeight / 1000) * pricePerKg * 100) / 100;

      // 1. Actualización optimista inmediata (0ms de latencia en la pantalla)
      setCart(prev => {
        const updated = [...prev];
        if (!updated[index]) return prev;
        updated[index] = { ...updated[index], weight_grams: newWeight, itemPrice: newPrice };
        return updated;
      });

      // 2. Sincronización en segundo plano sin bloquear la interfaz
      if (isLoggedIn) {
        cartApi.list().then(items => {
          const apiItem = items.find((i: any) => i.product_id === item.product.id);
          if (apiItem) cartApi.update(apiItem.id, { weight_grams: newWeight }).catch(() => {});
        }).catch(() => {});
      }
      return;
    }

    const newQty = (item.quantity || 1) + delta;
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }

    // 1. Actualización optimista inmediata (0ms de latencia en la pantalla)
    setCart(prev => {
      const updated = [...prev];
      if (!updated[index]) return prev;
      updated[index] = { ...updated[index], quantity: newQty };
      return updated;
    });

    // 2. Sincronización en segundo plano sin bloquear la interfaz
    if (isLoggedIn) {
      cartApi.list().then(items => {
        const apiItem = items.find((i: any) => i.product_id === item.product.id && i.selected_size === item.selectedSize);
        if (apiItem) cartApi.update(apiItem.id, { quantity: newQty }).catch(() => {});
      }).catch(() => {});
    }
  };

  const handleRemoveItem = (index: number) => {
    const item = cart[index];
    if (!item) return;

    // 1. Actualización optimista inmediata (0ms)
    setCart(prev => prev.filter((_, i) => i !== index));

    // 2. Sincronización en segundo plano
    if (isLoggedIn) {
      cartApi.list().then(items => {
        const apiItem = items.find((i: any) => i.product_id === item.product.id && (item.weight_grams ? true : i.selected_size === item.selectedSize));
        if (apiItem) cartApi.remove(apiItem.id).catch(() => {});
      }).catch(() => {});
    }
  };

  const numFreeDelivery = Number(freeDeliveryOver || 0);
  const progressPercent = numFreeDelivery > 0 && !isNaN(subTotal)
    ? Math.min(100, Math.round((subTotal / numFreeDelivery) * 100))
    : 0;

  const remainingForFreeDelivery = Math.max(0, numFreeDelivery - subTotal);

  const handleFinalizarPedido = () => {
    onClose();
    onCheckout();
    // Centrar la pantalla y hacer scroll suave al contenido de la pantalla de checkout
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const checkoutEl = document.getElementById('checkout-main-content') || document.getElementById('cart-checkout-container');
      if (checkoutEl) {
        checkoutEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end transform-gpu touch-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs will-change-opacity"
          />

          {/* Slide Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-10 overflow-hidden transform-gpu will-change-transform rounded-l-3xl sm:rounded-l-3xl"
            style={{ overscrollBehavior: 'contain' }}
          >
            {/* Grab Handle for mobile gesture feel */}
            <div className="pt-2 pb-1 flex justify-center sm:hidden bg-slate-50 border-b border-slate-100/80">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            {/* Drawer Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl candy-gradient-bg text-white flex items-center justify-center shadow-md shadow-pink-500/20">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="font-headline font-black text-slate-900 text-lg tracking-tight">Tu Carrito</h2>
                    {totalItems > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-xs font-black font-mono">
                        {totalItems}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-slate-500">Chamical Candy Shop</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                aria-label="Cerrar carrito"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Delivery Bar */}
            {numFreeDelivery > 0 && totalItems > 0 && (
              <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border-b border-purple-100/80 px-5 py-2.5 shrink-0">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="flex items-center space-x-1.5 text-purple-950">
                    <Truck className="w-4 h-4 text-purple-600 shrink-0" />
                    {subTotal >= numFreeDelivery ? (
                      <span className="text-emerald-700 font-bold flex items-center space-x-1">
                        <span>¡Envío Gratis Activado! 🎉</span>
                      </span>
                    ) : (
                      <span className="text-[11px]">
                        Te faltan <strong className="text-purple-700">${remainingForFreeDelivery.toLocaleString('es-AR')}</strong> para <strong>Envío Gratis</strong>
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-purple-700 font-black font-mono">{progressPercent}%</span>
                </div>
                <div className="w-full bg-purple-200/50 rounded-full h-2 overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-300 shadow-xs"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Scrollable Cart Items List */}
            <div 
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-slate-100"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-pink-50 text-pink-500 flex items-center justify-center shadow-inner">
                    <ShoppingBag className="w-10 h-10 text-pink-400" />
                  </div>
                  <div className="space-y-1.5 max-w-xs">
                    <h3 className="font-headline font-bold text-slate-900 text-base">Tu carrito está vacío</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      ¡Todavía no agregaste golosinas! Descubrí gomitas, chocolates y combos especiales.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onViewCatalog();
                    }}
                    className="px-6 py-3 candy-gradient-bg text-white font-bold text-xs rounded-2xl shadow-md shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center space-x-1.5"
                  >
                    <span>Explorar Catálogo</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                cart.map((item, idx) => {
                  const itemPrice = getItemPrice(item);
                  const itemTotal = itemPrice * (item.quantity || 1);
                  const rawImg = item.product?.image_url || 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=400&q=80';
                  const optimizedImg = optimizeImageUrl(rawImg, 180, 80);

                  return (
                    <div 
                      key={`${item.product?.id || idx}-${item.selectedSize || 'std'}-${idx}`} 
                      className="pt-3.5 first:pt-0 flex gap-3.5 items-center bg-white"
                    >
                      {/* Product Thumbnail */}
                      <div className="relative shrink-0">
                        <img
                          src={optimizedImg}
                          alt={item.product?.name || 'Golosina'}
                          loading="lazy"
                          decoding="async"
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-100 shadow-xs bg-slate-50"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-headline font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-tight">
                            {item.product?.name || 'Golosina'}
                          </h4>
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-400 hover:text-red-500 active:scale-90 p-1.5 -mr-1 transition-all cursor-pointer shrink-0 rounded-lg hover:bg-red-50"
                            title="Eliminar producto"
                            aria-label="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Variant / Weight info */}
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {item.weight_grams ? (
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-extrabold font-mono border border-purple-100">
                              {item.weight_grams}g
                            </span>
                          ) : item.selectedSize && item.selectedSize !== 'Estándar' ? (
                            <span className="px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 text-[10px] font-extrabold border border-pink-100">
                              {item.selectedSize}
                            </span>
                          ) : null}

                          <span className="text-[11px] text-slate-500 font-mono">
                            ${itemPrice.toLocaleString('es-AR')} {item.weight_grams ? `(${item.weight_grams}g)` : 'c/u'}
                          </span>
                        </div>

                        {/* Combo Selections (if combo) */}
                        {item.comboSelections && Array.isArray(item.comboSelections) && item.comboSelections.length > 0 && (
                          <div className="mt-1 p-2 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-600 block">🍬 Sabores elegidos:</span>
                            <div className="flex flex-wrap gap-1">
                              {item.comboSelections.map((sel: any, sIdx: number) => (
                                <span key={sIdx} className="text-[9px] bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md font-semibold">
                                  {sel.quantity}x {sel.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Bottom Row: Quantity Controls & Subtotal */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-xs">
                            <button
                              onClick={() => handleUpdateQty(idx, -1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 active:scale-90 text-slate-600 transition-all cursor-pointer"
                              aria-label="Disminuir cantidad"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="min-w-[34px] px-1 text-center text-xs font-black text-slate-800 font-mono">
                              {item.weight_grams ? `${item.weight_grams}g` : item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQty(idx, 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 active:scale-90 text-slate-600 transition-all cursor-pointer"
                              aria-label="Aumentar cantidad"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-black text-purple-950 font-mono">
                              ${itemTotal.toLocaleString('es-AR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer */}
            {cart.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-slate-100 bg-white space-y-3 shrink-0 shadow-[0_-12px_30px_rgba(0,0,0,0.06)] pb-6 sm:pb-5">
                {/* Subtotal summary */}
                <div className="space-y-1 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between text-slate-600 text-xs font-semibold">
                    <span>Subtotal de productos:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ${subTotal.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-900 pt-0.5 border-t border-slate-200/60">
                    <span className="font-headline font-bold text-sm">Total Estimado:</span>
                    <span className="font-black text-purple-700 text-base sm:text-lg font-mono">
                      ${subTotal.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-0.5">
                  <button
                    id="drawer-checkout-btn"
                    onClick={handleFinalizarPedido}
                    className="w-full py-4 candy-gradient-bg text-white font-headline font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-pink-500/25 hover:shadow-pink-500/40 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Finalizar Pedido</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={onClose}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Seguir eligiendo golosinas
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
