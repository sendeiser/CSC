import React from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, Sparkles, ArrowLeft, AlertCircle } from 'lucide-react';
import { ActiveScreen, UserSession } from '../types';

interface AuthScreensProps {
  type: 'login' | 'register';
  setActiveScreen: (screen: ActiveScreen) => void;
  setSession: React.Dispatch<React.SetStateAction<UserSession>>;
}

export const AuthScreens: React.FC<AuthScreensProps> = ({
  type,
  setActiveScreen,
  setSession
}) => {
  const isLogin = type === 'login';
  
  // Fields state
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [errorText, setErrorText] = React.useState('');
  const [successAnimation, setSuccessAnimation] = React.useState(false);

  // Quick reset when swapping views
  React.useEffect(() => {
    setEmail('');
    setPassword('');
    setFullName('');
    setTermsAccepted(false);
    setErrorText('');
    setSuccessAnimation(false);
  }, [type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (isLogin) {
      if (!email.trim() || !password) {
        setErrorText('Por favor ingresa tus accesos galácticos.');
        return;
      }
      if (password.length < 5) {
        setErrorText('Contraseña incorrecta o de longitud deficiente.');
        return;
      }

      // Simulate success login
      const displayUserName = email.split('@')[0];
      setSuccessAnimation(true);
      setTimeout(() => {
        setSession({
          isLoggedIn: true,
          email: email.trim(),
          name: displayUserName.charAt(0).toUpperCase() + displayUserName.slice(1)
        });
        setActiveScreen('inicio');
      }, 1500);

    } else {
      if (!fullName.trim() || !email.trim() || !password) {
        setErrorText('Por favor rellena el formulario de inscripción.');
        return;
      }
      if (!termsAccepted) {
        setErrorText('Debes aceptar las políticas de privacidad estelares.');
        return;
      }
      if (password.length < 6) {
        setErrorText('La contraseña de seguridad debe contemplar al menos 6 caracteres.');
        return;
      }

      // Simulate success register
      setSuccessAnimation(true);
      setTimeout(() => {
        setSession({
          isLoggedIn: true,
          email: email.trim(),
          name: fullName.trim()
        });
        setActiveScreen('inicio');
      }, 1500);
    }
  };

  // Simulated social OAuth flows
  const handleSocialOAuth = (brand: 'google') => {
    setEmail('viajero.cosmos@gmail.com');
    setFullName('Cosmonauta Viajero');
    setSuccessAnimation(true);
    setTimeout(() => {
      setSession({
        isLoggedIn: true,
        email: 'viajero.cosmos@gmail.com',
        name: brand === 'google' ? 'Cosmonauta Viajero' : 'Usuario Social'
      });
      setActiveScreen('inicio');
    }, 1500);
  };

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-4 py-12 sm:py-20">
      
      {/* Container Card with Split layout */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-xl max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 min-h-[550px]">
        
        {/* Left column: Visual Graphics banner (with exact URLs matching the designs!) */}
        <div className="hidden md:block col-span-5 relative bg-pink-50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-pink-500/20 via-transparent to-transparent z-10" />
          <img
            src={
              isLogin 
                ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsWxovcwU9zRhNyEtyHiAUlPpSXX3rc00yJgO1W-VLDb8bR5sOfV7mClD5eKRlHGe63iRTffO45WFoIHifJTBblza2jtU-5xy5vVZezxz-x0S6Shz-JnxBD5c7uP5kceccCzCmZtVAbw-ig6dHJ6Pzzuz3TFAwofc5TK1L50UyI8DH1TFSKyDkH3PEMaTtiKAHhNdbUJ-ntaYleyE_0-pKWbgiScGbBnBYnY3Ld8dDxJkAGHPon7zB263GEw_KGyKpsFeNU_XVMIY'
                : 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1XlzZ19VAb6ulu81Zru0TEXDqS5nrWwskUHBVdxLhCMx9H4AsRfh9O-m3oMTHxH4n-mkS96FvXj20CGkbwiWu1Z8fK8Egiegp4qECJKOKhjDAO18EdloOXwfPV-AypIhlY2cspl3gOaJPxMpb-WPAjRwLvbU3CV8BgIqIHnsWCLPVBm_-jyk2pnU4ucFTJItO0bfY5PS_oaIseJcjjLemUNUHF6lGLL8CerwGHkWSFvoLPZGUO_tVVTjV1jnmWPudbwnvRnCEMS4'
            }
            alt="Candyverse auth visual presentation"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover select-none absolute inset-0"
          />
          
          {/* Cover decorative notes */}
          <div className="absolute bottom-6 left-6 right-6 z-25 text-white drop-shadow p-4 bg-black/10 backdrop-blur-md rounded-2xl border border-white/10">
            <h4 className="font-headline font-bold text-sm tracking-wide">
              {isLogin ? 'La Galaxia Te Espera' : 'Únete de Forma Gratuita'}
            </h4>
            <p className="text-[10px] text-pink-100 font-sans mt-1">
              {isLogin 
                ? 'Tu bolsa dulce favorita, promociones semanales y envíos rápidos en un solo lugar.' 
                : 'Obtén 15% de descuento en tu primer lote artesanal de gominolas usando el código DULCE2024.'}
            </p>
          </div>
        </div>

        {/* Right column: Form section */}
        <div className="col-span-12 md:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
          
          {/* Top navigation helper or logo header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveScreen('inicio')}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-purple-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Inicio</span>
            </button>
            <span className="text-[10px] uppercase font-black tracking-widest text-pink-500 bg-pink-50 px-2.5 py-0.5 rounded">
              {isLogin ? 'Iniciar Sesión' : 'Registro de explorador'}
            </span>
          </div>

          <div className="space-y-4">
            {/* Title headers */}
            <div>
              <h1 className="font-headline font-black text-2xl text-slate-900">
                {isLogin ? '¡Hola de nuevo!' : 'Crea tu pasaporte cósmico'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {isLogin 
                  ? 'Acede para re-surtir tu bolsa o consultar tus cupones activos.' 
                  : 'Empieza a recibir novedades, gominolas en cortesía y regalos galácticos.'}
              </p>
            </div>

            {/* Simulated oauth buttons with precise Google links */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleSocialOAuth('google')}
                className="w-full flex items-center justify-center p-0 hover:opacity-95 transition-opacity cursor-pointer border-0 rounded-xl"
              >
                <img
                  src={
                    isLogin 
                      ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjm2kz0qYfYsh5ZXWw3BPZYxDxbNJXIKec3dFehrHZq7k2Fbti6FSHHpOgKVNDHTz0fQJXvoTofn9bBVMvaEszjtKQtAbQeO0Z6dFMuBHxrggEr3OlTb7-nC3pDrfQFEJChWhWxpOjgQyDyDoaWn007A3DtsCHgDgWvqw2obwkEB_FNmQNl_rmfwxSCv2-xB61059HnX-ZbDs_zA561_UTh0nGMnknz5-NNYZvo1dWlwJIPratgiHMw2FYyTXD1j1wEV3NEhZMYa4'
                      : 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTunXO6iT0TypE-F2CDRv3iwHhauXnmuKT8TuEvMJHW9yqdU44eig-myoNJgGAz4an7A6Tx2W6ACc5Fv9GEEskefNYOJj5vzJ4tGZ5lwYCJX_kU5PLLrg2lHkTi17yf41dp0fGWjJv0JH4jqjNsrFe0tYNBc-HUpK42eTYtHzRgmyio1SA6Ufgt_agU7sGrh3dnR663Af6E56vgATWyFuqRqbGlTDtZLLmGyBQejLWW-m24boIUIlLiXf9Vy-K7entT3j9O5bci7U'
                  }
                  alt={isLogin ? 'Iniciar sesión con Google ID' : 'Registrarse con Google ID'}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto rounded-xl object-contain pointer-events-none"
                />
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center space-x-2 text-slate-350">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">o utiliza tu email</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {!isLogin && (
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-650 uppercase tracking-widest mb-1">
                    Nombre y Apellido *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Valentina González"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-purple-500 focus:bg-white rounded-xl text-xs sm:text-sm"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-extrabold text-slate-650 uppercase tracking-widest mb-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-purple-500 focus:bg-white rounded-xl text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-650 uppercase tracking-widest mb-1">
                  Contraseña de Ingreso *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-purple-500 focus:bg-white rounded-xl text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>

              {!isLogin && (
                <label className="flex items-start space-x-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 mt-0.5"
                  />
                  <span className="text-[10px] text-slate-500 leading-normal font-sans">
                    Acepto los Términos de Servicio de Candyverse y autorizo el rastreo térmico de mis envases.
                  </span>
                </label>
              )}

              {errorText && (
                <div className="flex items-center space-x-2 text-pink-700 bg-pink-50 p-2.5 rounded-xl border border-pink-100 text-xs font-bold leading-none">
                  <AlertCircle className="w-4 h-4 shrink-0 text-pink-600" />
                  <span>{errorText}</span>
                </div>
              )}

              {successAnimation && (
                <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-150 text-xs font-bold leading-none">
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-600 animate-bounce" />
                  <span>Sincronizando coordenadas cósmicas, por favor espera...</span>
                </div>
              )}

              <button
                type="submit"
                id="auth-submit-btn"
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow hover:shadow-md transition-all cursor-pointer"
              >
                {isLogin ? 'Iniciar Sesión Estelar' : 'Crear mi Cuenta Gratis'}
              </button>

            </form>
          </div>

          {/* Switch screens logic */}
          <div className="text-center pt-2">
            <span className="text-xs text-slate-550 font-medium font-sans">
              {isLogin ? '¿Aún no tienes cuenta? ' : '¿Inscrito previamente en Candyverse? '}
            </span>
            <button
              onClick={() => setActiveScreen(isLogin ? 'registro' : 'login')}
              className="text-xs font-bold text-pink-600 hover:text-pink-700 hover:underline cursor-pointer"
            >
              {isLogin ? 'Regístrate aquí' : 'Inicia Sesión aquí'}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
