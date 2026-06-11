import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Star, User, Sparkles, LogOut, Menu, X } from 'lucide-react';
import { ActiveScreen, CartItem, UserSession } from '../types';
import { auth as authApi, setAuthToken } from '../lib/api';

interface HeaderProps {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  cart: CartItem[];
  session: UserSession;
  setSession: React.Dispatch<React.SetStateAction<UserSession>>;
}

export const Header: React.FC<HeaderProps> = ({
  activeScreen,
  setActiveScreen,
  cart,
  session,
  setSession
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navItems = [
    { label: 'Inicio', screen: 'inicio' as ActiveScreen },
    { label: 'Catálogo', screen: 'catalogo' as ActiveScreen },
    { label: 'Nosotros', screen: 'nosotros' as ActiveScreen },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-pink-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo Title */}
          <div 
            onClick={() => { setActiveScreen('inicio'); setMobileMenuOpen(false); }}
            className="flex items-center space-x-2 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <span className="font-headline font-bold text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              CSC
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-1 sm:space-x-2 items-center">
            {navItems.map((item) => {
              const isActive = activeScreen === item.screen;
              return (
                <button
                  key={item.screen}
                  id={`nav-link-${item.screen}`}
                  onClick={() => setActiveScreen(item.screen)}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'text-purple-700 font-bold' : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="navDot"
                      className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            {/* Admin link */}
            {session.isLoggedIn && session.role === 'admin' && (
              <button
                onClick={() => setActiveScreen('admin')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeScreen === 'admin' ? 'bg-purple-600 text-white' : 'text-purple-700 bg-purple-50 hover:bg-purple-100'
                }`}
              >
                Admin
              </button>
            )}
            {/* Session Indicator */}
            {session.isLoggedIn ? (
              <div className="flex items-center space-x-3 bg-purple-50/70 border border-purple-100 rounded-full pl-3 pr-1 py-1">
                <span className="text-xs text-purple-700 font-medium">
                  {session.name}
                </span>
                <button
                  onClick={async () => { await authApi.logout().catch(() => {}); setAuthToken(null); setSession({ isLoggedIn: false, email: null, name: null, role: undefined }); }}
                  className="w-7 h-7 rounded-full bg-white hover:bg-pink-50 text-purple-600 hover:text-pink-600 flex items-center justify-center border border-purple-100 transition-colors shadow-sm"
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-700 hover:bg-purple-50/50 rounded-lg transition-colors duration-150"
                >
                  Iniciar Sesión
                </button>
                <button
                  id="header-signup-btn"
                  onClick={() => setActiveScreen('registro')}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-lg shadow-sm hover:shadow transition-all duration-150"
                >
                  Registrarse
                </button>
              </div>
            )}

            {/* Shopping cart button */}
            <button
              id="header-cart-btn"
              onClick={() => setActiveScreen('carrito')}
              className={`relative p-2.5 rounded-full border border-purple-100 transition-all ${
                activeScreen === 'carrito' ? 'bg-purple-600 text-white' : 'bg-purple-50 hover:bg-purple-100 text-purple-700'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce shadow">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Mobile menu and cart controls */}
          <div className="md:hidden flex items-center space-x-3">
            <button
              onClick={() => setActiveScreen('carrito')}
              className="relative p-2 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-purple-600 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden bg-white border-b border-pink-100 shadow-lg px-4 pt-2 pb-6 space-y-3"
        >
          {navItems.map((item) => (
            <button
              key={item.screen}
              onClick={() => { setActiveScreen(item.screen); setMobileMenuOpen(false); }}
              className={`block w-full text-left px-3 py-2.5 rounded-md text-base font-semibold ${
                activeScreen === item.screen ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </button>
          ))}
          {session.isLoggedIn && session.role === 'admin' && (
            <button
              onClick={() => { setActiveScreen('admin'); setMobileMenuOpen(false); }}
              className={`block w-full text-left px-3 py-2.5 rounded-md text-base font-semibold ${
                activeScreen === 'admin' ? 'bg-purple-50 text-purple-700' : 'text-purple-700 hover:bg-purple-50'
              }`}
            >
              ⚙️ Panel Admin
            </button>
          )}
          <hr className="border-pink-50 my-2" />
          
          {session.isLoggedIn ? (
            <div className="space-y-2 px-3">
              <div className="text-sm font-semibold text-gray-700">
                Conectado como <span className="text-purple-700">{session.name}</span>
              </div>
              <button
                onClick={async () => {
                  await authApi.logout().catch(() => {});
                  setAuthToken(null);
                  setSession({ isLoggedIn: false, email: null, name: null, role: undefined });
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 border border-pink-200 text-pink-600 hover:bg-pink-50 rounded-lg text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 px-3">
              <button
                onClick={() => { setActiveScreen('login'); setMobileMenuOpen(false); }}
                className="w-full text-center block px-4 py-2.5 border border-purple-200 text-purple-700 hover:bg-purple-50 rounded-lg text-sm font-semibold"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => { setActiveScreen('registro'); setMobileMenuOpen(false); }}
                className="w-full text-center block px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-sm font-semibold shadow"
              >
                Registarse
              </button>
            </div>
          )}
        </motion.div>
      )}
    </header>
  );
};
