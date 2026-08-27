import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, Sparkles, Plus, Trash2, Check, RefreshCw, Eye, 
  RotateCcw, ArrowRight, Smartphone,
  Layers, MessageSquare, ShoppingBag, Truck, CreditCard,
  CheckCircle2, X, Sliders, ShieldCheck, Tag, Info,
  FlaskConical, Edit3, Copy, Save, Search, ChevronRight,
  ArrowUpRight, AlertCircle, Send, CheckCheck,
  Phone, Sparkle, MessageCircle, MapPin, Building,
  Clock, Package, HelpCircle, CheckSquare, Zap, List
} from 'lucide-react';
import { useModal } from '../context/ModalContext';
import { whatsappBotApi } from '../lib/api';
import type { CustomMenuOption } from '../lib/whatsappBotConstants';
import { DEFAULT_TEMPLATES, DEFAULT_CHATBOT_KEYWORDS } from '../lib/whatsappBotConstants';

export type FlowCategory = 'welcome_menu' | 'catalog_order' | 'shipping_delivery' | 'payments' | 'notifications' | 'custom_qa';

export interface FlowItem {
  id: string;
  category: FlowCategory;
  categoryName: string;
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  fieldKey?: string;
  content: string;
  keywords?: string[];
  options?: Array<{ num?: string; label: string; actionDesc?: string }>;
  isCustom?: boolean;
}

export const CATEGORIES_CONFIG: Array<{ id: FlowCategory; name: string; icon: string; desc: string }> = [
  { id: 'welcome_menu', name: '👋 1. Bienvenida & Menú', icon: '📋', desc: 'Mensaje de saludo inicial y opciones numéricas del 1 al 5' },
  { id: 'catalog_order', name: '🛍️ 2. Catálogo & Compra', icon: '🛍️', desc: 'Catálogo por chat, fotos, venta al peso (gramos) y carrito' },
  { id: 'shipping_delivery', name: '🛵 3. Entrega & Dirección', icon: '🛵', desc: 'Retiro en local vs cadete a domicilio y solicitud de calle' },
  { id: 'payments', name: '💳 4. Pagos & Alias/CBU', icon: '💳', desc: 'Datos bancarios oficiales, Mercado Pago, efectivo y confirmación' },
  { id: 'notifications', name: '🔔 5. Notificaciones Automáticas', icon: '🔔', desc: 'Avisos al cambiar de estado: Preparación, Listo y En camino' },
  { id: 'custom_qa', name: '✨ 6. Respuestas Personalizadas', icon: '✨', desc: 'Preguntas frecuentes y respuestas automáticas a medida' }
];

