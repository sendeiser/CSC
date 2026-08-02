import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, Trash2, HelpCircle } from 'lucide-react';

interface AlertOptions {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  buttonText?: string;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ModalContextType {
  showAlert: (options: AlertOptions | string) => Promise<void>;
  showConfirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    options: AlertOptions;
    resolve: () => void;
  } | null>(null);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const showAlert = (options: AlertOptions | string): Promise<void> => {
    const opts: AlertOptions =
      typeof options === 'string'
        ? { title: 'Atención', message: options, type: 'info' }
        : { title: options.title || 'Atención', ...options };

    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        options: opts,
        resolve: () => {
          setAlertState(null);
          resolve();
        },
      });
    });
  };

  const showConfirm = (options: ConfirmOptions | string): Promise<boolean> => {
    const opts: ConfirmOptions =
      typeof options === 'string'
        ? { title: '¿Estás seguro?', message: options, type: 'danger' }
        : { title: options.title || '¿Estás seguro?', ...options };

    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options: opts,
        resolve: (value: boolean) => {
          setConfirmState(null);
          resolve(value);
        },
      });
    });
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Global Alert Modal */}
      <AnimatePresence>
        {alertState?.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-100 text-center"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center bg-purple-50 text-purple-600">
                {alertState.options.type === 'error' ? (
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                ) : alertState.options.type === 'success' ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                ) : alertState.options.type === 'warning' ? (
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                ) : (
                  <Info className="w-8 h-8 text-purple-600" />
                )}
              </div>

              <div>
                <h3 className="font-headline font-bold text-lg text-slate-900">
                  {alertState.options.title || 'Atención'}
                </h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  {alertState.options.message}
                </p>
              </div>

              <button
                onClick={() => alertState.resolve()}
                className="w-full py-3 bg-purple-600 text-white font-bold text-sm rounded-xl hover:bg-purple-700 transition-colors shadow-sm"
              >
                {alertState.options.buttonText || 'Entendido'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Confirm Modal */}
      <AnimatePresence>
        {confirmState?.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 border border-slate-100 text-center"
            >
              <div
                className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center ${
                  confirmState.options.type === 'danger'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                {confirmState.options.type === 'danger' ? (
                  <Trash2 className="w-7 h-7" />
                ) : (
                  <HelpCircle className="w-7 h-7" />
                )}
              </div>

              <div>
                <h3 className="font-headline font-bold text-lg text-slate-900">
                  {confirmState.options.title || '¿Estás seguro?'}
                </h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  {confirmState.options.message}
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => confirmState.resolve(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-200 transition-colors"
                >
                  {confirmState.options.cancelText || 'Cancelar'}
                </button>
                <button
                  onClick={() => confirmState.resolve(true)}
                  className={`flex-1 py-3 text-white font-bold text-sm rounded-xl transition-colors shadow-sm ${
                    confirmState.options.type === 'danger'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {confirmState.options.confirmText || 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal debe ser usado dentro de un ModalProvider');
  }
  return context;
};
