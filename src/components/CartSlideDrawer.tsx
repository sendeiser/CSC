import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, Sparkles, Truck, Check } from 'lucide-react';
import { CartItem } from '../types';
import { cart as cartApi } from '../lib/api';

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
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subTotal = cart.reduce((sum, item) => sum + ((item.itemPrice ?? item.product?.price ?? 0) * item.quantity), 0);

  const handleUpdateQty = async (index: number, delta: number) => {
    const item = cart[index];
    if (!item) return;

    if (item.weight_grams) {
      const step = item.product.unit_type === 'unit' ? 1 : 100;
      const minWeight = 100;
      const newWeight = Math.max(minWeight, (item.weight_grams || 100) + (delta * step));
      const newPrice = (item.product.price / 100) * newWeight;

      if (isLoggedIn) {
        try {
          const items = await cartApi.list();
          const apiItem = items.find((i: any) => i.product_id === item.product.id);
          if (apiItem) await cartApi.update(apiItem.id, { weight_grams: newWeight });
        } catch { /* ignore */ }
      }
      setCart(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], weight_grams: newWeight, itemPrice: newPrice };
        return updated;
      });
      return;
    }

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      await handleRemoveItem(index);
      return;
    }

    if (isLoggedIn) {
      try {
        const items = await cartApi.list();
        const apiItem = items.find((i: any) => i.product_id === item.product.id && i.selected_size === item.selectedSize);
        if (apiItem) await cartApi.update(apiItem.id, { quantity: newQty });
      } catch { /* ignore */ }
    }

    setCart(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: newQty };
      return updated;
    });
  };

  const handleRemoveItem = async (index: number) => {
    const item = cart[index];
    if (!item) return;

    if (isLoggedIn) {
      try {
        const items = await cartApi.list();
        const apiItem = items.find((i: any) => i.product_id === item.product.id && (item.weight_grams ? true : i.selected_size === item.selectedSize));
        if (apiItem) await cartApi.remove(apiItem.id);
      } catch { /* ignore */ }
    }

    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const progressPercent = freeDeliveryOver > 0 
    ? Math.min(100, Math.round((subTotal / freeDeliveryOver) * 100))
    : 0;

  const remainingForFreeDelivery = Math.max(0, freeDeliveryOver - subTotal);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Slide Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-10 overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl candy-gradient-bg text-white flex items-center justify-center shadow-md shadow-pink-500/20">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="font-headline font-black text-slate-900 text-lg">Tu Carrito</h2>
                    {totalItems > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-xs font-bold">
                        {totalItems} {totalItems === 1 ? 'item' : 'items'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Chamical Candy Shop</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Cerrar carrito"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Delivery Bar (if configured) */}
            {freeDeliveryOver > 0 && totalItems > 0 && (
              <div className="bg-purple-50/80 border-b border-purple-100/60 px-5 py-2.5 shrink-0">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="flex items-center space-x-1.5 text-purple-900">
                    <Truck className="w-3.5 h-3.5 text-purple-600" />
                    {subTotal >= freeDeliveryOver ? (
                      <span className="text-emerald-700 font-bold flex items-center space-x-1">
                        <span>¡Tenés Envío Gratis! 🎉</span>
                      </span>
                    ) : (
                      <span>Te faltan <strong>${remainingForFreeDelivery.toLocaleString('es-AR')}</strong> para envío gratis</span>
                    )}
                  </span>
                  <span className="text-[11px] text-purple-700 font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full bg-purple-200/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Scrollable Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-pink-50 text-pink-500 flex items-center justify-center shadow-inner">
                    <ShoppingBag className="w-10 h-10 text-pink-400" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <h3 className="font-headline font-bold text-slate-900 text-base">Tu carrito está vacío</h3>
                    <p className="text-xs text-slate-500">
                      ¡Todavía no agregaste golosinas! Descubrí gomitas, combos y bandejas listas para disfrutar.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onViewCatalog();
                    }}
                    className="px-6 py-2.5 candy-gradient-bg text-white font-bold text-xs rounded-2xl shadow-md shadow-pink-500/20 hover:scale-105 transition-all cursor-pointer"
                  >
                    Ver Golosinas 🍬
                  </button>
                </div>
              ) : (
                cart.map((item, idx) => {
                  const itemPrice = item.itemPrice ?? item.product?.price ?? 0;
                  const itemTotal = itemPrice * item.quantity;
                  const imgSrc = item.product?.image_url || 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=400&q=80';

                  return (
                    <div key={`${item.product.id}-${item.selectedSize}-${idx}`} className="pt-3.5 first:pt-0 flex gap-3 items-start">
                      {/* Product Thumbnail */}
                      <img
                        src={imgSrc}
                        alt={item.product.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-100 shadow-sm shrink-0 bg-slate-50"
                      />

                      {/* Product Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-headline font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-tight">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-400 hover:text-red-500 p-1 transition-colors cursor-pointer shrink-0"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Variant / Weight / Combo info */}
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {item.weight_grams ? (
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold">
                              {item.weight_grams}g
                            </span>
                          ) : item.selectedSize && item.selectedSize !== 'Estándar' ? (
                            <span className="px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 text-[10px] font-bold">
                              {item.selectedSize}
                            </span>
                          ) : null}

                          {/* Price per unit */}
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
                                <span key={sIdx} className="text-[9px] bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md">
                                  {sel.quantity}x {sel.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Bottom Row: Quantity Controls & Subtotal */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50/80 shadow-xs">
                            <button
                              onClick={() => handleUpdateQty(idx, -1)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                              aria-label="Disminuir cantidad"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-slate-800 font-mono">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQty(idx, 1)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                              aria-label="Aumentar cantidad"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="text-xs sm:text-sm font-black text-purple-950 font-mono">
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
              <div className="p-5 border-t border-slate-100 bg-white space-y-3 shrink-0 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)]">
                {/* Subtotal summary */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-600 text-xs">
                    <span>Subtotal de productos:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      ${subTotal.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Total acumulado:</span>
                    <span className="font-bold text-purple-700 text-base sm:text-lg font-mono">
                      ${subTotal.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    id="drawer-checkout-btn"
                    onClick={() => {
                      onClose();
                      onCheckout();
                    }}
                    className="w-full py-3.5 candy-gradient-bg text-white font-headline font-black text-sm rounded-2xl shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Finalizar Pedido</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={onClose}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
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