export const INITIAL_FLOW_ITEMS: FlowItem[] = [
  // 1. BIENVENIDA & MENÚ
  {
    id: 'template_menu',
    category: 'welcome_menu',
    categoryName: '👋 Bienvenida & Menú',
    title: 'Menú Principal de Bienvenida',
    subtitle: 'Primer mensaje que envía el bot cuando un cliente saluda o escribe al WhatsApp',
    icon: '📋',
    badge: 'Inicio',
    fieldKey: 'template_menu',
    content: DEFAULT_TEMPLATES.template_menu,
    keywords: DEFAULT_CHATBOT_KEYWORDS,
    options: [
      { num: '1', label: 'Consultar estado de mi pedido', actionDesc: 'Busca el pedido en la BD y responde con estado y total' },
      { num: '2', label: 'Ver datos de transferencia bancaria', actionDesc: 'Envía Alias, Banco, Titular y CBU oficial' },
      { num: '3', label: 'Horarios y ubicación del local', actionDesc: 'Envía dirección y franjas horarias en Chamical' },
      { num: '4', label: 'Ver catálogo de productos y precios', actionDesc: 'Envía lista con precios y link a la tienda' },
      { num: '5', label: 'Hablar con un asesor humano', actionDesc: 'Pausa el bot y notifica al equipo de CSC' }
    ]
  },
  {
    id: 'menu_response_1',
    category: 'welcome_menu',
    categoryName: '👋 Bienvenida & Menú',
    title: 'Respuesta Opción 1: Consulta de Pedido',
    subtitle: 'Se envía cuando el cliente responde con el número 1 o escribe "estado"',
    icon: '📦',
    badge: 'Opción 1',
    fieldKey: 'menu_response_1',
    content: DEFAULT_TEMPLATES.menu_response_1,
    keywords: ['1', 'estado', 'pedido', 'seguimiento']
  },
  {
    id: 'menu_response_2',
    category: 'welcome_menu',
    categoryName: '👋 Bienvenida & Menú',
    title: 'Respuesta Opción 2: Datos Bancarios',
    subtitle: 'Se envía cuando el cliente responde con el número 2 o pide Alias/CBU',
    icon: '🏦',
    badge: 'Opción 2',
    fieldKey: 'menu_response_2',
    content: DEFAULT_TEMPLATES.menu_response_2,
    keywords: ['2', 'alias', 'cbu', 'transferencia', 'banco', 'pagar']
  },
  {
    id: 'menu_response_3',
    category: 'welcome_menu',
    categoryName: '👋 Bienvenida & Menú',
    title: 'Respuesta Opción 3: Horarios y Ubicación',
    subtitle: 'Se envía cuando el cliente responde con el número 3 o consulta horarios',
    icon: '📍',
    badge: 'Opción 3',
    fieldKey: 'menu_response_3',
    content: DEFAULT_TEMPLATES.menu_response_3,
    keywords: ['3', 'horario', 'horarios', 'local', 'ubicacion', 'donde queda']
  },
  {
    id: 'menu_response_4',
    category: 'welcome_menu',
    categoryName: '👋 Bienvenida & Menú',
    title: 'Respuesta Opción 4: Catálogo y Precios',
    subtitle: 'Se envía cuando el cliente responde con el número 4 o pide catálogo',
    icon: '🛍️',
    badge: 'Opción 4',
    fieldKey: 'menu_response_4',
    content: DEFAULT_TEMPLATES.menu_response_4,
    keywords: ['4', 'catalogo', 'precios', 'productos', 'lista']
  },
  {
    id: 'menu_response_5',
    category: 'welcome_menu',
    categoryName: '👋 Bienvenida & Menú',
    title: 'Respuesta Opción 5: Derivación a Asesor Humano',
    subtitle: 'Se envía cuando el cliente responde con el número 5 o pide hablar con una persona',
    icon: '👤',
    badge: 'Opción 5',
    fieldKey: 'menu_response_5',
    content: DEFAULT_TEMPLATES.menu_response_5,
    keywords: ['5', 'humano', 'asesor', 'persona', 'ayuda', 'atencion']
  },

  // 2. CATÁLOGO & COMPRA
  {
    id: 'template_buy_catalog',
    category: 'catalog_order',
    categoryName: '🛍️ Catálogo & Compra',
    title: 'Catálogo Numerado de Compra Directa',
    subtitle: 'Se envía cuando el cliente escribe "COMPRAR" o quiere armar pedido por chat',
    icon: '🛍️',
    badge: 'Catálogo',
    fieldKey: 'template_buy_catalog',
    content: DEFAULT_TEMPLATES.template_buy_catalog,
    keywords: ['comprar', 'compra', 'quiero comprar', 'hacer pedido']
  },
  {
    id: 'template_product_photo',
    category: 'catalog_order',
    categoryName: '🛍️ Catálogo & Compra',
    title: 'Envío de Foto y Detalle del Producto',
    subtitle: 'Texto que acompaña la foto cuando el cliente pide ver la imagen de una golosina',
    icon: '📸',
    badge: 'Fotos',
    fieldKey: 'template_product_photo',
    content: DEFAULT_TEMPLATES.template_product_photo,
    keywords: ['foto', 'ver foto', 'imagen']
  },
  {
    id: 'template_weight_prompt',
    category: 'catalog_order',
    categoryName: '🛍️ Catálogo & Compra',
    title: 'Calculadora de Gramos (Venta al Peso)',
    subtitle: 'Mensaje que solicita la cantidad de gramos para productos al peso (75g, 150g, etc.)',
    icon: '⚖️',
    badge: 'Al Peso',
    fieldKey: 'template_weight_prompt',
    content: DEFAULT_TEMPLATES.template_weight_prompt
  },
  {
    id: 'template_unit_quantity_prompt',
    category: 'catalog_order',
    categoryName: '🛍️ Catálogo & Compra',
    title: 'Selector de Unidades (Venta por Unidad)',
    subtitle: 'Mensaje que solicita cuántas unidades desea llevar de un producto unitario',
    icon: '🍫',
    badge: 'Por Unidad',
    fieldKey: 'template_unit_quantity_prompt',
    content: DEFAULT_TEMPLATES.template_unit_quantity_prompt
  },
  {
    id: 'template_cart_item_added',
    category: 'catalog_order',
    categoryName: '🛍️ Catálogo & Compra',
    title: 'Carrito en Vivo & Subtotal Parcial',
    subtitle: 'Se envía cada vez que se agrega un producto al carrito por WhatsApp',
    icon: '🛒',
    badge: 'Carrito',
    fieldKey: 'template_cart_item_added',
    content: DEFAULT_TEMPLATES.template_cart_item_added,
    keywords: ['carrito', 'ver carrito', 'listo', 'continuar']
  },

  // 3. ENTREGA & DIRECCIÓN
  {
    id: 'template_shipping_prompt',
    category: 'shipping_delivery',
    categoryName: '🛵 Entrega & Dirección',
    title: 'Pregunta de Retiro vs Envío a Domicilio',
    subtitle: 'El cliente elige 1 para retiro por el local o 2 para envío con cadete',
    icon: '🛵',
    badge: 'Entrega',
    fieldKey: 'template_shipping_prompt',
    content: DEFAULT_TEMPLATES.template_shipping_prompt
  },
  {
    id: 'template_address_prompt',
    category: 'shipping_delivery',
    categoryName: '🛵 Entrega & Dirección',
    title: 'Solicitud de Dirección de Entrega',
    subtitle: 'Se envía si el cliente eligió envío a domicilio para pedir calle y entrecalles',
    icon: '📍',
    badge: 'Dirección',
    fieldKey: 'template_address_prompt',
    content: DEFAULT_TEMPLATES.template_address_prompt
  },

  // 4. PAGOS & ALIAS/CBU
  {
    id: 'template_coupon_prompt',
    category: 'payments',
    categoryName: '💳 Pagos & Alias/CBU',
    title: 'Pregunta de Cupón de Descuento',
    subtitle: 'Permite al cliente ingresar un código promocional o responder NO',
    icon: '🎟️',
    badge: 'Cupones',
    fieldKey: 'template_coupon_prompt',
    content: DEFAULT_TEMPLATES.template_coupon_prompt
  },
  {
    id: 'template_payment_prompt',
    category: 'payments',
    categoryName: '💳 Pagos & Alias/CBU',
    title: 'Selección de Método de Pago',
    subtitle: 'Opciones 1. Transferencia Bancaria, 2. Efectivo contra entrega, 3. Mercado Pago',
    icon: '💳',
    badge: 'Forma de Pago',
    fieldKey: 'template_payment_prompt',
    content: DEFAULT_TEMPLATES.template_payment_prompt
  },
  {
    id: 'template_order_confirmed',
    category: 'payments',
    categoryName: '💳 Pagos & Alias/CBU',
    title: 'Confirmación Final del Pedido',
    subtitle: 'Se envía cuando el pedido queda registrado oficialmente en la base de datos',
    icon: '🎉',
    badge: 'Confirmación',
    fieldKey: 'template_order_confirmed',
    content: DEFAULT_TEMPLATES.template_order_confirmed
  },

  // 5. NOTIFICACIONES AUTOMÁTICAS
  {
    id: 'template_payment_proof',
    category: 'notifications',
    categoryName: '🔔 Notificaciones Automáticas',
    title: 'Recepción de Comprobante de Pago',
    subtitle: 'Se envía automáticamente cuando el cliente envía una foto o captura bancaria',
    icon: '📸',
    badge: 'Comprobante',
    fieldKey: 'template_payment_proof',
    content: DEFAULT_TEMPLATES.template_payment_proof
  },
  {
    id: 'template_order_preparing',
    category: 'notifications',
    categoryName: '🔔 Notificaciones Automáticas',
    title: 'Aviso: Pedido en Preparación',
    subtitle: 'Se envía al cliente cuando cambias el estado a "En Preparación"',
    icon: '👨‍🍳',
    badge: 'Preparando',
    fieldKey: 'template_order_preparing',
    content: DEFAULT_TEMPLATES.template_order_preparing
  },
  {
    id: 'template_order_ready',
    category: 'notifications',
    categoryName: '🔔 Notificaciones Automáticas',
    title: 'Aviso: Pedido Listo para Retirar',
    subtitle: 'Se envía al cliente cuando el pedido está empacado en el local',
    icon: '✨',
    badge: 'Listo',
    fieldKey: 'template_order_ready',
    content: DEFAULT_TEMPLATES.template_order_ready
  },
  {
    id: 'template_order_shipped',
    category: 'notifications',
    categoryName: '🔔 Notificaciones Automáticas',
    title: 'Aviso: Pedido en Camino (Cadete)',
    subtitle: 'Se envía al cliente cuando el cadete sale a realizar la entrega',
    icon: '🛵',
    badge: 'En Camino',
    fieldKey: 'template_order_shipped',
    content: DEFAULT_TEMPLATES.template_order_shipped
  }
];

