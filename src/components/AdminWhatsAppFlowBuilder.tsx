import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, Sparkles, Plus, Trash2, Check, RefreshCw, Eye, 
  RotateCcw, ArrowRight, Smartphone,
  Layers, MessageSquare, ShoppingBag, Truck, CreditCard,
  CheckCircle2, X, Sliders, ShieldCheck, Tag, Info,
  FlaskConical, Edit3, Copy, Save, Search, ChevronRight,
  ArrowUpRight, AlertCircle, Link2, Unlink, ArrowDown,
  Hash, Send, Settings2, Columns, LayoutGrid, Split,
  CheckCheck, Phone, ChevronDown, Sparkle
} from 'lucide-react';
import { useModal } from '../context/ModalContext';
import { whatsappBotApi } from '../lib/api';
import type { CustomMenuOption } from '../lib/whatsappBotConstants';
import { DEFAULT_TEMPLATES, DEFAULT_CHATBOT_KEYWORDS } from '../lib/whatsappBotConstants';

export interface FlowStepOption {
  id: string;
  label: string;
  targetStepId?: string;
  keyword?: string;
  description?: string;
}

export interface FlowStep {
  id: string;
  phaseId: 'triggers' | 'menu' | 'buy_catalog' | 'shipping' | 'coupons' | 'payment' | 'notifications';
  phaseName: string;
  title: string;
  subtitle: string;
  icon: string;
  color: 'emerald' | 'purple' | 'pink' | 'amber' | 'indigo' | 'blue' | 'cyan' | 'slate';
  fieldKey?: string;
  content: string;
  keywords?: string[];
  options: FlowStepOption[];
  isCustom?: boolean;
  systemAction?: string;
}

export const FLOW_PHASES = [
  { id: 'triggers', name: '⚡ Disparadores & Saludos', desc: 'Detección de palabras clave comerciales y saludos' },
  { id: 'menu', name: '📋 Menú & Opciones', desc: 'Menú principal y opciones de consulta 1 a 5' },
  { id: 'buy_catalog', name: '🛒 Compra por Chat & Catálogo', desc: 'Catálogo numerado, fotos, calculadora de gramos y carrito' },
  { id: 'shipping', name: '🛵 Logística & Entrega', desc: 'Retiro en local o envío a domicilio con cadete' },
  { id: 'coupons', name: '🎟️ Cupones de Descuento', desc: 'Validación en base de datos y descuentos' },
  { id: 'payment', name: '💳 Pagos & Cierre de Pedidos', desc: 'Transferencia, Mercado Pago, efectivo y registro en BD' },
  { id: 'notifications', name: '🔔 Notificaciones Automáticas', desc: 'Avisos de preparación, listo para retirar y en camino' }
];

