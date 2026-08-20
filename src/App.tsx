import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { Header } from './components/Header';
import { LandingScreen } from './components/LandingScreen';
import { CatalogScreen } from './components/CatalogScreen';
import { ProductDetailScreen } from './components/ProductDetailScreen';
import { CartScreen } from './components/CartScreen';
import { AuthScreens } from './components/AuthScreens';
import { AdminPanel } from './components/AdminPanel';
import { AboutUsScreen } from './components/AboutUsScreen';
import { HowToBuyScreen } from './components/HowToBuyScreen';
import { MyOrdersScreen } from './components/MyOrdersScreen';
import { CartSlideDrawer } from './components/CartSlideDrawer';
import { ActiveScreen, CartItem, Product, UserSession } from './types';
import { PRODUCTS } from './data';
import { homepage as homepageApi, products as productsApi, cart as cartApi, auth as authApi, favorites as favoritesApi, setAuthToken, getAuthToken, setOnAuthExpired } from './lib/api';
import { supabase } from './lib/supabase';
import { getLocalCart, saveLocalCart, clearLocalCart } from './lib/localCart';
import { waLink, setWhatsAppNumbers, setWhatsAppTemplates } from './lib/whatsapp';
import { MessageCircle, Instagram, ShoppingBag } from 'lucide-react';

const VALID_SCREENS: ActiveScreen[] = ['inicio', 'catalogo', 'detalle', 'carrito', 'login', 'registro', 'admin', 'nosotros', 'como-comprar', 'mis-pedidos'];

