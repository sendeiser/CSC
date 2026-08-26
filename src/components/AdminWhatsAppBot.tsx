import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  QrCode, Smartphone, MessageCircle, Bot, Sparkles, RefreshCw, 
  CheckCircle2, AlertCircle, LogOut, Send, Eye, ShieldCheck, 
  Sliders, Copy, Check, Info, HelpCircle, UserX, Plus, Trash2, 
  Clock, ShieldAlert, Search, PhoneOff, UserCheck, Tag, X, RotateCcw,
  Layers, Settings, ChevronRight, CornerDownLeft, Sparkle, PhoneCall,
  MoreVertical, Paperclip, Smile, Mic, CheckCheck, FlaskConical,
  Play, PlayCircle, FastForward, Cpu, Terminal, FileCode, CheckSquare,
  Shield, Activity, ArrowRight, Zap, Image as ImageIcon, Download
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

export interface TestPersona {
  id: string;
  name: string;
  phone: string;
  role: string;
  avatarBg: string;
  description: string;
  hasActiveOrder?: boolean;
  activeOrderId?: string;
  isIgnored?: boolean;
}

export const TEST_PERSONAS: TestPersona[] = [
  {
    id: 'persona_new',
    name: 'Mariana Gómez',
    phone: '3826401122',
    role: 'Cliente Nueva',
    avatarBg: 'bg-pink-600',
    description: 'Sin pedidos previos. Consulta catálogo, precios y bienvenida.',
    hasActiveOrder: false
  },
  {
    id: 'persona_vip',
    name: 'Lucas Benítez',
    phone: '3826458899',
    role: 'Cliente Frecuente',
    avatarBg: 'bg-purple-700',
    description: 'Tiene un pedido activo (#A7F39C) en preparación para probar estado.',
    hasActiveOrder: true,
    activeOrderId: 'A7F39C12'
  },
  {
    id: 'persona_weight',
    name: 'Valentina Romero',
    phone: '3826493344',
    role: 'Compradora de Gomitas',
    avatarBg: 'bg-emerald-600',
    description: 'Pide gomitas al peso en pasos de 25g, 50g y gramajes libres (75g/150g).',
    hasActiveOrder: false
  },
  {
    id: 'persona_friend',
    name: 'Juan (Amigo / Familiar)',
    phone: '3826507711',
    role: 'Contacto Personal',
    avatarBg: 'bg-slate-700',
    description: 'Prueba que el bot NO responda mensajes personales (Filtro Anti-Spam / Método 3).',
    isIgnored: true
  }
];

export interface TestSuite {
  id: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  steps: string[];
}