export interface AdminWhatsAppFlowBuilderProps {
  settings?: any;
  onUpdateSettings?: (newSettings: any) => Promise<void>;
  onOpenLab?: () => void;
  onOpenBotSettings?: () => void;
}

export const AdminWhatsAppFlowBuilder: React.FC<AdminWhatsAppFlowBuilderProps> = ({
  settings: propSettings,
  onUpdateSettings: propOnUpdateSettings,
  onOpenLab,
  onOpenBotSettings
}) => {
  const { showAlert, showConfirm } = useModal();
  
  const [internalSettings, setInternalSettings] = useState<any>(propSettings || { ...DEFAULT_TEMPLATES, chatbot_keywords: DEFAULT_CHATBOT_KEYWORDS, custom_menu_options: [] });
  const [loadingInitial, setLoadingInitial] = useState(!propSettings);

  const activeSettings = propSettings || internalSettings;

  // Cargar configuración de WhatsApp
  useEffect(() => {
    if (!propSettings) {
      whatsappBotApi.getSettings()
        .then((data) => {
          if (data) {
            setInternalSettings({ ...DEFAULT_TEMPLATES, ...data });
          }
        })
        .catch((err) => console.error('[FlowBuilder]: Error loading settings:', err))
        .finally(() => setLoadingInitial(false));
    }
  }, [propSettings]);

  // Lista de Items del Flujo
  const [flowItems, setFlowItems] = useState<FlowItem[]>(() => {
    const base = INITIAL_FLOW_ITEMS.map((item) => {
      if (item.fieldKey && activeSettings[item.fieldKey]) {
        return { ...item, content: activeSettings[item.fieldKey] };
      }
      return item;
    });

    // Cargar respuestas personalizadas existentes
    if (Array.isArray(activeSettings.custom_menu_options)) {
      activeSettings.custom_menu_options.forEach((opt: CustomMenuOption) => {
        base.push({
          id: `custom_${opt.id || opt.option_number}`,
          category: 'custom_qa',
          categoryName: '✨ Respuestas Personalizadas',
          title: `Opción ${opt.option_number}: ${opt.title}`,
          subtitle: 'Respuesta automática personalizada creada por el administrador',
          icon: '🏷️',
          badge: `Opción ${opt.option_number}`,
          content: opt.response,
          keywords: opt.keywords || [opt.option_number],
          isCustom: true
        });
      });
    }

    return base;
  });

  const [activeCategory, setActiveCategory] = useState<FlowCategory>('welcome_menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<FlowItem | null>(null);
  const [showSimulatorDrawer, setShowSimulatorDrawer] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Modal para Crear Nueva Respuesta Personalizada
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCustomForm, setNewCustomForm] = useState<{
    title: string;
    icon: string;
    content: string;
    keywords: string;
    category: FlowCategory;
  }>({
    title: '',
    icon: '✨',
    content: '',
    keywords: '',
    category: 'custom_qa'
  });

  // Guardar Cambios de un Item en Edición
  const handleSaveEditedItem = () => {
    if (!editingItem) return;
    setFlowItems((prev) =>
      prev.map((it) => (it.id === editingItem.id ? editingItem : it))
    );
    setEditingItem(null);
    setHasUnsavedChanges(true);
  };

  // Crear Nueva Respuesta
  const handleCreateCustomItem = () => {
    if (!newCustomForm.title.trim()) {
      showAlert({ title: 'Título requerido', message: 'Ingresa un título para la respuesta.', type: 'warning' });
      return;
    }

    const newId = `custom_${Date.now()}`;
    const cleanKeywords = newCustomForm.keywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    const categoryObj = CATEGORIES_CONFIG.find((c) => c.id === newCustomForm.category) || CATEGORIES_CONFIG[5];

    const newItem: FlowItem = {
      id: newId,
      category: newCustomForm.category,
      categoryName: categoryObj.name,
      title: newCustomForm.title.trim(),
      subtitle: 'Respuesta automática personalizada',
      icon: newCustomForm.icon || '✨',
      badge: 'Personalizado',
      content: newCustomForm.content.trim() || 'Mensaje de respuesta...',
      keywords: cleanKeywords,
      isCustom: true
    };

    setFlowItems((prev) => [...prev, newItem]);
    setActiveCategory(newCustomForm.category);
    setShowCreateModal(false);
    setHasUnsavedChanges(true);

    setNewCustomForm({
      title: '',
      icon: '✨',
      content: '',
      keywords: '',
      category: 'custom_qa'
    });

    showAlert({
      title: '¡Respuesta Creada!',
      message: `"${newItem.title}" se agregó correctamente al flujo.`,
      type: 'success'
    });
  };

  // Eliminar Item Personalizado
  const handleDeleteCustomItem = async (itemId: string) => {
    const target = flowItems.find((it) => it.id === itemId);
    if (!target) return;

    const confirmed = await showConfirm({
      title: `¿Eliminar "${target.title}"?`,
      message: 'Esta respuesta se eliminará de las opciones automáticas.',
      confirmText: 'Eliminar',
      type: 'danger'
    });

    if (!confirmed) return;

    setFlowItems((prev) => prev.filter((it) => it.id !== itemId));
    setHasUnsavedChanges(true);
    showAlert({ title: 'Eliminado', message: 'La respuesta personalizada fue removida.', type: 'info' });
  };

  // Guardar Todo el Flujo en Supabase y Baileys
  const handleSaveAllToDatabase = async () => {
    setIsSaving(true);
    try {
      const updatedSettingsPayload = { ...activeSettings };

      // 1. Sincronizar plantillas oficiales
      flowItems.forEach((item) => {
        if (item.fieldKey) {
          updatedSettingsPayload[item.fieldKey] = item.content;
        }
      });

      // 2. Extraer opciones personalizadas
      const customItems = flowItems.filter((it) => it.isCustom);
      const customOptions: CustomMenuOption[] = customItems.map((it, idx) => {
        return {
          id: it.id.replace('custom_', ''),
          option_number: String(idx + 6),
          title: it.title,
          keywords: it.keywords && it.keywords.length > 0 ? it.keywords : [String(idx + 6)],
          response: it.content
        };
      });
      updatedSettingsPayload.custom_menu_options = customOptions;

      // 3. Persistir
      if (propOnUpdateSettings) {
        await propOnUpdateSettings(updatedSettingsPayload);
      } else {
        await whatsappBotApi.updateSettings(updatedSettingsPayload);
      }

      setInternalSettings(updatedSettingsPayload);
      setHasUnsavedChanges(false);

      showAlert({
        title: '¡Flujo de WhatsApp Guardado!',
        message: 'Todas las respuestas, textos y opciones se sincronizaron con el bot en vivo.',
        type: 'success'
      });
    } catch (err: any) {
      showAlert({ title: 'Error al guardar', message: err.message || 'No se pudo guardar.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Restaurar Textos de Fábrica
  const handleResetToDefaults = async () => {
    const confirmed = await showConfirm({
      title: '¿Restaurar textos originales?',
      message: 'Se reestablecerán las respuestas y opciones predeterminadas de Chamical Candy Shop.',
      confirmText: 'Restaurar',
      type: 'warning'
    });

    if (!confirmed) return;

    setFlowItems(INITIAL_FLOW_ITEMS);
    setHasUnsavedChanges(true);
    showAlert({ title: 'Textos Restaurados', message: 'Haz clic en "Guardar Todo" para confirmar.', type: 'info' });
  };

  // Filtrado de items para la vista actual
  const currentCategoryItems = useMemo(() => {
    return flowItems.filter((item) => {
      const matchCategory = item.category === activeCategory;
      if (!matchCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q) ||
          (item.keywords || []).some((k) => k.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [flowItems, activeCategory, searchQuery]);

  // Formateador visual para simular WhatsApp en vivo
  const formatWhatsAppText = (text: string) => {
    return text
      .replace('{cliente}', 'Mariana')
      .replace('{pedido_id}', 'ORD-8921')
      .replace('{total}', '14.500')
      .replace('{subtotal}', '12.000')
      .replace('{estado}', 'En preparación')
      .replace('{alias_banco}', 'martinchox33')
      .replace('{cbu}', '0000003100012345678901')
      .replace('{banco}', 'Mercado Pago')
      .replace('{titular}', 'Gonzalez Martin Gustavo')
      .replace('{direccion}', 'Castro Barros 450, Chamical')
      .replace('{catalogo_url}', 'candyshopchamical.netlify.app/catalogo')
      .replace('{catalogo_lista}', '1️⃣ Gomitas Ácidas Frutilla ($3.200)\n2️⃣ Moras Dulces ($2.900)\n3️⃣ Ositos Clásicos ($3.500)\n4️⃣ Dientes de Frutilla ($3.100)');
  };

  if (loadingInitial) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center space-y-3 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <RefreshCw className="w-8 h-8 text-cyan-600 animate-spin" />
        <p className="text-sm font-bold text-slate-700">Cargando flujo de WhatsApp...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex flex-col space-y-4 font-sans pb-10">
      
      {/* 1. BARRA SUPERIOR PRINCIPAL (CABECERA ELEGANTE) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-center shadow-lg shadow-emerald-900/10 shrink-0">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="font-headline font-black text-xl sm:text-2xl text-slate-900">
                Flujo de Conversación de WhatsApp
              </h1>
              {hasUnsavedChanges && (
                <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-full animate-pulse">
                  ● Cambios pendientes de guardar
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Configura de forma clara y organizada qué responde el bot en cada etapa de la compra.
            </p>
          </div>
        </div>

        {/* Botones de Acción Global */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenLab && (
            <button
              type="button"
              onClick={onOpenLab}
              className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <FlaskConical className="w-4 h-4" />
              <span>Laboratorio Sandbox</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowSimulatorDrawer(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Ver Simulador en Vivo</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-cyan-200"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Respuesta</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAllToDatabase}
            disabled={isSaving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer shadow-md shadow-emerald-200 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Guardar Todo en WhatsApp</span>
          </button>
        </div>
      </div>

      {/* 2. SELECTOR DE ETAPAS / PESTAÑAS HORIZONTALES GRANDES Y VISUALES */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1.5">
          {CATEGORIES_CONFIG.map((cat) => {
            const isActive = activeCategory === cat.id;
            const count = flowItems.filter((it) => it.category === cat.id).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full p-3 rounded-xl transition-all cursor-pointer text-left flex flex-col justify-between border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                    : 'bg-slate-50/70 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{cat.icon}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {count} {count === 1 ? 'mensaje' : 'mensajes'}
                  </span>
                </div>
                <span className="font-bold text-xs mt-2 block truncate">
                  {cat.name.replace(/^[^\w\s]+/, '').trim()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SUB-BARRA DE BÚSQUEDA Y EXPLICACIÓN DE LA ETAPA ACTUAL */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="font-headline font-black text-base text-slate-900 flex items-center gap-2">
            <span>{CATEGORIES_CONFIG.find((c) => c.id === activeCategory)?.name}</span>
          </h2>
          <p className="text-xs text-slate-600">
            {CATEGORIES_CONFIG.find((c) => c.id === activeCategory)?.desc}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en esta etapa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <button
            type="button"
            onClick={handleResetToDefaults}
            className="p-2 bg-white text-slate-600 hover:text-amber-600 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Restaurar textos por defecto"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. LISTADO ORGANIZADO DE TARJETAS DE CONVERSACIÓN */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {currentCategoryItems.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <span className="text-4xl block">✨</span>
            <h3 className="font-bold text-sm text-slate-800">No hay respuestas configuradas en esta etapa</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Puedes agregar una nueva respuesta personalizada haciendo clic en el botón "+ Nueva Respuesta".
            </p>
            <button
              type="button"
              onClick={() => {
                setNewCustomForm({ ...newCustomForm, category: activeCategory });
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              + Agregar Respuesta en esta Etapa
            </button>
          </div>
        ) : (
          currentCategoryItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              {/* Encabezado de la Tarjeta */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-2xl p-2 bg-slate-100 rounded-2xl shrink-0">{item.icon}</span>
                    <div>
                      <h3 className="font-headline font-black text-sm text-slate-900 leading-snug">
                        {item.title}
                      </h3>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md uppercase tracking-wider inline-block mt-0.5">
                        {item.badge}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {item.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Eliminar respuesta personalizada"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingItem(item)}
                      className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Editar</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {item.subtitle}
                </p>
              </div>

              {/* Vista Previa del Mensaje de WhatsApp */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2 font-sans">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Mensaje que envía el Bot:
                </span>

                <div className="p-3 bg-emerald-950 text-emerald-100 rounded-xl text-xs whitespace-pre-wrap leading-relaxed shadow-2xs font-sans max-h-48 overflow-y-auto">
                  {formatWhatsAppText(item.content)}
                </div>
              </div>

              {/* Opciones o Palabras Clave */}
              {item.options && item.options.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                    Opciones que presenta ({item.options.length}):
                  </span>
                  <div className="space-y-1">
                    {item.options.map((opt, i) => (
                      <div key={i} className="text-[11px] bg-slate-100/80 p-1.5 rounded-lg text-slate-800 flex items-center justify-between font-medium">
                        <span className="truncate pr-1">
                          {opt.num ? `${opt.num}️⃣ ` : '• '} {opt.label}
                        </span>
                        <ArrowRight className="w-3 h-3 text-cyan-600 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Palabras Clave */}
              {item.keywords && item.keywords.length > 0 && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-slate-400 font-bold mr-1">Activa con:</span>
                  {item.keywords.slice(0, 4).map((kw) => (
                    <span key={kw} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-mono font-medium">
                      #{kw}
                    </span>
                  ))}
                  {item.keywords.length > 4 && (
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px]">
                      +{item.keywords.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 5. MODAL ENFOCADO PARA EDITAR CUALQUIER MENSAJE (FOCUS EDITOR) */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Header del Modal */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <span className="text-3xl p-2 bg-white rounded-2xl shadow-xs">{editingItem.icon}</span>
                <div>
                  <h3 className="font-headline font-black text-base text-slate-900">
                    Editar: {editingItem.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingItem.categoryName} • ID: <code className="font-mono text-slate-700">{editingItem.id}</code>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido en 2 Columnas (Editor a la izquierda, Vista Previa a la derecha) */}
            <div className="p-5 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Columna Izquierda: Formulario y Textarea */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Título descriptivo:
                  </label>
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-800 block mb-1.5 flex items-center space-x-1">
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Texto del Mensaje de WhatsApp:</span>
                  </label>
                  <textarea
                    rows={9}
                    value={editingItem.content}
                    onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all resize-y leading-relaxed font-medium"
                    placeholder="Escribe el mensaje del bot..."
                  />
                </div>

                {/* Pastillas de Inserción de Variables Dinámicas */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
                    Insertar Datos Dinámicos con 1 Clic:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { tag: '{cliente}', label: 'Nombre Cliente' },
                      { tag: '{pedido_id}', label: 'N° Pedido' },
                      { tag: '{total}', label: 'Total $' },
                      { tag: '{subtotal}', label: 'Subtotal' },
                      { tag: '{productos}', label: 'Lista Productos' },
                      { tag: '{alias_banco}', label: 'Alias' },
                      { tag: '{cbu}', label: 'CBU' },
                      { tag: '{banco}', label: 'Banco' },
                      { tag: '{titular}', label: 'Titular' },
                      { tag: '{direccion}', label: 'Dirección' },
                      { tag: '{catalogo_url}', label: 'Link Tienda' }
                    ].map(({ tag, label }) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, content: editingItem.content + ' ' + tag })}
                        className="px-2 py-1 bg-white hover:bg-cyan-50 text-slate-700 hover:text-cyan-800 border border-slate-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <span className="font-mono text-cyan-600 font-bold">{tag}</span>
                        <span className="text-[9px] text-slate-400">({label})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Palabras Clave */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Palabras Clave de Activación (separadas por coma):
                  </label>
                  <input
                    type="text"
                    value={(editingItem.keywords || []).join(', ')}
                    onChange={(e) => {
                      const list = e.target.value.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);
                      setEditingItem({ ...editingItem, keywords: list });
                    }}
                    placeholder="ej: promo, 2x1, envio, precio"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Columna Derecha: Vista Previa en Tiempo Real */}
              <div className="lg:col-span-5 space-y-3">
                <span className="text-xs font-black text-slate-800 block flex items-center space-x-1">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Vista Previa en WhatsApp:</span>
                </span>

                <div className="bg-slate-900 rounded-3xl p-4 text-white shadow-lg space-y-3">
                  <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-[10px]">
                      CSC
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1">
                        <span>Chamical Candy Shop</span>
                        <CheckCheck className="w-3 h-3 text-cyan-400" />
                      </h4>
                      <span className="text-[9px] text-emerald-400">En línea</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-950 text-emerald-100 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed shadow-xs font-sans max-h-72 overflow-y-auto">
                    {formatWhatsAppText(editingItem.content)}
                    <span className="text-[9px] text-emerald-400 block text-right mt-1">19:45 ✓✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditedItem}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md shadow-emerald-200"
              >
                Guardar Mensaje
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 6. MODAL PARA CREAR NUEVA RESPUESTA / OPCIÓN PERSONALIZADA */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Crear Nueva Respuesta del Bot</h3>
                  <p className="text-[11px] text-slate-500">Agrega una respuesta automática para una pregunta frecuente o promo.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre o Título de la Respuesta:</label>
                <input
                  type="text"
                  placeholder="ej: 🎉 Promo 2x1 en Gomitas Ácidas"
                  value={newCustomForm.title}
                  onChange={(e) => setNewCustomForm({ ...newCustomForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Icono Emoji:</label>
                  <input
                    type="text"
                    value={newCustomForm.icon}
                    onChange={(e) => setNewCustomForm({ ...newCustomForm, icon: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Etapa:</label>
                  <select
                    value={newCustomForm.category}
                    onChange={(e) => setNewCustomForm({ ...newCustomForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  >
                    {CATEGORIES_CONFIG.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mensaje de Respuesta en WhatsApp:</label>
                <textarea
                  rows={5}
                  placeholder="Escribe el texto que responderá el bot cuando se active esta opción..."
                  value={newCustomForm.content}
                  onChange={(e) => setNewCustomForm({ ...newCustomForm, content: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-cyan-500 resize-y leading-relaxed font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Palabras Clave de Activación (separadas por coma):
                </label>
                <input
                  type="text"
                  placeholder="ej: promo, oferta, 2x1, envio"
                  value={newCustomForm.keywords}
                  onChange={(e) => setNewCustomForm({ ...newCustomForm, keywords: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateCustomItem}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md shadow-cyan-200"
              >
                + Crear Respuesta
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 7. DRAWER LATERAL DEL SIMULADOR DE WHATSAPP EN VIVO */}
      <AnimatePresence>
        {showSimulatorDrawer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-full max-w-md bg-slate-950 h-full p-6 text-white flex flex-col justify-between shadow-2xl overflow-y-auto"
            >
              <div className="space-y-4">
                {/* Header del Simulador */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">
                      CSC
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                        <span>Chamical Candy Shop</span>
                        <CheckCheck className="w-4 h-4 text-cyan-400" />
                      </h3>
                      <span className="text-xs text-emerald-400">Simulador de Chatbot en Vivo</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSimulatorDrawer(false)}
                    className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Burbujas del Menú Inicial */}
                <div className="space-y-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs font-sans">
                  <div className="flex justify-end">
                    <div className="bg-emerald-800 text-white p-3 rounded-2xl rounded-tr-xs shadow-xs">
                      Hola!
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <div className="bg-slate-800 text-slate-100 p-3.5 rounded-2xl rounded-tl-xs shadow-xs whitespace-pre-wrap leading-relaxed">
                      {formatWhatsAppText(flowItems.find((it) => it.id === 'template_menu')?.content || DEFAULT_TEMPLATES.template_menu)}
                    </div>
                  </div>
                </div>

                {/* Acciones de Prueba Rápida */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Probar Respuestas Rápidas:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { num: '1', label: '1️⃣ Estado Pedido' },
                      { num: '2', label: '2️⃣ Datos Bancarios' },
                      { num: '3', label: '3️⃣ Horarios Local' },
                      { num: '4', label: '4️⃣ Ver Catálogo' },
                      { num: '5', label: '5️⃣ Asesor Humano' },
                      { num: 'comprar', label: '🛒 Escribir COMPRAR' }
                    ].map((btn) => (
                      <button
                        key={btn.num}
                        type="button"
                        onClick={() => {
                          const targetMap: Record<string, FlowCategory> = {
                            '1': 'welcome_menu',
                            '2': 'welcome_menu',
                            '3': 'welcome_menu',
                            '4': 'welcome_menu',
                            '5': 'welcome_menu',
                            'comprar': 'catalog_order'
                          };
                          setActiveCategory(targetMap[btn.num]);
                          setShowSimulatorDrawer(false);
                        }}
                        className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-left transition-colors flex items-center justify-between"
                      >
                        <span className="truncate">{btn.label}</span>
                        <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botón Cerrar */}
              <button
                type="button"
                onClick={() => setShowSimulatorDrawer(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all mt-4"
              >
                Cerrar Simulador
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
