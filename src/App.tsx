import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Header } from './components/Header';
import { LandingScreen } from './components/LandingScreen';
import { CatalogScreen } from './components/CatalogScreen';
import { ProductDetailScreen } from './components/ProductDetailScreen';
import { CartScreen } from './components/CartScreen';
import { AuthScreens } from './components/AuthScreens';
import { AdminPanel } from './components/AdminPanel';
import { AboutUsScreen } from './components/AboutUsScreen';
import { ActiveScreen, CartItem, Product, UserSession } from './types';
import { products as productsApi, cart as cartApi, auth as authApi, favorites as favoritesApi, setAuthToken, getAuthToken } from './lib/api';
import { getLocalCart, saveLocalCart, clearLocalCart } from './lib/localCart';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('inicio');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [session, setSession] = useState<UserSession>({
    isLoggedIn: false,
    email: null,
    name: null
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    productsApi.list().then(setAllProducts).catch(console.error)
  }, [])

  useEffect(() => {
    const token = getAuthToken()
    if (token) {
      authApi.me()
        .then(user => {
          setSession({ isLoggedIn: true, email: user.email, name: user.name, role: user.role })
          return favoritesApi.list()
        })
        .then(favs => {
          const favMap: Record<string, boolean> = {}
          favs.forEach((f: any) => { favMap[f.product_id] = true })
          setFavorites(favMap)
        })
        .catch(() => setAuthToken(null))
    }
  }, [])

  useEffect(() => {
    if (session.isLoggedIn) {
      const localCart = getLocalCart()
      const migrateLocal = localCart.length > 0
        ? Promise.all(localCart.map(item =>
            cartApi.add({
              product_id: item.product.id,
              quantity: item.quantity,
              selected_size: item.selectedSize,
              item_price: item.itemPrice
            }).catch(() => {})
          )).then(() => clearLocalCart())
        : Promise.resolve()

      migrateLocal.then(() => {
        cartApi.list()
          .then(items => {
            const mapped: CartItem[] = items.map((i: any) => ({
              product: i.products,
              quantity: i.quantity,
              selectedSize: i.selected_size,
              itemPrice: Number(i.item_price)
            }))
            setCart(mapped)
          })
          .catch(console.error)
      })
    } else {
      setCart(getLocalCart())
    }
  }, [session.isLoggedIn])

  useEffect(() => {
    if (!session.isLoggedIn) {
      saveLocalCart(cart)
    }
  }, [cart, session.isLoggedIn])

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleFavorite = async (id: string) => {
    if (!session.isLoggedIn) {
      showToast('Iniciá sesión para guardar favoritos', 'info')
      setActiveScreen('login')
      return
    }
    const isFav = favorites[id]
    try {
      if (isFav) {
        await favoritesApi.remove(id)
      } else {
        await favoritesApi.add(id)
      }
      setFavorites(prev => ({ ...prev, [id]: !isFav }))
      const prod = allProducts.find(p => p.id === id)
      if (prod) {
        showToast(isFav ? `Quitaste ${prod.name} de tus favoritos.` : `¡Añadido ${prod.name} a tus favoritos!`)
      }
    } catch {
      showToast('Error al actualizar favoritos', 'info')
    }
  };

  const addToCart = async (product: Product, size: string, quantity: number) => {
    const priceVal = product.sizes && product.sizes[size] ? product.sizes[size] : product.base_price;

    if (!session.isLoggedIn) {
      setCart(prev => {
        const existing = prev.find(
          i => i.product.id === product.id && i.selectedSize === size
        )
        if (existing) {
          return prev.map(i =>
            i.product.id === product.id && i.selectedSize === size
              ? { ...i, quantity: i.quantity + quantity }
              : i
          )
        }
        return [...prev, { product, quantity, selectedSize: size, itemPrice: priceVal }]
      })
      showToast(`¡Añadido ${quantity}x ${product.name} (${size}) a tu Bolsa!`)
      return
    }

    try {
      await cartApi.add({ product_id: product.id, quantity, selected_size: size, item_price: priceVal })
      const items = await cartApi.list()
      const mapped: CartItem[] = items.map((i: any) => ({
        product: i.products,
        quantity: i.quantity,
        selectedSize: i.selected_size,
        itemPrice: Number(i.item_price)
      }))
      setCart(mapped)
      showToast(`¡Añadido ${quantity}x ${product.name} (${size}) a tu Bolsa!`)
    } catch {
      showToast('Error al añadir al carrito', 'info')
    }
  };

  const activeProduct = allProducts.find(p => p.id === selectedProductId || p.slug === selectedProductId) || allProducts[0];

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 flex flex-col font-sans selection:bg-pink-200 selection:text-pink-900">
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

      <Header
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        cart={cart}
        session={session}
        setSession={setSession}
      />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {activeScreen === 'inicio' && (
            <motion.div key="inicio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {allProducts.length > 0 && (
                <LandingScreen
                  setActiveScreen={setActiveScreen}
                  setSelectedProductById={(id) => { setSelectedProductId(id); setActiveScreen('detalle'); }}
                  heroProduct={allProducts[0]}
                />
              )}
            </motion.div>
          )}

          {activeScreen === 'catalogo' && (
            <motion.div key="catalogo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <CatalogScreen
                setActiveScreen={setActiveScreen}
                setSelectedProductById={setSelectedProductId}
                addToCart={addToCart}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
              />
            </motion.div>
          )}

          {activeScreen === 'detalle' && activeProduct && (
            <motion.div key="detalle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
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
            <motion.div key="carrito" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <CartScreen
                cart={cart}
                setCart={setCart}
                setActiveScreen={setActiveScreen}
                isLoggedIn={session.isLoggedIn}
              />
            </motion.div>
          )}

          {activeScreen === 'login' && (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <AuthScreens type="login" setActiveScreen={setActiveScreen} setSession={setSession} />
            </motion.div>
          )}

          {activeScreen === 'registro' && (
            <motion.div key="registro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <AuthScreens type="register" setActiveScreen={setActiveScreen} setSession={setSession} />
            </motion.div>
          )}

          {activeScreen === 'admin' && session.role === 'admin' && (
            <AdminPanel setActiveScreen={setActiveScreen} setSession={setSession} />
          )}

          {activeScreen === 'nosotros' && (
            <motion.div key="nosotros" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <AboutUsScreen setActiveScreen={setActiveScreen} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-white text-[10px] font-bold">C</div>
            <span className="font-headline font-bold text-slate-100">Chamical Candy Shop</span>
          </div>
          <p className="font-sans text-center sm:text-right">
            &copy; {new Date().getFullYear()} Chamical Candy Shop. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