export const INITIAL_FLOW_STEPS: FlowStep[] = [
  // 1. DISPARADORES
  {
    id: 'step_trigger_keywords',
    phaseId: 'triggers',
    phaseName: '⚡ Disparadores & Saludos',
    title: 'Detección de Saludos & Palabras Clave',
    subtitle: 'Filtro inteligente de mensajes entrantes para activar el bot',
    icon: '⚡',
    color: 'emerald',
    content: 'Detecta palabras comerciales como "hola", "pedido", "comprar", "gomitas", "precio", "1", "2", "3", "4", "5", etc. y dirige al menú o compra directa.',
    keywords: DEFAULT_CHATBOT_KEYWORDS,
    systemAction: 'Evalúa mensaje entrante y deriva automáticamente',
    options: [
      { id: 'trig_opt_menu', label: '👋 Saludo / Escribe "HOLA" o "MENU"', targetStepId: 'step_menu_welcome', description: 'Abre el menú principal de bienvenida' },
      { id: 'trig_opt_buy', label: '🛒 Escribe "COMPRAR" o "PEDIDO"', targetStepId: 'step_buy_catalog', description: 'Inicia el flujo de armado de pedido' },
      { id: 'trig_opt_status', label: '📦 Escribe "1" (Estado)', targetStepId: 'step_opt_1_status', description: 'Consulta el estado del pedido actual' }
    ]
  },

  // 2. MENÚ & OPCIONES
  {
    id: 'step_menu_welcome',
    phaseId: 'menu',
    phaseName: '📋 Menú & Opciones',
    title: 'Menú Principal de Bienvenida',
    subtitle: 'Mensaje de bienvenida con las opciones del 1 al 5',
    icon: '📋',
    color: 'purple',
    fieldKey: 'template_menu',
    content: DEFAULT_TEMPLATES.template_menu,
    keywords: ['menu', 'menú', 'inicio', 'opciones'],
    options: [
      { id: 'm_opt_1', label: '1️⃣ Consultar Estado de Pedido', targetStepId: 'step_opt_1_status', keyword: '1' },
      { id: 'm_opt_2', label: '2️⃣ Datos de Transferencia Bancaria', targetStepId: 'step_opt_2_bank', keyword: '2' },
      { id: 'm_opt_3', label: '3️⃣ Horarios y Ubicación del Local', targetStepId: 'step_opt_3_location', keyword: '3' },
      { id: 'm_opt_4', label: '4️⃣ Ver Catálogo de Productos y Precios', targetStepId: 'step_opt_4_catalog', keyword: '4' },
      { id: 'm_opt_5', label: '5️⃣ Hablar con un Asesor Humano', targetStepId: 'step_opt_5_human', keyword: '5' }
    ]
  },
  {
    id: 'step_opt_1_status',
    phaseId: 'menu',
    phaseName: '📋 Menú & Opciones',
    title: 'Opción 1: Consulta de Pedido',
    subtitle: 'Busca el pedido del cliente en la BD y envía estado',
    icon: '📦',
    color: 'blue',
    fieldKey: 'menu_response_1',
    content: DEFAULT_TEMPLATES.menu_response_1,
    keywords: ['1', 'estado', 'seguimiento'],
    systemAction: 'Consulta tabla orders en Supabase por número de teléfono',
    options: [
      { id: 'st_back_menu', label: '📋 Volver al Menú Principal', targetStepId: 'step_menu_welcome', keyword: 'menu' }
    ]
  },
  {
    id: 'step_opt_2_bank',
    phaseId: 'menu',
    phaseName: '📋 Menú & Opciones',
    title: 'Opción 2: Datos Bancarios',
    subtitle: 'Envía Alias, CBU, Banco y Titular oficial para pagar',
    icon: '🏦',
    color: 'emerald',
    fieldKey: 'menu_response_2',
    content: DEFAULT_TEMPLATES.menu_response_2,
    keywords: ['2', 'alias', 'cbu', 'transferencia', 'banco'],
    options: [
      { id: 'bank_send_proof', label: '📸 Enviar Comprobante', targetStepId: 'step_notif_proof', description: 'El cliente envía captura bancaria' },
      { id: 'bank_back_menu', label: '📋 Volver al Menú Principal', targetStepId: 'step_menu_welcome', keyword: 'menu' }
    ]
  },
  {
    id: 'step_opt_3_location',
    phaseId: 'menu',
    phaseName: '📋 Menú & Opciones',
    title: 'Opción 3: Horarios y Ubicación',
    subtitle: 'Dirección del local y franjas de retiro en Chamical',
    icon: '📍',
    color: 'amber',
    fieldKey: 'menu_response_3',
    content: DEFAULT_TEMPLATES.menu_response_3,
    keywords: ['3', 'horario', 'horarios', 'local', 'ubicacion', 'direccion'],
    options: [
      { id: 'loc_back_menu', label: '📋 Volver al Menú Principal', targetStepId: 'step_menu_welcome', keyword: 'menu' }
    ]
  },
  {
    id: 'step_opt_4_catalog',
    phaseId: 'menu',
    phaseName: '📋 Menú & Opciones',
    title: 'Opción 4: Catálogo y Precios',
    subtitle: 'Listado de productos con precios y enlace a la tienda web',
    icon: '🛍️',
    color: 'pink',
    fieldKey: 'menu_response_4',
    content: DEFAULT_TEMPLATES.menu_response_4,
    keywords: ['4', 'catalogo', 'precios', 'productos'],
    options: [
      { id: 'cat_armar_pedido', label: '🛒 Armar Pedido por WhatsApp', targetStepId: 'step_buy_catalog', keyword: 'comprar' },
      { id: 'cat_back_menu', label: '📋 Volver al Menú Principal', targetStepId: 'step_menu_welcome', keyword: 'menu' }
    ]
  },
  {
    id: 'step_opt_5_human',
    phaseId: 'menu',
    phaseName: '📋 Menú & Opciones',
    title: 'Opción 5: Derivación a Asesor Humano',
    subtitle: 'Pausa el bot y avisa al cliente que un asesor responderá',
    icon: '👤',
    color: 'slate',
    fieldKey: 'menu_response_5',
    content: DEFAULT_TEMPLATES.menu_response_5,
    keywords: ['5', 'humano', 'asesor', 'persona', 'ayuda'],
    systemAction: 'Pausa respuestas automáticas por 120 min',
    options: []
  },

  // 3. COMPRA POR CHAT & CATÁLOGO
  {
    id: 'step_buy_catalog',
    phaseId: 'buy_catalog',
    phaseName: '🛒 Compra por Chat & Catálogo',
    title: 'Catálogo Numerado de Compra Directa',
    subtitle: 'Genera el listado interactivo de productos con números',
    icon: '🛍️',
    color: 'pink',
    fieldKey: 'template_buy_catalog',
    content: DEFAULT_TEMPLATES.template_buy_catalog,
    keywords: ['comprar', 'compra', 'pedido directo'],
    systemAction: 'Obtiene lista de productos activos con stock de Supabase',
    options: [
      { id: 'buy_to_weight', label: '⚖️ Si el producto seleccionado es al Peso', targetStepId: 'step_buy_weight' },
      { id: 'buy_to_unit', label: '🍫 Si el producto seleccionado es por Unidad', targetStepId: 'step_buy_unit' },
      { id: 'buy_to_photo', label: '📸 Escribe "FOTO [número]"', targetStepId: 'step_buy_photo' }
    ]
  },
  {
    id: 'step_buy_photo',
    phaseId: 'buy_catalog',
    phaseName: '🛒 Compra por Chat & Catálogo',
    title: 'Envío de Foto y Detalles del Producto',
    subtitle: 'Envía la imagen real de la gomita seleccionada por WhatsApp',
    icon: '📸',
    color: 'indigo',
    fieldKey: 'template_product_photo',
    content: DEFAULT_TEMPLATES.template_product_photo,
    keywords: ['foto', 'ver foto', 'imagen'],
    options: [
      { id: 'photo_to_buy', label: '🛒 Pedir este Producto', targetStepId: 'step_buy_catalog' }
    ]
  },
  {
    id: 'step_buy_weight',
    phaseId: 'buy_catalog',
    phaseName: '🛒 Compra por Chat & Catálogo',
    title: 'Calculadora de Gramos y Precios',
    subtitle: 'Calcula precio exacto según los gramos elegidos (ej: 75g, 150g, 350g)',
    icon: '⚖️',
    color: 'indigo',
    fieldKey: 'template_weight_prompt',
    content: DEFAULT_TEMPLATES.template_weight_prompt,
    options: [
      { id: 'weight_to_cart', label: '🛒 Item Agregado al Carrito', targetStepId: 'step_buy_cart' }
    ]
  },
  {
    id: 'step_buy_unit',
    phaseId: 'buy_catalog',
    phaseName: '🛒 Compra por Chat & Catálogo',
    title: 'Selector de Cantidad (Unidades)',
    subtitle: 'Pregunta cuántas unidades del producto desea llevar',
    icon: '🍫',
    color: 'indigo',
    fieldKey: 'template_unit_quantity_prompt',
    content: DEFAULT_TEMPLATES.template_unit_quantity_prompt,
    options: [
      { id: 'unit_to_cart', label: '🛒 Item Agregado al Carrito', targetStepId: 'step_buy_cart' }
    ]
  },
  {
    id: 'step_buy_cart',
    phaseId: 'buy_catalog',
    phaseName: '🛒 Compra por Chat & Catálogo',
    title: 'Carrito en Vivo & Subtotal Acumulado',
    subtitle: 'Muestra items, precios parciales y permite sumar o avanzar',
    icon: '🛒',
    color: 'pink',
    fieldKey: 'template_cart_item_added',
    content: DEFAULT_TEMPLATES.template_cart_item_added,
    keywords: ['carrito', 'ver carrito', 'listo'],
    options: [
      { id: 'cart_more_items', label: '➕ Sumar Más Golosinas (Escribe otro número)', targetStepId: 'step_buy_catalog' },
      { id: 'cart_to_shipping', label: '✅ Escribe "LISTO" (Avanzar a Entrega)', targetStepId: 'step_shipping_mode' }
    ]
  },

  // 4. LOGÍSTICA & ENTREGA
  {
    id: 'step_shipping_mode',
    phaseId: 'shipping',
    phaseName: '🛵 Logística & Entrega',
    title: 'Método de Entrega (Retiro vs Cadete)',
    subtitle: 'Pregunta si retira por el local o solicita envío a domicilio',
    icon: '🛵',
    color: 'amber',
    fieldKey: 'template_shipping_prompt',
    content: DEFAULT_TEMPLATES.template_shipping_prompt,
    options: [
      { id: 'ship_to_coupon', label: '🎟️ Avanzar al Paso de Cupones', targetStepId: 'step_coupons_prompt' }
    ]
  },

  // 5. CUPONES DE DESCUENTO
  {
    id: 'step_coupons_prompt',
    phaseId: 'coupons',
    phaseName: '🎟️ Cupones de Descuento',
    title: 'Solicitud y Validación de Cupones',
    subtitle: 'Verifica cupones de descuento en Supabase y calcula ahorro',
    icon: '🎟️',
    color: 'purple',
    fieldKey: 'template_coupon_prompt',
    content: DEFAULT_TEMPLATES.template_coupon_prompt,
    options: [
      { id: 'coup_to_payment', label: '💳 Avanzar a Selección de Pago', targetStepId: 'step_payment_mode' }
    ]
  },

  // 6. PAGOS & CIERRE
  {
    id: 'step_payment_mode',
    phaseId: 'payment',
    phaseName: '💳 Pagos & Cierre de Pedidos',
    title: 'Forma de Pago & Resumen del Pedido',
    subtitle: 'Transferencia bancaria, Efectivo o Mercado Pago con desglose',
    icon: '💳',
    color: 'emerald',
    fieldKey: 'template_payment_prompt',
    content: DEFAULT_TEMPLATES.template_payment_prompt,
    options: [
      { id: 'pay_to_confirm', label: '🎉 Confirmar y Registrar en BD', targetStepId: 'step_order_confirmed' }
    ]
  },
  {
    id: 'step_order_confirmed',
    phaseId: 'payment',
    phaseName: '💳 Pagos & Cierre de Pedidos',
    title: 'Confirmación & Registro en Base de Datos',
    subtitle: 'Inserta el pedido en orders & order_items y envía comprobante',
    icon: '🎉',
    color: 'emerald',
    fieldKey: 'template_order_confirmed',
    content: DEFAULT_TEMPLATES.template_order_confirmed,
    systemAction: 'Crea registro real en orders y emite notificación sonora al admin',
    options: []
  },

  // 7. NOTIFICACIONES AUTOMÁTICAS
  {
    id: 'step_notif_proof',
    phaseId: 'notifications',
    phaseName: '🔔 Notificaciones Automáticas',
    title: 'Comprobante de Pago Recibido',
    subtitle: 'Respuesta automática cuando el cliente envía captura bancaria',
    icon: '📸',
    color: 'emerald',
    fieldKey: 'template_payment_proof',
    content: DEFAULT_TEMPLATES.template_payment_proof,
    options: []
  },
  {
    id: 'step_notif_preparing',
    phaseId: 'notifications',
    phaseName: '🔔 Notificaciones Automáticas',
    title: 'Notificación: Pedido en Preparación',
    subtitle: 'Aviso al cambiar estado a "En Preparación"',
    icon: '👨‍🍳',
    color: 'blue',
    fieldKey: 'template_order_preparing',
    content: DEFAULT_TEMPLATES.template_order_preparing,
    options: []
  },
  {
    id: 'step_notif_ready',
    phaseId: 'notifications',
    phaseName: '🔔 Notificaciones Automáticas',
    title: 'Notificación: Pedido Listo para Retirar',
    subtitle: 'Aviso cuando el pedido está empaquetado en el local',
    icon: '✨',
    color: 'pink',
    fieldKey: 'template_order_ready',
    content: DEFAULT_TEMPLATES.template_order_ready,
    options: []
  },
  {
    id: 'step_notif_shipped',
    phaseId: 'notifications',
    phaseName: '🔔 Notificaciones Automáticas',
    title: 'Notificación: Pedido en Camino (Cadete)',
    subtitle: 'Aviso cuando el cadete sale a entregar el pedido',
    icon: '🛵',
    color: 'amber',
    fieldKey: 'template_order_shipped',
    content: DEFAULT_TEMPLATES.template_order_shipped,
    options: []
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

  // Cargar configuración de WhatsApp si no viene por props
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

  // Lista de Pasos del Flujo
  const [steps, setSteps] = useState<FlowStep[]>(() => {
    const base = INITIAL_FLOW_STEPS.map((step) => {
      if (step.fieldKey && activeSettings[step.fieldKey]) {
        return { ...step, content: activeSettings[step.fieldKey] };
      }
      return step;
    });

    // Opciones personalizadas como pasos editables
    if (Array.isArray(activeSettings.custom_menu_options)) {
      activeSettings.custom_menu_options.forEach((opt: CustomMenuOption) => {
        base.push({
          id: `step_custom_${opt.id || opt.option_number}`,
          phaseId: 'menu',
          phaseName: '📋 Menú & Opciones',
          title: `Opción ${opt.option_number}: ${opt.title}`,
          subtitle: `Opción adicional configurada por el administrador`,
          icon: '🏷️',
          color: 'cyan',
          content: opt.response,
          keywords: opt.keywords || [opt.option_number],
          options: [
            { id: `opt_back_${opt.id}`, label: '📋 Volver al Menú Principal', targetStepId: 'step_menu_welcome', keyword: 'menu' }
          ],
          isCustom: true
        });
      });
    }

    return base;
  });

  const [selectedStepId, setSelectedStepId] = useState<string>('step_menu_welcome');
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [layoutView, setLayoutView] = useState<'studio' | 'focus'>('studio');
  
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Modal para Crear Nuevo Paso
  const [showCreateStepModal, setShowCreateStepModal] = useState(false);
  const [newStepForm, setNewStepForm] = useState<{
    title: string;
    phaseId: FlowStep['phaseId'];
    icon: string;
    color: FlowStep['color'];
    content: string;
    keywords: string;
    targetStepId: string;
  }>({
    title: '',
    phaseId: 'menu',
    icon: '✨',
    color: 'cyan',
    content: '',
    keywords: '',
    targetStepId: 'step_menu_welcome'
  });

  // Modal para Nueva Opción / Bifurcación
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionTarget, setNewOptionTarget] = useState('step_menu_welcome');
  const [newOptionKeyword, setNewOptionKeyword] = useState('');

  // Paso actualmente seleccionado
  const selectedStep = useMemo(() => {
    return steps.find((s) => s.id === selectedStepId) || steps[0];
  }, [steps, selectedStepId]);

  // Actualizar contenido de un paso
  const handleUpdateStep = (stepId: string, updates: Partial<FlowStep>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s))
    );
    setHasUnsavedChanges(true);
  };

  // Crear Nuevo Paso
  const handleCreateStep = () => {
    if (!newStepForm.title.trim()) {
      showAlert({ title: 'Título requerido', message: 'Escribe un nombre para este paso.', type: 'warning' });
      return;
    }

    const newId = `step_custom_${Date.now()}`;
    const cleanKeywords = newStepForm.keywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    const phaseObj = FLOW_PHASES.find((p) => p.id === newStepForm.phaseId) || FLOW_PHASES[1];

    const createdStep: FlowStep = {
      id: newId,
      phaseId: newStepForm.phaseId,
      phaseName: phaseObj.name,
      title: newStepForm.title.trim(),
      subtitle: 'Paso personalizado del bot de WhatsApp',
      icon: newStepForm.icon || '✨',
      color: newStepForm.color || 'cyan',
      content: newStepForm.content.trim() || 'Mensaje de respuesta...',
      keywords: cleanKeywords,
      options: newStepForm.targetStepId ? [
        {
          id: `opt_${newId}_1`,
          label: 'Siguiente Paso',
          targetStepId: newStepForm.targetStepId
        }
      ] : [],
      isCustom: true
    };

    setSteps((prev) => [...prev, createdStep]);
    setSelectedStepId(newId);
    setShowCreateStepModal(false);
    setHasUnsavedChanges(true);

    setNewStepForm({
      title: '',
      phaseId: 'menu',
      icon: '✨',
      color: 'cyan',
      content: '',
      keywords: '',
      targetStepId: 'step_menu_welcome'
    });

    showAlert({
      title: '¡Paso Creado!',
      message: `"${createdStep.title}" se agregó al flujo de conversación con éxito.`,
      type: 'success'
    });
  };

  // Eliminar Paso
  const handleDeleteStep = async (stepIdToDelete: string) => {
    const target = steps.find((s) => s.id === stepIdToDelete);
    if (!target) return;

    const confirmed = await showConfirm({
      title: `¿Eliminar "${target.title}"?`,
      message: 'Este paso y sus conexiones asociadas se removerán del flujo.',
      confirmText: 'Eliminar Paso',
      type: 'danger'
    });

    if (!confirmed) return;

    setSteps((prev) => {
      const remaining = prev.filter((s) => s.id !== stepIdToDelete);
      return remaining.map((s) => ({
        ...s,
        options: s.options.filter((o) => o.targetStepId !== stepIdToDelete)
      }));
    });

    if (selectedStepId === stepIdToDelete) {
      setSelectedStepId('step_menu_welcome');
    }

    setHasUnsavedChanges(true);
    showAlert({ title: 'Paso Eliminado', message: 'El paso fue removido del flujo.', type: 'info' });
  };

  // Agregar Opción de Salida al Paso Activo
  const handleAddOptionToStep = () => {
    if (!newOptionLabel.trim()) {
      showAlert({ title: 'Etiqueta requerida', message: 'Escribe el nombre de la opción (ej: "2️⃣ Ver Datos")', type: 'warning' });
      return;
    }

    const newOpt: FlowStepOption = {
      id: `opt_${selectedStep.id}_${Date.now()}`,
      label: newOptionLabel.trim(),
      targetStepId: newOptionTarget,
      keyword: newOptionKeyword.trim() || undefined
    };

    handleUpdateStep(selectedStep.id, {
      options: [...(selectedStep.options || []), newOpt]
    });

    setNewOptionLabel('');
    setNewOptionKeyword('');
  };

  // Eliminar Opción de Salida
  const handleRemoveOptionFromStep = (optionId: string) => {
    handleUpdateStep(selectedStep.id, {
      options: (selectedStep.options || []).filter((o) => o.id !== optionId)
    });
  };

  // Guardar Todo el Flujo en Supabase
  const handleSaveAllFlow = async () => {
    setIsSaving(true);
    try {
      const updatedSettingsPayload = { ...activeSettings };

      // 1. Guardar plantillas del sistema
      steps.forEach((step) => {
        if (step.fieldKey) {
          updatedSettingsPayload[step.fieldKey] = step.content;
        }
      });

      // 2. Extraer opciones personalizadas
      const customSteps = steps.filter((s) => s.isCustom);
      const customOptions: CustomMenuOption[] = customSteps.map((s, idx) => {
        return {
          id: s.id.replace('step_custom_', ''),
          option_number: String(idx + 6),
          title: s.title,
          keywords: s.keywords && s.keywords.length > 0 ? s.keywords : [String(idx + 6)],
          response: s.content
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
        title: '¡Flujo Guardado con Éxito!',
        message: 'Todas las plantillas, opciones y respuestas se sincronizaron con el bot de WhatsApp.',
        type: 'success'
      });
    } catch (err: any) {
      showAlert({ title: 'Error al guardar', message: err.message || 'No se pudo guardar.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Restaurar Flujo por Defecto
  const handleResetToDefaultFlow = async () => {
    const confirmed = await showConfirm({
      title: '¿Restaurar flujo de fábrica?',
      message: 'Se reestablecerán todos los textos y secuencias originales.',
      confirmText: 'Restaurar',
      type: 'warning'
    });

    if (!confirmed) return;

    setSteps(INITIAL_FLOW_STEPS);
    setSelectedStepId('step_menu_welcome');
    setHasUnsavedChanges(true);
    showAlert({ title: 'Flujo Restaurado', message: 'Haz clic en "Guardar Flujo" para confirmar los cambios.', type: 'info' });
  };

  // Filtrar pasos
  const filteredSteps = useMemo(() => {
    return steps.filter((s) => {
      if (selectedPhaseFilter !== 'all' && s.phaseId !== selectedPhaseFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          s.content.toLowerCase().includes(q) ||
          (s.keywords || []).some((k) => k.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [steps, selectedPhaseFilter, searchQuery]);

  if (loadingInitial) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center space-y-3 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <RefreshCw className="w-8 h-8 text-cyan-600 animate-spin" />
        <p className="text-sm font-bold text-slate-700">Cargando constructor de flujos...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex flex-col space-y-3 font-sans pb-8">
      {/* 1. BARRA SUPERIOR DE ACCIÓN GLOBAL A PANTALLA COMPLETA */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-cyan-200 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-headline font-black text-lg sm:text-xl text-slate-900">
                Flujo del Chatbot de WhatsApp
              </h1>
              <span className="px-2.5 py-0.5 bg-cyan-100 text-cyan-900 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                {steps.length} Pasos
              </span>
              {hasUnsavedChanges && (
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-full animate-pulse">
                  ● Cambios sin guardar
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Administra todas las etapas, respuestas automáticas, opciones de menú, catálogo y derivaciones de WhatsApp.
            </p>
          </div>
        </div>

        {/* Botones de Cabecera */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenLab && (
            <button
              type="button"
              onClick={onOpenLab}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <FlaskConical className="w-4 h-4" />
              <span className="hidden sm:inline">Laboratorio</span>
            </button>
          )}

          {onOpenBotSettings && (
            <button
              type="button"
              onClick={onOpenBotSettings}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Ajustes Bot</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowCreateStepModal(true)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-cyan-200"
          >
            <Plus className="w-4 h-4" />
            <span>+ Crear Nuevo Paso</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAllFlow}
            disabled={isSaving}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-200 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Guardar Flujo</span>
          </button>
        </div>
      </div>

      {/* 2. FILTRO DE ETAPAS & BUSCADOR HORIZONTAL */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Pills de Etapas */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto py-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedPhaseFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedPhaseFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🌟 Todas las Etapas ({steps.length})
          </button>

          {FLOW_PHASES.map((phase) => {
            const count = steps.filter((s) => s.phaseId === phase.id).length;
            if (count === 0) return null;
            return (
              <button
                key={phase.id}
                type="button"
                onClick={() => setSelectedPhaseFilter(phase.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedPhaseFilter === phase.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {phase.name.split(' ')[0]} {phase.name.split(' ')[1]} ({count})
              </button>
            );
          })}
        </div>

        {/* Buscador y Toggle de Vista */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <div className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por texto o palabra clave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all"
            />
          </div>

          <button
            type="button"
            onClick={handleResetToDefaultFlow}
            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Restaurar valores de fábrica"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setLayoutView(layoutView === 'studio' ? 'focus' : 'studio')}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
            title="Cambiar distribución de paneles"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{layoutView === 'studio' ? 'Pantalla Completa' : 'Ver Simulador'}</span>
          </button>
        </div>
      </div>

      {/* 3. WORKSPACE DE 3 PANELES A PANTALLA COMPLETA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 items-start">
        
        {/* PANEL IZQUIERDO: ÍNDICE DE PASOS DEL FLUJO (4 COLS O 3 COLS) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-2 bg-white rounded-2xl p-3 border border-slate-200 shadow-xs max-h-[750px] overflow-y-auto">
          <div className="flex items-center justify-between px-2 py-1 text-xs font-black text-slate-800 border-b border-slate-100 pb-2">
            <span>Pasos del Flujo ({filteredSteps.length})</span>
            <button
              type="button"
              onClick={() => setShowCreateStepModal(true)}
              className="text-cyan-700 hover:underline font-bold text-[11px] flex items-center space-x-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Nuevo</span>
            </button>
          </div>

          <div className="space-y-1">
            {filteredSteps.map((step) => {
              const isSelected = selectedStepId === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setSelectedStepId(step.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-start space-x-2.5 border ${
                    isSelected
                      ? 'bg-cyan-50/90 border-cyan-300 text-cyan-950 shadow-xs ring-1 ring-cyan-400'
                      : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200/70 text-slate-700'
                  }`}
                >
                  <span className="text-xl shrink-0 mt-0.5">{step.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold truncate text-slate-900">{step.title}</h4>
                      {step.isCustom && (
                        <span className="px-1.5 py-0.2 bg-cyan-100 text-cyan-800 rounded text-[9px] font-black uppercase shrink-0">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {step.content}
                    </p>
                    <div className="flex items-center space-x-2 mt-1.5 text-[10px] text-slate-400 font-medium">
                      <span>{step.phaseName.split(' ')[0]}</span>
                      <span>•</span>
                      <span>{step.options?.length || 0} salidas</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PANEL CENTRAL: EDITOR COMPLETO DEL PASO SELECCIONADO (5 COLS O 9 COLS SI FOCUS) */}
        <div className={`${layoutView === 'studio' ? 'lg:col-span-5 xl:col-span-5' : 'lg:col-span-8 xl:col-span-9'} space-y-3`}>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            
            {/* Header del Paso */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl p-2 bg-slate-100 rounded-2xl">{selectedStep.icon}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="font-headline font-black text-base sm:text-lg text-slate-900">
                      {selectedStep.title}
                    </h2>
                    {selectedStep.isCustom && (
                      <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-md text-[10px] font-bold">
                        Personalizado
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 block">
                    {selectedStep.phaseName} • ID: <code className="font-mono text-slate-700">{selectedStep.id}</code>
                  </span>
                </div>
              </div>

              {/* Acciones de Paso */}
              <div className="flex items-center space-x-2">
                {selectedStep.isCustom && (
                  <button
                    type="button"
                    onClick={() => handleDeleteStep(selectedStep.id)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveAllFlow}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar</span>
                </button>
              </div>
            </div>

            {/* Formulario de Configuración del Paso */}
            <div className="space-y-4">
              
              {/* Título y Subtítulo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Paso:</label>
                  <input
                    type="text"
                    value={selectedStep.title}
                    onChange={(e) => handleUpdateStep(selectedStep.id, { title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Icono Emoji:</label>
                  <input
                    type="text"
                    value={selectedStep.icon}
                    onChange={(e) => handleUpdateStep(selectedStep.id, { icon: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500 text-center"
                  />
                </div>
              </div>

              {/* Editor de Texto del Mensaje */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-slate-800 flex items-center space-x-1">
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Texto del Mensaje que enviará el Bot en WhatsApp:</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {selectedStep.content.length} caracteres • {selectedStep.content.split('\n').length} líneas
                  </span>
                </div>

                <textarea
                  rows={9}
                  value={selectedStep.content}
                  onChange={(e) => handleUpdateStep(selectedStep.id, { content: e.target.value })}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-sans outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all resize-y leading-relaxed font-medium"
                  placeholder="Escribe el mensaje que enviará el bot..."
                />
              </div>

              {/* Chips de Inserción Rápida de Variables */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Insertar Variables Dinámicas con 1 Toque:</span>
                  </span>
                </div>
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
                      onClick={() => handleUpdateStep(selectedStep.id, { content: selectedStep.content + ' ' + tag })}
                      className="px-2.5 py-1 bg-white hover:bg-cyan-50 hover:text-cyan-800 text-slate-700 border border-slate-200/80 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1"
                    >
                      <span className="font-mono text-cyan-600 font-bold">{tag}</span>
                      <span className="text-[10px] text-slate-400">({label})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Palabras Clave de Activación */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Palabras Clave de Activación (separadas por coma):
                </label>
                <input
                  type="text"
                  value={(selectedStep.keywords || []).join(', ')}
                  onChange={(e) => {
                    const list = e.target.value.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);
                    handleUpdateStep(selectedStep.id, { keywords: list });
                  }}
                  placeholder="ej: promo, oferta, 2x1, envio"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white"
                />
              </div>

              {/* Rutas de Salida y Siguientes Pasos */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                      <Split className="w-4 h-4 text-cyan-600" />
                      <span>Rutas de Salida / Siguientes Pasos ({selectedStep.options?.length || 0})</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Opciones que el cliente puede responder para avanzar al siguiente paso.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {(selectedStep.options || []).map((opt) => {
                    const target = steps.find((s) => s.id === opt.targetStepId);
                    return (
                      <div key={opt.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <span className="text-xs font-bold text-slate-800 block truncate">{opt.label}</span>
                          {opt.keyword && (
                            <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-mono font-bold">
                              Palabra/Número: {opt.keyword}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <select
                            value={opt.targetStepId || ''}
                            onChange={(e) => {
                              const newTarget = e.target.value;
                              handleUpdateStep(selectedStep.id, {
                                options: selectedStep.options.map((o) =>
                                  o.id === opt.id ? { ...o, targetStepId: newTarget } : o
                                )
                              });
                            }}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none font-medium max-w-[200px]"
                          >
                            {steps.map((s) => (
                              <option key={s.id} value={s.id}>
                                ➔ {s.icon} {s.title}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemoveOptionFromStep(opt.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Quitar opción"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Formulario para Agregar Nueva Opción */}
                <div className="p-3 bg-cyan-50/70 rounded-2xl border border-cyan-200 space-y-2">
                  <span className="text-xs font-bold text-cyan-950 block">
                    + Conectar Nueva Opción / Bifurcación
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="ej: 1️⃣ Consultar Estado"
                        value={newOptionLabel}
                        onChange={(e) => setNewOptionLabel(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                      />
                    </div>

                    <div className="sm:col-span-5">
                      <select
                        value={newOptionTarget}
                        onChange={(e) => setNewOptionTarget(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                      >
                        {steps.map((s) => (
                          <option key={s.id} value={s.id}>
                            ➔ {s.icon} {s.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddOptionToStep}
                        className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: SIMULADOR DE WHATSAPP EN VIVO (3 COLS O 4 COLS) */}
        {layoutView === 'studio' && (
          <div className="lg:col-span-3 xl:col-span-4 space-y-3">
            <div className="bg-slate-950 rounded-3xl p-4 border border-slate-800 shadow-xl text-white space-y-3 sticky top-4">
              
              {/* Barra de Estado de Teléfono */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                    CSC
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1">
                      <span>Chamical Candy Shop</span>
                      <CheckCheck className="w-3 h-3 text-cyan-400" />
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-medium">En línea • Bot Oficial</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[9px] font-bold uppercase tracking-wider">
                  Simulación
                </span>
              </div>

              {/* Chat WhatsApp con el Paso Activo */}
              <div className="bg-slate-900 rounded-2xl p-3.5 space-y-3 min-h-[350px] max-h-[500px] overflow-y-auto text-xs leading-relaxed font-sans">
                {/* Mensaje del Usuario Simulado */}
                <div className="flex justify-end">
                  <div className="bg-emerald-800 text-white p-2.5 rounded-2xl rounded-tr-xs max-w-[85%] shadow-xs">
                    <p className="text-xs">
                      {selectedStep.keywords && selectedStep.keywords[0] ? selectedStep.keywords[0] : 'hola'}
                    </p>
                    <span className="text-[9px] text-emerald-200 block text-right mt-1">19:42 ✓✓</span>
                  </div>
                </div>

                {/* Respuesta del Bot */}
                <div className="flex justify-start">
                  <div className="bg-slate-800 text-slate-100 p-3 rounded-2xl rounded-tl-xs max-w-[95%] shadow-xs border border-slate-700/60 whitespace-pre-wrap">
                    {selectedStep.content
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
                      .replace('{catalogo_url}', 'candyshopchamical.netlify.app/catalogo')}
                    <span className="text-[9px] text-slate-400 block text-right mt-1.5">19:42</span>
                  </div>
                </div>

                {/* Botones de Salida / Siguiente Paso */}
                {selectedStep.options && selectedStep.options.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Opciones disponibles para el cliente:
                    </span>
                    {selectedStep.options.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          if (opt.targetStepId) {
                            setSelectedStepId(opt.targetStepId);
                          }
                        }}
                        className="w-full text-left p-2 bg-slate-800 hover:bg-cyan-950/80 border border-slate-700 hover:border-cyan-500 rounded-xl text-[11px] font-bold text-cyan-300 transition-all flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate">{opt.label}</span>
                        <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Input simulado */}
              <div className="flex items-center space-x-2 bg-slate-900 p-2 rounded-2xl border border-slate-800">
                <input
                  type="text"
                  placeholder="Escribe un mensaje de prueba..."
                  disabled
                  className="bg-transparent text-xs text-slate-400 flex-1 outline-none px-2"
                />
                <button
                  type="button"
                  disabled
                  className="p-2 bg-emerald-600 text-white rounded-xl opacity-80"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. MODAL PARA CREAR NUEVO PASO EN EL FLUJO */}
      {showCreateStepModal && (
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
                  <h3 className="text-sm font-black text-slate-900">Crear Nuevo Paso del Chatbot</h3>
                  <p className="text-[11px] text-slate-500">Agrega una respuesta automática, menú o derivación.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateStepModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Paso:</label>
                <input
                  type="text"
                  placeholder="ej: 🎉 Promo 2x1 en Gomitas Ácidas"
                  value={newStepForm.title}
                  onChange={(e) => setNewStepForm({ ...newStepForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Icono Emoji:</label>
                  <input
                    type="text"
                    value={newStepForm.icon}
                    onChange={(e) => setNewStepForm({ ...newStepForm, icon: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Etapa del Flujo:</label>
                  <select
                    value={newStepForm.phaseId}
                    onChange={(e) => setNewStepForm({ ...newStepForm, phaseId: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  >
                    {FLOW_PHASES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mensaje de Respuesta en WhatsApp:</label>
                <textarea
                  rows={5}
                  placeholder="Escribe el texto que responderá el bot..."
                  value={newStepForm.content}
                  onChange={(e) => setNewStepForm({ ...newStepForm, content: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-cyan-500 resize-y"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Palabras Clave de Activación (separadas por coma):
                </label>
                <input
                  type="text"
                  placeholder="ej: promo, 2x1, oferta, descuento"
                  value={newStepForm.keywords}
                  onChange={(e) => setNewStepForm({ ...newStepForm, keywords: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Siguiente Paso al que Avanza (Opcional):
                </label>
                <select
                  value={newStepForm.targetStepId}
                  onChange={(e) => setNewStepForm({ ...newStepForm, targetStepId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                >
                  <option value="">-- Sin siguiente paso --</option>
                  {steps.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCreateStepModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateStep}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md shadow-cyan-200"
              >
                + Crear Paso
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
