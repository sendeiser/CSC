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
  ShoppingBag, Truck, Gift, CreditCard, ShoppingCart, Users, UploadCloud, Square
} from 'lucide-react';
import { whatsappBotApi } from '../lib/api';
import { useModal } from '../context/ModalContext';
import { supabase } from '../lib/supabase';
import { AdminChatbotLab } from './AdminChatbotLab';

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
  onOpenFlowBuilder?: () => void;
}

export const AdminWhatsAppBot: React.FC<AdminWhatsAppBotProps> = ({ onOpenLab, onOpenFlowBuilder }) => {
  const { showAlert, showConfirm } = useModal();
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'qr_ready' | 'connected'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectedUser, setConnectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingQR, setRefreshingQR] = useState(false);

  // Navegación principal en 3 pestañas limpias
  const [mainTab, setMainTab] = useState<'chatbot_studio' | 'test_lab' | 'bot_security'>('chatbot_studio');

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

  // Estados para Importación y Selección de Contactos (Celular, WhatsApp, Clientes, VCF)
  const [showContactPickerModal, setShowContactPickerModal] = useState(false);
  const [contactPickerSource, setContactPickerSource] = useState<'whatsapp' | 'customers' | 'vcf'>('whatsapp');
  const [loadedWhatsAppContacts, setLoadedWhatsAppContacts] = useState<Array<{ jid: string; phone: string; name: string; pushName?: string }>>([]);
  const [loadedCustomerContacts, setLoadedCustomerContacts] = useState<Array<{ phone: string; name: string; totalOrders?: number }>>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [selectedContactsForExclusion, setSelectedContactsForExclusion] = useState<Record<string, { phone: string; label: string }>>({});
  const vcardFileInputRef = useRef<HTMLInputElement>(null);

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

  // 1. Selector Nativo de Contactos de Android / Chrome (Web Contact Picker API)
  const handlePickFromNativePhone = async () => {
    if (typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel'];
        const opts = { multiple: true };
        const contacts = await (navigator as any).contacts.select(props, opts);
        if (contacts && contacts.length > 0) {
          const currentList: IgnoredNumber[] = Array.isArray(settings.ignored_numbers) ? [...settings.ignored_numbers] : [];
          let addedCount = 0;
          
          for (const c of contacts) {
            const rawName = Array.isArray(c.name) ? c.name[0] : (c.name || 'Contacto Celular');
            const tels = Array.isArray(c.tel) ? c.tel : [c.tel];
            for (const rawTel of tels) {
              if (!rawTel) continue;
              const clean = String(rawTel).replace(/\D/g, '');
              if (clean && clean.length >= 6) {
                if (!currentList.some(item => String(item.phone || item).replace(/\D/g, '') === clean)) {
                  currentList.unshift({
                    id: 'ign_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                    phone: clean,
                    label: rawName || 'Contacto Celular',
                    created_at: new Date().toISOString()
                  });
                  addedCount++;
                }
              }
            }
          }
          
          if (addedCount > 0) {
            const newSet = { ...settings, ignored_numbers: currentList };
            setSettings(newSet);
            await whatsappBotApi.updateSettings(newSet);
            showAlert({
              title: '¡Contactos Excluidos!',
              message: `Se importaron y guardaron ${addedCount} contacto(s) seleccionados directamente desde tu celular.`,
              type: 'success'
            });
          } else {
            showAlert({
              title: 'Sin contactos nuevos',
              message: 'Los contactos seleccionados ya estaban en la lista de excluidos.',
              type: 'info'
            });
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Contact picker error:', err);
          handleOpenContactPickerModal('whatsapp');
        }
      }
    } else {
      // Fallback para navegadores donde la API no está disponible (ej: desktop)
      handleOpenContactPickerModal('whatsapp');
    }
  };

  // 2. Abrir Modal de Contactos (WhatsApp / Clientes / VCF)
  const handleOpenContactPickerModal = async (source: 'whatsapp' | 'customers' | 'vcf' = 'whatsapp') => {
    setContactPickerSource(source);
    setShowContactPickerModal(true);
    setSelectedContactsForExclusion({});
    setContactSearchQuery('');
    setLoadingContacts(true);

    try {
      if (source === 'whatsapp' || source === 'vcf') {
        const contacts = await whatsappBotApi.getContacts().catch(() => []);
        setLoadedWhatsAppContacts(contacts || []);
      } else if (source === 'customers') {
        // Cargar clientes con pedidos desde Supabase
        const { data } = await supabase
          .from('orders')
          .select('customer_name, customer_phone')
          .not('customer_phone', 'is', null)
          .order('created_at', { ascending: false })
          .limit(100);

        if (data) {
          const map = new Map<string, { phone: string; name: string; totalOrders: number }>();
          for (const ord of data) {
            const clean = (ord.customer_phone || '').replace(/\D/g, '');
            if (clean && clean.length >= 6) {
              const existing = map.get(clean);
              if (existing) {
                existing.totalOrders += 1;
              } else {
                map.set(clean, {
                  phone: clean,
                  name: ord.customer_name || 'Cliente Web',
                  totalOrders: 1
                });
              }
            }
          }
          setLoadedCustomerContacts(Array.from(map.values()));
        }
      }
    } catch (err: any) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  // 3. Cambiar pestaña en el modal
  const handleChangeContactSource = async (source: 'whatsapp' | 'customers' | 'vcf') => {
    setContactPickerSource(source);
    if (source === 'customers' && loadedCustomerContacts.length === 0) {
      setLoadingContacts(true);
      try {
        const { data } = await supabase
          .from('orders')
          .select('customer_name, customer_phone')
          .not('customer_phone', 'is', null)
          .order('created_at', { ascending: false })
          .limit(100);

        if (data) {
          const map = new Map<string, { phone: string; name: string; totalOrders: number }>();
          for (const ord of data) {
            const clean = (ord.customer_phone || '').replace(/\D/g, '');
            if (clean && clean.length >= 6) {
              const existing = map.get(clean);
              if (existing) {
                existing.totalOrders += 1;
              } else {
                map.set(clean, {
                  phone: clean,
                  name: ord.customer_name || 'Cliente Web',
                  totalOrders: 1
                });
              }
            }
          }
          setLoadedCustomerContacts(Array.from(map.values()));
        }
      } catch (_e) {} finally {
        setLoadingContacts(false);
      }
    } else if (source === 'whatsapp' && loadedWhatsAppContacts.length === 0) {
      setLoadingContacts(true);
      try {
        const contacts = await whatsappBotApi.getContacts().catch(() => []);
        setLoadedWhatsAppContacts(contacts || []);
      } catch (_e) {} finally {
        setLoadingContacts(false);
      }
    }
  };

  // 4. Importar y parsear archivo .VCF (vCard de celular)
  const handleVCardFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const parsedContacts: Array<{ jid: string; phone: string; name: string; pushName?: string }> = [];
      const vcardEntries = content.split(/BEGIN:VCARD/i).filter(Boolean);

      for (const entry of vcardEntries) {
        let name = '';
        const fnMatch = entry.match(/FN[;:]([^\r\n]+)/i);
        if (fnMatch) {
          name = fnMatch[1].replace(/^[;:]+/, '').trim();
        } else {
          const nMatch = entry.match(/N[;:]([^\r\n]+)/i);
          if (nMatch) name = nMatch[1].replace(/^[;:]+/, '').replace(/;/g, ' ').trim();
        }

        const telMatches = entry.matchAll(/TEL[^:]*:([^\r\n]+)/gi);
        for (const m of telMatches) {
          const rawTel = m[1].trim();
          const clean = rawTel.replace(/\D/g, '');
          if (clean.length >= 6) {
            parsedContacts.push({
              jid: `${clean}@s.whatsapp.net`,
              phone: clean,
              name: name || clean,
              pushName: name
            });
          }
        }
      }

      if (parsedContacts.length > 0) {
        setLoadedWhatsAppContacts(parsedContacts);
        setContactPickerSource('vcf');
        setShowContactPickerModal(true);
        showAlert({
          title: 'Archivo VCF Leído',
          message: `Se detectaron ${parsedContacts.length} contactos en el archivo. Marcá los que quieras excluir.`,
          type: 'info'
        });
      } else {
        showAlert({
          title: 'Sin números válidos',
          message: 'No se encontraron teléfonos válidos en el archivo .vcf seleccionado.',
          type: 'warning'
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 5. Toggle de selección individual de contacto
  const handleToggleContactSelection = (phone: string, label: string) => {
    setSelectedContactsForExclusion((prev) => {
      const copy = { ...prev };
      if (copy[phone]) {
        delete copy[phone];
      } else {
        copy[phone] = { phone, label };
      }
      return copy;
    });
  };

  // 6. Aplicar contactos seleccionados a la lista negra
  const handleApplySelectedContactsToBlacklist = async () => {
    const toAdd = Object.values(selectedContactsForExclusion) as Array<{ phone: string; label?: string }>;
    if (toAdd.length === 0) {
      showAlert({ title: 'Selección vacía', message: 'Selecciona al menos un contacto con el casillero.', type: 'warning' });
      return;
    }

    const currentList: IgnoredNumber[] = Array.isArray(settings.ignored_numbers) ? [...settings.ignored_numbers] : [];
    let addedCount = 0;

    for (const item of toAdd) {
      const clean = item.phone.replace(/\D/g, '');
      if (!clean) continue;
      if (!currentList.some(curr => String(curr.phone || curr).replace(/\D/g, '') === clean)) {
        currentList.unshift({
          id: 'ign_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          phone: clean,
          label: item.label || 'Contacto Personal',
          created_at: new Date().toISOString()
        });
        addedCount++;
      }
    }

    const newSettings = { ...settings, ignored_numbers: currentList };
    setSettings(newSettings);
    setShowContactPickerModal(false);
    setSelectedContactsForExclusion({});

    try {
      await whatsappBotApi.updateSettings(newSettings);
      showAlert({
        title: '¡Lista Negra Actualizada!',
        message: `Se agregaron ${addedCount} contacto(s) a la lista de excluidos del bot en Supabase.`,
        type: 'success'
      });
    } catch (_e) {
      showAlert({
        title: 'Contactos Agregados',
        message: `Se añadieron ${addedCount} contacto(s) a la lista. No olvides pulsar "Guardar Filtros y Ajustes".`,
        type: 'info'
      });
    }
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

        <div className="flex items-center bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 w-full lg:w-auto overflow-x-auto gap-1">
          {onOpenFlowBuilder && (
            <button
              type="button"
              onClick={onOpenFlowBuilder}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200/60 transition-all cursor-pointer whitespace-nowrap"
              title="Abrir Constructor de Flujo en Pantalla Completa"
            >
              <Layers className="w-4 h-4 text-cyan-600" />
              <span>🗺️ Constructor de Flujo (Página Completa)</span>
            </button>
          )}

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

      {/* PESTAÑA 1: LABORATORIO */}
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

      {/* PESTAÑA: CONEXIÓN & FILTROS ANTI-SPAM COMPLETOS */}
      {mainTab === 'bot_security' && (
        <div className="space-y-6">
          
          {/* Header con botón Guardar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">Configuración de Seguridad, Filtros y Conexión</h2>
                <p className="text-xs text-slate-500">
                  Controla cuándo y a quién debe responder el bot para evitar spam o interrupciones con amigos y familiares.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-all flex items-center space-x-2 shadow-sm cursor-pointer whitespace-nowrap"
            >
              {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{savingSettings ? 'Guardando en BD...' : 'Guardar Filtros y Ajustes'}</span>
            </button>
          </div>

          {/* 1. INTERRUPTORES GLOBALES DE FUNCIONAMIENTO */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Interruptores Principales del Bot</span>
                </h3>
                <p className="text-[11px] text-slate-500">Habilita o deshabilita funciones específicas del asistente de WhatsApp.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Bot Activo */}
              <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                settings.enabled ? 'bg-purple-50/70 border-purple-200' : 'bg-slate-50 border-slate-200 opacity-70'
              }`}>
                <div>
                  <span className="text-xs font-black text-slate-900 block">🤖 Bot de WhatsApp Activo</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Permite al bot procesar y contestar mensajes automáticamente.</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer shrink-0 mt-0.5"
                />
              </label>

              {/* Notificar Nuevo Pedido */}
              <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                settings.auto_notify_new_order ? 'bg-purple-50/70 border-purple-200' : 'bg-slate-50 border-slate-200 opacity-70'
              }`}>
                <div>
                  <span className="text-xs font-black text-slate-900 block">🛍️ Avisos de Nuevos Pedidos Web</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Envía el mensaje de bienvenida y datos de CBU al registrar compras web.</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.auto_notify_new_order}
                  onChange={(e) => setSettings({ ...settings, auto_notify_new_order: e.target.checked })}
                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer shrink-0 mt-0.5"
                />
              </label>

              {/* Notificar Cambio de Estado */}
              <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                settings.auto_notify_status_change ? 'bg-purple-50/70 border-purple-200' : 'bg-slate-50 border-slate-200 opacity-70'
              }`}>
                <div>
                  <span className="text-xs font-black text-slate-900 block">📦 Avisos de Cambio de Estado</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Avisa automáticamente cuando el pedido está En Preparación, Listo o en Camino.</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.auto_notify_status_change}
                  onChange={(e) => setSettings({ ...settings, auto_notify_status_change: e.target.checked })}
                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer shrink-0 mt-0.5"
                />
              </label>

              {/* Menú Automático */}
              <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                settings.auto_chatbot_menu ? 'bg-purple-50/70 border-purple-200' : 'bg-slate-50 border-slate-200 opacity-70'
              }`}>
                <div>
                  <span className="text-xs font-black text-slate-900 block">📋 Menú de Bienvenida y Respuestas</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Responde con las opciones 1 a 5 y opciones personalizadas.</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.auto_chatbot_menu}
                  onChange={(e) => setSettings({ ...settings, auto_chatbot_menu: e.target.checked })}
                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer shrink-0 mt-0.5"
                />
              </label>

              {/* Fotos de Golosinas */}
              <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                settings.send_product_images ? 'bg-purple-50/70 border-purple-200' : 'bg-slate-50 border-slate-200 opacity-70'
              }`}>
                <div>
                  <span className="text-xs font-black text-slate-900 block">📸 Envío de Fotos HD de Golosinas</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Envía imagen y ficha cuando el usuario escribe "FOTO 1" o "INFO 1".</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.send_product_images}
                  onChange={(e) => setSettings({ ...settings, send_product_images: e.target.checked })}
                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer shrink-0 mt-0.5"
                />
              </label>

              {/* Compra Directa por Chat */}
              <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                settings.allow_chat_orders ? 'bg-purple-50/70 border-purple-200' : 'bg-slate-50 border-slate-200 opacity-70'
              }`}>
                <div>
                  <span className="text-xs font-black text-slate-900 block">🛒 Compras Directas por WhatsApp</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Permite armar carritos, calcular gramos y generar pedidos reales en la BD.</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allow_chat_orders}
                  onChange={(e) => setSettings({ ...settings, allow_chat_orders: e.target.checked })}
                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer shrink-0 mt-0.5"
                />
              </label>
            </div>
          </div>

          {/* 2. FILTROS ANTI-SPAM INTELIGENTES (3 MÉTODOS) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Filtros Anti-Spam Inteligentes (3 Métodos de Protección)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Evita que el bot responda en conversaciones personales, grupos o mensajes no comerciales.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* MÉTODO 1: Pausa por Respuesta Manual */}
              <div className={`p-4 rounded-2xl border transition-all space-y-3 ${
                settings.pause_on_manual_reply ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-200'
              }`}>
                <label className="flex items-start justify-between gap-3 cursor-pointer">
                  <div>
                    <span className="text-xs font-black text-amber-950 block">
                      🤫 Método 1: Pausa por Respuesta Manual
                    </span>
                    <span className="text-[11px] text-amber-800/80 block mt-0.5">
                      Si respondes manualmente desde tu teléfono físico, el bot se silencia en ese chat para no interrumpir tu charla.
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
                  <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs">
                    <span className="text-amber-900 font-bold text-[11px]">Silenciar durante:</span>
                    <select
                      value={settings.pause_duration_minutes || 120}
                      onChange={(e) => setSettings({ ...settings, pause_duration_minutes: Number(e.target.value) })}
                      className="px-2.5 py-1 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-900 outline-none cursor-pointer"
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

              {/* MÉTODO 2: Restringir solo a Clientes con Pedido */}
              <div className={`p-4 rounded-2xl border transition-all space-y-3 ${
                settings.only_reply_to_customers ? 'bg-blue-50/60 border-blue-200' : 'bg-slate-50 border-slate-200'
              }`}>
                <label className="flex items-start justify-between gap-3 cursor-pointer">
                  <div>
                    <span className="text-xs font-black text-blue-950 block">
                      👥 Método 2: Solo a Clientes Registrados
                    </span>
                    <span className="text-[11px] text-blue-800/80 block mt-0.5">
                      El bot SOLO atenderá a personas que ya tengan al menos una compra registrada en la tienda.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.only_reply_to_customers}
                    onChange={(e) => setSettings({ ...settings, only_reply_to_customers: e.target.checked })}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0 mt-0.5"
                  />
                </label>

                {settings.only_reply_to_customers && (
                  <div className="pt-2 border-t border-blue-200/80 flex items-center justify-between text-xs">
                    <span className="text-blue-900 font-bold text-[11px]">Criterio de cliente:</span>
                    <select
                      value={settings.customer_filter_mode || 'any_order'}
                      onChange={(e) => setSettings({ ...settings, customer_filter_mode: e.target.value })}
                      className="px-2.5 py-1 bg-white border border-blue-300 rounded-xl text-xs font-bold text-blue-900 outline-none cursor-pointer"
                    >
                      <option value="any_order">Cualquier Pedido Histórico</option>
                      <option value="recent_order">Pedidos de los últimos 30 días</option>
                    </select>
                  </div>
                )}
              </div>

              {/* MÉTODO 3: Detección por Palabras Clave */}
              <div className={`p-4 rounded-2xl border transition-all space-y-3 ${
                settings.require_keywords_for_chatbot ? 'bg-purple-50/60 border-purple-200' : 'bg-slate-50 border-slate-200'
              }`}>
                <label className="flex items-start justify-between gap-3 cursor-pointer">
                  <div>
                    <span className="text-xs font-black text-purple-950 block">
                      🛡️ Método 3: Palabras Clave Comerciales
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
                <div className="pt-2 border-t border-purple-200/80 flex items-center justify-between text-[11px] text-purple-800 font-medium">
                  <span>Palabras registradas:</span>
                  <span className="font-bold font-mono bg-white px-2 py-0.5 rounded-md border border-purple-200 text-purple-900">
                    {(settings.chatbot_keywords || []).length} activas
                  </span>
                </div>
              </div>

            </div>

            {/* Gestor de Palabras Clave Comerciales (Método 3) */}
            {settings.require_keywords_for_chatbot && (
              <div className="p-5 bg-purple-50/40 rounded-2xl border border-purple-100 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-purple-600" />
                    <span>Diccionario de Palabras Clave Comerciales ({(settings.chatbot_keywords || []).length})</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setSettings({ ...settings, chatbot_keywords: [...DEFAULT_CHATBOT_KEYWORDS] });
                      showAlert({ title: 'Palabras Restauradas', message: 'Se restablecieron las palabras clave recomendadas.', type: 'info' });
                    }}
                    className="text-[11px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar recomendadas</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escribí una palabra clave (ej: gomitas, alfajor, precio)..."
                    value={newKeywordInput}
                    onChange={(e) => setNewKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                    className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    + Agregar Palabra
                  </button>
                </div>

                {/* Lista de Chips de Palabras Clave */}
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-3 bg-white rounded-2xl border border-slate-200/80">
                  {(settings.chatbot_keywords || []).map((kw: string) => (
                    <span
                      key={kw}
                      className="px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-xs flex items-center gap-1.5 font-mono shadow-2xs"
                    >
                      <span className="font-semibold">{kw}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
                        className="text-purple-400 hover:text-red-500 cursor-pointer font-bold ml-0.5"
                        title="Eliminar palabra"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. LISTA NEGRA DE CONTACTOS EXCLUIDOS (AMIGOS / FAMILIARES) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <UserX className="w-4 h-4 text-red-500" />
                  <span>Lista Negra de Contactos Excluidos (Amigos / Familiares)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Los números aquí anotados jamás recibirán respuestas automáticas ni menús del bot.
                </p>
              </div>

              <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                <span>{(settings.ignored_numbers || []).length} contactos excluidos</span>
              </div>
            </div>

            {/* BOTONES DE IMPORTACIÓN RÁPIDA DE CONTACTOS */}
            <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  <span>📲 Seleccionar Contactos de tu Celular o WhatsApp</span>
                </span>
                <span className="text-[10px] text-purple-700 font-bold bg-white px-2 py-0.5 rounded-lg border border-purple-200">
                  Sin escribir a mano
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* 1. Selector Nativo del Celular (Android / Chrome) */}
                <button
                  type="button"
                  onClick={handlePickFromNativePhone}
                  className="p-3 bg-white hover:bg-purple-50 rounded-xl border border-purple-200/80 text-left transition-all group cursor-pointer shadow-2xs flex flex-col justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-black text-purple-950">Agenda del Celular</span>
                  </div>
                  <span className="text-[10px] text-purple-800 block mt-1">
                    Abre el selector nativo de tu teléfono (Android)
                  </span>
                </button>

                {/* 2. Contactos y Chats de WhatsApp */}
                <button
                  type="button"
                  onClick={() => handleOpenContactPickerModal('whatsapp')}
                  className="p-3 bg-white hover:bg-emerald-50 rounded-xl border border-emerald-200/80 text-left transition-all group cursor-pointer shadow-2xs flex flex-col justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black text-emerald-950">Chats de WhatsApp</span>
                  </div>
                  <span className="text-[10px] text-emerald-800 block mt-1">
                    Ver conversaciones y contactos sincronizados
                  </span>
                </button>

                {/* 3. Clientes de la Tienda */}
                <button
                  type="button"
                  onClick={() => handleOpenContactPickerModal('customers')}
                  className="p-3 bg-white hover:bg-blue-50 rounded-xl border border-blue-200/80 text-left transition-all group cursor-pointer shadow-2xs flex flex-col justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-black text-blue-950">Clientes de la Web</span>
                  </div>
                  <span className="text-[10px] text-blue-800 block mt-1">
                    Listado de compradores en Supabase
                  </span>
                </button>

                {/* 4. Subir Archivo .VCF (vCard) */}
                <button
                  type="button"
                  onClick={() => vcardFileInputRef.current?.click()}
                  className="p-3 bg-white hover:bg-amber-50 rounded-xl border border-amber-200/80 text-left transition-all group cursor-pointer shadow-2xs flex flex-col justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <UploadCloud className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-black text-amber-950">Subir Archivo .VCF</span>
                  </div>
                  <span className="text-[10px] text-amber-800 block mt-1">
                    Exportar contactos de Google o iPhone
                  </span>
                </button>

                <input
                  type="file"
                  ref={vcardFileInputRef}
                  onChange={handleVCardFileUpload}
                  accept=".vcf,text/vcard"
                  className="hidden"
                />
              </div>
            </div>

            {/* Formulario manual para agregar número */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
              <div className="sm:col-span-5">
                <label className="text-[10px] font-bold text-slate-600 block mb-1">O agregar número manual (con código de área):</label>
                <input
                  type="text"
                  placeholder="ej: 3826123456"
                  value={newIgnoredPhone}
                  onChange={(e) => setNewIgnoredPhone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Etiqueta o Nombre:</label>
                <input
                  type="text"
                  placeholder="ej: Mamá / Amigo / Proveedor"
                  value={newIgnoredLabel}
                  onChange={(e) => setNewIgnoredLabel(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <div className="sm:col-span-3 sm:self-end">
                <button
                  type="button"
                  onClick={handleAddIgnoredNumber}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  + Excluir Manual
                </button>
              </div>
            </div>

            {/* Buscador y Lista de Excluidos */}
            {(settings.ignored_numbers || []).length > 0 && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar contacto en la lista negra..."
                    value={searchIgnored}
                    onChange={(e) => setSearchIgnored(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200/80">
                  {(settings.ignored_numbers || [])
                    .filter((ign: any) => {
                      if (!searchIgnored) return true;
                      const q = searchIgnored.toLowerCase();
                      const ph = String(ign.phone || ign).toLowerCase();
                      const lb = String(ign.label || '').toLowerCase();
                      return ph.includes(q) || lb.includes(q);
                    })
                    .map((ign: any) => {
                      const idVal = ign.id || ign.phone || ign;
                      const phoneVal = ign.phone || ign;
                      const labelVal = ign.label || 'Excluido';
                      return (
                        <div
                          key={idVal}
                          className="p-2.5 bg-white rounded-xl text-xs flex justify-between items-center border border-red-100 shadow-2xs group"
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold text-slate-800 font-mono block truncate">{phoneVal}</span>
                            <span className="text-[10px] text-red-600 font-medium block truncate">({labelVal})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveIgnoredNumber(idVal)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Quitar de la lista negra"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* MODAL INTERACTIVO DE SELECCIÓN DE CONTACTOS (WHATSAPP / CLIENTES / VCF) */}
          {showContactPickerModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Header del Modal */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Seleccionar Contactos para la Lista Negra</h3>
                      <p className="text-[11px] text-slate-500">
                        Marca los contactos que deseas excluir para que el bot nunca les responda.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowContactPickerModal(false)}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Selector de Pestañas de Origen */}
                <div className="px-5 py-3 flex items-center gap-2 border-b border-slate-100 bg-white overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => handleChangeContactSource('whatsapp')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                      contactPickerSource === 'whatsapp'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp ({loadedWhatsAppContacts.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChangeContactSource('customers')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                      contactPickerSource === 'customers'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Clientes Web ({loadedCustomerContacts.length})</span>
                  </button>

                  {contactPickerSource === 'vcf' && (
                    <button
                      type="button"
                      onClick={() => handleChangeContactSource('vcf')}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 bg-purple-600 text-white shadow-xs"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Archivo VCF ({loadedWhatsAppContacts.length})</span>
                    </button>
                  )}
                </div>

                {/* Buscador y Controles de Selección */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o número..."
                      value={contactSearchQuery}
                      onChange={(e) => setContactSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>

                  <div className="flex items-center space-x-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        const allList = contactPickerSource === 'customers' 
                          ? loadedCustomerContacts 
                          : loadedWhatsAppContacts;
                        const filtered = allList.filter((c: any) => {
                          if (!contactSearchQuery) return true;
                          const q = contactSearchQuery.toLowerCase();
                          return String(c.name || '').toLowerCase().includes(q) || String(c.phone || '').includes(q);
                        });
                        const newSelected: Record<string, { phone: string; label: string }> = { ...selectedContactsForExclusion };
                        for (const c of filtered) {
                          newSelected[c.phone] = { phone: c.phone, label: c.name || 'Contacto WhatsApp' };
                        }
                        setSelectedContactsForExclusion(newSelected);
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Marcar Visibles
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedContactsForExclusion({})}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                {/* Lista Scrolleable de Contactos */}
                <div className="p-4 overflow-y-auto flex-1 space-y-2 max-h-[50vh]">
                  {loadingContacts ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                      <p className="text-xs font-bold">Cargando contactos...</p>
                    </div>
                  ) : (
                    (() => {
                      const list = contactPickerSource === 'customers' ? loadedCustomerContacts : loadedWhatsAppContacts;
                      const filtered = list.filter((c: any) => {
                        if (!contactSearchQuery) return true;
                        const q = contactSearchQuery.toLowerCase();
                        return String(c.name || '').toLowerCase().includes(q) || String(c.phone || '').includes(q);
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="py-10 text-center text-slate-400 space-y-1">
                            <Users className="w-8 h-8 mx-auto text-slate-300" />
                            <p className="text-xs font-bold text-slate-600">No se encontraron contactos</p>
                            <p className="text-[11px]">Intenta con otro término de búsqueda o sincroniza tu WhatsApp.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {filtered.map((c: any) => {
                            const isSelected = !!selectedContactsForExclusion[c.phone];
                            const isAlreadyExcluded = (settings.ignored_numbers || []).some(
                              (ign: any) => String(ign.phone || ign).replace(/\D/g, '') === String(c.phone).replace(/\D/g, '')
                            );

                            return (
                              <label
                                key={c.phone + (c.jid || '')}
                                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                                  isSelected 
                                    ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-400/30' 
                                    : isAlreadyExcluded 
                                    ? 'bg-red-50/40 border-red-200' 
                                    : 'bg-white border-slate-200/80 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleContactSelection(c.phone, c.name || 'Contacto WhatsApp')}
                                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer shrink-0"
                                  />
                                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                                    {(c.name || 'C').charAt(0)}
                                  </div>
                                  <div className="truncate">
                                    <span className="text-xs font-black text-slate-900 block truncate">{c.name || c.phone}</span>
                                    <span className="text-[11px] font-mono text-slate-500 block truncate">+{c.phone}</span>
                                  </div>
                                </div>

                                {isAlreadyExcluded && (
                                  <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md shrink-0">
                                    Excluido
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* Footer del Modal */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-600">
                    <span className="text-purple-700 font-black">{Object.keys(selectedContactsForExclusion).length}</span> seleccionados
                  </span>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setShowContactPickerModal(false)}
                      className="w-1/2 sm:w-auto px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleApplySelectedContactsToBlacklist}
                      disabled={Object.keys(selectedContactsForExclusion).length === 0}
                      className="w-1/2 sm:w-auto px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm transition-all"
                    >
                      Excluir Seleccionados ({Object.keys(selectedContactsForExclusion).length})
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* 4. CONEXIÓN QR & MENSAJE DE PRUEBA EN VIVO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Tarjeta Conexión QR */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <QrCode className="w-4 h-4 text-purple-600" />
                <span>Estado de Vinculación de WhatsApp</span>
              </h3>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
                {status === 'connected' ? (
                  <div className="space-y-3 w-full">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">WhatsApp Conectado y Operativo</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Línea vinculada: <span className="font-bold text-slate-700">{connectedUser?.name || connectedUser?.id || 'Chamical Candy Shop'}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold cursor-pointer transition-all"
                    >
                      Desvincular WhatsApp
                    </button>
                  </div>
                ) : qrCode ? (
                  <div className="space-y-3 w-full">
                    <img src={qrCode} alt="QR Code" className="w-48 h-48 mx-auto border-4 border-white shadow-md rounded-2xl" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Escaneá el código QR desde tu WhatsApp</p>
                      <p className="text-[10px] text-slate-500">WhatsApp &gt; Dispositivos vinculados &gt; Vincular un dispositivo</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartOrRefresh}
                      className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Actualizar Código QR
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 py-4">
                    <p className="text-xs text-slate-600 font-medium">El bot de WhatsApp está actualmente desconectado.</p>
                    <button
                      type="button"
                      onClick={handleStartOrRefresh}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm"
                    >
                      Iniciar y Generar Código QR
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tarjeta Envío de Mensaje de Prueba */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Send className="w-4 h-4 text-purple-600" />
                <span>Enviar WhatsApp de Prueba en Vivo</span>
              </h3>

              <p className="text-xs text-slate-500">
                Verifica que los mensajes salgan correctamente desde el servidor hacia un número de teléfono real.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Teléfono Destinatario (ej: 5493826123456):</label>
                  <input
                    type="text"
                    placeholder="5493826123456"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Mensaje de Prueba:</label>
                  <textarea
                    rows={3}
                    placeholder="Hola! Este es un mensaje de prueba desde Chamical Candy Shop 🍬"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-400 resize-none font-sans"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={sendingTest || !testPhone}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
                >
                  {sendingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{sendingTest ? 'Enviando mensaje...' : 'Enviar WhatsApp de Prueba'}</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
