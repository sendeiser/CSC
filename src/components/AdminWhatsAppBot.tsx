import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  QrCode, Smartphone, MessageCircle, Bot, Sparkles, RefreshCw, 
  CheckCircle2, AlertCircle, LogOut, Send, Eye, ShieldCheck, 
  Sliders, Copy, Check, Info, HelpCircle, UserX, Plus, Trash2, 
  Clock, ShieldAlert, Search, PhoneOff, UserCheck, Tag, X, RotateCcw
} from 'lucide-react';
import { whatsappBotApi } from '../lib/api';
import { useModal } from '../context/ModalContext';

export interface IgnoredNumber {
  id: string;
  phone: string;
  label: string;
  created_at: string;
}

export interface CustomMenuOption {
  id: string;
  option_number: string;
  title: string;
  keywords: string[];
  response: string;
}

export const DEFAULT_CHATBOT_KEYWORDS = [
  'pedido', 'candy', 'comprar', 'precio', 'precios', 'gomitas', 
  'catalogo', 'catálogo', 'envio', 'envío', 'local', 'horario', 
  'horarios', 'transferencia', 'alias', 'cbu', 'menu', 'menú', 
  'hola candy', 'promo', 'promos', 'stock', 'tienda', '#csc', 'consulta'
];

export const DEFAULT_TEMPLATES = {
  template_new_order: `🍬 *¡Hola {cliente}! Gracias por tu compra en Chamical Candy Shop* 🍭\n\n📦 *Pedido:* #{pedido_id}\n💰 *Total:* \${total}\n📍 *Entrega:* {direccion}\n\n🛒 *Detalle de tus golosinas:*\n{productos}\n\n🏦 *Datos para Transferencia Bancaria:*\n• *Alias:* \`{alias_banco}\`\n• *Banco:* {banco}\n• *Titular:* {titular}\n• *CBU:* \`{cbu}\`\n\n📸 *Por favor envíanos una foto del comprobante de transferencia por aquí para comenzar a preparar tu pedido. ¡Muchas gracias!* 🎉`,
  template_order_preparing: `👨‍🍳 *¡Buenas noticias {cliente}!* 🍬\n\nTu pedido *#{pedido_id}* por *\${total}* ya está *EN PREPARACIÓN*. 🍭\nNuestros expertos están seleccionando y empacando tus golosinas con el mayor cuidado.\n\n¡Te avisaremos apenas esté listo! ⏱️`,
  template_order_ready: `✨ *¡Tu pedido está LISTO {cliente}!* 🎉\n\n📦 Pedido: *#{pedido_id}*\n📍 Ya podés pasar a retirarlo por nuestro local en los horarios habituales.\n\n¡Te esperamos con tus golosinas preparadas! 🍬`,
  template_order_shipped: `🛵 *¡Tu pedido va en camino {cliente}!* 🚀\n\n📦 Pedido: *#{pedido_id}*\n📍 Dirección de entrega: *{direccion}*\n\nEl cadete ya salió con tu pedido. ¡Mantenete atento para recibir tus golosinas! 🍭`,
  template_menu: `🍬 *¡Hola {cliente}! Bienvenido a Chamical Candy Shop* 🍭\n\n¿En qué podemos ayudarte hoy? *Respondé con el número de opción:*\n\n1️⃣ 📦 *Consultar estado de mi pedido*\n2️⃣ 🏦 *Ver datos de transferencia bancaria*\n3️⃣ 📍 *Horarios y ubicación del local*\n4️⃣ 🛍️ *Ver catálogo online*\n5️⃣ 👤 *Hablar con una persona del equipo*`,
  template_payment_proof: `📸 *¡Comprobante de pago recibido!* 🎉\n\nMuchas gracias por enviarnos tu comprobante. Nuestro equipo lo verificará a la brevedad para confirmar tu pedido. 🍬`,
  menu_response_1: `📦 *Estado de tu Pedido:* #{pedido_id}\n\n• *Estado:* {estado}\n• *Total:* \${total}\n• *Destino:* {direccion}\n\n_Para volver al menú, enviá la palabra *MENU*._`,
  menu_response_2: `🏦 *Datos para Transferencia Bancaria:* 🍬\n\n• *Alias:* \`{alias_banco}\`\n• *Banco:* {banco}\n• *Titular:* {titular}\n• *CBU:* \`{cbu}\`\n\n📸 *Una vez realizada la transferencia, podés enviar la captura o comprobante por este mismo chat.*\n\n_Enviá *MENU* para ver más opciones._`,
  menu_response_3: `📍 *Ubicación y Horarios de Atención:* 🍬\n\n🏠 *Dirección:* {direccion}\n🕒 *Horarios:* {horarios}\n\n¡Te esperamos con las golosinas más ricas! 🍭\n\n_Enviá *MENU* para volver al menú principal._`,
  menu_response_4: `🛍️ *Catálogo Online de Chamical Candy Shop* 🍬\n\nPodés explorar todos nuestros productos, combos, gomitas por peso y armar tu carrito directamente en nuestra tienda web:\n👉 {catalogo_url}\n\n_Enviá *MENU* para ver más opciones._`,
  menu_response_5: `👤 *¡Entendido {cliente}! Un asesor de nuestro equipo te responderá a la brevedad.* 🍬\n\nPor favor dejanos tu consulta detallada para poder ayudarte más rápido. ¡Muchas gracias por tu paciencia!`,
  custom_menu_options: []
};

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
    ignored_numbers: [] as IgnoredNumber[],
    pause_on_manual_reply: true,
    pause_duration_minutes: 120,
    only_reply_to_customers: false,
    customer_filter_mode: 'any_order',
    require_keywords_for_chatbot: true,
    chatbot_keywords: DEFAULT_CHATBOT_KEYWORDS,
    template_new_order: DEFAULT_TEMPLATES.template_new_order,
    template_order_preparing: DEFAULT_TEMPLATES.template_order_preparing,
    template_order_ready: DEFAULT_TEMPLATES.template_order_ready,
    template_order_shipped: DEFAULT_TEMPLATES.template_order_shipped,
    template_menu: DEFAULT_TEMPLATES.template_menu,
    template_payment_proof: DEFAULT_TEMPLATES.template_payment_proof,
    menu_response_1: DEFAULT_TEMPLATES.menu_response_1,
    menu_response_2: DEFAULT_TEMPLATES.menu_response_2,
    menu_response_3: DEFAULT_TEMPLATES.menu_response_3,
    menu_response_4: DEFAULT_TEMPLATES.menu_response_4,
    menu_response_5: DEFAULT_TEMPLATES.menu_response_5,
    custom_menu_options: [] as CustomMenuOption[],
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [activeTemplateTab, setActiveTemplateTab] = useState<
    'menu' | 'option_1' | 'option_2' | 'option_3' | 'option_4' | 'option_5' | 'custom_options' |
    'new_order' | 'preparing' | 'ready' | 'shipped' | 'proof'
  >('menu');

  // New Custom Option Form
  const [newOptNumber, setNewOptNumber] = useState('6');
  const [newOptTitle, setNewOptTitle] = useState('');
  const [newOptKeywords, setNewOptKeywords] = useState('');
  const [newOptResponse, setNewOptResponse] = useState('');
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);

  // Simulated Option for WhatsApp Live Preview
  const [previewSelectedOption, setPreviewSelectedOption] = useState<string>('menu');

  // New Ignored Number form
  const [newIgnoredPhone, setNewIgnoredPhone] = useState('');
  const [newIgnoredLabel, setNewIgnoredLabel] = useState('');
  const [searchIgnored, setSearchIgnored] = useState('');

  // New Keyword form
  const [newKeywordInput, setNewKeywordInput] = useState('');

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
      if (data) {
        setSettings({
          ...DEFAULT_TEMPLATES,
          ...data,
          ignored_numbers: Array.isArray(data.ignored_numbers) ? data.ignored_numbers : [],
          pause_on_manual_reply: data.pause_on_manual_reply ?? true,
          pause_duration_minutes: data.pause_duration_minutes ?? 120,
          only_reply_to_customers: data.only_reply_to_customers ?? false,
          customer_filter_mode: data.customer_filter_mode || 'any_order',
          require_keywords_for_chatbot: data.require_keywords_for_chatbot ?? true,
          chatbot_keywords: Array.isArray(data.chatbot_keywords) && data.chatbot_keywords.length > 0 
            ? data.chatbot_keywords 
            : DEFAULT_CHATBOT_KEYWORDS,
          menu_response_1: data.menu_response_1 || DEFAULT_TEMPLATES.menu_response_1,
          menu_response_2: data.menu_response_2 || DEFAULT_TEMPLATES.menu_response_2,
          menu_response_3: data.menu_response_3 || DEFAULT_TEMPLATES.menu_response_3,
          menu_response_4: data.menu_response_4 || DEFAULT_TEMPLATES.menu_response_4,
          menu_response_5: data.menu_response_5 || DEFAULT_TEMPLATES.menu_response_5,
          custom_menu_options: Array.isArray(data.custom_menu_options) ? data.custom_menu_options : [],
        });
      }
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
      showAlert({ title: 'Guardado', message: 'Configuración y restricciones actualizadas correctamente.', type: 'success' });
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message || 'Error al guardar configuración', type: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddIgnoredNumber = () => {
    const clean = newIgnoredPhone.replace(/\D/g, '');
    if (!clean || clean.length < 6) {
      showAlert({
        title: 'Número incompleto',
        message: 'Por favor ingresa un número de teléfono válido (ej: 3826123456).',
        type: 'warning'
      });
      return;
    }

    const currentList: IgnoredNumber[] = Array.isArray(settings.ignored_numbers) ? settings.ignored_numbers : [];
    if (currentList.some((item) => String(item.phone || item).replace(/\D/g, '') === clean)) {
      showAlert({
        title: 'Ya existe',
        message: 'Este número ya se encuentra en la lista de excluidos.',
        type: 'warning'
      });
      return;
    }

    const newItem: IgnoredNumber = {
      id: 'ign_' + Date.now(),
      phone: clean,
      label: newIgnoredLabel.trim() || 'Contacto Personal',
      created_at: new Date().toISOString()
    };

    const updated = [newItem, ...currentList];
    setSettings({
      ...settings,
      ignored_numbers: updated
    });

    setNewIgnoredPhone('');
    setNewIgnoredLabel('');
  };

  const handleRemoveIgnoredNumber = (idOrPhone: string) => {
    const currentList: any[] = Array.isArray(settings.ignored_numbers) ? settings.ignored_numbers : [];
    const updated = currentList.filter((item) => {
      if (typeof item === 'string') return item !== idOrPhone;
      return item.id !== idOrPhone && item.phone !== idOrPhone;
    });
    setSettings({
      ...settings,
      ignored_numbers: updated
    });
  };

  const handleAddKeyword = () => {
    const clean = newKeywordInput.trim().toLowerCase();
    if (!clean) return;
    const currentKw: string[] = Array.isArray(settings.chatbot_keywords) ? settings.chatbot_keywords : DEFAULT_CHATBOT_KEYWORDS;
    if (currentKw.includes(clean)) {
      setNewKeywordInput('');
      return;
    }
    setSettings({
      ...settings,
      chatbot_keywords: [...currentKw, clean]
    });
    setNewKeywordInput('');
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    const currentKw: string[] = Array.isArray(settings.chatbot_keywords) ? settings.chatbot_keywords : DEFAULT_CHATBOT_KEYWORDS;
    setSettings({
      ...settings,
      chatbot_keywords: currentKw.filter((k) => k !== kwToRemove)
    });
  };

  const handleRestoreDefaultKeywords = () => {
    setSettings({
      ...settings,
      chatbot_keywords: DEFAULT_CHATBOT_KEYWORDS
    });
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

  const handleAddCustomOption = () => {
    if (!newOptTitle.trim() || !newOptResponse.trim()) {
      showAlert({ title: 'Campos incompletos', message: 'Ingresa al menos un título y la respuesta de la opción.', type: 'warning' });
      return;
    }

    const rawKws = newOptKeywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    const newOption: CustomMenuOption = {
      id: 'opt_' + Date.now(),
      option_number: newOptNumber.trim() || String((settings.custom_menu_options?.length || 0) + 6),
      title: newOptTitle.trim(),
      keywords: rawKws.length > 0 ? rawKws : [newOptNumber.trim()],
      response: newOptResponse.trim()
    };

    const updated = [...(settings.custom_menu_options || []), newOption];
    setSettings({ ...settings, custom_menu_options: updated });
    setNewOptTitle('');
    setNewOptKeywords('');
    setNewOptResponse('');
    setNewOptNumber(String(updated.length + 6));
    setShowAddCustomModal(false);
    showAlert({ title: 'Opción Creada', message: `La opción "${newOption.title}" fue agregada al chatbot.`, type: 'success' });
  };

  const handleRemoveCustomOption = (id: string) => {
    const updated = (settings.custom_menu_options || []).filter((opt: any) => opt.id !== id);
    setSettings({ ...settings, custom_menu_options: updated });
  };

  const handleRestoreDefaultTemplate = (tabKey: string) => {
    const keyMap: Record<string, string> = {
      menu: 'template_menu',
      option_1: 'menu_response_1',
      option_2: 'menu_response_2',
      option_3: 'menu_response_3',
      option_4: 'menu_response_4',
      option_5: 'menu_response_5',
      new_order: 'template_new_order',
      preparing: 'template_order_preparing',
      ready: 'template_order_ready',
      shipped: 'template_order_shipped',
      proof: 'template_payment_proof'
    };

    const settingKey = keyMap[tabKey];
    if (settingKey && (DEFAULT_TEMPLATES as any)[settingKey]) {
      setSettings({
        ...settings,
        [settingKey]: (DEFAULT_TEMPLATES as any)[settingKey]
      });
      showAlert({ title: 'Restaurado', message: 'Se restableció la plantilla por defecto.', type: 'info' });
    }
  };

  const insertVariable = (variable: string) => {
    const fieldMap: Record<string, string> = {
      menu: 'template_menu',
      option_1: 'menu_response_1',
      option_2: 'menu_response_2',
      option_3: 'menu_response_3',
      option_4: 'menu_response_4',
      option_5: 'menu_response_5',
      new_order: 'template_new_order',
      preparing: 'template_order_preparing',
      ready: 'template_order_ready',
      shipped: 'template_order_shipped',
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
  const getPreviewText = (tabToPreview?: string) => {
    const tab = tabToPreview || activeTemplateTab;
    const fieldMap: Record<string, string> = {
      menu: settings.template_menu,
      option_1: settings.menu_response_1,
      option_2: settings.menu_response_2,
      option_3: settings.menu_response_3,
      option_4: settings.menu_response_4,
      option_5: settings.menu_response_5,
      new_order: settings.template_new_order,
      preparing: settings.template_order_preparing,
      ready: settings.template_order_ready,
      shipped: settings.template_order_shipped,
      proof: settings.template_payment_proof
    };
    let text = fieldMap[tab] || '';

    const dummyData: Record<string, string> = {
      cliente: 'Mariana Gómez',
      pedido_id: 'A7F39C12',
      total: '4.850',
      productos: '• Gomitas Ácidas 250g - $1.800\n• Alfajor Premium Dulce de Leche (2 u.) - $1.600\n• Caramelos Masticables Surtidos 250g - $1.450',
      direccion: 'Castro Barros 245, Chamical',
      alias_banco: 'CHAMICAL.CANDY.SHOP',
      banco: 'Banco Galicia / MP',
      titular: 'Gonzalez Martin Gustavo',
      cbu: '0000003100019283746510',
      estado: '🍬 Listo para retirar',
      horarios: 'Lunes a Sábados de 09:00 a 13:00 y de 17:30 a 22:00 hs.',
      catalogo_url: 'https://candyshopchamical.netlify.app'
    };

    for (const [k, v] of Object.entries(dummyData)) {
      const regex = new RegExp(`\\{${k}\\}`, 'gi');
      text = text.replace(regex, v);
    }
    return text;
  };

  const filteredIgnoredNumbers = (Array.isArray(settings.ignored_numbers) ? settings.ignored_numbers : []).filter((item: any) => {
    const q = searchIgnored.toLowerCase();
    const phone = typeof item === 'string' ? item : item.phone;
    const label = typeof item === 'string' ? '' : (item.label || '');
    return phone.includes(q) || label.toLowerCase().includes(q);
  });

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
                Envío automático de pedidos finalizados y chatbot inteligente por palabras clave (Método 3).
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
          ) : status === 'connecting' ? (
            <div className="flex items-center space-x-2 px-4 py-2 bg-sky-50 border border-sky-200 rounded-2xl text-sky-700 text-xs font-bold shadow-2xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Conectando...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-2xl text-slate-600 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>Desconectado</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Conexión QR & Probador */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tarjeta de Código QR */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-center space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-600" />
              <span>Vincular WhatsApp de la Tienda</span>
            </h2>

            {status === 'connected' ? (
              <div className="py-8 px-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-900">¡WhatsApp Vinculado con Éxito!</h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {connectedUser?.name || 'Línea de WhatsApp'} ({connectedUser?.id?.split(':')[0] || 'Conectado'})
                  </p>
                </div>
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

        {/* Columna Derecha: Restricciones, Interruptores y Editor de Plantillas */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECCIÓN 1: Enviar WhatsApp Automático al Finalizar el Pedido */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <span>Envíos Automáticos de Pedidos</span>
              </h2>

              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{savingSettings ? 'Guardando...' : 'Guardar'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {/* REQUERIMIENTO 1: Enviar mensaje al terminar el pedido */}
              <label className="flex items-start justify-between p-4 rounded-2xl border-2 border-emerald-200/80 bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors cursor-pointer">
                <div className="pr-3">
                  <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <span>🛍️ Enviar WhatsApp Automático al Finalizar la Compra</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 font-extrabold px-2 py-0.5 rounded-full">
                      Principal
                    </span>
                  </p>
                  <p className="text-[11px] text-emerald-800/90 mt-0.5 leading-relaxed">
                    Apenas el cliente termina su pedido en la tienda web, el bot le envía automáticamente un WhatsApp con el detalle de sus golosinas, el total y los datos de pago (Alias, Banco, Titular).
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.auto_notify_new_order}
                  onChange={(e) => setSettings({ ...settings, auto_notify_new_order: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer shrink-0 mt-0.5"
                />
              </label>

              <label className="flex items-start justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 cursor-pointer">
                <div className="pr-3">
                  <p className="text-xs font-bold text-slate-800">📦 Notificar Cambios de Estado de Pedido</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Avisa al cliente automáticamente cuando marcas su pedido como "En preparación", "Listo para retirar" o "En camino".
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.auto_notify_status_change}
                  onChange={(e) => setSettings({ ...settings, auto_notify_status_change: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0 mt-0.5"
                />
              </label>

              <label className="flex items-start justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 cursor-pointer">
                <div className="pr-3">
                  <p className="text-xs font-bold text-slate-800">🤖 Chatbot Interactivo 24/7 (Menú 1 al 5)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Responde preguntas frecuentes (estado de pedido, alias bancario, horarios y catálogo) cuando los clientes escriben.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.auto_chatbot_menu}
                  onChange={(e) => setSettings({ ...settings, auto_chatbot_menu: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0 mt-0.5"
                />
              </label>
            </div>
          </div>

          {/* SECCIÓN 2: MÉTODO 3 (Detección por Palabras Clave) & Restricciones */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Método 3: Detección por Palabras Clave de Tienda</span>
                    <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded-full">
                      Recomendado
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    El chatbot SOLO responderá si el mensaje menciona términos de compra. Mensajes personales de familia y amigos son ignorados.
                  </p>
                </div>
              </div>
            </div>

            {/* Switch de Método 3 */}
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-3">
              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    <span>🏷️ Activar Método 3 (Exigir Palabras Clave para Responder)</span>
                  </p>
                  <p className="text-[11px] text-purple-900/80 mt-0.5 leading-relaxed">
                    Si un cliente o invitado escribe preguntando por <em>"pedido", "gomitas", "precio", "catálogo", "comprar"</em> o el código web <em>"#CSC"</em>, el bot le enviará el menú. Si un contacto personal escribe cualquier otra cosa, el bot se mantiene 100% en silencio.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.require_keywords_for_chatbot}
                  onChange={(e) => setSettings({ ...settings, require_keywords_for_chatbot: e.target.checked })}
                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer shrink-0 mt-0.5"
                />
              </label>

              {settings.require_keywords_for_chatbot && (
                <div className="pt-3 border-t border-purple-200/60 space-y-2.5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-purple-600" />
                      <span>Palabras clave activas ({settings.chatbot_keywords?.length || 0}):</span>
                    </span>

                    <button
                      type="button"
                      onClick={handleRestoreDefaultKeywords}
                      className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restaurar palabras sugeridas</span>
                    </button>
                  </div>

                  {/* Input para agregar nueva palabra clave */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Escribe una palabra clave (ej: combo, alfajor, pago)..."
                      value={newKeywordInput}
                      onChange={(e) => setNewKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddKeyword();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddKeyword}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  </div>

                  {/* Lista de chips de palabras clave */}
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-1">
                    {(settings.chatbot_keywords || []).map((kw: string) => (
                      <span
                        key={kw}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-purple-200 text-purple-800 rounded-lg text-[11px] font-medium shadow-2xs"
                      >
                        <span>{kw}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(kw)}
                          className="text-purple-400 hover:text-red-500 ml-1 cursor-pointer"
                          title="Eliminar palabra clave"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pausa Automática por Respuesta Manual */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-3">
              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <span>🤫 Pausar Bot Automáticamente si Yo Respondo en el Chat</span>
                  </p>
                  <p className="text-[11px] text-amber-800/80 mt-0.5">
                    Si abrís WhatsApp y le escribís manualmente a alguien, el bot se pausará automáticamente para esa persona para no interrumpir tu conversación.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pause_on_manual_reply}
                  onChange={(e) => setSettings({ ...settings, pause_on_manual_reply: e.target.checked })}
                  className="w-5 h-5 accent-amber-600 rounded cursor-pointer shrink-0 mt-0.5"
                />
              </label>

              {settings.pause_on_manual_reply && (
                <div className="pt-2 border-t border-amber-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <span className="text-amber-900 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Tiempo de pausa tras tu último mensaje:</span>
                  </span>
                  <select
                    value={settings.pause_duration_minutes || 120}
                    onChange={(e) => setSettings({ ...settings, pause_duration_minutes: Number(e.target.value) })}
                    className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-900 outline-none cursor-pointer"
                  >
                    <option value={30}>30 Minutos</option>
                    <option value={60}>1 Hora</option>
                    <option value={120}>2 Horas (Recomendado)</option>
                    <option value={360}>6 Horas</option>
                    <option value={720}>12 Horas</option>
                    <option value={1440}>24 Horas</option>
                  </select>
                </div>
              )}
            </div>

            {/* Lista Negra / Números Excluidos */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <UserX className="w-4 h-4 text-red-500" />
                    <span>Lista Negra de Números Excluidos (Nunca responder)</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                      {Array.isArray(settings.ignored_numbers) ? settings.ignored_numbers.length : 0}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Añade teléfonos personales específicos para que el bot jamás les conteste.
                  </p>
                </div>
              </div>

              {/* Formulario para Agregar Número Excluido */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6">
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Teléfono a Excluir</label>
                    <input
                      type="text"
                      placeholder="Ej: 3826123456"
                      value={newIgnoredPhone}
                      onChange={(e) => setNewIgnoredPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Etiqueta / Nombre</label>
                    <input
                      type="text"
                      placeholder="Ej: Mamá / Amigo"
                      value={newIgnoredLabel}
                      onChange={(e) => setNewIgnoredLabel(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-end">
                    <button
                      type="button"
                      onClick={handleAddIgnoredNumber}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Listado de Números Excluidos */}
              {Array.isArray(settings.ignored_numbers) && settings.ignored_numbers.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {filteredIgnoredNumbers.map((item: any) => {
                    const id = typeof item === 'string' ? item : item.id;
                    const phone = typeof item === 'string' ? item : item.phone;
                    const label = typeof item === 'string' ? 'Contacto Personal' : (item.label || 'Contacto Personal');

                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-red-50/40 border border-slate-200/80 rounded-xl text-xs transition-colors group"
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-[11px]">
                            🚫
                          </span>
                          <div>
                            <p className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span className="font-mono text-slate-900">{phone}</span>
                              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.2 rounded-md font-semibold">
                                {label}
                              </span>
                            </p>
                            <p className="text-[10px] text-slate-500">El bot no le contestará automáticamente</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveIgnoredNumber(id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-200"
                          title="Eliminar de la lista de excluidos"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl text-center border border-dashed border-slate-200 text-xs text-slate-400">
                  No hay números excluidos aún.
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 3: Editor de Menú Chatbot y Plantillas */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-600" />
                  <span>Editor del Menú Chatbot y Mensajes Automáticos</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Modifica las respuestas del menú interactivo (1, 2, 3, 4, 5...) y las notificaciones de pedidos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {activeTemplateTab !== 'custom_options' && (
                  <button
                    type="button"
                    onClick={() => handleRestoreDefaultTemplate(activeTemplateTab)}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    title="Restaurar plantilla por defecto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar por Defecto</span>
                  </button>
                )}

                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingSettings ? 'Guardando...' : 'Guardar Todo'}</span>
                </button>
              </div>
            </div>

            {/* Selector de Grupo de Plantillas */}
            <div className="space-y-3">
              {/* Grupo 1: Menú Interactivo del Chatbot */}
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 block mb-1.5 flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  <span>🤖 Opciones del Menú Chatbot Interactivo:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'menu', label: '📋 Menú Bienvenida' },
                    { id: 'option_1', label: '📦 1. Estado Pedido' },
                    { id: 'option_2', label: '🏦 2. Transferencia' },
                    { id: 'option_3', label: '📍 3. Horarios y Local' },
                    { id: 'option_4', label: '🛍️ 4. Catálogo Web' },
                    { id: 'option_5', label: '👤 5. Asesor Humano' },
                    { id: 'custom_options', label: `➕ Opciones Extra (${settings.custom_menu_options?.length || 0})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTemplateTab(tab.id as any);
                        if (tab.id !== 'custom_options') {
                          setPreviewSelectedOption(tab.id);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTemplateTab === tab.id
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-200 ring-2 ring-purple-400'
                          : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200/60'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grupo 2: Notificaciones Automáticas de Pedidos */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1.5 flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  <span>🔔 Notificaciones Automáticas de Pedidos:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'new_order', label: '🛍️ Nuevo Pedido (Comprobante)' },
                    { id: 'preparing', label: '👨‍🍳 En Preparación' },
                    { id: 'ready', label: '✨ Listo Retiro' },
                    { id: 'shipped', label: '🛵 En Camino' },
                    { id: 'proof', label: '📸 Foto Comprobante Recibida' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTemplateTab(tab.id as any);
                        setPreviewSelectedOption(tab.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTemplateTab === tab.id
                          ? 'bg-slate-800 text-white shadow-md shadow-slate-300 ring-2 ring-slate-400'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Contenido según la pestaña activa */}
            {activeTemplateTab === 'custom_options' ? (
              /* GESTOR DE OPCIONES PERSONALIZADAS */
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl">
                  <div>
                    <h3 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>Opciones Personalizadas del Chatbot</span>
                    </h3>
                    <p className="text-[11px] text-purple-800/80 mt-0.5">
                      Crea opciones adicionales para el menú (ej: Opción 6 para "Promociones", Opción 7 para "Envíos a Domicilio").
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomModal(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nueva Opción</span>
                  </button>
                </div>

                {/* Lista de Opciones Personalizadas */}
                {Array.isArray(settings.custom_menu_options) && settings.custom_menu_options.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {settings.custom_menu_options.map((opt: CustomMenuOption) => (
                      <div
                        key={opt.id}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 hover:border-purple-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                              {opt.option_number}
                            </span>
                            <span className="font-bold text-slate-800 text-xs">{opt.title}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomOption(opt.id)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Eliminar opción"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-[10px] text-slate-500 flex items-center gap-1 flex-wrap">
                          <span className="font-semibold">Palabras clave:</span>
                          {(opt.keywords || []).map((k: string) => (
                            <span key={k} className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                              {k}
                            </span>
                          ))}
                        </div>

                        <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-700 font-mono whitespace-pre-wrap">
                          {opt.response}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-600">No hay opciones personalizadas adicionales.</p>
                    <p className="text-[11px] text-slate-400">
                      El chatbot responderá con las 5 opciones estándar. Haz clic en "Nueva Opción" para añadir más.
                    </p>
                  </div>
                )}

                {/* Modal / Formulario para Agregar Opción */}
                {showAddCustomModal && (
                  <div className="p-4 bg-white border-2 border-purple-300 rounded-2xl shadow-lg space-y-3">
                    <h4 className="text-xs font-bold text-purple-900 flex items-center justify-between">
                      <span>➕ Crear Nueva Opción para el Menú</span>
                      <button onClick={() => setShowAddCustomModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-3">
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">N° / Código</label>
                        <input
                          type="text"
                          placeholder="Ej: 6 o PROMO"
                          value={newOptNumber}
                          onChange={(e) => setNewOptNumber(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-purple-400 font-mono"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Título de la Opción</label>
                        <input
                          type="text"
                          placeholder="Ej: Promociones y Combos"
                          value={newOptTitle}
                          onChange={(e) => setNewOptTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-400"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Palabras Clave (separadas por coma)</label>
                        <input
                          type="text"
                          placeholder="Ej: 6, promo, promocion, oferta, combo"
                          value={newOptKeywords}
                          onChange={(e) => setNewOptKeywords(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-400 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Respuesta del Bot</label>
                      <textarea
                        rows={4}
                        placeholder="Escribe el mensaje que enviará el bot al presionar esta opción..."
                        value={newOptResponse}
                        onChange={(e) => setNewOptResponse(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddCustomModal(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomOption}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 cursor-pointer"
                      >
                        Guardar Opción
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* EDITOR DE PLANTILLA REGULAR */
              <div className="space-y-4">
                {/* Variables Dinámicas Insertables */}
                <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1.5">
                  <div className="flex items-center space-x-1 text-purple-900 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Variables Dinámicas Disponibles (haz clic para insertar):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { tag: '{cliente}', label: 'Nombre Cliente' },
                      { tag: '{pedido_id}', label: 'ID Pedido' },
                      { tag: '{total}', label: 'Monto Total' },
                      { tag: '{estado}', label: 'Estado Pedido' },
                      { tag: '{productos}', label: 'Lista de Golosinas' },
                      { tag: '{direccion}', label: 'Dirección' },
                      { tag: '{horarios}', label: 'Horarios de Atención' },
                      { tag: '{catalogo_url}', label: 'Enlace Catálogo Web' },
                      { tag: '{alias_banco}', label: 'Alias Bancario' },
                      { tag: '{banco}', label: 'Nombre Banco' },
                      { tag: '{titular}', label: 'Titular' },
                      { tag: '{cbu}', label: 'CBU' },
                    ].map((v) => (
                      <button
                        key={v.tag}
                        type="button"
                        onClick={() => insertVariable(v.tag)}
                        className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer"
                      >
                        {v.tag}
                      </button>
                    ))}
                  </div>
                  {copiedVar && (
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                      ✓ Variable {copiedVar} insertada en el mensaje.
                    </p>
                  )}
                </div>

                {/* Campo de Texto del Template */}
                <div>
                  <textarea
                    rows={8}
                    value={
                      activeTemplateTab === 'menu' ? (settings.template_menu || '') :
                      activeTemplateTab === 'option_1' ? (settings.menu_response_1 || '') :
                      activeTemplateTab === 'option_2' ? (settings.menu_response_2 || '') :
                      activeTemplateTab === 'option_3' ? (settings.menu_response_3 || '') :
                      activeTemplateTab === 'option_4' ? (settings.menu_response_4 || '') :
                      activeTemplateTab === 'option_5' ? (settings.menu_response_5 || '') :
                      activeTemplateTab === 'new_order' ? (settings.template_new_order || '') :
                      activeTemplateTab === 'preparing' ? (settings.template_order_preparing || '') :
                      activeTemplateTab === 'ready' ? (settings.template_order_ready || '') :
                      activeTemplateTab === 'shipped' ? (settings.template_order_shipped || '') :
                      (settings.template_payment_proof || '')
                    }
                    onChange={(e) => {
                      const fieldMap: Record<string, string> = {
                        menu: 'template_menu',
                        option_1: 'menu_response_1',
                        option_2: 'menu_response_2',
                        option_3: 'menu_response_3',
                        option_4: 'menu_response_4',
                        option_5: 'menu_response_5',
                        new_order: 'template_new_order',
                        preparing: 'template_order_preparing',
                        ready: 'template_order_ready',
                        shipped: 'template_order_shipped',
                        proof: 'template_payment_proof'
                      };
                      const key = fieldMap[activeTemplateTab];
                      if (key) {
                        setSettings({ ...settings, [key]: e.target.value });
                      }
                    }}
                    className="w-full p-4 border border-slate-200 rounded-2xl text-xs font-mono leading-relaxed outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50/50"
                    placeholder="Escribe aquí el contenido del mensaje de WhatsApp..."
                  />
                </div>
              </div>
            )}

            {/* SECCIÓN 4: Simulador Interactivo de WhatsApp en Tiempo Real */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span>Simulador Interactivo de WhatsApp (Haz clic en una opción para probar):</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'menu', label: '📋 Ver Menú' },
                    { id: 'option_1', label: '1️⃣ Pedido' },
                    { id: 'option_2', label: '2️⃣ Bancos' },
                    { id: 'option_3', label: '3️⃣ Horarios' },
                    { id: 'option_4', label: '4️⃣ Catálogo' },
                    { id: 'option_5', label: '5️⃣ Asesor' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setPreviewSelectedOption(b.id)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                        previewSelectedOption === b.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat WhatsApp Preview */}
              <div className="bg-[#efeae2] p-4 rounded-3xl border border-slate-200 shadow-inner max-w-xl mx-auto space-y-3">
                {/* Mensaje del Bot (Menú o respuesta inicial) */}
                <div className="bg-white text-slate-900 p-3.5 rounded-2xl rounded-tl-none shadow-sm mr-auto max-w-[90%] border border-slate-200/60 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                  {getPreviewText('menu')}
                  <div className="mt-1 flex items-center justify-end space-x-1 text-[10px] text-slate-400">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Si se seleccionó una opción diferente a 'menu', simular la interacción */}
                {previewSelectedOption !== 'menu' && (
                  <>
                    {/* Mensaje que envía el cliente */}
                    <div className="bg-[#d9fdd3] text-slate-900 p-2.5 rounded-2xl rounded-tr-none shadow-sm ml-auto max-w-[50%] border border-emerald-100 text-xs font-sans text-right">
                      <span className="font-bold">
                        {previewSelectedOption === 'option_1' ? '1' :
                         previewSelectedOption === 'option_2' ? '2' :
                         previewSelectedOption === 'option_3' ? '3' :
                         previewSelectedOption === 'option_4' ? '4' :
                         previewSelectedOption === 'option_5' ? '5' :
                         previewSelectedOption.toUpperCase()}
                      </span>
                      <div className="mt-0.5 flex items-center justify-end space-x-1 text-[9px] text-emerald-800">
                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-sky-600 font-bold">✓✓</span>
                      </div>
                    </div>

                    {/* Respuesta automática del Bot a esa opción */}
                    <div className="bg-white text-slate-900 p-3.5 rounded-2xl rounded-tl-none shadow-sm mr-auto max-w-[90%] border border-slate-200/60 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                      {getPreviewText(previewSelectedOption)}
                      <div className="mt-1 flex items-center justify-end space-x-1 text-[10px] text-slate-400">
                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