const getInitialScreen = (): ActiveScreen => {
  const hash = window.location.hash.replace('#', '') as ActiveScreen;
  return VALID_SCREENS.includes(hash) ? hash : 'inicio';
};

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>(getInitialScreen);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(0);
  const [session, setSession] = useState<UserSession>({
    isLoggedIn: false,
    email: null,
    name: null
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Navegación centralizada sincronizada con el historial del navegador (soporta botón Atrás del celular)
  const navigateTo = (screen: ActiveScreen, productId?: string, replace = false) => {
    setActiveScreen(screen);
    if (productId !== undefined) {
      setSelectedProductId(productId);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    const targetHash = screen === 'inicio' ? '#' : `#${screen}`;
    const targetState = { screen, productId: productId || (screen === 'detalle' ? selectedProductId : '') };

    if (replace) {
      window.history.replaceState(targetState, '', targetHash);
    } else {
      if (window.location.hash !== targetHash || (productId && productId !== selectedProductId)) {
        window.history.pushState(targetState, '', targetHash);
      }
    }
  };

  const handleSetActiveScreen = (screen: ActiveScreen) => {
    navigateTo(screen);
  };

  const handleSetSelectedProductId = (id: string) => {
    navigateTo('detalle', id);
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const isPaymentReturn = searchParams.get('payment_success') || searchParams.get('payment_id') || searchParams.get('collection_id') || searchParams.get('status');

    const currentHash = window.location.hash.replace('#', '') as ActiveScreen;
    const initialScreen = isPaymentReturn ? 'carrito' : (VALID_SCREENS.includes(currentHash) ? currentHash : 'inicio');

    if (isPaymentReturn && activeScreen !== 'carrito') {
      setActiveScreen('carrito');
    }

    if (!window.history.state) {
      window.history.replaceState(
        { screen: initialScreen, productId: selectedProductId },
        '',
        initialScreen === 'inicio' ? '#' : `#${initialScreen}`
      );
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.screen) {
        setActiveScreen(event.state.screen);
        if (event.state.productId) {
          setSelectedProductId(event.state.productId);
        }
      } else {
        const hash = window.location.hash.replace('#', '') as ActiveScreen;
        if (VALID_SCREENS.includes(hash)) {
          setActiveScreen(hash);
        } else {
          setActiveScreen('inicio');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedProductId]);

  const refreshProducts = () => {
    productsApi.list().then(setAllProducts).catch(console.error)
  }

  useEffect(() => {
    refreshProducts();
    homepageApi.getSettings().then((st) => {
      if (st) {
        setWhatsAppNumbers(st.whatsapp_number_1, st.whatsapp_number_2);
        setWhatsAppTemplates(st);
        if (st.free_delivery_over) {
          setFreeDeliveryThreshold(Number(st.free_delivery_over || 0));
        }
      }
    }).catch(console.error);
  }, []);

  // Función para forzar logout limpio (usada desde API 401 y Supabase listener)
  const forceLogout = () => {
    setAuthToken(null)
    setSession({ isLoggedIn: false, email: null, name: null })
    setFavorites({})
    navigateTo('inicio', undefined, true)
  }

  useEffect(() => {
    // Registrar callback para logout automático en 401 del backend
    setOnAuthExpired(forceLogout)
    return () => setOnAuthExpired(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const initSession = async () => {
      const existingToken = getAuthToken()
      if (existingToken) {
        try {
          const user = await authApi.me()
          setSession({ isLoggedIn: true, email: user.email, name: user.name, role: user.role })
          const favs = await favoritesApi.list()
          const favMap: Record<string, boolean> = {}
          favs.forEach((f: any) => { favMap[f.product_id] = true })
          setFavorites(favMap)
          return
        } catch {
          // Token inválido — limpiar y continuar
          setAuthToken(null)
        }
      }

      // Intentar recuperar sesión de Supabase (ej: OAuth callback)
      try {
        const { data: { session: supaSession }, error } = await supabase.auth.getSession()
        if (error) {
          // Refresh token inválido u otro error — limpiar silenciosamente
          await supabase.auth.signOut()
          setAuthToken(null)
          return
        }
        if (supaSession?.access_token) {
          setAuthToken(supaSession.access_token)
          window.location.hash = ''
          try {
            const user = await authApi.me()
            setSession({ isLoggedIn: true, email: user.email, name: user.name, role: user.role })
            const favs = await favoritesApi.list()
            const favMap: Record<string, boolean> = {}
            favs.forEach((f: any) => { favMap[f.product_id] = true })
            setFavorites(favMap)
          } catch {
            setAuthToken(null)
          }
        }
      } catch {
        // Error de red al obtener sesión — ignorar silenciosamente
        setAuthToken(null)
      }
    }
    initSession()

    // Escuchar cambios de auth en Supabase (Google OAuth login, token refresh, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, supaSession) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && supaSession?.access_token) {
        setAuthToken(supaSession.access_token)
        if (window.location.hash || window.location.search.includes('code=')) {
          window.history.replaceState(null, '', window.location.pathname)
        }
        try {
          const user = await authApi.me()
          setSession({ isLoggedIn: true, email: user.email, name: user.name, role: user.role })
          const favs = await favoritesApi.list()
          const favMap: Record<string, boolean> = {}
          favs.forEach((f: any) => { favMap[f.product_id] = true })
          setFavorites(favMap)
        } catch {
          // Si falla authApi.me, limpiar token
          setAuthToken(null)
        }
      } else if (
        event === 'SIGNED_OUT' ||
        // @ts-ignore — el tipo 'TOKEN_REFRESH_FAILED' existe en runtime pero no en tipos viejos
        event === 'TOKEN_REFRESH_FAILED'
      ) {
        // Sesión perdida o token inválido — logout limpio
        forceLogout()
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            item_price: item.itemPrice,
            weight_grams: item.weight_grams,
            combo_selections: item.comboSelections
          }).catch(() => { })
        )).then(() => clearLocalCart())
        : Promise.resolve()

      migrateLocal.then(() => {
        cartApi.list()
          .then(items => {
            const mapped: CartItem[] = items.map((i: any) => ({
              product: i.products,
              quantity: i.quantity,
              selectedSize: i.selected_size,
              itemPrice: Number(i.item_price),
              weight_grams: i.weight_grams,
              comboSelections: i.combo_selections
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment_id') && params.get('preference_id') && params.get('status')) {
      setActiveScreen('carrito')
    }
  }, [])

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

  const addToCart = async (product: Product, size: string, quantity: number, weight_grams?: number, comboSelections?: {
    productId: string;
    name: string;
    quantity: number;
    isWeight: boolean;
    capacityGrams: number;
  }[]) => {
    let priceVal: number
    let itemSize: string
    let itemQty: number

    if (product.is_combo) {
      itemSize = size
      itemQty = quantity
      priceVal = product.base_price
    } else if (product.unit_type === 'weight') {
      itemSize = 'Granel'
      itemQty = 1
      priceVal = (weight_grams! / 1000) * product.price_per_kg!
    } else {
      itemSize = size
      itemQty = quantity
      priceVal = product.sizes && product.sizes[size] ? product.sizes[size] : product.base_price
    }

    const newItem: CartItem = {
      product,
      quantity: itemQty,
      selectedSize: itemSize,
      itemPrice: priceVal,
      weight_grams: product.unit_type === 'weight' ? weight_grams : undefined,
      comboSelections: comboSelections
    }

    if (!session.isLoggedIn) {
      setCart(prev => {
        // Para combos, siempre agregamos como un item nuevo si las selecciones son diferentes (o podríamos juntarlos, pero es más fácil agregar separados)
        if (product.is_combo) {
          return [...prev, newItem];
        }
        
        const existing = prev.find(
          i => i.product.id === product.id && (product.unit_type === 'weight' ? true : i.selectedSize === itemSize) && !i.product.is_combo
        )
        if (existing) {
          return prev.map(i => {
            if (i.product.id !== product.id || i.product.is_combo) return i;
            if (product.unit_type === 'weight') {
              const newWeight = (i.weight_grams || 0) + (weight_grams || 50);
              const newPrice = Math.round((newWeight / 1000) * (product.price_per_kg || 0) * 100) / 100;
              return { ...i, weight_grams: newWeight, itemPrice: newPrice };
            } else {
              if (i.selectedSize !== itemSize) return i;
              return { ...i, quantity: i.quantity + itemQty };
            }
          });
        }
        return [...prev, newItem];
      })
      showToast(`¡Añadido ${product.unit_type === 'weight' ? weight_grams + 'g de ' : product.is_combo ? '' : itemQty + 'x '}${product.name} a tu Bolsa!`)
      return
    }

    try {
      const cartPayload: any = {
        product_id: product.id,
        quantity: itemQty,
        selected_size: itemSize,
        item_price: priceVal
      }
      if (product.unit_type === 'weight') {
        cartPayload.weight_grams = weight_grams
      }
      if (product.is_combo && comboSelections) {
        cartPayload.combo_selections = comboSelections
      }
      await cartApi.add(cartPayload)
      const items = await cartApi.list()
      const mapped: CartItem[] = items.map((i: any) => ({
        product: i.products,
        quantity: i.quantity,
        selectedSize: i.selected_size,
        itemPrice: Number(i.item_price),
        weight_grams: i.weight_grams,
        comboSelections: i.combo_selections
      }))
      setCart(mapped)
      showToast(`¡Añadido ${product.unit_type === 'weight' ? weight_grams + 'g' : itemQty + 'x'} ${product.name} a tu Bolsa!`)
    } catch (err: any) {
      showToast(err.message || 'Error al añadir al carrito', 'info')
    }
  };

  const activeProduct = allProducts.find(p => p.id === selectedProductId || p.slug === selectedProductId) || allProducts[0];

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 flex flex-col font-sans selection:bg-pink-200 selection:text-pink-900">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -60, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -60, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-24 left-1/2 z-[100] flex items-center space-x-3 px-5 py-3.5 rounded-2xl shadow-2xl border max-w-sm w-11/12 sm:w-auto"
            style={{
              background: toast.type === 'success'
                ? 'linear-gradient(135deg, #064e3b, #065f46)'
                : toast.type === 'info'
                  ? 'linear-gradient(135deg, #1e1b4b, #312e81)'
                  : 'linear-gradient(135deg, #7f1d1d, #991b1b)',
              borderColor: toast.type === 'success' ? '#10b98140' : toast.type === 'info' ? '#818cf840' : '#f8717140'
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-indigo-300 shrink-0" />
              )}
            </motion.div>
            <span className="text-xs sm:text-sm font-semibold text-white">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {activeScreen !== 'admin' && (
        <Header
          activeScreen={activeScreen}
          setActiveScreen={handleSetActiveScreen}
          cart={cart}
          session={session}
          setSession={setSession}
          onOpenCart={() => setIsCartDrawerOpen(true)}
        />
      )}

      <main className={activeScreen === 'admin' ? 'min-h-screen bg-slate-100' : 'flex-1'}>
        {activeScreen === 'inicio' && (
          <div key="inicio">
            <LandingScreen
              setActiveScreen={handleSetActiveScreen}
              setSelectedProductById={handleSetSelectedProductId}
              heroProduct={allProducts[0] || PRODUCTS[0]}
              allProducts={allProducts}
            />
          </div>
        )}

        {activeScreen === 'catalogo' && (
          <div key="catalogo">
            <CatalogScreen
              setActiveScreen={handleSetActiveScreen}
              setSelectedProductById={handleSetSelectedProductId}
              addToCart={addToCart}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />
          </div>
        )}

        {activeScreen === 'detalle' && activeProduct && (
          <div key="detalle">
            <ProductDetailScreen
              product={activeProduct}
              allProducts={allProducts}
              setActiveScreen={handleSetActiveScreen}
              setSelectedProductById={handleSetSelectedProductId}
              addToCart={addToCart}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />
          </div>
        )}

        {activeScreen === 'carrito' && (
          <div key="carrito">
            <CartScreen
              cart={cart}
              setCart={setCart}
              setActiveScreen={handleSetActiveScreen}
              isLoggedIn={session.isLoggedIn}
              userSession={session}
            />
          </div>
        )}

        {activeScreen === 'login' && (
          <div key="login">
            <AuthScreens type="login" setActiveScreen={handleSetActiveScreen} setSession={setSession} />
          </div>
        )}

        {activeScreen === 'registro' && (
          <div key="registro">
            <AuthScreens type="register" setActiveScreen={handleSetActiveScreen} setSession={setSession} />
          </div>
        )}

        {activeScreen === 'admin' && session.role === 'admin' && (
          <AdminPanel setActiveScreen={handleSetActiveScreen} setSession={setSession} onProductsUpdated={refreshProducts} />
        )}

        {activeScreen === 'nosotros' && (
          <div key="nosotros">
            <AboutUsScreen setActiveScreen={handleSetActiveScreen} />
          </div>
        )}

        {activeScreen === 'como-comprar' && (
          <div key="como-comprar">
            <HowToBuyScreen setActiveScreen={handleSetActiveScreen} />
          </div>
        )}

        {activeScreen === 'mis-pedidos' && (
          <div key="mis-pedidos">
            <MyOrdersScreen setActiveScreen={handleSetActiveScreen} session={session} />
          </div>
        )}
      </main>

      {activeScreen !== 'admin' && (
        <>
          <footer className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-slate-300 pt-14 pb-8 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 pb-10 border-b border-white/10">
                {/* Brand */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-10 h-10 rounded-full p-0.5 candy-gradient-bg flex items-center justify-center shadow-md overflow-hidden">
                      <img src="/logo.png" alt="Chamical Candy Shop" className="w-full h-full object-contain rounded-full bg-white p-0.5" />
                    </div>
                    <div>
                      <span className="font-headline font-extrabold text-lg text-white tracking-tight">Candy Shop</span>
                      <span className="text-purple-400 font-semibold text-lg"> Chamical</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                    Gomitas, chocolates, caramelos y más — vendemos por granel para que compres justo lo que querés.
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Tienda online</span>
                    </span>
                  </div>
                </div>

                {/* Links */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Navegación</h4>
                  <ul className="space-y-2.5">
                    {[
                      { label: 'Inicio', screen: 'inicio' },
                      { label: 'Catálogo', screen: 'catalogo' },
                      { label: '¿Cómo comprar?', screen: 'como-comprar' },
                      { label: 'Nosotros', screen: 'nosotros' },
                    ].map(({ label, screen }) => (
                      <li key={screen}>
                        <button
                          onClick={() => handleSetActiveScreen(screen as any)}
                          className="text-sm text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-flex transform duration-150"
                        >
                          {label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Contact & Socials */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Contacto & Redes</h4>
                  <p className="text-xs text-slate-400">Chamical, La Rioja, Argentina</p>
                  <div className="flex items-center space-x-3 pt-1">
                    <a
                      href="https://instagram.com/chamicalcandyshop"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Instagram"
                      className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow hover:scale-110 transition-all duration-200"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                <p>&copy; {new Date().getFullYear()} Chamical Candy Shop. Todos los derechos reservados.</p>
                <p className="text-slate-700">Hecho por <a href={waLink('Hola! Quiero hacer una consulta.')} target="_blank" rel="noopener noreferrer">Martin Gustavo Gonzalez</a></p>
              </div>
            </div>
          </footer>

          {/* Botón flotante del Carrito a la derecha */}
          {activeScreen !== 'carrito' && activeScreen !== 'admin' && cart.length > 0 && (
            <button
              id="floating-cart-btn"
              onClick={() => setIsCartDrawerOpen(true)}
              aria-label="Carrito de Compras"
              className="fixed bottom-23 right-5 z-50 flex items-center space-x-2 px-3.5 py-2.5 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white font-bold text-xs sm:text-sm rounded-full shadow-2xl shadow-purple-900/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-white/20"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-pink-400 text-white text-[9px] font-black flex items-center justify-center border border-white shadow-xs">
                  {cart.reduce((sum, item) => sum + (item.quantity || 1), 0) > 9 ? '9+' : cart.reduce((sum, item) => sum + (item.quantity || 1), 0)}
                </span>
              </div>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-mono font-bold">
                ${cart.reduce((sum, item) => {
                  const p = (typeof item.itemPrice === 'number' && !isNaN(item.itemPrice) && item.itemPrice > 0)
                    ? item.itemPrice
                    : item.weight_grams
                      ? Math.round((item.weight_grams / 1000) * Number(item.product?.price_per_kg || item.product?.base_price || 0) * 100) / 100
                      : Number(item.product?.base_price || 0);
                  return sum + (p * (item.quantity || 1));
                }, 0).toLocaleString('es-AR')}
              </span>
            </button>
          )}

          {/* WhatsApp floating button con ícono oficial */}
          <div className="fixed bottom-6 right-5 z-50 group">
            {/* Ping rings */}
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping-slow opacity-60" />
            <a
              href={waLink('Hola! Quiero hacer una consulta.')}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Escribinos por WhatsApp"
              className="relative w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-400/40 hover:bg-emerald-600 hover:scale-110 transition-all duration-300"
            >
              <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
            </a>
            {/* Tooltip */}
            <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
              Escribinos 💬
            </span>
          </div>
        </>
      )}

      {/* Slide Drawer lateral del Carrito desde la derecha */}
      <CartSlideDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        cart={cart}
        setCart={setCart}
        onCheckout={() => {
          setIsCartDrawerOpen(false);
          handleSetActiveScreen('carrito');
        }}
        onViewCatalog={() => {
          setIsCartDrawerOpen(false);
          handleSetActiveScreen('catalogo');
        }}
        isLoggedIn={session.isLoggedIn}
        freeDeliveryOver={freeDeliveryThreshold}
      />
    </div>
  );
}
