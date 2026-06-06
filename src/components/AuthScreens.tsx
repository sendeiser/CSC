import React from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, Sparkles, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { ActiveScreen, UserSession } from '../types';
import { auth as authApi, setAuthToken } from '../lib/api';

interface AuthScreensProps {
  type: 'login' | 'register';
  setActiveScreen: (screen: ActiveScreen) => void;
  setSession: React.Dispatch<React.SetStateAction<UserSession>>;
}

export const AuthScreens: React.FC<AuthScreensProps> = ({ type, setActiveScreen, setSession }) => {
  const isLogin = type === 'login';

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [errorText, setErrorText] = React.useState('');
  const [successAnimation, setSuccessAnimation] = React.useState(false);

  React.useEffect(() => {
    setEmail('');
    setPassword('');
    setFullName('');
    setTermsAccepted(false);
    setErrorText('');
    setSuccessAnimation(false);
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (isLogin) {
      if (!email.trim() || !password) {
        setErrorText('Por favor ingresa tus accesos galácticos.');
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
        setErrorText('Por favor rellena el formulario de inscripción.');
        return;
      }
      if (!termsAccepted) {
        setErrorText('Debes aceptar las políticas de privacidad estelares.');
        return;
      }
      if (password.length < 6) {
        setErrorText('La contraseña debe tener al menos 6 caracteres.');
        return;
      }

      try {
        const result = await authApi.signup({ email: email.trim(), password, name: fullName.trim() })
        if (result.session) {
          setAuthToken(result.session.access_token)
        }
        setSuccessAnimation(true)
        setTimeout(() => {
          if (result.session) {
            setSession({ isLoggedIn: true, email: email.trim(), name: fullName.trim() })
          }
          setActiveScreen('inicio')
        }, 1500)
      } catch (err: any) {
        setErrorText(err.message || 'Error al registrarse')
      }
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gradient-to-b from-pink-50/20 via-white to-purple-50/20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white shadow-lg border border-pink-100 rounded-3xl p-8 sm:p-10 space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-md">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-headline font-bold text-gray-900">
            {isLogin ? 'Bienvenido de Vuelta' : 'Crear Cuenta'}
          </h2>
          <p className="text-sm text-gray-500">
            {isLogin ? 'Accede a tu universo de dulzura.' : 'Únete a la dulce galaxia.'}
          </p>
        </div>

        {successAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-3 py-8"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <p className="text-emerald-700 font-semibold text-lg">
              {isLogin ? '¡Inicio de sesión exitoso!' : '¡Registro exitoso!'}
            </p>
          </motion.div>
        )}

        {!successAnimation && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej: Valentina González"
                    className="w-full pl-11 pr-4 py-3 border border-pink-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all bg-pink-50/30"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hola@chamicalcandy.shop"
                  className="w-full pl-11 pr-4 py-3 border border-pink-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all bg-pink-50/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 border border-pink-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all bg-pink-50/30"
                />
              </div>
            </div>

            {!isLogin && (
              <label className="flex items-start space-x-3 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 rounded border-pink-300 text-purple-600 focus:ring-purple-400"
                />
                <span>Acepto las <strong className="text-purple-700">Políticas de Privacidad</strong> y los Términos de Chamical Candy Shop.</span>
              </label>
            )}

            {errorText && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorText}</span>
              </motion.div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:opacity-95 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
            >
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </button>

            <div className="text-center text-sm text-gray-500 space-y-2">
              {isLogin ? (
                <p>
                  ¿No tienes cuenta?{' '}
                  <button type="button" onClick={() => setActiveScreen('registro')} className="text-purple-700 font-semibold hover:underline">
                    Registrarse
                  </button>
                </p>
              ) : (
                <p>
                  ¿Ya tienes cuenta?{' '}
                  <button type="button" onClick={() => setActiveScreen('login')} className="text-purple-700 font-semibold hover:underline">
                    Iniciar Sesión
                  </button>
                </p>
              )}
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
