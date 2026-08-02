import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Sparkles, AlertCircle, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { ActiveScreen, UserSession } from '../types';
import { auth as authApi, setAuthToken } from '../lib/api';
import { supabase } from '../lib/supabase';

interface AuthScreensProps {
  type: 'login' | 'register';
  setActiveScreen: (screen: ActiveScreen) => void;
  setSession: React.Dispatch<React.SetStateAction<UserSession>>;
}

export const AuthScreens: React.FC<AuthScreensProps> = ({ type, setActiveScreen, setSession }) => {
  const isLogin = type === 'login';

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [fullName, setFullName] = React.useState('');
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [errorText, setErrorText] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [successAnimation, setSuccessAnimation] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account'
          }
        }
      })
      if (error) setErrorText(error.message)
    } catch (e: any) {
      setErrorText(e.message || 'Error al iniciar con Google')
    } finally {
      setGoogleLoading(false)
    }
  }

  React.useEffect(() => {
    setEmail('');
    setPassword('');
    setFullName('');
    setTermsAccepted(false);
    setErrorText('');
    setSuccessAnimation(false);
    setLoading(false);
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setLoading(true);

    if (isLogin) {
      if (!email.trim() || !password) {
        setErrorText('Por favor ingresá tu email y contraseña.');
        setLoading(false);
        return;
      }
      try {
        const result = await authApi.login({ email: email.trim(), password })
        setAuthToken(result.session.access_token)
        setSuccessAnimation(true)
        setTimeout(() => {
          setSession({ isLoggedIn: true, email: result.user.email, name: result.user.name, role: result.user.role })
          setActiveScreen('inicio')
        }, 1500)
      } catch (err: any) {
        setErrorText(err.message || 'Error al iniciar sesión')
      }
    } else {
      if (!fullName.trim() || !email.trim() || !password) {
        setErrorText('Por favor completá todos los campos.');
        setLoading(false);
        return;
      }
      if (!termsAccepted) {
        setErrorText('Debés aceptar los términos para continuar.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setErrorText('La contraseña debe tener al menos 6 caracteres.');
        setLoading(false);
        return;
      }
      try {
        const result = await authApi.signup({ email: email.trim(), password, name: fullName.trim() })
        if (result.session) setAuthToken(result.session.access_token)
        setSuccessAnimation(true)
        setTimeout(() => {
          if (result.session) setSession({ isLoggedIn: true, email: email.trim(), name: fullName.trim() })
          setActiveScreen('inicio')
        }, 1500)
      } catch (err: any) {
        setErrorText(err.message || 'Error al registrarse')
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] relative flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,_rgba(244,114,182,0.15),transparent_50%),radial-gradient(circle_at_80%_80%,_rgba(192,132,252,0.15),transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-md"
      >
        {/* Back button */}
        <button
          onClick={() => setActiveScreen('inicio')}
          className="flex items-center space-x-2 text-sm text-gray-500 hover:text-purple-700 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Volver al inicio</span>
        </button>

        <div className="glass rounded-3xl p-8 sm:p-10 shadow-2xl shadow-purple-200/30">
          {/* Header */}
          <div className="text-center space-y-3 mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-16 h-16 mx-auto rounded-2xl candy-gradient-bg flex items-center justify-center shadow-lg shadow-purple-300/40"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="font-headline font-extrabold text-2xl sm:text-3xl text-gray-900">
              {isLogin ? 'Bienvenido de vuelta' : 'Crear cuenta'}
            </h2>
            <p className="text-sm text-gray-500">
              {isLogin ? 'Ingresá a tu cuenta para continuar' : 'Únete a la familia de Chamical Candy Shop'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {successAnimation ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center space-y-4 py-10"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center"
                >
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </motion.div>
                <p className="text-emerald-700 font-bold text-lg">
                  {isLogin ? '¡Sesión iniciada!' : '¡Cuenta creada!'}
                </p>
                <p className="text-gray-400 text-sm">Redirigiendo...</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* Fields */}
                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre Completo</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ej: Valentina González"
                        className="w-full pl-11 pr-4 py-3 border border-pink-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all bg-white/70 placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hola@chamicalcandy.shop"
                      className="w-full pl-11 pr-4 py-3 border border-pink-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all bg-white/70 placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3 border border-pink-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all bg-white/70 placeholder:text-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <label className="flex items-start space-x-3 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-pink-300 text-purple-600 focus:ring-purple-400 w-4 h-4"
                    />
                    <span className="leading-snug">
                      Acepto las <strong className="text-purple-700 hover:underline cursor-pointer">Políticas de Privacidad</strong> y los Términos de Chamical Candy Shop.
                    </span>
                  </label>
                )}

                {/* Error */}
                <AnimatePresence>
                  {errorText && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex items-start space-x-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
                    >
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{errorText}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 candy-gradient-bg text-white font-bold rounded-xl shadow-lg shadow-purple-300/40 hover:shadow-purple-400/50 hover:opacity-95 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm disabled:opacity-70 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <span>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</span>
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-pink-100" /></div>
                  <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400 font-medium">O continuá con</span></div>
                </div>

                {/* Google */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full py-3 flex items-center justify-center gap-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold text-sm text-slate-700 disabled:opacity-50 shadow-sm"
                >
                  {googleLoading ? (
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  {googleLoading ? 'Conectando...' : 'Continuar con Google'}
                </button>

                {/* Toggle */}
                <p className="text-center text-sm text-gray-500 pt-1">
                  {isLogin ? (
                    <>¿No tenés cuenta?{' '}
                      <button type="button" onClick={() => setActiveScreen('registro')} className="text-purple-700 font-bold hover:underline">
                        Registrate gratis
                      </button>
                    </>
                  ) : (
                    <>¿Ya tenés cuenta?{' '}
                      <button type="button" onClick={() => setActiveScreen('login')} className="text-purple-700 font-bold hover:underline">
                        Iniciar sesión
                      </button>
                    </>
                  )}
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
