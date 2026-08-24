import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  QrCode, Smartphone, MessageCircle, Bot, Sparkles, RefreshCw, 
  CheckCircle2, AlertCircle, LogOut, Send, Eye, ShieldCheck, 
  Sliders, Copy, Check, Info, HelpCircle
} from 'lucide-react';
import { whatsappBotApi } from '../lib/api';
import { useModal } from '../context/ModalContext';

export const AdminWhatsAppBot: React.FC = () => {
  const { showAlert, showConfirm } = useModal();
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'qr_ready' | 'connected'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectedUser, setConnectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingQR, setRefreshingQR] = useState(false);

  // Settings
  const [settings, setSettings] = useState<any>({
    enabled: true,
    auto_notify_new_order: true,
    auto_notify_status_change: true,
    auto_chatbot_menu: true,
    template_new_order: '',
    template_order_preparing: '',
    template_order_ready: '',
    template_order_shipped: '',
    template_menu: '',
    template_payment_proof: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [activeTemplateTab, setActiveTemplateTab] = useState<'new_order' | 'preparing' | 'ready' | 'shipped' | 'menu' | 'proof'>('new_order');

  // Test message
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  // Cargar estado y configuración inicial
  const fetchStatus = async () => {
    try {
      const data = await whatsappBotApi.getStatus();
      setStatus(data.status);
      setQrCode(data.qrCode || null);
      setConnectedUser(data.user || null);
    } catch (_e) {}
  };

  const fetchSettings = async () => {
    try {
      const data = await whatsappBotApi.getSettings();
      if (data) setSettings(data);
    } catch (_e) {}
  };

  useEffect(() => {
    Promise.all([fetchStatus(), fetchSettings()]).finally(() => setLoading(false));
  }, []);

  // Polling del estado de conexión (cada 4 segundos cuando está esperando QR o conectando)
  useEffect(() => {
    if (status === 'qr_ready' || status === 'connecting') {
      const interval = setInterval(() => {
        fetchStatus();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const handleStartOrRefresh = async () => {
    setRefreshingQR(true);
    try {
      const res = await whatsappBotApi.start();
      setStatus(res.status as any);
      setQrCode(res.qrCode || null);
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message || 'No se pudo iniciar el bot', type: 'error' });
    } finally {
      setRefreshingQR(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      title: '¿Desvincular WhatsApp?',
      message: 'Se cerrará la sesión de WhatsApp del bot. Para volver a usarlo deberás escanear el código QR nuevamente.',
      confirmText: 'Desvincular',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      await whatsappBotApi.logout();
      setStatus('disconnected');
      setQrCode(null);
      setConnectedUser(null);
      showAlert({ title: 'Desvinculado', message: 'La sesión de WhatsApp ha sido cerrada.', type: 'info' });
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message || 'Error al cerrar sesión', type: 'error' });
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const updated = await whatsappBotApi.updateSettings(settings);
      setSettings(updated);
      showAlert({ title: 'Guardado', message: 'Configuración y plantillas actualizadas correctamente.', type: 'success' });
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message || 'Error al guardar configuración', type: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSendTest = async () => {
    if (!testPhone) {
      showAlert({ title: 'Atención', message: 'Ingresa un número de teléfono para la prueba.', type: 'warning' });
      return;
    }
    setSendingTest(true);
    try {
      await whatsappBotApi.sendTest(testPhone, testMessage);
      showAlert({ title: '¡Mensaje Enviado!', message: `Se envió el WhatsApp de prueba a ${testPhone}`, type: 'success' });
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message || 'No se pudo enviar el mensaje', type: 'error' });
    } finally {
      setSendingTest(false);
    }
  };

  const insertVariable = (variable: string) => {
    const fieldMap: Record<string, string> = {
      new_order: 'template_new_order',
      preparing: 'template_order_preparing',
      ready: 'template_order_ready',
      shipped: 'template_order_shipped',
      menu: 'template_menu',
      proof: 'template_payment_proof'
    };
    const key = fieldMap[activeTemplateTab];
    if (!key) return;

    setSettings((prev: any) => ({
      ...prev,
      [key]: (prev[key] || '') + variable
    }));

    setCopiedVar(variable);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  // Preview de plantilla con datos ficticios
  const getPreviewText = () => {
    const fieldMap: Record<string, string> = {
      new_order: settings.template_new_order,
      preparing: settings.template_order_preparing,
      ready: settings.template_order_ready,
      shipped: settings.template_order_shipped,
      menu: settings.template_menu,
      proof: settings.template_payment_proof
    };
    let text = fieldMap[activeTemplateTab] || '';

    const dummyData: Record<string, string> = {
      cliente: 'Mariana Gómez',
      pedido_id: 'A7F39C12',
      total: '4.850',
      productos: '• Gomitas Ácidas 250g - $1.800\n• Alfajor Premium Dulce de Leche (2 u.) - $1.600\n• Caramelos Masticables Surtidos 250g - $1.450',
      direccion: 'Castro Barros 245, Chamical',
      alias_banco: 'CHAMICAL.CANDY.SHOP',
      banco: 'Banco Galicia / MP',
      titular: 'Chamical Candy Shop',
      cbu: '0000003100019283746510',
      estado: 'En preparación'
    };

    for (const [k, v] of Object.entries(dummyData)) {
      const regex = new RegExp(`\\{${k}\\}`, 'gi');
      text = text.replace(regex, v);
    }
    return text;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-headline font-bold text-slate-900 flex items-center gap-2">
                WhatsApp Bot & Mensajes Automáticos
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  Open Source (Baileys)
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Envía confirmaciones automáticas de compra, estados de pedidos y activa un menú inteligente 24/7.
              </p>
            </div>
          </div>
        </div>

        {/* Estado general */}
        <div className="flex items-center space-x-2">
          {status === 'connected' ? (
            <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-bold shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Conectado ({connectedUser?.name || connectedUser?.id?.split(':')[0] || 'WhatsApp'})</span>
            </div>
          ) : status === 'qr_ready' ? (
            <div className="flex items-center space-x-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-bold shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <span>Esperando Escaneo QR</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-2xl text-slate-600 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>Desconectado</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Vinculación QR & Interruptores */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Tarjeta QR o Conexión */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-center">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center justify-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              <span>Vincular WhatsApp de la Tienda</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Escanea el código con tu celular para que los mensajes salgan desde tu número oficial.
            </p>

            {status === 'connected' ? (
              <div className="py-8 px-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-emerald-900">¡WhatsApp Vinculado con Éxito!</h3>
                <p className="text-xs text-emerald-700 max-w-xs text-center">
                  El bot está listo para enviar confirmaciones a tus clientes y responder preguntas frecuentes automáticamente.
                </p>
                <div className="pt-3">
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Desvincular WhatsApp</span>
                  </button>
                </div>
              </div>
            ) : status === 'qr_ready' && qrCode ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-3 bg-white border-2 border-emerald-400 rounded-2xl shadow-md inline-block">
                  <img src={qrCode} alt="Código QR de WhatsApp" className="w-56 h-56 rounded-xl object-contain" />
                </div>

                <div className="text-left bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1.5 w-full">
                  <p className="font-bold text-slate-900 mb-1">Pasos para conectar:</p>
                  <p>1️⃣ Abrí WhatsApp en tu celular.</p>
                  <p>2️⃣ Tocá <strong>Ajustes</strong> o los <strong>3 puntos</strong> &gt; <strong>Dispositivos Vinculados</strong>.</p>
                  <p>3️⃣ Tocá <strong>Vincular un dispositivo</strong> y apuntá la cámara aquí.</p>
                </div>

                <button
                  onClick={handleStartOrRefresh}
                  disabled={refreshingQR}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer w-full"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshingQR ? 'animate-spin' : ''}`} />
                  <span>Regenerar Código QR</span>
                </button>
              </div>
            ) : (
              <div className="py-10 px-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
                  <QrCode className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">WhatsApp Desconectado</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs text-center">
                    Haz clic en el botón de abajo para generar el código QR y vincular tu cuenta en 1 minuto.
                  </p>
                </div>
                <button
                  onClick={handleStartOrRefresh}
                  disabled={refreshingQR}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshingQR ? 'animate-spin' : ''}`} />
                  <span>Generar Código QR</span>
                </button>
              </div>
            )}
          </div>

          {/* Probador de Mensajes en Vivo */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-600" />
              <span>Probar Envío de WhatsApp</span>
            </h2>
            <p className="text-xs text-slate-500">
              Envía un mensaje de prueba a cualquier teléfono para verificar la conexión.
            </p>

            <div className="space-y-2 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700">Número de teléfono (con código de área)</label>
                <input
                  type="text"
                  placeholder="Ej: 3826123456 o 5493826123456"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700">Mensaje opcional</label>
                <input
                  type="text"
                  placeholder="Mensaje personalizado de prueba..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <button
                onClick={handleSendTest}
                disabled={sendingTest || status !== 'connected'}
                className="w-full mt-2 flex items-center justify-center space-x-2 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 transition-all active:scale-95 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingTest ? 'Enviando...' : 'Enviar WhatsApp de Prueba'}</span>
              </button>
              {status !== 'connected' && (
                <p className="text-[11px] text-amber-600 text-center">
                  * Debes conectar WhatsApp primero antes de probar.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Interruptores y Editor de Plantillas */}
        <div className="lg:col-span-7 space-y-6">
          {/* Interruptores de Automatización */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-600" />
              <span>Opciones de Automatización</span>
            </h2>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-800">🛍️ Notificación de Compra al Cliente</p>
                  <p className="text-[11px] text-slate-500">
                    Envía automáticamente el recibo y Alias de transferencia al WhatsApp del cliente al finalizar la compra.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.auto_notify_new_order}
                  onChange={(e) => setSettings({ ...settings, auto_notify_new_order: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-800">📦 Notificación de Estado de Pedido</p>
                  <p className="text-[11px] text-slate-500">
                    Avisa al cliente automáticamente cuando marcas su pedido como "En preparación", "Listo" o "En camino".
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.auto_notify_status_change}
                  onChange={(e) => setSettings({ ...settings, auto_notify_status_change: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-800">🤖 Chatbot Interactivo 24/7 (Menú 1 al 5)</p>
                  <p className="text-[11px] text-slate-500">
                    Responde automáticamente cuando un cliente escribe para consultar su pedido, datos de pago o catálogo.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.auto_chatbot_menu}
                  onChange={(e) => setSettings({ ...settings, auto_chatbot_menu: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Editor de Plantillas */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                  <span>Editor de Plantillas de Mensajes</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Personaliza los mensajes que recibirán tus clientes.
                </p>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{savingSettings ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>

            {/* Pestañas de Plantillas */}
            <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
              {[
                { id: 'new_order', label: '🛍️ Nuevo Pedido' },
                { id: 'preparing', label: '👨‍🍳 En Preparación' },
                { id: 'ready', label: '✨ Listo Retiro' },
                { id: 'shipped', label: '🛵 En Camino' },
                { id: 'menu', label: '🤖 Menú Chatbot' },
                { id: 'proof', label: '📸 Comprobante' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTemplateTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTemplateTab === tab.id
                      ? 'bg-purple-100 text-purple-800 shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Chips de Variables Dinámicas */}
            <div>
              <p className="text-[11px] font-bold text-slate-600 mb-1.5">
                Toca una variable para insertarla en el texto:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { tag: '{cliente}', desc: 'Nombre' },
                  { tag: '{pedido_id}', desc: 'ID Pedido' },
                  { tag: '{total}', desc: 'Total $' },
                  { tag: '{productos}', desc: 'Lista golosinas' },
                  { tag: '{alias_banco}', desc: 'Alias' },
                  { tag: '{banco}', desc: 'Banco' },
                  { tag: '{titular}', desc: 'Titular' },
                  { tag: '{cbu}', desc: 'CBU' },
                  { tag: '{direccion}', desc: 'Dirección' },
                ].map((v) => (
                  <button
                    key={v.tag}
                    onClick={() => insertVariable(v.tag)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-semibold transition-all active:scale-95 cursor-pointer"
                  >
                    <span>{v.tag}</span>
                    <span className="text-[10px] text-purple-400">({v.desc})</span>
                    {copiedVar === v.tag && <Check className="w-3 h-3 text-emerald-600 ml-0.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor de Texto */}
            <div>
              <textarea
                rows={8}
                value={
                  activeTemplateTab === 'new_order' ? settings.template_new_order :
                  activeTemplateTab === 'preparing' ? settings.template_order_preparing :
                  activeTemplateTab === 'ready' ? settings.template_order_ready :
                  activeTemplateTab === 'shipped' ? settings.template_order_shipped :
                  activeTemplateTab === 'menu' ? settings.template_menu :
                  settings.template_payment_proof
                }
                onChange={(e) => {
                  const val = e.target.value;
                  const fieldMap: Record<string, string> = {
                    new_order: 'template_new_order',
                    preparing: 'template_order_preparing',
                    ready: 'template_order_ready',
                    shipped: 'template_order_shipped',
                    menu: 'template_menu',
                    proof: 'template_payment_proof'
                  };
                  setSettings({ ...settings, [fieldMap[activeTemplateTab]]: val });
                }}
                className="w-full p-4 border border-slate-200 rounded-2xl text-xs font-mono bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-purple-400 transition-all leading-relaxed"
                placeholder="Escribe la plantilla del mensaje aquí..."
              />
            </div>

            {/* Previsualización en Burbuja de WhatsApp */}
            <div className="pt-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 mb-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>Previsualización en vivo (Cómo lo ve el cliente en su WhatsApp):</span>
              </div>

              <div className="p-4 bg-[#e5ddd5] rounded-2xl border border-slate-300 flex flex-col items-start max-w-lg">
                <div className="bg-[#dcf8c6] text-slate-800 p-3 rounded-2xl rounded-tl-none shadow-sm text-xs leading-relaxed max-w-full whitespace-pre-wrap">
                  {getPreviewText()}
                  <div className="flex items-center justify-end space-x-1 mt-1 text-[10px] text-slate-500">
                    <span>14:32</span>
                    <span className="text-[#34B7F1] font-bold">✓✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
