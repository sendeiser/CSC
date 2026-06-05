import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { Header } from './components/Header';
import { LandingScreen } from './components/LandingScreen';
import { CatalogScreen } from './components/CatalogScreen';
import { ProductDetailScreen } from './components/ProductDetailScreen';
import { CartScreen } from './components/CartScreen';
import { AuthScreens } from './components/AuthScreens';
import { PRODUCTS } from './data';
import { ActiveScreen, CartItem, Product, UserSession } from './types';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('inicio');
  const [selectedProductId, setSelectedProductId] = useState<string>('gomitas-explosion-galactica');
  
  // Favorites map
  const [favorites, setFavorites] = useState<Record<string, boolean>>({
    'gomitas-explosion-galactica': true,
    'trufas-galacticas': true
  });

  // Prefill the cart with the exact products shown in the design drawings!
  const [cart, setCart] = useState<CartItem[]>(() => {
    const ositos = PRODUCTS.find(p => p.id === 'ositos-cosmicos');
    const cintas = PRODUCTS.find(p => p.id === 'cintas-neon');
    
    const prefilled: CartItem[] = [];
    if (ositos) {
      prefilled.push({
        product: ositos,
        quantity: 1,
        selectedSize: '300g',
        itemPrice: 36.00
      });
    }
    if (cintas) {
      prefilled.push({
        product: cintas,
        quantity: 1,
        selectedSize: 'Pack Estándar',
        itemPrice: 25.00
      });
    }
    return prefilled;
  });

  // User session
  const [session, setSession] = useState<UserSession>({
    isLoggedIn: false,
    email: null,
    name: null
  });

  // Toast feedback states
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      const prod = PRODUCTS.find(p => p.id === id);
      if (prod) {
        showToast(
          updated[id] 
            ? `¡Añadido ${prod.name} a tus favoritos cósmicos! ❤️` 
            : `Quitaste ${prod.name} de tus favoritos.`
        );
      }
      return updated;
    });
  };

  // Add items functionality
  const addToCart = (product: Product, size: string, quantity: number) => {
    // Read corresponding sizes cost weight
    const priceVal = product.sizes && product.sizes[size] ? product.sizes[size] : product.price;

    setCart(prev => {
      const targetIndex = prev.findIndex(item => item.product.id === product.id && item.selectedSize === size);
      
      if (targetIndex !== -1) {
        // Increase quantity
        const updated = [...prev];
        updated[targetIndex].quantity += quantity;
        return updated;
      } else {
        // Append new item
        return [...prev, {
          product,
          quantity,
          selectedSize: size,
          itemPrice: priceVal
        }];
      }
    });

    showToast(`¡Añadido ${quantity}x ${product.name} (${size}) a tu Bolsa! 🛍️`);
  };

  // Find active product
  const activeProduct = PRODUCTS.find(p => p.id === selectedProductId) || PRODUCTS[0];

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 flex flex-col font-sans selection:bg-pink-200 selection:text-pink-900">
      
      {/* Dynamic Floating Toast Feedback Alerts */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl px-5 py-3 shadow-2xl border border-white/10 flex items-center space-x-3 max-w-sm sm:max-w-md w-11/12 text-center"
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-450 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-pink-450 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-semibold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent navbar header */}
      <Header
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        cart={cart}
        session={session}
        setSession={setSession}
      />

      {/* Main viewport panels */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {activeScreen === 'inicio' && (
            <motion.div
              key="inicio"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <LandingScreen
                setActiveScreen={setActiveScreen}
                setSelectedProductById={(id) => {
                  setSelectedProductId(id);
                  setActiveScreen('detalle');
                }}
                heroProduct={PRODUCTS[0]} // Gomitas de explosión galáctica
              />
            </motion.div>
          )}

          {activeScreen === 'catalogo' && (
            <motion.div
              key="catalogo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <CatalogScreen
                setActiveScreen={setActiveScreen}
                setSelectedProductById={setSelectedProductId}
                addToCart={addToCart}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
              />
            </motion.div>
          )}

          {activeScreen === 'detalle' && (
            <motion.div
              key="detalle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <ProductDetailScreen
                product={activeProduct}
                setActiveScreen={setActiveScreen}
                setSelectedProductById={setSelectedProductId}
                addToCart={addToCart}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
              />
            </motion.div>
          )}

          {activeScreen === 'carrito' && (
            <motion.div
              key="carrito"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <CartScreen
                cart={cart}
                setCart={setCart}
                setActiveScreen={setActiveScreen}
              />
            </motion.div>
          )}

          {activeScreen === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <AuthScreens
                type="login"
                setActiveScreen={setActiveScreen}
                setSession={setSession}
              />
            </motion.div>
          )}

          {activeScreen === 'registro' && (
            <motion.div
              key="registro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <AuthScreens
                type="register"
                setActiveScreen={setActiveScreen}
                setSession={setSession}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer bar credits */}
      <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-white text-[10px] font-bold">
              C
            </div>
            <span className="font-headline font-bold text-slate-100">Candyverse Inc.</span>
          </div>
          <p className="font-sans text-center sm:text-right">
            © {new Date().getFullYear()} Candyverse. Todos los derechos reservados. Sabor de calidad astronómica para toda la galaxia.
          </p>
        </div>
      </footer>

    </div>
  );
}
