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
  Shield, Activity, ArrowRight, Zap, Image as ImageIcon, Download,
  ShoppingBag, Truck, Gift, CreditCard, ShoppingCart
} from 'lucide-react';
import { whatsappBotApi } from '../lib/api';
import { useModal } from '../context/ModalContext';
import { AdminChatbotLab } from './AdminChatbotLab';
import { AdminWhatsAppFlowBuilder } from './AdminWhatsAppFlowBuilder';

import type { 
  IgnoredNumber, 
  CustomMenuOption, 
  TemplateNode 
} from '../lib/whatsappBotConstants';

import { 
  DEFAULT_CHATBOT_KEYWORDS, 
  DEFAULT_TEMPLATES, 
  ALL_TEMPLATE_NODES 
} from '../lib/whatsappBotConstants';

export type { 
  IgnoredNumber, 
  CustomMenuOption, 
  TemplateNode 
};

export { 
  DEFAULT_CHATBOT_KEYWORDS, 
  DEFAULT_TEMPLATES, 
  ALL_TEMPLATE_NODES 
};

export interface AdminWhatsAppBotProps {
  onOpenLab?: () => void;
}

export const AdminWhatsAppBot: React.FC<AdminWhatsAppBotProps> = ({ onOpenLab }) => {
  const { showAlert, showConfirm } = useModal();
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'qr_ready' | 'connected'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectedUser, setConnectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingQR, setRefreshingQR] = useState(false);

  // Navegación principal en 4 pestañas
  const [mainTab, setMainTab] = useState<'visual_flow' | 'chatbot_studio' | 'test_lab' | 'bot_security'>('visual_flow');

  // Filtro de categoría dentro del Chatbot Studio
  const [templateFilterCategory, setTemplateFilterCategory] = useState<'all' | 'menu' | 'buy_flow' | 'notifications'>('all');

  // Configuración y plantillas completas
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
    ...DEFAULT_TEMPLATES
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Nodo seleccionado para editar
  const [selectedTemplateNodeId, setSelectedTemplateNodeId] = useState<string>('template_menu');

  // Simulador de Chatbot en Vivo
  const [simulatedChatHistory, setSimulatedChatHistory] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string; image?: string }>>([
    {
      sender: 'bot',
      text: DEFAULT_TEMPLATES.template_menu.replace('{cliente}', 'Mariana'),
      time: '18:30'
    }
  ]);
  const [simInputText, setSimInputText] = useState('');

  // Modal para nueva opción personalizada
  const [newOptNumber, setNewOptNumber] = useState('6');
  const [newOptTitle, setNewOptTitle] = useState('');
  const [newOptKeywords, setNewOptKeywords] = useState('');
  const [newOptResponse, setNewOptResponse] = useState('');
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);

  // Ignored numbers & test message
  const [newIgnoredPhone, setNewIgnoredPhone] = useState('');
  const [newIgnoredLabel, setNewIgnoredLabel] = useState('');
  const [searchIgnored, setSearchIgnored] = useState('');
  const [newKeywordInput, setNewKeywordInput] = useState('');
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
          custom_menu_options: Array.isArray(data.custom_menu_options) ? data.custom_menu_options : [],
        });
      }
    } catch (_e) {}
  };

  useEffect(() => {
    Promise.all([fetchStatus(), fetchSettings()]).finally(() => setLoading(false));
  }, []);

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
      showAlert({ title: '¡Plantillas Guardadas!', message: 'Todas las plantillas del bot se actualizaron exitosamente en la base de datos.', type: 'success' });
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

    setSettings({
      ...settings,
      custom_menu_options: [...(settings.custom_menu_options || []), newOption]
    });
    setSelectedTemplateNodeId(newOption.id);
    setShowAddCustomModal(false);
    setNewOptTitle('');
    setNewOptKeywords('');
    setNewOptResponse('');
    showAlert({ title: '¡Opción Creada!', message: `Se agregó la opción "${newOption.title}" al menú.`, type: 'success' });
  };

  const handleRemoveCustomOption = (optId: string) => {
    const updated = (settings.custom_menu_options || []).filter((opt: any) => opt.id !== optId);
    setSettings({ ...settings, custom_menu_options: updated });
    if (selectedTemplateNodeId === optId) {
      setSelectedTemplateNodeId('template_menu');
    }
  };

  const handleRestoreDefaultTemplate = (field: string) => {
    if ((DEFAULT_TEMPLATES as any)[field] !== undefined) {
      setSettings({
        ...settings,
        [field]: (DEFAULT_TEMPLATES as any)[field]
      });
      showAlert({ title: 'Plantilla Restaurada', message: 'Se restableció el texto original de esta plantilla.', type: 'info' });
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

  const formatWithDummyData = (rawText: string) => {
    let text = rawText || '';
    const dummyData: Record<string, string> = {
      cliente: 'Mariana Gómez',
      pedido_id: 'A7F39C12',
      total: '4.850',
      subtotal: '5.150',
      descuento: '300',
      cupon: 'DULCE10',
      ejemplo_cupon: 'DULCE10',
      linea_descuento: '🎟️ *Cupón (DULCE10):* -$300\n',
      metodo_entrega: '🏠 Retiro en Local (Chamical)',
      medio_pago: '🏦 Transferencia Bancaria',
      instrucciones_pago: '🏦 *Datos para Transferencia:*\n• *Alias:* `martinchox33`\n• *Banco:* MercadoPago\n\n📸 *Enviá el comprobante por acá para preparar tus golosinas.* ✨',
      menu: '1️⃣ Consultar pedido\n2️⃣ Datos bancarios\n3️⃣ Horarios\n4️⃣ Catálogo',
      productos: '• Moritas Ácidas 250g - $2.800\n• Conitos Mogul 500g - $2.350',
      carrito_items: '1️⃣ Moritas Ácidas (250g) - $2.800\n2️⃣ Conitos Mogul (500g) - $2.350',
      producto: 'Moritas Ácidas',
      detalle: '📝 Gomitas masticables con cobertura ácida crocante.\n',
      dietas: '🌱 *Apto:* Sin TACC • Vegano',
      precio: '$12.000/kg (desde 25g)',
      stock: '45',
      precio_kg: '12.000',
      min_weight: '25',
      step_weight: '25',
      precio_unitario: '950',
      subtotal_item: '$2.800',
      opciones_gramaje: '1️⃣ *25g* — $300\n2️⃣ *50g* — $600\n3️⃣ *100g* — $1.200\n4️⃣ *250g* — $2.800\n5️⃣ *500g* — $5.400',
      cantidad_opciones: '5',
      catalogo_lista: '1️⃣ *Moritas Ácidas* — $12.000/kg (desde 25g)\n2️⃣ *Ositos Frutales* — $10.000/kg (desde 50g)\n3️⃣ *Chocolate Block 38g* — $950 c/u\n4️⃣ *Súper Combo Gomitas 500g* — $5.400',
      direccion: 'Castro Barros 245, Chamical',
      alias_banco: 'martinchox33',
      banco: 'MercadoPago / Galicia',
      titular: 'Gonzalez Martin Gustavo',
      cbu: '0000003100092138928374',
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

  const handleSimulateSend = (userInput?: string) => {
    const textToSend = (userInput || simInputText).trim();
    if (!textToSend) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newHistory = [...simulatedChatHistory, { sender: 'user' as const, text: textToSend, time: timeNow }];

    const lower = textToSend.toLowerCase();
    let botReply = '';
    let botImage: string | undefined = undefined;

    if (lower === '1') {
      botReply = formatWithDummyData(settings.menu_response_1 || DEFAULT_TEMPLATES.menu_response_1);
    } else if (lower === '2') {
      botReply = formatWithDummyData(settings.menu_response_2 || DEFAULT_TEMPLATES.menu_response_2);
    } else if (lower === '3') {
      botReply = formatWithDummyData(settings.menu_response_3 || DEFAULT_TEMPLATES.menu_response_3);
    } else if (lower === '4') {
      botReply = formatWithDummyData(settings.menu_response_4 || DEFAULT_TEMPLATES.menu_response_4);
      if (settings.send_product_images) {
        botImage = 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop&q=80';
      }
    } else if (lower === '5') {
      botReply = formatWithDummyData(settings.menu_response_5 || DEFAULT_TEMPLATES.menu_response_5);
    } else if (lower.startsWith('foto')) {
      botReply = formatWithDummyData(settings.template_product_photo || DEFAULT_TEMPLATES.template_product_photo);
      botImage = 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop&q=80';
    } else if (lower === 'comprar' || lower === 'pedir') {
      botReply = formatWithDummyData(settings.template_buy_catalog || DEFAULT_TEMPLATES.template_buy_catalog);
      if (settings.send_product_images) {
        botImage = 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop&q=80';
      }
    } else if (lower.includes('250g') || lower.includes('500g') || lower.includes('100g')) {
      botReply = formatWithDummyData(settings.template_cart_item_added || DEFAULT_TEMPLATES.template_cart_item_added);
    } else if (lower === 'carrito' || lower === 'ver') {
      botReply = formatWithDummyData(settings.template_cart_view || DEFAULT_TEMPLATES.template_cart_view);
    } else if (lower === 'listo') {
      botReply = formatWithDummyData(settings.template_shipping_prompt || DEFAULT_TEMPLATES.template_shipping_prompt);
    } else if (lower === 'si' || lower === 'confirmar') {
      botReply = formatWithDummyData(settings.template_order_confirmed || DEFAULT_TEMPLATES.template_order_confirmed);
    } else {
      const customMatch = (settings.custom_menu_options || []).find((opt: any) => 
        lower === String(opt.option_number).toLowerCase() || (opt.keywords || []).some((k: string) => lower.includes(k.toLowerCase()))
      );

      if (customMatch) {
        botReply = formatWithDummyData(customMatch.response);
      } else {
        botReply = formatWithDummyData(settings.template_menu || DEFAULT_TEMPLATES.template_menu);
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
        text: formatWithDummyData(settings.template_menu || DEFAULT_TEMPLATES.template_menu),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

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

  // Filtrado de nodos
  const filteredNodes = ALL_TEMPLATE_NODES.filter((node) => {
    if (templateFilterCategory === 'all') return true;
    return node.category === templateFilterCategory;
  });

  const activeStandardNode = ALL_TEMPLATE_NODES.find(n => n.id === selectedTemplateNodeId);
  const customOptionObj = (settings.custom_menu_options || []).find((opt: any) => opt.id === selectedTemplateNodeId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* BARRA SUPERIOR DE ESTADO Y TABS */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-200 shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Editor Integral de Plantillas de WhatsApp</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                status === 'connected' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                status === 'qr_ready' ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' :
                'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {status === 'connected' ? '🟢 Bot Conectado' : status === 'qr_ready' ? '🟡 Esperando QR' : '⚪ Desconectado'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Personaliza todas las plantillas: menú, catálogo, compra directa, fotos, carritos y avisos de entrega.
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 w-full lg:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setMainTab('visual_flow')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              mainTab === 'visual_flow'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>🗺️ Flujo Visual (Diagrama n8n)</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('chatbot_studio')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              mainTab === 'chatbot_studio'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>📝 Lista de Plantillas ({ALL_TEMPLATE_NODES.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenLab ? onOpenLab() : setMainTab('test_lab')}
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
            type="button"
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

      {/* PESTAÑA 1: CONSTRUCTOR DE FLUJO VISUAL (ESTILO N8N) */}
      {mainTab === 'visual_flow' && (
        <AdminWhatsAppFlowBuilder
          settings={settings}
          onUpdateSettings={async (newSet) => {
            setSettings(newSet);
            await whatsappBotApi.updateSettings(newSet);
          }}
          onOpenLab={() => onOpenLab ? onOpenLab() : setMainTab('test_lab')}
        />
      )}

      {/* PESTAÑA 2: LABORATORIO */}
      {mainTab === 'test_lab' && <AdminChatbotLab />}

      {/* PESTAÑA 3: EDITOR DE PLANTILLAS INTEGRAL CLÁSICO */}
      {mainTab === 'chatbot_studio' && (
        <div className="space-y-4">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUMNA IZQUIERDA (7 COLS): ÁRBOL COMPLETO DE PLANTILLAS Y EDITOR */}
            <div className="lg:col-span-7 space-y-4">
              
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                
                {/* Header con botón Guardar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>Selecciona y Edita cualquier Plantilla</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Toca una plantilla para editar su contenido y variables dinámicas.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{savingSettings ? 'Guardando...' : 'Guardar Todo en BD'}</span>
                  </button>
                </div>

                {/* Filtros por Categoría */}
                <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setTemplateFilterCategory('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      templateFilterCategory === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🌟 Todas ({ALL_TEMPLATE_NODES.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateFilterCategory('menu')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      templateFilterCategory === 'menu' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>📋 Menú & Opciones</span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 text-[10px]">6</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateFilterCategory('buy_flow')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      templateFilterCategory === 'buy_flow' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🛒 Compra por Chat</span>
                    <span className="px-1.5 py-0.2 rounded bg-pink-100 text-pink-900 text-[10px]">17</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateFilterCategory('notifications')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      templateFilterCategory === 'notifications' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🔔 Notificaciones</span>
                    <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-900 text-[10px]">5</span>
                  </button>
                </div>

                {/* Grid de Plantillas Disponibles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-1">
                  {filteredNodes.map((node) => {
                    const isSelected = selectedTemplateNodeId === node.id;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setSelectedTemplateNodeId(node.id)}
                        className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-1 relative ${
                          isSelected 
                            ? 'bg-purple-50/90 border-purple-400 ring-2 ring-purple-300 shadow-xs' 
                            : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          {isSelected ? (
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs bg-purple-700 text-white">
                              {node.num}
                            </span>
                          ) : (
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-900 border border-slate-200">
                              {node.num}
                            </span>
                          )}
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase ${
                            node.category === 'menu' ? 'bg-purple-100 text-purple-900' :
                            node.category === 'buy_flow' ? 'bg-pink-100 text-pink-900' :
                            'bg-indigo-100 text-indigo-900'
                          }`}>
                            {node.category === 'menu' ? 'Menú' : node.category === 'buy_flow' ? 'Compra' : 'Notif.'}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 truncate">{node.title}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{node.desc}</p>
                        </div>
                      </button>
                    );
                  })}

                  {/* Opciones Personalizadas */}
                  {(settings.custom_menu_options || []).map((opt: CustomMenuOption) => {
                    const isSelected = selectedTemplateNodeId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedTemplateNodeId(opt.id)}
                        className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-1 relative ${
                          isSelected 
                            ? 'bg-purple-50/90 border-purple-400 ring-2 ring-purple-300 shadow-xs' 
                            : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="w-6 h-6 rounded-lg bg-purple-700 text-white flex items-center justify-center font-bold text-xs">
                            {opt.option_number}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCustomOption(opt.id);
                            }}
                            className="text-slate-400 hover:text-red-500 p-0.5 cursor-pointer"
                            title="Eliminar opción"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 truncate">{opt.title}</p>
                          <p className="text-[10px] text-purple-700 font-semibold truncate">Personalizada</p>
                        </div>
                      </button>
                    );
                  })}

                  {/* Botón Añadir Opción Custom */}
                  <button
                    type="button"
                    onClick={() => setShowAddCustomModal(true)}
                    className="p-2.5 rounded-2xl text-center border border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/40 hover:bg-purple-50 transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 text-purple-700 font-bold text-xs"
                  >
                    <Plus className="w-4 h-4 text-purple-600" />
                    <span>+ Nueva Opción</span>
                  </button>
                </div>

                {/* MODAL CREAR OPCIÓN PERSONALIZADA */}
                {showAddCustomModal && (
                  <div className="p-4 bg-purple-50/90 border-2 border-purple-300 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span>Crear Nueva Opción para el Menú</span>
                      </span>
                      <button onClick={() => setShowAddCustomModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
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
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none font-mono"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Título de la Opción</label>
                        <input
                          type="text"
                          placeholder="Ej: Promos y Combos"
                          value={newOptTitle}
                          onChange={(e) => setNewOptTitle(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Palabras Clave (por coma)</label>
                        <input
                          type="text"
                          placeholder="Ej: 6, promo, oferta, combo"
                          value={newOptKeywords}
                          onChange={(e) => setNewOptKeywords(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Respuesta Automática</label>
                      <textarea
                        rows={3}
                        placeholder="Escribe la respuesta del bot..."
                        value={newOptResponse}
                        onChange={(e) => setNewOptResponse(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none"
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
                        Guardar Opción
                      </button>
                    </div>
                  </div>
                )}

                {/* EDITOR DE TEXTO ENFOCADO DE LA PLANTILLA SELECCIONADA */}
                <div className="p-4 bg-slate-50/90 border border-slate-200 rounded-2xl space-y-3">
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
                        onClick={() => handleRestoreDefaultTemplate(activeStandardNode.field)}
                        className="text-[11px] text-slate-500 hover:text-purple-700 flex items-center gap-1 font-semibold cursor-pointer transition-colors"
                        title="Restaurar a plantilla original"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restaurar original</span>
                      </button>
                    )}
                  </div>

                  {/* Variables Insertables */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                      🏷️ Variables disponibles (toca para insertar):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeStandardNode?.tags && activeStandardNode.tags.length > 0 ? activeStandardNode.tags : [
                        { tag: '{cliente}', label: 'Nombre' },
                        { tag: '{pedido_id}', label: 'ID Pedido' },
                        { tag: '{total}', label: 'Total $' },
                        { tag: '{subtotal}', label: 'Subtotal' },
                        { tag: '{descuento}', label: 'Descuento' },
                        { tag: '{cupon}', label: 'Cupón' },
                        { tag: '{carrito_items}', label: 'Items Carrito' },
                        { tag: '{direccion}', label: 'Dirección' },
                        { tag: '{alias_banco}', label: 'Alias' },
                        { tag: '{banco}', label: 'Banco' },
                        { tag: '{titular}', label: 'Titular' },
                        { tag: '{cbu}', label: 'CBU' },
                        { tag: '{horarios}', label: 'Horarios' },
                        { tag: '{catalogo_url}', label: 'Link Web' }
                      ]).map((v) => (
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
                          className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
                          title={`Insertar ${v.label}`}
                        >
                          {v.tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Textarea */}
                  <textarea
                    rows={8}
                    value={
                      activeStandardNode 
                        ? (settings[activeStandardNode.field] || (DEFAULT_TEMPLATES as any)[activeStandardNode.field] || '') 
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
                    placeholder="Escribe aquí el contenido de la plantilla..."
                  />
                </div>

              </div>

            </div>

            {/* COLUMNA DERECHA (5 COLS): SMARTPHONE SIMULADOR EN VIVO */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Vista Previa en Celular</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetSimulator}
                    className="text-[10px] text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reiniciar Chat</span>
                  </button>
                </div>

                {/* CELULAR MOCKUP FRAME */}
                <div className="w-full max-w-[340px] mx-auto rounded-[38px] bg-slate-900 p-3 shadow-2xl border-4 border-slate-800">
                  <div className="w-28 h-4 bg-slate-950 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-slate-800 mr-2" />
                    <div className="w-10 h-1 bg-slate-800 rounded-full" />
                  </div>

                  <div className="rounded-[28px] overflow-hidden bg-[#efeae2] flex flex-col h-[520px] shadow-inner border border-slate-800/20">
                    
                    {/* Header WhatsApp */}
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

                    {/* Messages Body */}
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
                                <img src={msg.image} alt="Golosina" className="w-full h-28 object-cover" />
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

                    {/* Botones de Prueba Rápida */}
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
                          onClick={() => handleSimulateSend('foto 1')}
                          className="px-2 py-1 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          📸 Foto 1
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
                          onClick={() => handleSimulateSend('carrito')}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                        >
                          🛒 Carrito
                        </button>
                      </div>

                      <div className="flex gap-1 overflow-x-auto scrollbar-none">
                        <button
                          type="button"
                          onClick={() => handleSimulateSend('listo')}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                        >
                          🛵 Listo
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
                          onClick={() => handleSimulateSend('si')}
                          className="px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                        >
                          👍 Confirmar
                        </button>
                      </div>
                    </div>

                    {/* Footer Input */}
                    <div className="p-2 bg-white flex items-center space-x-1.5 border-t border-slate-200">
                      <input
                        type="text"
                        placeholder="Escribe un mensaje de prueba..."
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

        </div>
      )}

      {/* PESTAÑA: CONEXIÓN & FILTROS ANTI-SPAM */}
      {mainTab === 'bot_security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Tarjeta Conexión QR */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-purple-600" />
              <span>Conexión de WhatsApp</span>
            </h2>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
              {status === 'connected' ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">WhatsApp Vinculado Exitosamente</p>
                  <p className="text-[11px] text-slate-500">
                    Usuario conectado: {connectedUser?.name || connectedUser?.id || 'Chamical Candy Shop'}
                  </p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Desvincular WhatsApp
                  </button>
                </div>
              ) : qrCode ? (
                <div className="space-y-2">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48 mx-auto border-4 border-white shadow rounded-xl" />
                  <p className="text-xs font-bold text-slate-800">Escaneá el código desde WhatsApp</p>
                  <p className="text-[10px] text-slate-500">WhatsApp &gt; Dispositivos vinculados &gt; Vincular un dispositivo</p>
                  <button
                    type="button"
                    onClick={handleStartOrRefresh}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Actualizar QR
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600">El bot se encuentra desconectado.</p>
                  <button
                    type="button"
                    onClick={handleStartOrRefresh}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Iniciar y Generar QR
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tarjeta Filtros Anti-Spam & Palabras Clave */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Filtro Anti-Spam (Método 3) & Palabras Clave</span>
            </h2>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-purple-50/60 rounded-xl border border-purple-100 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-800">Activar Filtro Inteligente Anti-Spam</p>
                  <p className="text-[10px] text-slate-500">Solo responde si el mensaje contiene palabras comerciales</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.require_keywords_for_chatbot}
                  onChange={(e) => setSettings({ ...settings, require_keywords_for_chatbot: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded accent-purple-600"
                />
              </label>

              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">Palabras Clave Registradas:</span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {(settings.chatbot_keywords || []).map((kw: string) => (
                    <span key={kw} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs flex items-center gap-1 font-mono">
                      <span>{kw}</span>
                      <button type="button" onClick={() => handleRemoveKeyword(kw)} className="text-slate-400 hover:text-red-500 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Agregar palabra clave (ej: gomitas, alfajor)..."
                  value={newKeywordInput}
                  onChange={(e) => setNewKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Agregar
                </button>
              </div>

              {/* Números Excluidos */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Números Excluidos (Amigos / Familiares):</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="3826123456"
                    value={newIgnoredPhone}
                    onChange={(e) => setNewIgnoredPhone(e.target.value)}
                    className="w-1/2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Etiqueta (ej: Mamá)"
                    value={newIgnoredLabel}
                    onChange={(e) => setNewIgnoredLabel(e.target.value)}
                    className="w-1/2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddIgnoredNumber}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Excluir Número
                </button>

                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {(settings.ignored_numbers || []).map((ign: any) => (
                    <div key={ign.id || ign.phone} className="p-2 bg-slate-50 rounded-xl text-xs flex justify-between items-center border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-800 font-mono">{ign.phone}</span>
                        <span className="text-slate-400 text-[10px] ml-2">({ign.label || 'Excluido'})</span>
                      </div>
                      <button type="button" onClick={() => handleRemoveIgnoredNumber(ign.id || ign.phone)} className="text-red-500 hover:text-red-700 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
