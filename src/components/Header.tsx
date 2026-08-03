import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Sparkles, LogOut, Menu, X, Home, Package, Info, Settings } from 'lucide-react';
import { ActiveScreen, CartItem, UserSession } from '../types';
import { auth as authApi, setAuthToken } from '../lib/api';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  cart: CartItem[];
  session: UserSession;
  setSession: React.Dispatch<React.SetStateAction<UserSession>>;
}

function getInitials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export const Header: React.FC<HeaderProps> = ({
  activeScreen,
  setActiveScreen,
  cart,
  session,
  setSession
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  React.useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 12;
          setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close drawer on screen change
  React.useEffect(() => { setMobileMenuOpen(false); }, [activeScreen]);

  const navItems = [
    { label: 'Inicio', screen: 'inicio' as ActiveScreen, Icon: Home },
    { label: 'Catálogo', screen: 'catalogo' as ActiveScreen, Icon: Package },
    { label: 'Nosotros', screen: 'nosotros' as ActiveScreen, Icon: Info },
  ];

  const handleLogout = async () => {
    await Promise.all([authApi.logout().catch(() => {}), supabase.auth.signOut().catch(() => {})]);
    setAuthToken(null);
    setSession({ isLoggedIn: false, email: null, name: null, role: undefined });
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'bg-white/98 sm:bg-white/90 sm:backdrop-blur-md shadow-md shadow-purple-100/40 border-b border-pink-100/60'
            : 'bg-white/95 sm:bg-white/80 sm:backdrop-blur-sm border-b border-pink-100/40'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-14 sm:h-16' : 'h-16 sm:h-20'}`}>

            {/* Logo */}
            <motion.div
              onClick={() => setActiveScreen('inicio')}
              className="flex items-center space-x-2.5 cursor-pointer group select-none"
              whileTap={{ scale: 0.97 }}
            >
              <div className={`rounded-full p-0.5 candy-gradient-bg flex items-center justify-center text-white shadow-md shadow-purple-300/40 group-hover:shadow-purple-400/50 transition-all duration-300 overflow-hidden ${scrolled ? 'w-9 h-9' : 'w-11 h-11'}`}>
                <img src="/logo.png" alt="Chamical Candy Shop Logo" className="w-full h-full object-contain rounded-full bg-white p-0.5" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-headline font-extrabold text-lg sm:text-xl tracking-tight candy-gradient-text">
                  Chamical
                </span>
                <span className="font-sans text-[10px] font-semibold text-purple-400 tracking-widest uppercase -mt-0.5 hidden sm:block">
                  Candy Shop
                </span>
              </div>
            </motion.div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = activeScreen === item.screen;
                return (
                  <button
                    key={item.screen}
                    id={`nav-link-${item.screen}`}
                    onClick={() => setActiveScreen(item.screen)}
                    className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'text-purple-700 bg-purple-50'
                        : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50/50'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="navPill"
                        className="absolute inset-0 rounded-xl bg-purple-50"
                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                      />
                    )}
                    <span className="relative">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right actions — desktop */}
            <div className="hidden md:flex items-center space-x-3">
              {session.isLoggedIn && session.role === 'admin' && (
                <button
                  onClick={() => setActiveScreen('admin')}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    activeScreen === 'admin'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-purple-700 bg-purple-100/80 hover:bg-purple-200/80 border border-purple-300'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Panel Admin</span>
                </button>
              )}

              {session.isLoggedIn ? (
                <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-full pl-2 pr-1 py-1">
                  <div className="w-7 h-7 rounded-full candy-gradient-bg flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                    {getInitials(session.name)}
                  </div>
                  <span className="text-xs text-purple-700 font-semibold pr-1 flex items-center gap-1">
                    <span>{session.name?.split(' ')[0]}</span>
                    {session.role === 'admin' && (
                      <span className="text-[9px] bg-purple-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                        Admin
                      </span>
                    )}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="w-7 h-7 rounded-full bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center border border-gray-100 transition-colors shadow-sm"
                    title="Cerrar Sesión"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    id="header-login-btn"
                    onClick={() => setActiveScreen('login')}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    id="header-signup-btn"
                    onClick={() => setActiveScreen('registro')}
                    className="px-4 py-2 text-sm font-bold text-white candy-gradient-bg rounded-xl shadow-md shadow-purple-200/50 hover:shadow-purple-300/50 hover:opacity-95 transition-all"
                  >
                    Registrarse
                  </button>
                </div>
              )}

              {/* Cart */}
              <button
                id="header-cart-btn"
                onClick={() => setActiveScreen('carrito')}
                className={`relative p-2.5 rounded-xl border transition-all duration-200 ${
                  activeScreen === 'carrito'
                    ? 'candy-gradient-bg text-white border-transparent shadow-md'
                    : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-100 hover:border-purple-200'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md"
                    >
                      {totalItems > 9 ? '9+' : totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>

            {/* Mobile: cart + hamburger */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={() => setActiveScreen('carrito')}
                className="relative p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 transition-colors"
                aria-label="Abrir menú"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Drawer — slide from right */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-72 bg-white shadow-2xl md:hidden flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-pink-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full candy-gradient-bg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-headline font-bold text-base candy-gradient-text">CSC</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
                {navItems.map((item, i) => {
                  const isActive = activeScreen === item.screen;
                  return (
                    <motion.button
                      key={item.screen}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => { setActiveScreen(item.screen); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-purple-50 text-purple-700 border border-purple-100'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <item.Icon className={`w-4.5 h-4.5 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                      <span>{item.label}</span>
                    </motion.button>
                  );
                })}
                {session.isLoggedIn && session.role === 'admin' && (
                  <button
                    onClick={() => { setActiveScreen('admin'); setMobileMenuOpen(false); }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-purple-700 hover:bg-purple-50 transition-colors"
                  >
                    <Settings className="w-4.5 h-4.5 text-purple-400" />
                    <span>Panel Admin</span>
                  </button>
                )}
              </nav>

              {/* Bottom: session */}
              <div className="px-4 pb-6 pt-4 border-t border-pink-100 space-y-3">
                {session.isLoggedIn ? (
                  <>
                    <div className="flex items-center space-x-3 px-2">
                      <div className="w-9 h-9 rounded-full candy-gradient-bg flex items-center justify-center text-white font-bold text-xs shadow">
                        {getInitials(session.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{session.name}</p>
                        <p className="text-xs text-gray-400 truncate">{session.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => { setActiveScreen('login'); setMobileMenuOpen(false); }}
                      className="w-full py-2.5 border border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl text-sm font-semibold transition-colors"
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      onClick={() => { setActiveScreen('registro'); setMobileMenuOpen(false); }}
                      className="w-full py-2.5 candy-gradient-bg text-white rounded-xl text-sm font-bold shadow-md shadow-purple-200/50"
                    >
                      Crear Cuenta
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