export const TEST_SUITES: TestSuite[] = [
  {
    id: 'suite_full_order',
    title: '🍬 Compra Completa con Gramajes',
    description: 'Moritas 250g + Ositos 100g + Domicilio + Cupón DULCE10 + Transferencia.',
    badge: 'Flujo Completo',
    badgeColor: 'bg-pink-100 text-pink-900 border-pink-200',
    steps: ['comprar', '1', '250g', '2', '100g', 'listo', '2', 'Castro Barros 245', 'Mariana Gómez', 'DULCE10', '1', 'si']
  },
  {
    id: 'suite_order_status',
    title: '📦 Consulta de Estado de Pedido',
    description: 'Verifica respuesta de seguimiento para cliente con pedido en preparación.',
    badge: 'Estado #1',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-200',
    steps: ['1']
  },
  {
    id: 'suite_invalid_weight',
    title: '⚖️ Validación de Gramajes Libres',
    description: 'Prueba pedir 10g (menor al mínimo) y 33g (no múltiplo de 25g) para verificar sugerencias.',
    badge: 'Validación',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
    steps: ['comprar', '1', '10g', '33g', '25g', 'listo']
  },
  {
    id: 'suite_coupon_test',
    title: '🎟️ Prueba de Cupón de Descuento',
    description: 'Aplica cupón DULCE10 con descuento automático en subtotal.',
    badge: 'Descuento',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    steps: ['comprar', '1', '500g', 'listo', '1', 'Mariana Gómez', 'DULCE10', '1', 'si']
  },
  {
    id: 'suite_cart_edit',
    title: '🛒 Gestión y Edición de Carrito',
    description: 'Prueba comandos CARRITO, QUITAR 1 y VACIAR en vivo.',
    badge: 'Carrito',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-200',
    steps: ['comprar', '1', '250g', '2', '500g', 'carrito', 'quitar 1', 'ver', 'listo']
  },
  {
    id: 'suite_antispam',
    title: '🛡️ Filtro Anti-Spam (Método 3)',
    description: 'Verifica que el bot no responda mensajes no comerciales.',
    badge: 'Filtro',
    badgeColor: 'bg-slate-100 text-slate-900 border-slate-200',
    steps: ['Hola pá, a qué hora nos juntamos hoy?']
  }
];

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

  // Main Section Navigation (Clean 4-Tab Studio Layout con Laboratorio de Pruebas)
  const [mainTab, setMainTab] = useState<'chatbot_studio' | 'test_lab' | 'order_notifications' | 'bot_security'>('chatbot_studio');

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
    send_product_images: true,
    allow_chat_orders: true,
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

  // Selected Option in Chatbot Studio
  const [selectedMenuNode, setSelectedMenuNode] = useState<string>('menu');

  // Selected Notification in Order Notifications Tab
  const [selectedNotifTab, setSelectedNotifTab] = useState<'new_order' | 'preparing' | 'ready' | 'shipped' | 'proof'>('new_order');

  // Interactive Live Phone Simulator State (Chatbot Studio)
  const [simulatedChatHistory, setSimulatedChatHistory] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string; image?: string }>>([
    {
      sender: 'bot',
      text: DEFAULT_TEMPLATES.template_menu.replace('{cliente}', 'Mariana'),
      time: '18:30'
    }
  ]);
  const [simInputText, setSimInputText] = useState('');

  // ==========================================
  // ESTADOS DEL LABORATORIO DE PRUEBAS & SANDBOX
  // ==========================================
  const [selectedPersona, setSelectedPersona] = useState<TestPersona>(TEST_PERSONAS[0]);
  const [sandboxMode, setSandboxMode] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<'fast' | 'normal' | 'human'>('normal');
  const [runningSuiteId, setRunningSuiteId] = useState<string | null>(null);
  const [currentSuiteStep, setCurrentSuiteStep] = useState<number>(0);
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false);
  const [labChatHistory, setLabChatHistory] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string; image?: string; isSystemNote?: boolean }>>([
    {
      sender: 'bot',
      text: DEFAULT_TEMPLATES.template_menu.replace('{cliente}', 'Mariana'),
      time: '18:30'
    }
  ]);
  const [labInputText, setLabInputText] = useState('');
  const [labSessionState, setLabSessionState] = useState<{
    step: 'IDLE' | 'SELECTING_PRODUCTS' | 'SELECTING_WEIGHT' | 'SELECTING_QUANTITY' | 'ASK_SHIPPING_METHOD' | 'ASK_ADDRESS' | 'ASK_NAME' | 'ASK_COUPON' | 'ASK_PAYMENT_METHOD' | 'CONFIRMING';
    items: Array<{ name: string; quantity: number; weightGrams?: number; unitPrice: number }>;
    subtotal: number;
    discountAmount: number;
    total: number;
    couponCode?: string;
    shippingMethod?: string;
    shippingAddress?: string;
    shippingName?: string;
    paymentMethod?: string;
  }>({
    step: 'IDLE',
    items: [],
    subtotal: 0,
    discountAmount: 0,
    total: 0
  });

  // New Custom Option Form
  const [newOptNumber, setNewOptNumber] = useState('6');
  const [newOptTitle, setNewOptTitle] = useState('');
  const [newOptKeywords, setNewOptKeywords] = useState('');
  const [newOptResponse, setNewOptResponse] = useState('');
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);

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
          send_product_images: data.send_product_images ?? true,
          allow_chat_orders: data.allow_chat_orders ?? true,
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
      showAlert({ title: '¡Guardado!', message: 'Todos los cambios del chatbot y plantillas fueron guardados exitosamente.', type: 'success' });
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message || 'Error al guardar configuración', type: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddCustomOption = () => {
    if (!newOptTitle.trim() || !newOptResponse.trim()) {
      showAlert({ title: 'Campos incompletos', message: 'Ingresa un título y la respuesta que dará el bot.', type: 'warning' });
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
    setSelectedMenuNode(newOption.id);
    showAlert({ title: 'Opción Creada', message: `La opción "${newOption.title}" fue agregada al chatbot.`, type: 'success' });
  };

  const handleRemoveCustomOption = (id: string) => {
    const updated = (settings.custom_menu_options || []).filter((opt: any) => opt.id !== id);
    setSettings({ ...settings, custom_menu_options: updated });
    if (selectedMenuNode === id) {
      setSelectedMenuNode('menu');
    }
  };

  const handleRestoreDefaultTemplate = (nodeKey: string) => {
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

    const settingKey = keyMap[nodeKey];
    if (settingKey && (DEFAULT_TEMPLATES as any)[settingKey]) {
      setSettings({
        ...settings,
        [settingKey]: (DEFAULT_TEMPLATES as any)[settingKey]
      });
      showAlert({ title: 'Restaurado', message: 'Se restableció la plantilla a su valor de fábrica.', type: 'info' });
    }
  };

  const insertVariable = (variable: string, targetKey: string) => {
    setSettings((prev: any) => ({
      ...prev,
      [targetKey]: (prev[targetKey] || '') + variable
    }));
    setCopiedVar(variable);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  // Formatear texto con variables para simulador y preview
  const formatWithDummyData = (rawText: string) => {
    let text = rawText || '';
    const dummyData: Record<string, string> = {
      cliente: 'Mariana Gómez',
      pedido_id: 'A7F39C12',
      total: '4.850',
      productos: '• Gomitas Ácidas 250g - $1.800\n• Conitos Mogul 500g - $1.600\n• Caramelos Masticables Surtidos 250g - $1.450',
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

  // Interacción del Simulador en Vivo
  const handleSimulateSend = (userInput?: string) => {
    const textToSend = (userInput || simInputText).trim();
    if (!textToSend) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newHistory = [...simulatedChatHistory, { sender: 'user' as const, text: textToSend, time: timeNow }];

    // Determinar respuesta del bot
    const lower = textToSend.toLowerCase();
    let botReply = '';
    let botImage: string | undefined = undefined;

    if (lower === '1' && !simulatedChatHistory.some(m => m.text.includes('¿Qué cantidad querés llevar?') || m.text.includes('¿Cómo querés recibir') || m.text.includes('¿Cómo preferís abonar'))) {
      botReply = formatWithDummyData(settings.menu_response_1);
    } else if (lower === '2' && !simulatedChatHistory.some(m => m.text.includes('¿Qué cantidad querés llevar?') || m.text.includes('¿Cómo querés recibir') || m.text.includes('¿Cómo preferís abonar'))) {
      botReply = formatWithDummyData(settings.menu_response_2);
    } else if (lower === '3' && !simulatedChatHistory.some(m => m.text.includes('¿Qué cantidad querés llevar?') || m.text.includes('¿Cómo preferís abonar'))) {
      botReply = formatWithDummyData(settings.menu_response_3);
    } else if (lower === '4' && !simulatedChatHistory.some(m => m.text.includes('¿Qué cantidad querés llevar?'))) {
      botReply = formatWithDummyData(settings.menu_response_4);
      if (settings.send_product_images) {
        botImage = 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop&q=80';
      }
    } else if (lower === '5' && !simulatedChatHistory.some(m => m.text.includes('¿Qué cantidad querés llevar?'))) {
      botReply = formatWithDummyData(settings.menu_response_5);
    } else if (lower === 'comprar' || lower === 'pedir' || lower.includes('nuevo pedido') || lower === 'quiero comprar' || lower === 'quiero gomitas') {
      botReply = `🛍️ *¡Vamos a armar tu pedido de golosinas!* 🍬\n\n1️⃣ *Moritas Ácidas* — $12.000/kg (desde 25g)\n2️⃣ *Ositos Frutales* — $10.000/kg (desde 50g)\n3️⃣ *Chocolate Block 38g* — $950 por unidad\n4️⃣ *Súper Combo Gomitas 500g* — $5.400\n\n👉 *Respondé con el NÚMERO del producto (ej: 1, 2).*`;
      if (settings.send_product_images) {
        botImage = 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop&q=80';
      }
    } else if (lower === '1' || lower.includes('moritas')) {
      botReply = `🍬 *Moritas Ácidas* (Venta al peso) ⚖️\n💰 *Precio:* $12.000/kg • Mínimo: *25g* (Fraccionable de a *25g*)\n\n*¿Qué cantidad querés llevar?*\n1️⃣ *25g* — $300\n2️⃣ *50g* — $600\n3️⃣ *100g* — $1.200\n4️⃣ *250g* — $2.800\n5️⃣ *500g* — $5.400\n\n👉 *Respondé con el número (1 a 5)* o escribí tus gramos exactos (ej: *75g*, *150g*, *350g*).`;
    } else if (lower === '2' || lower.includes('ositos')) {
      botReply = `🍬 *Ositos Frutales* (Venta al peso) ⚖️\n💰 *Precio:* $10.000/kg • Mínimo: *50g* (Fraccionable de a *50g*)\n\n*¿Qué cantidad querés llevar?*\n1️⃣ *50g* — $500\n2️⃣ *100g* — $1.000\n3️⃣ *250g* — $2.500\n4️⃣ *500g* — $5.000\n5️⃣ *1 Kilo (1000g)* — $9.500\n\n👉 *Respondé con el número (1 a 5)* o escribí tus gramos exactos (ej: *150g*, *300g*).`;
    } else if (lower.includes('25g') || lower.includes('50g') || lower.includes('100g') || lower.includes('250g') || lower.includes('500g') || lower.includes('75g') || lower.includes('150g')) {
      const grams = lower.includes('25g') ? '25g' : lower.includes('75g') ? '75g' : lower.includes('50g') ? '50g' : lower.includes('100g') ? '100g' : lower.includes('250g') ? '250g' : lower.includes('500g') ? '500g' : '150g';
      const price = grams === '25g' ? '300' : grams === '75g' ? '900' : grams === '50g' ? '600' : grams === '100g' ? '1.200' : grams === '250g' ? '2.800' : grams === '500g' ? '5.400' : '1.800';
      botReply = `✅ *¡Agregaste Moritas Ácidas (${grams}) por \$${price}!* 🍬\n\n🛒 *Tu carrito actual:*\n• Moritas Ácidas (${grams}) - \$${price}\n\n💰 *Subtotal:* \$${price}\n\n👉 ¿Querés agregar otro producto? *(Escribí su número)*\n👉 O escribí *LISTO* para continuar y confirmar tu pedido.`;
    } else if (lower === 'listo' || lower === 'finalizar' || lower === 'pagar') {
      botReply = `🛵 *¿Cómo querés recibir tu pedido?*\n\nRespondé con el número de opción:\n1️⃣ *Retiro por el local (Chamical)* — Sin costo\n2️⃣ *Envío a domicilio con cadete (Chamical)*`;
    } else if (lower.includes('retiro') || lower.includes('local') || lower.includes('domicilio') || lower.includes('cadete')) {
      botReply = `🎟️ *¿Tenés algún Cupón de Descuento?*\n\n👉 Escribí el código de tu cupón (ej: *DULCE10*) o respondé *NO* para continuar sin cupón.`;
    } else if (lower === 'dulce10') {
      botReply = `🎉 *¡Cupón DULCE10 aplicado con éxito!* Descuento: -$300 ✨\n\n💳 *¿Cómo preferís abonar tu pedido?*\n\nRespondé con el número:\n1️⃣ *Transferencia Bancaria* (Alias / CBU)\n2️⃣ *Efectivo contra entrega* (Al retirar o recibir)\n3️⃣ *Mercado Pago* (Link directo de pago)`;
    } else if (lower === 'no' || lower === 'ninguno' || lower === 'paso') {
      botReply = `💳 *¿Cómo preferís abonar tu pedido?*\n\nRespondé con el número:\n1️⃣ *Transferencia Bancaria* (Alias / CBU)\n2️⃣ *Efectivo contra entrega* (Al retirar o recibir)\n3️⃣ *Mercado Pago* (Link directo de pago)`;
    } else if (lower.includes('transferencia') || lower.includes('efectivo') || lower.includes('mercadopago') || lower === '1' || lower === '2' || lower === '3') {
      const payLabel = lower.includes('efectivo') || lower === '2' ? '💵 Efectivo contra entrega' : '🏦 Transferencia Bancaria';
      botReply = `🍬 *RESUMEN DE TU PEDIDO* 🍭\n\n🛒 *Golosinas:*\n• Moritas Ácidas (250g) - $2.800\n\n💵 *Subtotal:* $2.800\n🎟️ *Cupón (DULCE10):* -$300\n🛵 *Entrega:* 🏠 Retiro en Local (Chamical)\n👤 *Cliente:* Mariana Gómez\n💳 *Forma de Pago:* ${payLabel}\n\n💰 *TOTAL A PAGAR:* $2.500\n\n¿Está todo correcto?\n👉 Respondé *SI* para confirmar tu pedido o *CANCELAR*.`;
    } else if (lower === 'si' || lower === 'confirmar' || lower === 'dale' || lower === 'sí') {
      botReply = `🎉 *¡PEDIDO #A7F39C12 REGISTRADO CON ÉXITO!* 🍬\n\nMuchas gracias *Mariana Gómez*, tu pedido ya fue cargado automáticamente.\n\n📦 *Detalle:* Moritas Ácidas (250g)\n💰 *Total:* $2.500\n📍 *Entrega:* Retiro en Local (Castro Barros 245, Chamical)\n\n🏦 *Datos Transferencia:*\n• *Alias:* \`${settings.menu_response_2?.includes('martinchox33') ? 'martinchox33' : 'CHAMICAL.CANDY.SHOP'}\`\n• *Banco:* MercadoPago\n\n📸 *Enviá el comprobante por acá para comenzar a preparar tus golosinas.* ✨`;
    } else if (lower === 'carrito' || lower === 'ver carrito' || lower === 'ver') {
      botReply = `🛒 *TU CARRITO ACTUAL:* 🍬\n\n1️⃣ Moritas Ácidas (250g) - $2.800\n\n💰 *Subtotal:* $2.800\n\n👉 Para sumar más productos, escribí su número.\n👉 Escribí *LISTO* para avanzar con la entrega y el pago.`;
    } else {
      // Buscar en opciones personalizadas
      const customMatch = (settings.custom_menu_options || []).find((opt: any) => 
        lower === String(opt.option_number).toLowerCase() || (opt.keywords || []).some((k: string) => lower.includes(k.toLowerCase()))
      );

      if (customMatch) {
        botReply = formatWithDummyData(customMatch.response);
      } else {
        botReply = formatWithDummyData(settings.template_menu);
      }
    }

    setTimeout(() => {
      setSimulatedChatHistory([
        ...newHistory,
        {
          sender: 'bot',
          text: botReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          image: botImage
        }
      ]);
    }, 400);

    setSimulatedChatHistory(newHistory);
    setSimInputText('');
  };

  const handleResetSimulator = () => {
    setSimulatedChatHistory([
      {
        sender: 'bot',
        text: formatWithDummyData(settings.template_menu),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // =========================================================================
  // MOTOR DE CÓMPUTO Y EJECUCIÓN DEL LABORATORIO DE PRUEBAS & SANDBOX
  // =========================================================================
  const computeBotLabResponse = (
    userInput: string,
    prevState: any,
    persona: TestPersona,
    botSettings: any
  ): { reply: string; image?: string; newState: any; systemNote?: boolean } => {
    const text = (userInput || '').trim();
    const lower = text.toLowerCase();
    let newState = { ...prevState, items: [...(prevState.items || [])] };
    let reply = '';
    let image: string | undefined = undefined;
    let systemNote = false;

    // 1. Filtro Anti-Spam (Método 3) o Persona Ignorada
    if (persona.isIgnored || (botSettings.require_keywords_for_chatbot && (lower.includes('almorzar') || lower.includes('hola pá') || lower.includes('nos vemos') || lower.includes('amigo') || lower.includes('che')))) {
      const hasKeyword = (botSettings.chatbot_keywords || DEFAULT_CHATBOT_KEYWORDS).some((kw: string) => lower.includes(kw.toLowerCase()));
      if (!hasKeyword) {
        return {
          reply: `🔇 *[BOT SILENCIOSO - FILTRO ANTI-SPAM]*\nEl mensaje de "${persona.name}" no contiene palabras clave de la tienda. El bot no interrumpe la conversación personal.`,
          newState,
          systemNote: true
        };
      }
    }

    // 2. Simulación de Comprobante de Pago
    if (text.includes('[ENVIAR FOTO COMPROBANTE]') || (text.includes('comprobante') && text.includes('foto'))) {
      image = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80';
      reply = botSettings.template_payment_proof
        ? formatWithDummyData(botSettings.template_payment_proof).replace('Mariana Gómez', persona.name)
        : `📸 *¡Comprobante de pago recibido!* ✨\nMuchas gracias *${persona.name}*, ya estamos verificando la acreditación para despachar tu pedido.`;
      return { reply, image, newState };
    }

    // 3. Consulta de Estado de Pedido
    if ((lower === '1' || lower.includes('estado') || lower.includes('como va')) && newState.step === 'IDLE') {
      if (persona.hasActiveOrder) {
        reply = `👨‍🍳 *¡Hola ${persona.name}! Tu pedido #${persona.activeOrderId || 'A7F39C12'} está EN PREPARACIÓN.*\n\nNuestros expertos están armando tu bolsita de golosinas. ¡Te avisaremos apenas esté listo para retirar! ✨`;
      } else {
        reply = `📦 *Estado de Pedidos:*\nNo encontramos pedidos pendientes para tu número (*${persona.phone}*).\n\n👉 Para armar un pedido nuevo, escribí *COMPRAR*.`;
      }
      return { reply, newState };
    }

    // 4. Cancelar
    if (lower === 'cancelar' || lower === 'salir') {
      newState = { step: 'IDLE', items: [], subtotal: 0, discountAmount: 0, total: 0 };
      reply = `❌ *Proceso de compra cancelado.* ¿En qué más podemos ayudarte?\n\n` + formatWithDummyData(botSettings.template_menu).replace('Mariana Gómez', persona.name);
      return { reply, newState };
    }

    // 5. Carrito: Ver / Vaciar / Quitar
    if (lower === 'carrito' || lower === 'ver carrito' || lower === 'ver') {
      if (newState.items.length === 0) {
        reply = '🛒 Tu carrito está vacío. Escribí *COMPRAR* para ver nuestras golosinas.';
      } else {
        const list = newState.items.map((it: any, idx: number) => `${idx + 1}️⃣ ${it.name} - \$${it.unitPrice.toLocaleString('es-AR')}`).join('\n');
        reply = `🛒 *TU CARRITO ACTUAL:* 🍬\n\n${list}\n\n💰 *Subtotal:* \$${newState.subtotal.toLocaleString('es-AR')}\n\n👉 Para sumar más, escribí su número.\n👉 Para quitar, escribí *QUITAR [nro]*.\n👉 O escribí *LISTO* para avanzar con la entrega.`;
      }
      return { reply, newState };
    }

    if (lower === 'vaciar' || lower === 'borrar carrito') {
      newState.items = [];
      newState.subtotal = 0;
      newState.total = 0;
      newState.step = 'SELECTING_PRODUCTS';
      reply = '🗑️ *Vaciaste tu carrito.* Podés elegir nuevos productos de la lista escribiendo su *NÚMERO*.';
      return { reply, newState };
    }

    if (lower.startsWith('quitar') || lower.startsWith('eliminar')) {
      const num = parseInt(lower.replace(/\D/g, ''), 10);
      if (!isNaN(num) && num >= 1 && num <= newState.items.length) {
        const removed = newState.items.splice(num - 1, 1)[0];
        newState.subtotal = newState.items.reduce((s: number, it: any) => s + it.unitPrice, 0);
        newState.total = Math.max(0, newState.subtotal - (newState.discountAmount || 0));
        const list = newState.items.map((it: any, idx: number) => `${idx + 1}️⃣ ${it.name} - \$${it.unitPrice.toLocaleString('es-AR')}`).join('\n');
        reply = `🗑️ Quitaste *${removed.name}*.\n\n🛒 *Carrito restante:*\n${list || 'Vacío'}\n\n💰 *Total:* \$${newState.total.toLocaleString('es-AR')}\n\n👉 Escribí otro número o escribí *LISTO* para finalizar.`;
      } else {
        reply = '⚠️ Para quitar un producto escribí *QUITAR 1* o el número correspondiente.';
      }
      return { reply, newState };
    }

    // 6. Iniciar Compra
    if (lower === 'comprar' || lower === 'pedir' || lower.includes('nuevo pedido') || lower === 'quiero comprar' || lower === 'quiero gomitas') {
      newState.step = 'SELECTING_PRODUCTS';
      newState.items = [];
      newState.subtotal = 0;
      newState.discountAmount = 0;
      newState.total = 0;
      reply = `🛍️ *¡Vamos a armar tu pedido de golosinas!* 🍬\n\n1️⃣ *Moritas Ácidas* — \$12.000/kg (desde 25g)\n2️⃣ *Ositos Frutales* — \$10.000/kg (desde 50g)\n3️⃣ *Chocolate Block 38g* — \$950 por unidad\n4️⃣ *Súper Combo Gomitas 500g* — \$5.400\n\n👉 *Respondé con el NÚMERO del producto (ej: 1, 2).*`;
      if (botSettings.send_product_images) {
        image = 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop&q=80';
      }
      return { reply, image, newState };
    }

    // 7. Selección de Producto
    if (newState.step === 'SELECTING_PRODUCTS') {
      if (lower === '1' || lower.includes('moritas')) {
        newState.step = 'SELECTING_WEIGHT';
        reply = `🍬 *Moritas Ácidas* (Venta al peso) ⚖️\n💰 *Precio:* \$12.000/kg • Mínimo: *25g* (Fraccionable de a *25g*)\n\n*¿Qué cantidad querés llevar?*\n1️⃣ *25g* — \$300\n2️⃣ *50g* — \$600\n3️⃣ *100g* — \$1.200\n4️⃣ *250g* — \$2.800\n5️⃣ *500g* — \$5.400\n\n👉 *Respondé con el número (1 a 5)* o escribí tus gramos exactos (ej: *75g*, *150g*, *350g*).`;
        return { reply, newState };
      } else if (lower === '2' || lower.includes('ositos')) {
        newState.step = 'SELECTING_WEIGHT';
        reply = `🍬 *Ositos Frutales* (Venta al peso) ⚖️\n💰 *Precio:* \$10.000/kg • Mínimo: *50g* (Fraccionable de a *50g*)\n\n*¿Qué cantidad querés llevar?*\n1️⃣ *50g* — \$500\n2️⃣ *100g* — \$1.000\n3️⃣ *250g* — \$2.500\n4️⃣ *500g* — \$5.000\n5️⃣ *1 Kilo (1000g)* — \$9.500\n\n👉 *Respondé con el número (1 a 5)* o escribí tus gramos exactos (ej: *150g*, *300g*).`;
        return { reply, newState };
      } else if (lower === 'listo' || lower === 'finalizar' || lower === 'pagar') {
        if (newState.items.length === 0) {
          reply = '⚠️ Tu carrito está vacío. Escribí el *NÚMERO* del producto que querés agregar.';
          return { reply, newState };
        }
        newState.step = 'ASK_SHIPPING_METHOD';
        reply = `🛵 *¿Cómo querés recibir tu pedido?*\n\nRespondé con el número de opción:\n1️⃣ *Retiro por el local (Chamical)* — Sin costo\n2️⃣ *Envío a domicilio con cadete (Chamical)*`;
        return { reply, newState };
      }
    }

    // 8. Selección de Gramaje
    if (newState.step === 'SELECTING_WEIGHT') {
      if (lower === '10g' || lower === '15g') {
        reply = `⚠️ La cantidad mínima de compra para Moritas es de *25g* (\$300).\n\n👉 Respondé *1* para llevar 25g o escribí otra cantidad superior a 25g.`;
        return { reply, newState };
      }
      if (lower === '33g') {
        reply = `⚠️ Moritas se fracciona en pasos de *25g*.\n\n¿Te preparamos:\n1️⃣ *25g* (\$300)\n2️⃣ *50g* (\$600)?\n\n👉 Respondé 1 o 2.`;
        return { reply, newState };
      }

      let grams = 250;
      let price = 2800;
      let prodName = 'Moritas Ácidas';

      if (lower === '1' || lower === '25g') { grams = 25; price = 300; }
      else if (lower === '2' || lower === '50g') { grams = 50; price = 600; }
      else if (lower === '3' || lower === '100g') { grams = 100; price = 1200; }
      else if (lower === '4' || lower === '250g') { grams = 250; price = 2800; }
      else if (lower === '5' || lower === '500g') { grams = 500; price = 5400; }
      else if (lower === '75g') { grams = 75; price = 900; }
      else if (lower === '150g') { grams = 150; price = 1800; }

      const formattedItemName = `${prodName} (${grams}g)`;
      newState.items.push({ name: formattedItemName, quantity: 1, weightGrams: grams, unitPrice: price });
      newState.subtotal = newState.items.reduce((s: number, it: any) => s + it.unitPrice, 0);
      newState.total = Math.max(0, newState.subtotal - (newState.discountAmount || 0));
      newState.step = 'SELECTING_PRODUCTS';

      const itemsList = newState.items.map((i: any) => `• ${i.name} - \$${i.unitPrice.toLocaleString('es-AR')}`).join('\n');
      reply = `✅ *¡Agregaste ${formattedItemName}!* 🍬 (+\$${price.toLocaleString('es-AR')})\n\n🛒 *Tu carrito actual:*\n${itemsList}\n\n💰 *Subtotal:* \$${newState.subtotal.toLocaleString('es-AR')}\n\n👉 ¿Querés agregar otro producto? *(Escribí su número)*\n👉 O escribí *LISTO* para continuar y confirmar tu pedido.`;
      return { reply, newState };
    }

    // 9. Método de Envío
    if (newState.step === 'ASK_SHIPPING_METHOD') {
      if (lower === '1' || lower.includes('retiro') || lower.includes('local')) {
        newState.shippingMethod = 'pickup';
        newState.shippingAddress = 'Retiro en Local (Castro Barros 245, Chamical)';
        newState.step = 'ASK_NAME';
        reply = '👤 *¿A nombre de quién registramos el pedido?* (Escribí tu nombre y apellido):';
        return { reply, newState };
      } else if (lower === '2' || lower.includes('envio') || lower.includes('domicilio') || lower.includes('cadete')) {
        newState.shippingMethod = 'delivery';
        newState.step = 'ASK_ADDRESS';
        reply = '📍 *Por favor escribí tu dirección de entrega y entrecalles en Chamical:*';
        return { reply, newState };
      }
    }

    // 10. Captura de Dirección
    if (newState.step === 'ASK_ADDRESS') {
      newState.shippingAddress = text;
      newState.step = 'ASK_NAME';
      reply = '👤 *¿A nombre de quién registramos el pedido?* (Escribí tu nombre y apellido):';
      return { reply, newState };
    }

    // 11. Captura de Nombre
    if (newState.step === 'ASK_NAME') {
      newState.shippingName = text || persona.name;
      newState.step = 'ASK_COUPON';
      reply = `🎟️ *¿Tenés algún Cupón de Descuento?*\n\n👉 Escribí el código de tu cupón (ej: *DULCE10*) o respondé *NO* para continuar sin cupón.`;
      return { reply, newState };
    }

    // 12. Captura de Cupón
    if (newState.step === 'ASK_COUPON') {
      if (lower === 'dulce10') {
        const discount = Math.min(newState.subtotal, 300);
        newState.couponCode = 'DULCE10';
        newState.discountAmount = discount;
        newState.total = Math.max(0, newState.subtotal - discount);
        newState.step = 'ASK_PAYMENT_METHOD';
        reply = `🎉 *¡Cupón DULCE10 aplicado con éxito!* Descuento: -\$300 ✨\n\n💳 *¿Cómo preferís abonar tu pedido?*\n\nRespondé con el número:\n1️⃣ *Transferencia Bancaria* (Alias / CBU)\n2️⃣ *Efectivo contra entrega* (Al retirar o recibir)\n3️⃣ *Mercado Pago* (Link directo de pago)`;
        return { reply, newState };
      } else {
        newState.step = 'ASK_PAYMENT_METHOD';
        reply = `💳 *¿Cómo preferís abonar tu pedido?*\n\nRespondé con el número:\n1️⃣ *Transferencia Bancaria* (Alias / CBU)\n2️⃣ *Efectivo contra entrega* (Al retirar o recibir)\n3️⃣ *Mercado Pago* (Link directo de pago)`;
        return { reply, newState };
      }
    }

    // 13. Método de Pago
    if (newState.step === 'ASK_PAYMENT_METHOD') {
      if (lower === '1' || lower.includes('transferencia') || lower.includes('alias')) {
        newState.paymentMethod = 'transfer';
      } else if (lower === '2' || lower.includes('efectivo') || lower.includes('cash')) {
        newState.paymentMethod = 'cash';
      } else {
        newState.paymentMethod = 'mercadopago';
      }

      newState.step = 'CONFIRMING';
      const itemsList = newState.items.map((i: any) => `• ${i.name} - \$${i.unitPrice.toLocaleString('es-AR')}`).join('\n');
      const payLabel = newState.paymentMethod === 'transfer' ? '🏦 Transferencia Bancaria' : newState.paymentMethod === 'cash' ? '💵 Efectivo contra entrega' : '💳 Mercado Pago';
      const shippingLabel = newState.shippingMethod === 'delivery' ? '🛵 Envío a Domicilio con cadete' : '🏠 Retiro en Local';

      let summaryText = `🍬 *RESUMEN DE TU PEDIDO* 🍭\n\n🛒 *Golosinas:*\n${itemsList}\n\n💵 *Subtotal:* \$${newState.subtotal.toLocaleString('es-AR')}`;
      if (newState.discountAmount > 0) {
        summaryText += `\n🎟️ *Cupón (${newState.couponCode}):* -\$${newState.discountAmount.toLocaleString('es-AR')}`;
      }
      summaryText += `\n🛵 *Entrega:* ${shippingLabel}\n📍 *Dirección:* ${newState.shippingAddress || 'Castro Barros 245'}\n👤 *Cliente:* ${newState.shippingName || persona.name}\n💳 *Forma de Pago:* ${payLabel}\n\n💰 *TOTAL A PAGAR:* \$${newState.total.toLocaleString('es-AR')}\n\n¿Está todo correcto?\n👉 Respondé *SI* para confirmar tu pedido o *CANCELAR*.`;

      reply = summaryText;
      return { reply, newState };
    }

    // 14. Confirmación Final
    if (newState.step === 'CONFIRMING') {
      if (lower === 'si' || lower === 'confirmar' || lower === 'dale' || lower === 'sí' || lower === 's') {
        const orderCode = 'CSC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const itemsList = newState.items.map((i: any) => `• ${i.name} - \$${i.unitPrice.toLocaleString('es-AR')}`).join('\n');
        
        let confirmMsg = `🎉 *¡PEDIDO #${orderCode} REGISTRADO CON ÉXITO!* 🍬\n\nMuchas gracias *${newState.shippingName || persona.name}*, tu pedido ya fue cargado.\n\n📦 *Detalle:*\n${itemsList}\n💰 *Total:* \$${newState.total.toLocaleString('es-AR')}\n📍 *Entrega:* ${newState.shippingAddress || 'Retiro en Local'}\n`;

        if (newState.paymentMethod === 'transfer') {
          confirmMsg += `\n🏦 *Datos para Transferencia:*\n• *Alias:* \`martinchox33\`\n• *Banco:* MercadoPago / Galicia\n• *Titular:* Gonzalez Martin Gustavo\n\n📸 *Enviá el comprobante de transferencia por acá para comenzar a preparar tus golosinas.* ✨`;
        } else if (newState.paymentMethod === 'cash') {
          confirmMsg += `\n💵 *Pago en Efectivo:* Abonás al recibir o retirar tu pedido. ¡Ya estamos preparando tus golosinas! ✨`;
        } else {
          confirmMsg += `\n💳 *Pago con Mercado Pago:* Podés transferir al Alias \`martinchox33\` o coordinar el link con nuestro asesor. ✨`;
        }

        newState.step = 'IDLE';
        reply = confirmMsg;
        return { reply, newState };
      } else {
        newState = { step: 'IDLE', items: [], subtotal: 0, discountAmount: 0, total: 0 };
        reply = '❌ Pedido cancelado. Escribí *MENU* para ver más opciones.';
        return { reply, newState };
      }
    }

    // Menú por defecto
    reply = formatWithDummyData(botSettings.template_menu).replace('Mariana Gómez', persona.name);
    return { reply, newState };
  };

  const handleLabSend = (userInput?: string, customImage?: string) => {
    const textToSend = (userInput || labInputText).trim();
    if (!textToSend && !customImage) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newHistory = [
      ...labChatHistory,
      {
        sender: 'user' as const,
        text: textToSend || '📸 [Comprobante enviado]',
        time: timeNow,
        image: customImage
      }
    ];

    setLabChatHistory(newHistory);
    setLabInputText('');
    setIsBotTyping(true);

    const delayMs = simulationSpeed === 'fast' ? 200 : simulationSpeed === 'human' ? 1200 : 450;

    setTimeout(() => {
      const { reply, image, newState, systemNote } = computeBotLabResponse(
        customImage ? '[ENVIAR FOTO COMPROBANTE]' : textToSend,
        labSessionState,
        selectedPersona,
        settings
      );

      setLabSessionState(newState);
      setIsBotTyping(false);

      if (reply) {
        setLabChatHistory([
          ...newHistory,
          {
            sender: 'bot',
            text: reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            image,
            isSystemNote: systemNote
          }
        ]);
      }
    }, delayMs);
  };

  const handleRunSuite = async (suite: TestSuite) => {
    if (runningSuiteId) return;
    setRunningSuiteId(suite.id);
    setCurrentSuiteStep(0);

    const initialTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let currentHistory: Array<{ sender: 'bot' | 'user'; text: string; time: string; image?: string; isSystemNote?: boolean }> = [
      {
        sender: 'bot',
        text: `🧪 *Ejecutando Suite de Pruebas: ${suite.title}* ⚡\nPersona: *${selectedPersona.name}* (${selectedPersona.role})\nSimulando ${suite.steps.length} interacciones...`,
        time: initialTime,
        isSystemNote: true
      }
    ];
    setLabChatHistory(currentHistory);

    let curState: typeof labSessionState = {
      step: 'IDLE',
      items: [],
      subtotal: 0,
      discountAmount: 0,
      total: 0
    };
    setLabSessionState(curState);

    const delayMs = simulationSpeed === 'fast' ? 300 : simulationSpeed === 'human' ? 1300 : 600;

    for (let i = 0; i < suite.steps.length; i++) {
      setCurrentSuiteStep(i + 1);
      const stepText = suite.steps[i];
      const stepTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      currentHistory = [...currentHistory, { sender: 'user', text: stepText, time: stepTime }];
      setLabChatHistory([...currentHistory]);
      setIsBotTyping(true);

      await new Promise(r => setTimeout(r, delayMs));

      const { reply, image, newState, systemNote } = computeBotLabResponse(stepText, curState, selectedPersona, settings);
      curState = newState;
      setLabSessionState({ ...curState });
      setIsBotTyping(false);

      if (reply) {
        currentHistory = [
          ...currentHistory,
          {
            sender: 'bot',
            text: reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            image,
            isSystemNote: systemNote
          }
        ];
        setLabChatHistory([...currentHistory]);
      }

      await new Promise(r => setTimeout(r, delayMs / 2));
    }

    setRunningSuiteId(null);
    showAlert({
      title: '¡Suite de Pruebas Exitosa!',
      message: `La suite "${suite.title}" finalizó sin errores para ${selectedPersona.name}.`,
      type: 'success'
    });
  };

  const handleResetLab = () => {
    setLabChatHistory([
      {
        sender: 'bot',
        text: formatWithDummyData(settings.template_menu).replace('Mariana Gómez', selectedPersona.name),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setLabSessionState({
      step: 'IDLE',
      items: [],
      subtotal: 0,
      discountAmount: 0,
      total: 0
    });
    setRunningSuiteId(null);
    setCurrentSuiteStep(0);
  };

  const handleInjectTimeout = () => {
    setLabSessionState({
      step: 'IDLE',
      items: [],
      subtotal: 0,
      discountAmount: 0,
      total: 0
    });
    setLabChatHistory(prev => [
      ...prev,
      {
        sender: 'bot',
        text: `⏱️ *[TIMEOUT DE SESIÓN]*: Han pasado 30 minutos de inactividad. La sesión de compra fue liberada automáticamente.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystemNote: true
      }
    ]);
  };

  const handleExportLabChat = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      persona: selectedPersona,
      history: labChatHistory,
      finalState: labSessionState,
      timestamp: new Date().toISOString()
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `csc_lab_test_${selectedPersona.id}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Ignored numbers & keyword handlers
  const handleAddIgnoredNumber = () => {
    const clean = newIgnoredPhone.replace(/\D/g, '');
    if (!clean || clean.length < 6) {
      showAlert({ title: 'Número incompleto', message: 'Ingresa un número válido (ej: 3826123456).', type: 'warning' });
      return;
    }
    const currentList: IgnoredNumber[] = Array.isArray(settings.ignored_numbers) ? settings.ignored_numbers : [];
    if (currentList.some((item) => String(item.phone || item).replace(/\D/g, '') === clean)) {
      showAlert({ title: 'Ya existe', message: 'Este número ya está en la lista de excluidos.', type: 'warning' });
      return;
    }
    const newItem: IgnoredNumber = {
      id: 'ign_' + Date.now(),
      phone: clean,
      label: newIgnoredLabel.trim() || 'Contacto Personal',
      created_at: new Date().toISOString()
    };
    setSettings({ ...settings, ignored_numbers: [newItem, ...currentList] });
    setNewIgnoredPhone('');
    setNewIgnoredLabel('');
  };

  const handleRemoveIgnoredNumber = (idOrPhone: string) => {
    const currentList: any[] = Array.isArray(settings.ignored_numbers) ? settings.ignored_numbers : [];
    const updated = currentList.filter((item) => {
      if (typeof item === 'string') return item !== idOrPhone;
      return item.id !== idOrPhone && item.phone !== idOrPhone;
    });
    setSettings({ ...settings, ignored_numbers: updated });
  };

  const handleAddKeyword = () => {
    const clean = newKeywordInput.trim().toLowerCase();
    if (!clean) return;
    const currentKw: string[] = Array.isArray(settings.chatbot_keywords) ? settings.chatbot_keywords : DEFAULT_CHATBOT_KEYWORDS;
    if (currentKw.includes(clean)) {
      setNewKeywordInput('');
      return;
    }
    setSettings({ ...settings, chatbot_keywords: [...currentKw, clean] });
    setNewKeywordInput('');
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    const currentKw: string[] = Array.isArray(settings.chatbot_keywords) ? settings.chatbot_keywords : DEFAULT_CHATBOT_KEYWORDS;
    setSettings({ ...settings, chatbot_keywords: currentKw.filter((k) => k !== kwToRemove) });
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

  const filteredIgnoredNumbers = (Array.isArray(settings.ignored_numbers) ? settings.ignored_numbers : []).filter((item: any) => {
    const q = searchIgnored.toLowerCase();
    const phone = typeof item === 'string' ? item : item.phone;
    const label = typeof item === 'string' ? '' : (item.label || '');
    return phone.includes(q) || label.toLowerCase().includes(q);
  });

  // Lista de Nodos del Menú para la barra lateral izquierda
  const standardMenuNodes = [
    { id: 'menu', num: '📋', title: 'Menú Principal (Bienvenida)', desc: 'Mensaje que recibe el cliente al iniciar', field: 'template_menu' },
    { id: 'option_1', num: '1', title: 'Opción 1: Estado del Pedido', desc: 'Respuesta con ID, estado y total', field: 'menu_response_1' },
    { id: 'option_2', num: '2', title: 'Opción 2: Datos Bancarios', desc: 'Respuesta con Alias, Banco y CBU', field: 'menu_response_2' },
    { id: 'option_3', num: '3', title: 'Opción 3: Horarios y Local', desc: 'Dirección física y horarios de atención', field: 'menu_response_3' },
    { id: 'option_4', num: '4', title: 'Opción 4: Catálogo Online', desc: 'Enlace a la tienda web para comprar', field: 'menu_response_4' },
    { id: 'option_5', num: '5', title: 'Opción 5: Asesor Humano', desc: 'Mensaje de derivación al equipo', field: 'menu_response_5' },
  ];

  const customOptionObj = (settings.custom_menu_options || []).find((opt: any) => opt.id === selectedMenuNode);
  const activeStandardNode = standardMenuNodes.find(n => n.id === selectedMenuNode);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* BARRA SUPERIOR: ESTADO DEL BOT Y NAVEGACIÓN STUDIO */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-green-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">WhatsApp Bot & Chatbot Studio</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                status === 'connected' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                status === 'qr_ready' ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' :
                'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {status === 'connected' ? '🟢 Conectado' : status === 'qr_ready' ? '🟡 Esperando QR' : '⚪ Desconectado'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Automatiza la atención a clientes, responde opciones y notifica pedidos en tiempo real.
            </p>
          </div>
        </div>

        {/* NAVEGADOR PRINCIPAL EN PESTAÑAS (STUDIO) */}
        <div className="flex items-center bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 w-full lg:w-auto overflow-x-auto">
          <button
            onClick={() => setMainTab('chatbot_studio')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              mainTab === 'chatbot_studio'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>🤖 Menú & Chatbot</span>
          </button>

          <button
            onClick={() => setMainTab('test_lab')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              mainTab === 'test_lab'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>🧪 Laboratorio & Sandbox</span>
          </button>

          <button
            onClick={() => setMainTab('order_notifications')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              mainTab === 'order_notifications'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>🔔 Notificaciones Pedidos</span>
          </button>

          <button
            onClick={() => setMainTab('bot_security')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              mainTab === 'bot_security'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>🛡️ Conexión & Filtros</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA: LABORATORIO DE PRUEBAS & SANDBOX DE WHATSAPP */}
      {/* ========================================================================= */}
      {mainTab === 'test_lab' && (
        <div className="space-y-6">
          
          {/* Barra Superior de Control del Laboratorio */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Laboratorio de Pruebas & Sandbox de WhatsApp</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sandboxMode ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {sandboxMode ? '🟣 Modo Sandbox (En Memoria)' : '🟢 Modo DB Test (Pedidos Reales)'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Simulá compras, gramajes libres (25g, 50g, 75g), cupones y filtros anti-spam sin necesidad de un segundo teléfono.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Selector de Velocidad */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-700">
                <span className="text-[10px] text-slate-400 px-2">Velocidad:</span>
                <button
                  type="button"
                  onClick={() => setSimulationSpeed('fast')}
                  className={`px-2 py-1 rounded-lg transition-all ${simulationSpeed === 'fast' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'}`}
                >
                  ⚡ Rápida
                </button>
                <button
                  type="button"
                  onClick={() => setSimulationSpeed('normal')}
                  className={`px-2 py-1 rounded-lg transition-all ${simulationSpeed === 'normal' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'}`}
                >
                  ⏱️ Normal
                </button>
                <button
                  type="button"
                  onClick={() => setSimulationSpeed('human')}
                  className={`px-2 py-1 rounded-lg transition-all ${simulationSpeed === 'human' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'}`}
                >
                  ⏳ Humana (1.2s)
                </button>
              </div>

              {/* Botón Exportar JSON */}
              <button
                type="button"
                onClick={handleExportLabChat}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Descargar historial de prueba en JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar JSON</span>
              </button>

              {/* Botón Reset */}
              <button
                type="button"
                onClick={handleResetLab}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar</span>
              </button>
            </div>
          </div>

          {/* Grid Principal de 3 Columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUMNA 1 (4 COLS): PERFILES DE CLIENTE & SUITES AUTOMATIZADAS */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Tarjeta 1: Perfiles de Cliente */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span>1. Perfil de Cliente Simulado</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">4 Perfiles</span>
                </div>

                <div className="space-y-2">
                  {TEST_PERSONAS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPersona(p);
                        setLabChatHistory([
                          {
                            sender: 'bot',
                            text: formatWithDummyData(settings.template_menu).replace('Mariana Gómez', p.name),
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          }
                        ]);
                        setLabSessionState({
                          step: 'IDLE',
                          items: [],
                          subtotal: 0,
                          discountAmount: 0,
                          total: 0
                        });
                      }}
                      className={`w-full p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                        selectedPersona.id === p.id
                          ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-400 shadow-sm'
                          : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-8 h-8 rounded-xl ${p.avatarBg} text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs`}>
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{p.name}</p>
                            <p className="text-[10px] font-mono text-slate-500">📱 {p.phone}</p>
                          </div>
                        </div>
                        {selectedPersona.id === p.id ? (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-purple-700 text-white">
                            {p.role}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-200 text-slate-800">
                            {p.role}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">
                        {p.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tarjeta 2: Suites de Pruebas Automatizadas */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>2. Suites de Pruebas (1-Clic)</span>
                  </h3>
                  {runningSuiteId && (
                    <span className="text-[10px] font-bold text-purple-600 animate-pulse">
                      Paso {currentSuiteStep} en curso...
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  {TEST_SUITES.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between gap-2.5"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-slate-900">{s.title}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${s.badgeColor}`}>
                            {s.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          {s.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={!!runningSuiteId}
                        onClick={() => handleRunSuite(s)}
                        className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{runningSuiteId === s.id ? 'Ejecutando Suite...' : 'Ejecutar Suite'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMNA 2 (4 COLS): SMARTPHONE WHATSAPP SIMULADO */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="w-full max-w-[340px] bg-slate-900 p-3.5 rounded-[44px] shadow-2xl border-4 border-slate-800 relative">
                {/* Altavoz y Notch */}
                <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-2 flex items-center justify-center space-x-1.5">
                  <div className="w-8 h-1 bg-slate-700 rounded-full" />
                  <div className="w-2 h-2 bg-slate-800 rounded-full" />
                </div>

                {/* Pantalla del Celular */}
                <div className="bg-[#efeae2] rounded-[32px] overflow-hidden flex flex-col h-[540px] border border-slate-700 shadow-inner">
                  
                  {/* Top Bar de WhatsApp */}
                  <div className="bg-[#075e54] text-white p-2.5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className={`w-7 h-7 rounded-full ${selectedPersona.avatarBg} text-white flex items-center justify-center text-[10px] font-bold`}>
                        {selectedPersona.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight truncate max-w-[120px]">{selectedPersona.name}</p>
                        <p className="text-[9px] text-emerald-200">
                          {isBotTyping ? 'escribiendo...' : 'en línea'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-emerald-100">
                      <PhoneCall className="w-3.5 h-3.5" />
                      <MoreVertical className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Feed de Mensajes */}
                  <div className="flex-1 p-2.5 overflow-y-auto space-y-2 text-xs">
                    {labChatHistory.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.isSystemNote ? 'justify-center' : msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.isSystemNote ? (
                          <div className="bg-amber-100 text-amber-900 border border-amber-300 p-2 rounded-xl text-[10px] text-center max-w-[90%] leading-tight font-sans">
                            {msg.text}
                          </div>
                        ) : (
                          <div
                            className={`p-2.5 rounded-2xl shadow-xs max-w-[85%] text-slate-900 leading-relaxed font-sans ${
                              msg.sender === 'user'
                                ? 'bg-[#d9fdd3] rounded-tr-none border border-emerald-100 ml-auto'
                                : 'bg-white rounded-tl-none border border-slate-100'
                            }`}
                          >
                            {msg.image && (
                              <img
                                src={msg.image}
                                alt="Adjunto"
                                className="w-full h-24 object-cover rounded-xl mb-1.5 border border-slate-200"
                              />
                            )}
                            <p className="whitespace-pre-wrap text-[11px]">{msg.text}</p>
                            <div className={`mt-0.5 flex items-center justify-end space-x-1 text-[8px] ${
                              msg.sender === 'user' ? 'text-emerald-800' : 'text-slate-400'
                            }`}>
                              <span>{msg.time}</span>
                              {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-sky-500 inline" />}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {isBotTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white p-2 rounded-xl shadow-xs border border-slate-100 flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse opacity-75" />
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse opacity-50" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chips Rápidos */}
                  <div className="px-2 py-1.5 bg-slate-200/90 border-t border-slate-300 space-y-1">
                    <div className="flex gap-1 overflow-x-auto scrollbar-none">
                      <button
                        type="button"
                        onClick={() => handleLabSend('comprar')}
                        className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        🛒 Comprar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLabSend('1')}
                        className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-[10px] font-bold shrink-0 shadow-xs border border-slate-300 cursor-pointer"
                      >
                        🍬 1. Moritas
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLabSend('25g')}
                        className="px-2 py-0.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        ⚖️ 25g
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLabSend('50g')}
                        className="px-2 py-0.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        ⚖️ 50g
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLabSend('100g')}
                        className="px-2 py-0.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        ⚖️ 100g
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLabSend('250g')}
                        className="px-2 py-0.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        ⚖️ 250g
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLabSend('75g')}
                        className="px-2 py-0.5 bg-pink-700 hover:bg-pink-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        ✨ 75g lib.
                      </button>
                    </div>

                    <div className="flex gap-1 overflow-x-auto scrollbar-none">
                      <button
                        type="button"
                        onClick={() => handleLabSend('listo')}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        🛵 Listo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLabSend('dulce10')}
                        className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        🎟️ DULCE10
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLabSend('transferencia')}
                        className="px-2 py-0.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        🏦 Transf.
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLabSend('si')}
                        className="px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        👍 Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLabSend('', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80')}
                        className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                        title="Simular envío de foto de comprobante"
                      >
                        📸 Comprobante
                      </button>
                    </div>
                  </div>

                  {/* Input Footer */}
                  <div className="p-2 bg-white flex items-center space-x-1.5 border-t border-slate-200">
                    <input
                      type="text"
                      placeholder={`Escribir como ${selectedPersona.name.split(' ')[0]}...`}
                      value={labInputText}
                      onChange={(e) => setLabInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLabSend()}
                      className="flex-1 px-3 py-1.5 bg-slate-100 rounded-full text-[11px] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleLabSend()}
                      className="w-7 h-7 rounded-full bg-[#075e54] text-white flex items-center justify-center cursor-pointer hover:bg-[#128c7e]"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMNA 3 (4 COLS): INSPECTOR DE ESTADO EN VIVO (DEBUGGER & SESSION INSPECTOR) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Tarjeta: Estado Interno del Bot */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-purple-600" />
                    <span>3. Inspector de Sesión en Vivo</span>
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    labSessionState.step === 'IDLE' ? 'bg-slate-100 text-slate-700' :
                    labSessionState.step === 'SELECTING_PRODUCTS' ? 'bg-blue-100 text-blue-800' :
                    labSessionState.step === 'SELECTING_WEIGHT' ? 'bg-purple-100 text-purple-800 animate-pulse' :
                    labSessionState.step === 'ASK_COUPON' ? 'bg-amber-100 text-amber-800' :
                    labSessionState.step === 'CONFIRMING' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-pink-100 text-pink-800'
                  }`}>
                    {labSessionState.step}
                  </span>
                </div>

                {/* Métricas de Carrito */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-[10px] text-slate-400 font-medium">Subtotal</p>
                    <p className="text-xs font-black text-slate-900">\${labSessionState.subtotal.toLocaleString('es-AR')}</p>
                  </div>
                  <div className="p-2.5 bg-amber-50 rounded-2xl border border-amber-200">
                    <p className="text-[10px] text-amber-700 font-medium">Descuento</p>
                    <p className="text-xs font-black text-amber-900">-\${labSessionState.discountAmount.toLocaleString('es-AR')}</p>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <p className="text-[10px] text-emerald-700 font-medium">Total</p>
                    <p className="text-xs font-black text-emerald-950">\${labSessionState.total.toLocaleString('es-AR')}</p>
                  </div>
                </div>

                {/* Tabla de Items en Carrito */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 block">Items en Carrito:</span>
                  {labSessionState.items.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-xl text-center text-slate-400 text-xs border border-dashed border-slate-200">
                      Carrito vacío (Paso IDLE)
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {labSessionState.items.map((it, idx) => (
                        <div key={idx} className="p-2 bg-slate-50 rounded-xl text-xs flex justify-between items-center border border-slate-200">
                          <span className="font-semibold text-slate-800 truncate max-w-[150px]">{it.name}</span>
                          <span className="font-mono font-bold text-purple-700">\${it.unitPrice.toLocaleString('es-AR')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Variables Resueltas */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[11px] font-bold text-slate-700 block">Variables Inyectadas:</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block">cliente:</span>
                      <span className="font-bold text-slate-800">{selectedPersona.name}</span>
                    </div>
                    <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block">telefono:</span>
                      <span className="font-bold text-slate-800">{selectedPersona.phone}</span>
                    </div>
                    <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block">cupon:</span>
                      <span className="font-bold text-slate-800">{labSessionState.couponCode || 'Ninguno'}</span>
                    </div>
                    <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block">medio_pago:</span>
                      <span className="font-bold text-slate-800">{labSessionState.paymentMethod || 'No definido'}</span>
                    </div>
                  </div>
                </div>

                {/* Acciones de Inyección */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700 block">Inyección de Eventos:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleInjectTimeout}
                      className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-[10px] font-bold cursor-pointer transition-colors text-center"
                    >
                      ⏱️ Simular Timeout 30m
                    </button>
                    <button
                      type="button"
                      onClick={() => setSandboxMode(!sandboxMode)}
                      className={`p-2 rounded-xl text-[10px] font-bold cursor-pointer transition-colors text-center border ${
                        sandboxMode ? 'bg-purple-50 text-purple-900 border-purple-200' : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      }`}
                    >
                      {sandboxMode ? '🟣 Sandbox Activo' : '🟢 Modo DB Test'}
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 1: CHATBOT STUDIO INTERACTIVO (SPLIT SCREEN IZQ: EDITOR / DER: CELULAR) */}
      {/* ========================================================================= */}
      {mainTab === 'chatbot_studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLUMNA IZQUIERDA (8 COLUMNAS): ÁRBOL DE OPCIONES + EDITOR ENFOCADO */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-4">
            
            {/* Header del Editor */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Configurador del Flujo de Conversación</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Selecciona una opción a la izquierda para editar su respuesta en tiempo real.
                  </p>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="flex items-center space-x-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingSettings ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>

              {/* Toggles Rápidos de Fotos y Venta Directa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                <label className="flex items-center justify-between p-2.5 bg-purple-50/60 rounded-xl border border-purple-100 cursor-pointer">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">📸</span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Fotos de Productos</p>
                      <p className="text-[10px] text-slate-500">Envía imagen al consultar catálogo</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.send_product_images}
                    onChange={(e) => setSettings({ ...settings, send_product_images: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded accent-purple-600"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 cursor-pointer">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">🛒</span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Venta por WhatsApp</p>
                      <p className="text-[10px] text-slate-500">Permite armar y registrar pedidos</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allow_chat_orders}
                    onChange={(e) => setSettings({ ...settings, allow_chat_orders: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded accent-emerald-600"
                  />
                </label>
              </div>

              {/* Selector Visual de Nodos / Opciones (Carrusel / Grid) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {standardMenuNodes.map((node) => {
                  const isSelected = selectedMenuNode === node.id;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setSelectedMenuNode(node.id)}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-1 relative overflow-hidden ${
                        isSelected 
                          ? 'bg-purple-50/90 border-purple-500 ring-2 ring-purple-300 shadow-sm' 
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={
                          isSelected 
                            ? 'w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs bg-purple-700 text-white' 
                            : 'w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-900 border border-slate-200'
                        }>
                          {node.num}
                        </span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 truncate">{node.title.replace(/Opción \d: /, '')}</p>
                        <p className="text-[10px] text-slate-500 truncate">{node.desc}</p>
                      </div>
                    </button>
                  );
                })}

                {/* Opciones Personalizadas */}
                {(settings.custom_menu_options || []).map((opt: CustomMenuOption) => {
                  const isSelected = selectedMenuNode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedMenuNode(opt.id)}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-1 relative overflow-hidden ${
                        isSelected 
                          ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-300 shadow-sm' 
                          : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                          {opt.option_number}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCustomOption(opt.id);
                          }}
                          className="text-slate-400 hover:text-red-500 p-0.5"
                          title="Eliminar opción"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 truncate">{opt.title}</p>
                        <p className="text-[10px] text-purple-600 font-semibold truncate">Personalizada</p>
                      </div>
                    </button>
                  );
                })}

                {/* Botón Añadir Opción */}
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(true)}
                  className="p-3 rounded-2xl text-center border border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/40 hover:bg-purple-50 transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 text-purple-700 font-bold text-xs"
                >
                  <Plus className="w-5 h-5 text-purple-600" />
                  <span>+ Nueva Opción</span>
                </button>
              </div>

              {/* MODAL PARA CREAR NUEVA OPCIÓN */}
              {showAddCustomModal && (
                <div className="p-4 bg-purple-50/90 border-2 border-purple-300 rounded-2xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>Crear Nueva Opción para el Menú</span>
                    </span>
                    <button onClick={() => setShowAddCustomModal(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">N° / Código</label>
                      <input
                        type="text"
                        placeholder="Ej: 6 o PROMO"
                        value={newOptNumber}
                        onChange={(e) => setNewOptNumber(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-purple-400 font-mono"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Título de la Opción</label>
                      <input
                        type="text"
                        placeholder="Ej: Promos y Combos"
                        value={newOptTitle}
                        onChange={(e) => setNewOptTitle(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Palabras Clave (por coma)</label>
                      <input
                        type="text"
                        placeholder="Ej: 6, promo, oferta, combo"
                        value={newOptKeywords}
                        onChange={(e) => setNewOptKeywords(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-400 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Respuesta Automática del Bot</label>
                    <textarea
                      rows={3}
                      placeholder="Escribe el mensaje que enviará el bot al escribir esta opción..."
                      value={newOptResponse}
                      onChange={(e) => setNewOptResponse(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddCustomModal(false)}
                      className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCustomOption}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                    >
                      Guardar y Añadir
                    </button>
                  </div>
                </div>
              )}

              {/* EDITOR DE TEXTO ENFOCADO DEL NODO SELECCIONADO */}
              <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-purple-600" />
                      <span>Editando: {activeStandardNode ? activeStandardNode.title : customOptionObj?.title}</span>
                    </span>
                  </div>

                  {activeStandardNode && (
                    <button
                      type="button"
                      onClick={() => handleRestoreDefaultTemplate(activeStandardNode.id)}
                      className="text-[11px] text-slate-500 hover:text-purple-700 flex items-center gap-1 font-semibold cursor-pointer transition-colors"
                      title="Restaurar a plantilla original"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restaurar original</span>
                    </button>
                  )}
                </div>

                {/* Variables Insertables con 1 Clic */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                    🏷️ Variables automáticas (toca para insertar):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { tag: '{cliente}', label: 'Nombre' },
                      { tag: '{pedido_id}', label: 'ID Pedido' },
                      { tag: '{total}', label: 'Total $' },
                      { tag: '{estado}', label: 'Estado' },
                      { tag: '{direccion}', label: 'Dirección' },
                      { tag: '{horarios}', label: 'Horarios' },
                      { tag: '{catalogo_url}', label: 'Link Catálogo' },
                      { tag: '{alias_banco}', label: 'Alias' },
                      { tag: '{banco}', label: 'Banco' },
                      { tag: '{titular}', label: 'Titular' },
                      { tag: '{cbu}', label: 'CBU' },
                    ].map((v) => (
                      <button
                        key={v.tag}
                        type="button"
                        onClick={() => {
                          const targetField = activeStandardNode ? activeStandardNode.field : 'response';
                          if (activeStandardNode) {
                            insertVariable(v.tag, targetField);
                          } else if (customOptionObj) {
                            const updated = (settings.custom_menu_options || []).map((o: any) => 
                              o.id === customOptionObj.id ? { ...o, response: (o.response || '') + v.tag } : o
                            );
                            setSettings({ ...settings, custom_menu_options: updated });
                          }
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-700 border border-purple-200/80 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
                      >
                        {v.tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea del Nodo */}
                <textarea
                  rows={8}
                  value={
                    activeStandardNode 
                      ? (settings[activeStandardNode.field] || '') 
                      : (customOptionObj?.response || '')
                  }
                  onChange={(e) => {
                    if (activeStandardNode) {
                      setSettings({ ...settings, [activeStandardNode.field]: e.target.value });
                    } else if (customOptionObj) {
                      const updated = (settings.custom_menu_options || []).map((o: any) => 
                        o.id === customOptionObj.id ? { ...o, response: e.target.value } : o
                      );
                      setSettings({ ...settings, custom_menu_options: updated });
                    }
                  }}
                  className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs font-mono leading-relaxed outline-none focus:ring-2 focus:ring-purple-400 text-slate-800 shadow-inner"
                  placeholder="Escribe aquí el contenido del mensaje que enviará el bot..."
                />
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA (5 COLUMNAS): SIMULADOR WHATSAPP MOCKUP REALISTA */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-3">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Simulador WhatsApp en Vivo</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetSimulator}
                  className="text-[10px] text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-semibold cursor-pointer"
                  title="Reiniciar chat"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reiniciar Chat</span>
                </button>
              </div>

              {/* CELULAR MOCKUP FRAME */}
              <div className="w-full max-w-[340px] mx-auto rounded-[38px] bg-slate-900 p-3 shadow-2xl border-4 border-slate-800">
                {/* Notch / Speaker */}
                <div className="w-28 h-4 bg-slate-950 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-slate-800 mr-2" />
                  <div className="w-10 h-1 bg-slate-800 rounded-full" />
                </div>

                {/* Pantalla del Teléfono */}
                <div className="rounded-[28px] overflow-hidden bg-[#efeae2] flex flex-col h-[520px] shadow-inner border border-slate-800/20">
                  
                  {/* WhatsApp Header */}
                  <div className="bg-[#075e54] text-white px-3 py-2.5 flex items-center justify-between shadow-md">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-400 to-amber-300 flex items-center justify-center text-sm font-bold shadow-xs">
                        🍬
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight">Chamical Candy Shop</p>
                        <p className="text-[9px] text-emerald-200">en línea (Bot Activo)</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-white/80">
                      <PhoneCall className="w-3.5 h-3.5" />
                      <MoreVertical className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Chat Messages Body */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-2.5 scrollbar-thin text-xs">
                    {simulatedChatHistory.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`p-2.5 rounded-2xl text-[11px] leading-relaxed whitespace-pre-wrap max-w-[88%] shadow-xs space-y-1.5 ${
                            msg.sender === 'user'
                              ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-none border border-emerald-200/50'
                              : 'bg-white text-slate-900 rounded-tl-none border border-slate-200/60'
                          }`}
                        >
                          {msg.image && (
                            <div className="rounded-xl overflow-hidden mb-1 border border-slate-100 shadow-xs">
                              <img src={msg.image} alt="Producto" className="w-full h-28 object-cover" />
                            </div>
                          )}
                          <div>{msg.text}</div>
                          <div className={`mt-0.5 flex items-center justify-end space-x-1 text-[8px] ${
                            msg.sender === 'user' ? 'text-emerald-800' : 'text-slate-400'
                          }`}>
                            <span>{msg.time}</span>
                            {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-sky-500 inline" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Botones de Respuesta Rápida para Probar con 1 Clic */}
                  <div className="px-2 py-1.5 bg-slate-200/90 border-t border-slate-300 space-y-1">
                    <div className="flex gap-1 overflow-x-auto scrollbar-none">
                      <button
                        type="button"
                        onClick={() => handleSimulateSend('comprar')}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        🛒 Comprar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateSend('1')}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-[10px] font-bold shrink-0 shadow-xs border border-slate-300 cursor-pointer"
                      >
                        🍬 1. Moritas
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateSend('2')}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-[10px] font-bold shrink-0 shadow-xs border border-slate-300 cursor-pointer"
                      >
                        🐻 2. Ositos
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateSend('25g')}
                        className="px-2 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        ⚖️ 25g
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateSend('50g')}
                        className="px-2 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        ⚖️ 50g
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateSend('100g')}
                        className="px-2 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        ⚖️ 100g
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateSend('250g')}
                        className="px-2 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        ⚖️ 250g
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateSend('500g')}
                        className="px-2 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        ⚖️ 500g
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateSend('75g')}
                        className="px-2 py-1 bg-pink-700 hover:bg-pink-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        ✨ 75g lib.
                      </button>
                    </div>

                    <div className="flex gap-1 overflow-x-auto scrollbar-none">
                      <button
                        type="button"
                        onClick={() => handleSimulateSend('listo')}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        🛵 Listo / Enviar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateSend('1')}
                        className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-[10px] font-bold shrink-0 shadow-xs border border-slate-300 cursor-pointer"
                      >
                        🏠 Retiro Local
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateSend('dulce10')}
                        className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        🎟️ DULCE10
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateSend('transferencia')}
                        className="px-2 py-0.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        🏦 Transf.
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateSend('efectivo')}
                        className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        💵 Efectivo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateSend('si')}
                        className="px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                      >
                        👍 Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateSend('carrito')}
                        className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-[10px] font-bold shrink-0 shadow-xs border border-slate-300 cursor-pointer"
                      >
                        🛒 Ver Carrito
                      </button>
                    </div>
                  </div>

                  {/* Input Footer */}
                  <div className="p-2 bg-white flex items-center space-x-1.5 border-t border-slate-200">
                    <input
                      type="text"
                      placeholder="Escribe 1, 2, menu..."
                      value={simInputText}
                      onChange={(e) => setSimInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSimulateSend()}
                      className="flex-1 px-3 py-1.5 bg-slate-100 rounded-full text-[11px] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSimulateSend()}
                      className="w-7 h-7 rounded-full bg-[#075e54] text-white flex items-center justify-center cursor-pointer hover:bg-[#128c7e]"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: NOTIFICACIONES AUTOMÁTICAS DE PEDIDOS */}
      {/* ========================================================================= */}
      {mainTab === 'order_notifications' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-purple-600" />
                <span>Mensajes Automáticos por Estado del Pedido</span>
              </h2>
              <p className="text-xs text-slate-500">
                Personaliza los mensajes que se envían cuando un cliente hace un pedido o cambia de estado.
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

          {/* Stepper de Estados */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'new_order', num: '1', title: '🛍️ Nuevo Pedido', field: 'template_new_order' },
              { id: 'preparing', num: '2', title: '👨‍🍳 En Preparación', field: 'template_order_preparing' },
              { id: 'ready', num: '3', title: '✨ Listo Retiro', field: 'template_order_ready' },
              { id: 'shipped', num: '4', title: '🛵 En Camino', field: 'template_order_shipped' },
              { id: 'proof', num: '5', title: '📸 Foto Comprobante', field: 'template_payment_proof' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedNotifTab(st.id as any)}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                  selectedNotifTab === st.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-200 border-purple-600 ring-2 ring-purple-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <p className="text-xs font-bold truncate">{st.title}</p>
                <p className={`text-[10px] ${selectedNotifTab === st.id ? 'text-purple-100' : 'text-slate-500'}`}>
                  Auto-WhatsApp
                </p>
              </button>
            ))}
          </div>

          {/* Editor y Preview de la Notificación Seleccionada */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Contenido del Mensaje Automático:
                </span>
                <button
                  type="button"
                  onClick={() => handleRestoreDefaultTemplate(selectedNotifTab)}
                  className="text-xs text-slate-500 hover:text-purple-700 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar plantilla</span>
                </button>
              </div>

              {/* Variables */}
              <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1.5">
                <span className="text-[10px] font-bold text-purple-900 uppercase">Variables disponibles:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { tag: '{cliente}', label: 'Nombre' },
                    { tag: '{pedido_id}', label: 'ID Pedido' },
                    { tag: '{total}', label: 'Total $' },
                    { tag: '{productos}', label: 'Lista' },
                    { tag: '{direccion}', label: 'Dirección' },
                    { tag: '{alias_banco}', label: 'Alias' },
                    { tag: '{banco}', label: 'Banco' },
                    { tag: '{titular}', label: 'Titular' },
                    { tag: '{cbu}', label: 'CBU' },
                  ].map((v) => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => {
                        const fieldMap: Record<string, string> = {
                          new_order: 'template_new_order',
                          preparing: 'template_order_preparing',
                          ready: 'template_order_ready',
                          shipped: 'template_order_shipped',
                          proof: 'template_payment_proof'
                        };
                        insertVariable(v.tag, fieldMap[selectedNotifTab]);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer active:scale-95"
                    >
                      {v.tag}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={9}
                value={
                  selectedNotifTab === 'new_order' ? settings.template_new_order :
                  selectedNotifTab === 'preparing' ? settings.template_order_preparing :
                  selectedNotifTab === 'ready' ? settings.template_order_ready :
                  selectedNotifTab === 'shipped' ? settings.template_order_shipped :
                  settings.template_payment_proof
                }
                onChange={(e) => {
                  const fieldMap: Record<string, string> = {
                    new_order: 'template_new_order',
                    preparing: 'template_order_preparing',
                    ready: 'template_order_ready',
                    shipped: 'template_order_shipped',
                    proof: 'template_payment_proof'
                  };
                  setSettings({ ...settings, [fieldMap[selectedNotifTab]]: e.target.value });
                }}
                className="w-full p-4 bg-slate-50/60 border border-slate-200 rounded-2xl text-xs font-mono leading-relaxed outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div className="lg:col-span-5 space-y-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>Vista Previa en WhatsApp:</span>
              </span>

              <div className="bg-[#efeae2] p-4 rounded-3xl border border-slate-200 shadow-inner">
                <div className="bg-[#d9fdd3] text-slate-900 p-3.5 rounded-2xl rounded-tr-none shadow-sm ml-auto max-w-[95%] border border-emerald-100 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                  {formatWithDummyData(
                    selectedNotifTab === 'new_order' ? settings.template_new_order :
                    selectedNotifTab === 'preparing' ? settings.template_order_preparing :
                    selectedNotifTab === 'ready' ? settings.template_order_ready :
                    selectedNotifTab === 'shipped' ? settings.template_order_shipped :
                    settings.template_payment_proof
                  )}
                  <div className="mt-1 flex items-center justify-end space-x-1 text-[10px] text-emerald-800">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-sky-600 font-bold">✓✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: CONEXIÓN, SEGURIDAD, FILTROS Y LISTA NEGRA */}
      {/* ========================================================================= */}
      {mainTab === 'bot_security' && (
        <div className="space-y-6">
          
          {/* Card 1: Estado de Conexión & QR */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-600" />
              <span>Conexión de WhatsApp Web</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Para que el bot envíe mensajes automáticos y responda el menú interactivo, vincula tu cuenta de WhatsApp escaneando el código QR.
                </p>

                <div className="flex flex-wrap gap-2.5">
                  {status === 'connected' ? (
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Desvincular WhatsApp</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStartOrRefresh}
                      disabled={refreshingQR}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshingQR ? 'animate-spin' : ''}`} />
                      <span>{status === 'qr_ready' ? 'Actualizar Código QR' : 'Conectar WhatsApp'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="md:col-span-5 flex justify-center">
                {status === 'qr_ready' && qrCode ? (
                  <div className="p-4 bg-white rounded-2xl border-2 border-emerald-400 shadow-lg text-center space-y-2">
                    <img src={qrCode} alt="WhatsApp QR" className="w-48 h-48 mx-auto" />
                    <p className="text-[11px] font-bold text-slate-700">Escaneá desde WhatsApp &gt; Disp. Vinculados</p>
                  </div>
                ) : status === 'connected' ? (
                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-emerald-950">¡Bot Conectado y Operativo!</p>
                    <p className="text-[10px] text-emerald-700">Listo para responder a clientes</p>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    Bot desconectado. Haz clic en "Conectar WhatsApp".
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Filtros de Seguridad y Método 3 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                  <span>Filtros Anti-Spam y Palabras Clave (Método 3)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Evita que el bot conteste en conversaciones personales con amigos o familia.
                </p>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
              >
                Guardar Filtros
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Toggle Método 3 */}
              <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200/80 space-y-2">
                <label className="flex items-start justify-between gap-3 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-purple-950 block">
                      🛡️ Método 3: Detección por Palabras Clave de la Tienda
                    </span>
                    <span className="text-[11px] text-purple-800/80 block mt-0.5">
                      El bot SOLO responderá si el mensaje menciona términos de compra ("pedido", "precio", "gomitas", etc.).
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.require_keywords_for_chatbot}
                    onChange={(e) => setSettings({ ...settings, require_keywords_for_chatbot: e.target.checked })}
                    className="w-5 h-5 accent-purple-600 rounded cursor-pointer shrink-0 mt-0.5"
                  />
                </label>

                {settings.require_keywords_for_chatbot && (
                  <div className="pt-2 border-t border-purple-200 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nueva palabra clave (ej: promo)"
                        value={newKeywordInput}
                        onChange={(e) => setNewKeywordInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                        className="flex-1 px-3 py-1 bg-white border border-purple-200 rounded-xl text-xs outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddKeyword}
                        className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Añadir
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
                      {(settings.chatbot_keywords || []).map((kw: string) => (
                        <span key={kw} className="bg-white border border-purple-200 text-purple-800 px-2 py-0.5 rounded-md text-[10px] font-mono flex items-center gap-1">
                          <span>{kw}</span>
                          <button onClick={() => handleRemoveKeyword(kw)} className="text-red-400 hover:text-red-600">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pausa por Respuesta Manual */}
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
                <label className="flex items-start justify-between gap-3 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-amber-950 block">
                      🤫 Pausar Bot si Yo Respondo Manualmente
                    </span>
                    <span className="text-[11px] text-amber-800/80 block mt-0.5">
                      Si le escribís a alguien desde WhatsApp, el bot se calla para ese chat durante el tiempo seleccionado.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.pause_on_manual_reply}
                    onChange={(e) => setSettings({ ...settings, pause_on_manual_reply: e.target.checked })}
                    className="w-5 h-5 accent-amber-600 rounded cursor-pointer shrink-0 mt-0.5"
                  />
                </label>

                {settings.pause_on_manual_reply && (
                  <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-xs">
                    <span className="text-amber-900 font-medium">Tiempo de pausa:</span>
                    <select
                      value={settings.pause_duration_minutes || 120}
                      onChange={(e) => setSettings({ ...settings, pause_duration_minutes: Number(e.target.value) })}
                      className="px-2.5 py-1 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-900 outline-none"
                    >
                      <option value={30}>30 Minutos</option>
                      <option value={60}>1 Hora</option>
                      <option value={120}>2 Horas (Recomendado)</option>
                      <option value={360}>6 Horas</option>
                      <option value={1440}>24 Horas</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Lista Negra de Números Excluidos */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UserX className="w-4 h-4 text-red-500" />
                <span>Lista Negra de Contactos Excluidos (Familia / Amigos personales)</span>
              </span>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    placeholder="Teléfono (ej: 3826123456)"
                    value={newIgnoredPhone}
                    onChange={(e) => setNewIgnoredPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    placeholder="Etiqueta (ej: Mamá / Amigo)"
                    value={newIgnoredLabel}
                    onChange={(e) => setNewIgnoredLabel(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddIgnoredNumber}
                    className="w-full py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + Excluir
                  </button>
                </div>
              </div>

              {/* Lista */}
              {Array.isArray(settings.ignored_numbers) && settings.ignored_numbers.length > 0 && (
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pt-1">
                  {settings.ignored_numbers.map((item: any) => (
                    <span key={item.id || item.phone} className="bg-red-50 border border-red-200 text-red-800 px-2.5 py-1 rounded-xl text-xs flex items-center gap-2">
                      <span className="font-mono font-bold">{item.phone}</span>
                      <span className="text-[10px] text-red-600">({item.label})</span>
                      <button onClick={() => handleRemoveIgnoredNumber(item.id || item.phone)} className="text-red-400 hover:text-red-700">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
