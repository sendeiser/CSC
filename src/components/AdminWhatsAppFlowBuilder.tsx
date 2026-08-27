import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, Plus, Trash2, RefreshCw,
  RotateCcw, ArrowRight,
  Layers,
  X, ZoomIn, ZoomOut,
  Sliders, Move,
  FlaskConical, Save, Search
} from 'lucide-react';
import { useModal } from '../context/ModalContext';
import { whatsappBotApi } from '../lib/api';
import type { CustomMenuOption } from '../lib/whatsappBotConstants';
import { DEFAULT_TEMPLATES, DEFAULT_CHATBOT_KEYWORDS } from '../lib/whatsappBotConstants';

export interface FlowNodeOutput {
  id: string;
  label: string;
  targetNodeId?: string;
  keyword?: string;
  badgeColor?: string;
}

export interface FlowNode {
  id: string;
  type: 'trigger' | 'menu' | 'option' | 'buy_catalog' | 'product_photo' | 'weight_calc' | 'cart' | 'shipping' | 'coupon' | 'payment' | 'confirmation' | 'notification' | 'custom';
  title: string;
  category: string;
  description: string;
  icon: string;
  color: 'purple' | 'emerald' | 'indigo' | 'amber' | 'pink' | 'blue' | 'slate' | 'rose' | 'cyan';
  x: number;
  y: number;
  fieldKey?: string;
  content: string;
  keywords?: string[];
  inputs: Array<{ id: string; label: string }>;
  outputs: FlowNodeOutput[];
  isCustom?: boolean;
}

export const INITIAL_FLOW_NODES: FlowNode[] = [
  // 1. DISPARADOR INICIAL
  {
    id: 'node_trigger',
    type: 'trigger',
    title: '⚡ Mensaje Entrante WhatsApp',
    category: 'Disparadores',
    description: 'Filtro inteligente de palabras clave comerciales y saludos',
    icon: '⚡',
    color: 'emerald',
    x: 40,
    y: 180,
    content: 'Detecta palabras como "hola", "pedido", "comprar", "gomitas", "precio", "1", "2", "3", "4", "5", etc.',
    keywords: ['hola', 'pedido', 'comprar', 'precio', 'gomitas', 'menu'],
    inputs: [],
    outputs: [
      { id: 'out_menu', label: '👋 Saludo / Menú', targetNodeId: 'node_menu', badgeColor: 'bg-purple-100 text-purple-900 border-purple-200' },
      { id: 'out_buy', label: '🛒 Escribe "COMPRAR"', targetNodeId: 'node_buy_catalog', badgeColor: 'bg-pink-100 text-pink-900 border-pink-200' },
      { id: 'out_photo', label: '📸 Escribe "FOTO"', targetNodeId: 'node_photo', badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200' },
      { id: 'out_status', label: '📦 Escribe "1" (Estado)', targetNodeId: 'node_opt1', badgeColor: 'bg-blue-100 text-blue-900 border-blue-200' }
    ]
  },

  // 2. MENÚ DE BIENVENIDA
  {
    id: 'node_menu',
    type: 'menu',
    title: '📋 Menú Principal de Bienvenida',
    category: 'Menú & Opciones',
    description: 'Presenta las opciones numéricas del 1 al 5 al cliente',
    icon: '📋',
    color: 'purple',
    x: 420,
    y: 80,
    fieldKey: 'template_menu',
    content: DEFAULT_TEMPLATES.template_menu,
    keywords: ['menu', 'menú', 'inicio', 'opciones'],
    inputs: [{ id: 'in_menu', label: 'Entrada' }],
    outputs: [
      { id: 'm_out_1', label: '1️⃣ Estado Pedido', targetNodeId: 'node_opt1', badgeColor: 'bg-blue-100 text-blue-900 border-blue-200' },
      { id: 'm_out_2', label: '2️⃣ Datos Bancarios', targetNodeId: 'node_opt2', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
      { id: 'm_out_3', label: '3️⃣ Horarios / Local', targetNodeId: 'node_opt3', badgeColor: 'bg-amber-100 text-amber-900 border-amber-200' },
      { id: 'm_out_4', label: '4️⃣ Catálogo y Precios', targetNodeId: 'node_opt4', badgeColor: 'bg-pink-100 text-pink-900 border-pink-200' },
      { id: 'm_out_5', label: '5️⃣ Asesor Humano', targetNodeId: 'node_opt5', badgeColor: 'bg-slate-100 text-slate-900 border-slate-200' }
    ]
  },

  // 3. OPCIONES BÁSICAS
  {
    id: 'node_opt1',
    type: 'option',
    title: '📦 Opción 1: Consulta de Pedido',
    category: 'Menú & Opciones',
    description: 'Busca el pedido del cliente en la BD y envía estado',
    icon: '📦',
    color: 'blue',
    x: 820,
    y: 20,
    fieldKey: 'menu_response_1',
    content: DEFAULT_TEMPLATES.menu_response_1,
    keywords: ['1', 'estado', 'seguimiento'],
    inputs: [{ id: 'in_opt1', label: 'Opción 1' }],
    outputs: []
  },
  {
    id: 'node_opt2',
    type: 'option',
    title: '🏦 Opción 2: Datos de Transferencia',
    category: 'Menú & Opciones',
    description: 'Envía Alias, CBU, Banco y Titular oficial para pagar',
    icon: '🏦',
    color: 'emerald',
    x: 820,
    y: 240,
    fieldKey: 'menu_response_2',
    content: DEFAULT_TEMPLATES.menu_response_2,
    keywords: ['2', 'alias', 'cbu', 'transferencia', 'banco'],
    inputs: [{ id: 'in_opt2', label: 'Opción 2' }],
    outputs: [
      { id: 'opt2_out_proof', label: '📸 Envía Comprobante', targetNodeId: 'node_proof', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200' }
    ]
  },
  {
    id: 'node_opt3',
    type: 'option',
    title: '📍 Opción 3: Horarios y Ubicación',
    category: 'Menú & Opciones',
    description: 'Dirección del local y franjas de retiro en Chamical',
    icon: '📍',
    color: 'amber',
    x: 820,
    y: 470,
    fieldKey: 'menu_response_3',
    content: DEFAULT_TEMPLATES.menu_response_3,
    keywords: ['3', 'horario', 'horarios', 'local', 'ubicacion', 'direccion'],
    inputs: [{ id: 'in_opt3', label: 'Opción 3' }],
    outputs: []
  },
  {
    id: 'node_opt4',
    type: 'option',
    title: '🛍️ Opción 4: Catálogo y Precios',
    category: 'Menú & Opciones',
    description: 'Listado de productos con precios y enlace a la tienda web',
    icon: '🛍️',
    color: 'pink',
    x: 820,
    y: 690,
    fieldKey: 'menu_response_4',
    content: DEFAULT_TEMPLATES.menu_response_4,
    keywords: ['4', 'catalogo', 'precios', 'productos'],
    inputs: [{ id: 'in_opt4', label: 'Opción 4' }],
    outputs: [
      { id: 'opt4_out_buy', label: '🛒 Armar Pedido', targetNodeId: 'node_buy_catalog', badgeColor: 'bg-pink-100 text-pink-900 border-pink-200' }
    ]
  },
  {
    id: 'node_opt5',
    type: 'option',
    title: '👤 Opción 5: Derivación Humana',
    category: 'Menú & Opciones',
    description: 'Pausa el bot y avisa al cliente que un asesor responderá',
    icon: '👤',
    color: 'slate',
    x: 820,
    y: 910,
    fieldKey: 'menu_response_5',
    content: DEFAULT_TEMPLATES.menu_response_5,
    keywords: ['5', 'humano', 'asesor', 'persona', 'ayuda'],
    inputs: [{ id: 'in_opt5', label: 'Opción 5' }],
    outputs: []
  },

  // 4. FLUJO DE COMPRA POR CHAT
  {
    id: 'node_buy_catalog',
    type: 'buy_catalog',
    title: '🛒 Menú de Compra Directa',
    category: 'Compra por Chat',
    description: 'Genera el catálogo numerado interactivo para seleccionar',
    icon: '🛒',
    color: 'pink',
    x: 420,
    y: 720,
    fieldKey: 'template_buy_catalog',
    content: DEFAULT_TEMPLATES.template_buy_catalog,
    keywords: ['comprar', 'compra', 'pedido directo'],
    inputs: [{ id: 'in_buy', label: 'Entrada' }],
    outputs: [
      { id: 'b_out_weight', label: '⚖️ Si es al Peso (Gramos)', targetNodeId: 'node_weight', badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200' },
      { id: 'b_out_unit', label: '🍫 Si es por Unidad', targetNodeId: 'node_unit', badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200' }
    ]
  },
  {
    id: 'node_photo',
    type: 'product_photo',
    title: '📸 Envío de Foto y Detalles',
    category: 'Compra por Chat',
    description: 'Envía la imagen real de la gomita seleccionada por WhatsApp',
    icon: '📸',
    color: 'indigo',
    x: 1220,
    y: 350,
    fieldKey: 'template_product_photo',
    content: DEFAULT_TEMPLATES.template_product_photo,
    keywords: ['foto', 'ver foto', 'imagen'],
    inputs: [{ id: 'in_photo', label: 'Entrada' }],
    outputs: [
      { id: 'photo_out_buy', label: '🛍️ Pedir Producto', targetNodeId: 'node_buy_catalog', badgeColor: 'bg-pink-100 text-pink-900 border-pink-200' }
    ]
  },
  {
    id: 'node_weight',
    type: 'weight_calc',
    title: '⚖️ Calculadora de Gramos',
    category: 'Compra por Chat',
    description: 'Calcula precio exacto según el gramaje seleccionado',
    icon: '⚖️',
    color: 'indigo',
    x: 1220,
    y: 600,
    fieldKey: 'template_weight_prompt',
    content: DEFAULT_TEMPLATES.template_weight_prompt,
    inputs: [{ id: 'in_weight', label: 'Entrada' }],
    outputs: [
      { id: 'w_out_cart', label: '🛒 Item Agregado', targetNodeId: 'node_cart_added', badgeColor: 'bg-pink-100 text-pink-900 border-pink-200' }
    ]
  },
  {
    id: 'node_unit',
    type: 'weight_calc',
    title: '🍫 Selector de Cantidad (Unidades)',
    category: 'Compra por Chat',
    description: 'Pregunta cuántas unidades del producto desea llevar',
    icon: '🍫',
    color: 'indigo',
    x: 1220,
    y: 830,
    fieldKey: 'template_unit_quantity_prompt',
    content: DEFAULT_TEMPLATES.template_unit_quantity_prompt,
    inputs: [{ id: 'in_unit', label: 'Entrada' }],
    outputs: [
      { id: 'u_out_cart', label: '🛒 Item Agregado', targetNodeId: 'node_cart_added', badgeColor: 'bg-pink-100 text-pink-900 border-pink-200' }
    ]
  },
  {
    id: 'node_cart_added',
    type: 'cart',
    title: '🛒 Carrito & Subtotal en Vivo',
    category: 'Compra por Chat',
    description: 'Muestra los items acumulados y el subtotal en tiempo real',
    icon: '🛒',
    color: 'pink',
    x: 1620,
    y: 680,
    fieldKey: 'template_cart_item_added',
    content: DEFAULT_TEMPLATES.template_cart_item_added,
    keywords: ['carrito', 'ver carrito', 'listo'],
    inputs: [{ id: 'in_cart', label: 'Entrada' }],
    outputs: [
      { id: 'c_out_more', label: '➕ Sumar Más Gomitas', targetNodeId: 'node_buy_catalog', badgeColor: 'bg-pink-100 text-pink-900 border-pink-200' },
      { id: 'c_out_ready', label: '✅ Escribe "LISTO"', targetNodeId: 'node_shipping', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200' }
    ]
  },
  {
    id: 'node_shipping',
    type: 'shipping',
    title: '🛵 Tipo de Entrega & Dirección',
    category: 'Compra por Chat',
    description: 'Retiro por el local o envío a domicilio en Chamical',
    icon: '🛵',
    color: 'amber',
    x: 2020,
    y: 680,
    fieldKey: 'template_shipping_prompt',
    content: DEFAULT_TEMPLATES.template_shipping_prompt,
    inputs: [{ id: 'in_shipping', label: 'Entrada' }],
    outputs: [
      { id: 's_out_coupon', label: '🎟️ Paso de Cupones', targetNodeId: 'node_coupon', badgeColor: 'bg-purple-100 text-purple-900 border-purple-200' }
    ]
  },
  {
    id: 'node_coupon',
    type: 'coupon',
    title: '🎟️ Validador de Cupones',
    category: 'Compra por Chat',
    description: 'Verifica cupones de descuento en Supabase y aplica descuento',
    icon: '🎟️',
    color: 'purple',
    x: 2420,
    y: 680,
    fieldKey: 'template_coupon_prompt',
    content: DEFAULT_TEMPLATES.template_coupon_prompt,
    inputs: [{ id: 'in_coupon', label: 'Entrada' }],
    outputs: [
      { id: 'coup_out_pay', label: '💳 Selección de Pago', targetNodeId: 'node_payment', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200' }
    ]
  },
  {
    id: 'node_payment',
    type: 'payment',
    title: '💳 Método de Pago & Resumen',
    category: 'Compra por Chat',
    description: 'Transferencia bancaria, Efectivo o Mercado Pago',
    icon: '💳',
    color: 'emerald',
    x: 2820,
    y: 680,
    fieldKey: 'template_payment_prompt',
    content: DEFAULT_TEMPLATES.template_payment_prompt,
    inputs: [{ id: 'in_payment', label: 'Entrada' }],
    outputs: [
      { id: 'pay_out_confirm', label: '🎉 Confirmar Pedido', targetNodeId: 'node_confirmed', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200' }
    ]
  },
  {
    id: 'node_confirmed',
    type: 'confirmation',
    title: '🎉 Confirmación & Registro en BD',
    category: 'Compra por Chat',
    description: 'Inserta el pedido real en las tablas orders & order_items',
    icon: '🎉',
    color: 'emerald',
    x: 3220,
    y: 680,
    fieldKey: 'template_order_confirmed',
    content: DEFAULT_TEMPLATES.template_order_confirmed,
    inputs: [{ id: 'in_confirmed', label: 'Entrada' }],
    outputs: []
  },

  // 5. RECEPCIÓN DE COMPROBANTE Y NOTIFICACIONES
  {
    id: 'node_proof',
    type: 'notification',
    title: '📸 Comprobante de Pago Recibido',
    category: 'Notificaciones',
    description: 'Respuesta automática cuando el cliente envía captura bancaria',
    icon: '📸',
    color: 'emerald',
    x: 1220,
    y: 120,
    fieldKey: 'template_payment_proof',
    content: DEFAULT_TEMPLATES.template_payment_proof,
    inputs: [{ id: 'in_proof', label: 'Entrada' }],
    outputs: []
  }
];

export interface AdminWhatsAppFlowBuilderProps {
  settings?: any;
  onUpdateSettings?: (newSettings: any) => Promise<void>;
  onOpenLab?: () => void;
  onOpenBotSettings?: () => void;
}

const NODE_COLORS: Record<string, { border: string; bgHeader: string; text: string; badge: string }> = {
  purple: { border: 'border-purple-200 hover:border-purple-400', bgHeader: 'bg-purple-50 text-purple-900', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-900 border-purple-200' },
  emerald: { border: 'border-emerald-200 hover:border-emerald-400', bgHeader: 'bg-emerald-50 text-emerald-900', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  indigo: { border: 'border-indigo-200 hover:border-indigo-400', bgHeader: 'bg-indigo-50 text-indigo-900', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-900 border-indigo-200' },
  amber: { border: 'border-amber-200 hover:border-amber-400', bgHeader: 'bg-amber-50 text-amber-900', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-900 border-amber-200' },
  pink: { border: 'border-pink-200 hover:border-pink-400', bgHeader: 'bg-pink-50 text-pink-900', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-900 border-pink-200' },
  blue: { border: 'border-blue-200 hover:border-blue-400', bgHeader: 'bg-blue-50 text-blue-900', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-900 border-blue-200' },
  slate: { border: 'border-slate-200 hover:border-slate-400', bgHeader: 'bg-slate-50 text-slate-900', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-900 border-slate-200' },
  rose: { border: 'border-rose-200 hover:border-rose-400', bgHeader: 'bg-rose-50 text-rose-900', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-900 border-rose-200' },
  cyan: { border: 'border-cyan-200 hover:border-cyan-400', bgHeader: 'bg-cyan-50 text-cyan-900', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-900 border-cyan-200' }
};

export const AdminWhatsAppFlowBuilder: React.FC<AdminWhatsAppFlowBuilderProps> = ({
  settings: propSettings,
  onUpdateSettings: propOnUpdateSettings,
  onOpenLab,
  onOpenBotSettings
}) => {
  const { showAlert, showConfirm } = useModal();
  
  // Estado local si se usa de forma standalone
  const [internalSettings, setInternalSettings] = useState<any>(propSettings || { ...DEFAULT_TEMPLATES, chatbot_keywords: DEFAULT_CHATBOT_KEYWORDS, custom_menu_options: [] });
  const [loadingInitial, setLoadingInitial] = useState(!propSettings);

  const activeSettings = propSettings || internalSettings;

  // Cargar configuración de WhatsApp en modo página independiente
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

  // Nodos del Canvas
  const [nodes, setNodes] = useState<FlowNode[]>(() => {
    const base = INITIAL_FLOW_NODES.map((node) => {
      if (node.fieldKey && activeSettings[node.fieldKey]) {
        return { ...node, content: activeSettings[node.fieldKey] };
      }
      return node;
    });

    // Agregar opciones personalizadas existentes como nodos
    if (Array.isArray(activeSettings.custom_menu_options)) {
      activeSettings.custom_menu_options.forEach((opt: CustomMenuOption, idx: number) => {
        base.push({
          id: `node_custom_${opt.id || opt.option_number}`,
          type: 'custom',
          title: `🏷️ Opción ${opt.option_number}: ${opt.title}`,
          category: 'Personalizados',
          description: `Opción adicional configurada por el admin`,
          icon: '🏷️',
          color: 'cyan',
          x: 820,
          y: 1120 + idx * 220,
          content: opt.response,
          keywords: opt.keywords || [opt.option_number],
          inputs: [{ id: `in_custom_${opt.id}`, label: `Opción ${opt.option_number}` }],
          outputs: [],
          isCustom: true
        });
      });
    }

    return base;
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string>('node_menu');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Transform & Pan / Zoom del Canvas
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 50, y: 30 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [nodeStartPos, setNodeStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Estado de Guardado
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Modales
  const [showCreateNodeModal, setShowCreateNodeModal] = useState(false);
  const [showInspectorDrawer, setShowInspectorDrawer] = useState(true);
  const [drawerTab, setDrawerTab] = useState<'content' | 'connections' | 'settings' | 'preview'>('content');

  // Formulario para Crear Nuevo Nodo
  const [newNodeForm, setNewNodeForm] = useState<{
    title: string;
    category: string;
    type: FlowNode['type'];
    icon: string;
    color: FlowNode['color'];
    content: string;
    keywords: string;
    targetNodeId: string;
  }>({
    title: '',
    category: 'Personalizados',
    type: 'custom',
    icon: '✨',
    color: 'cyan',
    content: '',
    keywords: '',
    targetNodeId: ''
  });

  // Estado para Nueva Salida en Inspector
  const [newOutputLabel, setNewOutputLabel] = useState('');
  const [newOutputTarget, setNewOutputTarget] = useState('');

  const canvasRef = useRef<HTMLDivElement>(null);

  // Nodo activo seleccionado
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  // 1. Manejo de Pan (Mover Canvas)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.flow-node-card') || (e.target as HTMLElement).closest('.no-pan')) {
      return;
    }
    setIsPanning(true);
    setDragStartPos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - dragStartPos.x,
        y: e.clientY - dragStartPos.y
      });
    } else if (draggedNodeId) {
      const deltaX = (e.clientX - dragStartPos.x) / zoom;
      const deltaY = (e.clientY - dragStartPos.y) / zoom;
      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggedNodeId
            ? { ...n, x: Math.max(20, Math.round(nodeStartPos.x + deltaX)), y: Math.max(20, Math.round(nodeStartPos.y + deltaY)) }
            : n
        )
      );
      setHasUnsavedChanges(true);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  // 2. Manejo de Drag de Nodo
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setDraggedNodeId(nodeId);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    const targetNode = nodes.find((n) => n.id === nodeId);
    if (targetNode) {
      setNodeStartPos({ x: targetNode.x, y: targetNode.y });
    }
  };

  // 3. Crear Nuevo Nodo
  const handleCreateNode = () => {
    if (!newNodeForm.title.trim()) {
      showAlert({ title: 'Título requerido', message: 'Escribe un título descriptivo para el paso.', type: 'warning' });
      return;
    }

    const newId = `node_custom_${Date.now()}`;
    const cleanKeywords = newNodeForm.keywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    // Calcular posición óptima en canvas (alrededor del centro visible)
    const newX = Math.round(-pan.x / zoom + 400 + Math.random() * 100);
    const newY = Math.round(-pan.y / zoom + 200 + Math.random() * 100);

    const createdNode: FlowNode = {
      id: newId,
      type: newNodeForm.type,
      title: `${newNodeForm.icon} ${newNodeForm.title}`,
      category: newNodeForm.category,
      description: `Nodo personalizado creado en el flujo`,
      icon: newNodeForm.icon,
      color: newNodeForm.color,
      x: Math.max(50, newX),
      y: Math.max(50, newY),
      content: newNodeForm.content || 'Mensaje de respuesta...',
      keywords: cleanKeywords,
      inputs: [{ id: `in_${newId}`, label: 'Entrada' }],
      outputs: newNodeForm.targetNodeId ? [
        {
          id: `out_${newId}_1`,
          label: 'Siguiente Paso',
          targetNodeId: newNodeForm.targetNodeId,
          badgeColor: NODE_COLORS[newNodeForm.color]?.badge
        }
      ] : [],
      isCustom: true
    };

    setNodes((prev) => [...prev, createdNode]);
    setSelectedNodeId(newId);
    setShowCreateNodeModal(false);
    setHasUnsavedChanges(true);

    // Reset form
    setNewNodeForm({
      title: '',
      category: 'Personalizados',
      type: 'custom',
      icon: '✨',
      color: 'cyan',
      content: '',
      keywords: '',
      targetNodeId: ''
    });

    showAlert({
      title: '¡Nodo Creado!',
      message: `El paso "${createdNode.title}" se agregó al canvas. Puedes conectarlo y editarlo cuando quieras.`,
      type: 'success'
    });
  };

  // 4. Editar Nodo Seleccionado
  const handleUpdateSelectedNode = (updates: Partial<FlowNode>) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedNodeId ? { ...n, ...updates } : n))
    );
    setHasUnsavedChanges(true);
  };

  // 5. Eliminar Nodo Seleccionado
  const handleDeleteNode = async (nodeIdToDelete: string) => {
    const nodeToDelete = nodes.find((n) => n.id === nodeIdToDelete);
    if (!nodeToDelete) return;

    const confirmed = await showConfirm({
      title: `¿Eliminar "${nodeToDelete.title}"?`,
      message: 'Este nodo y sus conexiones salientes se eliminarán del flujo.',
      confirmText: 'Eliminar Nodo',
      type: 'danger'
    });

    if (!confirmed) return;

    setNodes((prev) => {
      // 1. Filtrar el nodo
      const remaining = prev.filter((n) => n.id !== nodeIdToDelete);
      // 2. Limpiar conexiones huérfanas hacia este nodo
      return remaining.map((n) => ({
        ...n,
        outputs: n.outputs.filter((out) => out.targetNodeId !== nodeIdToDelete)
      }));
    });

    // Seleccionar otro nodo si eliminamos el actual
    if (selectedNodeId === nodeIdToDelete) {
      setSelectedNodeId(nodes[0]?.id || 'node_menu');
    }

    setHasUnsavedChanges(true);
    showAlert({ title: 'Nodo eliminado', message: 'El nodo y sus conexiones fueron removidos.', type: 'info' });
  };

  // 6. Agregar Conexión de Salida a un Nodo
  const handleAddOutputConnection = () => {
    if (!newOutputLabel.trim()) {
      showAlert({ title: 'Etiqueta requerida', message: 'Escribe el nombre de la opción (ej: "2️⃣ Ver Datos")', type: 'warning' });
      return;
    }

    const newOutput: FlowNodeOutput = {
      id: `out_${selectedNodeId}_${Date.now()}`,
      label: newOutputLabel.trim(),
      targetNodeId: newOutputTarget || undefined,
      badgeColor: NODE_COLORS[selectedNode.color]?.badge
    };

    handleUpdateSelectedNode({
      outputs: [...(selectedNode.outputs || []), newOutput]
    });

    setNewOutputLabel('');
    setNewOutputTarget('');
  };

  // 7. Eliminar Conexión de Salida
  const handleRemoveOutputConnection = (outputId: string) => {
    handleUpdateSelectedNode({
      outputs: (selectedNode.outputs || []).filter((o) => o.id !== outputId)
    });
  };

  // 8. Actualizar Destino de una Salida existente
  const handleUpdateOutputTarget = (outputId: string, newTargetNodeId: string) => {
    handleUpdateSelectedNode({
      outputs: (selectedNode.outputs || []).map((o) =>
        o.id === outputId ? { ...o, targetNodeId: newTargetNodeId || undefined } : o
      )
    });
  };

  // 9. Guardar Todo el Flujo en Supabase y Baileys
  const handleSaveAllFlow = async () => {
    setIsSaving(true);
    try {
      const updatedSettingsPayload = { ...activeSettings };

      // 1. Sincronizar plantillas del sistema
      nodes.forEach((node) => {
        if (node.fieldKey) {
          updatedSettingsPayload[node.fieldKey] = node.content;
        }
      });

      // 2. Extraer opciones personalizadas
      const customNodes = nodes.filter((n) => n.isCustom);
      const customOptions: CustomMenuOption[] = customNodes.map((n, idx) => {
        return {
          id: n.id.replace('node_custom_', ''),
          option_number: String(idx + 6),
          title: n.title.replace(/^[^\w\s]+/, '').trim(),
          keywords: n.keywords && n.keywords.length > 0 ? n.keywords : [String(idx + 6)],
          response: n.content
        };
      });
      updatedSettingsPayload.custom_menu_options = customOptions;

      // 3. Persistir vía API
      if (propOnUpdateSettings) {
        await propOnUpdateSettings(updatedSettingsPayload);
      } else {
        await whatsappBotApi.updateSettings(updatedSettingsPayload);
      }

      setInternalSettings(updatedSettingsPayload);
      setHasUnsavedChanges(false);

      showAlert({
        title: '¡Flujo Guardado con Éxito!',
        message: 'Todos los cambios de nodos, textos, palabras clave y conexiones se sincronizaron con el bot de WhatsApp.',
        type: 'success'
      });
    } catch (err: any) {
      showAlert({ title: 'Error al guardar', message: err.message || 'No se pudo guardar el flujo.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // 10. Restaurar Flujo Inicial por Defecto
  const handleResetToDefaultFlow = async () => {
    const confirmed = await showConfirm({
      title: '¿Restaurar flujo predeterminado?',
      message: 'Se reorganizarán los nodos del catálogo, compras, menús y notificaciones al diseño de fábrica.',
      confirmText: 'Restaurar',
      type: 'warning'
    });

    if (!confirmed) return;

    setNodes(INITIAL_FLOW_NODES);
    setPan({ x: 50, y: 30 });
    setZoom(0.85);
    setHasUnsavedChanges(true);
    showAlert({ title: 'Flujo restaurado', message: 'Los nodos se restauraron. Pulsa "Guardar Flujo" para confirmar.', type: 'info' });
  };

  // Filtrar Nodos Visibles
  const filteredNodes = nodes.filter((n) => {
    if (activeCategoryFilter !== 'all' && n.category !== activeCategoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || (n.keywords || []).some(k => k.toLowerCase().includes(q));
    }
    return true;
  });

  // Categorías Únicas
  const categoriesList = ['all', ...Array.from(new Set(nodes.map((n) => n.category)))];

  if (loadingInitial) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center space-y-3 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <RefreshCw className="w-8 h-8 text-cyan-600 animate-spin" />
        <p className="text-sm font-bold text-slate-700">Cargando constructor de flujo visual...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col space-y-4 font-sans">
      {/* 1. BARRA SUPERIOR DE CONTROL Y ESTADO */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-md shadow-cyan-200 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-black text-lg text-slate-900">Constructor de Flujo Visual WhatsApp (n8n Studio)</h1>
                <span className="px-2.5 py-0.5 bg-cyan-100 text-cyan-800 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                  Visual Engine
                </span>
                {hasUnsavedChanges && (
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full animate-pulse">
                    ● Cambios sin guardar
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Diseña, conecta, crea y elimina nodos de respuesta, menús, catálogo y disparadores con arrastrar y soltar.
              </p>
            </div>
          </div>
        </div>

        {/* Botones de Acción Global */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenLab && (
            <button
              type="button"
              onClick={onOpenLab}
              className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Probar en Laboratorio</span>
            </button>
          )}

          {onOpenBotSettings && (
            <button
              type="button"
              onClick={onOpenBotSettings}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Ajustes del Bot</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowCreateNodeModal(true)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-cyan-200"
          >
            <Plus className="w-4 h-4" />
            <span>+ Crear Nuevo Paso / Nodo</span>
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

      {/* 2. FILTROS RÁPIDOS & HERRAMIENTAS DE ZOOM */}
      <div className="bg-white rounded-2xl px-4 py-2.5 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Chips de Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto py-1">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCategoryFilter === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? `🌟 Todos (${nodes.length})` : `${cat} (${nodes.filter(n => n.category === cat).length})`}
            </button>
          ))}
        </div>

        {/* Buscador y Controles de Zoom */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar paso..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-cyan-500 w-36 sm:w-44"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
              className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
              title="Alejar Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-700 px-1">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
              className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
              title="Acercar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => { setZoom(0.85); setPan({ x: 50, y: 30 }); }}
              className="px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Restablecer Vista"
            >
              100%
            </button>
            <button
              type="button"
              onClick={handleResetToDefaultFlow}
              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Restaurar Nodos Predeterminados"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowInspectorDrawer(!showInspectorDrawer)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center space-x-1 ${
              showInspectorDrawer
                ? 'bg-cyan-50 border-cyan-200 text-cyan-800'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inspector</span>
          </button>
        </div>
      </div>

      {/* 3. ÁREA PRINCIPAL: CANVAS DE FLUJO + INSPECTOR LATERAL */}
      <div className="relative w-full h-[700px] bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex">
        {/* CANVAS WORKSPACE */}
        <div
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          className="flex-1 h-full relative overflow-hidden select-none cursor-grab active:cursor-grabbing bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px]"
        >
          {/* Capa de Transformación Zoom & Pan */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: '4500px',
              height: '2500px',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          >
            {/* Capa SVG para Curvas de Conexión */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <defs>
                <linearGradient id="flowLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {nodes.map((sourceNode) => {
                return (sourceNode.outputs || []).map((output) => {
                  if (!output.targetNodeId) return null;
                  const targetNode = nodes.find((n) => n.id === output.targetNodeId);
                  if (!targetNode) return null;

                  // Coordenadas origen y destino
                  const startX = sourceNode.x + 320;
                  const startY = sourceNode.y + 70;
                  const endX = targetNode.x;
                  const endY = targetNode.y + 45;

                  const dx = Math.abs(endX - startX) * 0.55;
                  const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

                  return (
                    <g key={`${sourceNode.id}_${output.id}_${targetNode.id}`}>
                      {/* Sombra de la línea */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="5"
                        strokeOpacity="0.15"
                      />
                      {/* Línea animada */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke="url(#flowLineGrad)"
                        strokeWidth="2.5"
                        strokeDasharray="6,4"
                      />
                      {/* Punto de unión en el destino */}
                      <circle cx={endX} cy={endY} r="4" fill="#a855f7" />
                    </g>
                  );
                });
              })}
            </svg>

            {/* Renderizado de Nodos */}
            {filteredNodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const colorTheme = NODE_COLORS[node.color] || NODE_COLORS.purple;

              return (
                <div
                  key={node.id}
                  id={`node-${node.id}`}
                  style={{
                    transform: `translate(${node.x}px, ${node.y}px)`,
                    width: '320px',
                    position: 'absolute'
                  }}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  className={`flow-node-card bg-white rounded-3xl shadow-xl transition-shadow border-2 select-none cursor-move z-10 ${
                    isSelected
                      ? 'ring-4 ring-cyan-400 border-cyan-500 shadow-2xl scale-[1.02]'
                      : `${colorTheme.border} hover:shadow-2xl`
                  }`}
                >
                  {/* Conector de Entrada (Izquierda) */}
                  {node.inputs && node.inputs.length > 0 && (
                    <div
                      className="absolute -left-3 top-8 w-6 h-6 rounded-full bg-slate-900 border-2 border-white shadow-md flex items-center justify-center text-[10px] text-white"
                      title="Punto de Entrada"
                    >
                      ●
                    </div>
                  )}

                  {/* Header del Nodo */}
                  <div className={`p-4 rounded-t-2xl border-b border-slate-100 flex items-center justify-between ${colorTheme.bgHeader}`}>
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className="text-xl shrink-0">{node.icon}</span>
                      <div className="truncate">
                        <span className="text-xs font-black block truncate text-slate-900">{node.title}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                          {node.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      {node.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNode(node.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar este nodo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Activo" />
                    </div>
                  </div>

                  {/* Cuerpo del Nodo */}
                  <div className="p-4 space-y-3 bg-white">
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-sans bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {node.content}
                    </p>

                    {/* Palabras Clave */}
                    {node.keywords && node.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {node.keywords.slice(0, 3).map((kw) => (
                          <span key={kw} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-mono">
                            #{kw}
                          </span>
                        ))}
                        {node.keywords.length > 3 && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px]">
                            +{node.keywords.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Conectores / Salidas (Outputs) */}
                    {node.outputs && node.outputs.length > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Opciones de Salida ({node.outputs.length}):
                        </span>
                        {node.outputs.map((out) => {
                          const target = nodes.find((n) => n.id === out.targetNodeId);
                          return (
                            <div
                              key={out.id}
                              className="flex items-center justify-between text-[11px] font-bold p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/60"
                            >
                              <span className="truncate pr-1 text-slate-700">{out.label}</span>
                              <div className="flex items-center space-x-1 shrink-0">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${out.badgeColor || 'bg-slate-200 text-slate-800'}`}>
                                  {target ? target.title.slice(0, 14) + '…' : 'Sin conexión'}
                                </span>
                                <ArrowRight className="w-3 h-3 text-cyan-600" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer del Nodo */}
                  <div className="px-4 py-2 bg-slate-50/70 rounded-b-2xl border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span>ID: {node.id}</span>
                    <span className="text-cyan-700 font-bold hover:underline cursor-pointer" onClick={() => setSelectedNodeId(node.id)}>
                      Editar en Inspector ➔
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mini Ayuda flotante */}
          <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md text-white/80 p-3 rounded-2xl text-xs border border-white/10 space-y-1 pointer-events-none z-20">
            <p className="font-bold text-white flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-cyan-400" />
              <span>Arrastra para mover el lienzo</span>
            </p>
            <p className="text-[11px] text-slate-400">
              Haz clic en cualquier nodo para abrir su editor e inspector lateral.
            </p>
          </div>
        </div>

        {/* 4. INSPECTOR LATERAL / DRAWER DEL NODO */}
        <AnimatePresence>
          {showInspectorDrawer && selectedNode && (
            <motion.div
              initial={{ x: 380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 380, opacity: 0 }}
              className="w-96 bg-white h-full border-l border-slate-200 shadow-2xl flex flex-col z-30 overflow-hidden"
            >
              {/* Header del Inspector */}
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 truncate">
                  <span className="text-2xl">{selectedNode.icon}</span>
                  <div className="truncate">
                    <h3 className="font-black text-sm text-slate-900 truncate">{selectedNode.title}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {selectedNode.category} • ID: {selectedNode.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {selectedNode.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteNode(selectedNode.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar este nodo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowInspectorDrawer(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pestañas del Inspector */}
              <div className="flex border-b border-slate-100 px-2 pt-2 bg-slate-50/50 gap-1">
                <button
                  type="button"
                  onClick={() => setDrawerTab('content')}
                  className={`flex-1 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
                    drawerTab === 'content'
                      ? 'bg-white text-cyan-700 border-t-2 border-cyan-600 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  📝 Mensaje
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab('connections')}
                  className={`flex-1 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
                    drawerTab === 'connections'
                      ? 'bg-white text-cyan-700 border-t-2 border-cyan-600 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  🔌 Salidas ({selectedNode.outputs?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab('settings')}
                  className={`flex-1 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
                    drawerTab === 'settings'
                      ? 'bg-white text-cyan-700 border-t-2 border-cyan-600 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  ⚙️ Opciones
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab('preview')}
                  className={`flex-1 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
                    drawerTab === 'preview'
                      ? 'bg-white text-cyan-700 border-t-2 border-cyan-600 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  📱 Preview
                </button>
              </div>

              {/* Contenido del Tab */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* TAB 1: CONTENIDO DEL MENSAJE */}
                {drawerTab === 'content' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Mensaje que enviará el Bot:
                      </label>
                      <textarea
                        rows={10}
                        value={selectedNode.content}
                        onChange={(e) => handleUpdateSelectedNode({ content: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-sans outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all resize-y leading-relaxed"
                        placeholder="Escribe el texto de respuesta..."
                      />
                    </div>

                    {/* Chips de Inserción de Variables Dinámicas */}
                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                      <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
                        Insertar Variables Dinámicas con 1 Toque:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {[
                          '{cliente}', '{pedido_id}', '{total}', '{estado}', 
                          '{direccion}', '{alias_banco}', '{cbu}', '{banco}', 
                          '{titular}', '{catalogo_url}', '{productos}'
                        ].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              handleUpdateSelectedNode({ content: selectedNode.content + ' ' + tag });
                            }}
                            className="px-2 py-1 bg-white hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: CONEXIONES Y SALIDAS (OUTPUTS) */}
                {drawerTab === 'connections' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Rutas y Opciones de Salida</h4>
                      <p className="text-[11px] text-slate-500">
                        Configura a qué nodo se redirige el cliente según la opción que elija.
                      </p>
                    </div>

                    {/* Lista de Salidas Actuales */}
                    <div className="space-y-2">
                      {(selectedNode.outputs || []).length === 0 ? (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                          Este nodo es terminal (no tiene salidas configuradas).
                        </div>
                      ) : (
                        selectedNode.outputs.map((out) => (
                          <div key={out.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800 truncate">{out.label}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveOutputConnection(out.id)}
                                className="text-slate-400 hover:text-red-600 p-1 rounded cursor-pointer"
                                title="Quitar salida"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                Redirige al Nodo:
                              </label>
                              <select
                                value={out.targetNodeId || ''}
                                onChange={(e) => handleUpdateOutputTarget(out.id, e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                              >
                                <option value="">-- Sin conexión --</option>
                                {nodes
                                  .filter((n) => n.id !== selectedNode.id)
                                  .map((n) => (
                                    <option key={n.id} value={n.id}>
                                      {n.icon} {n.title}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Agregar Nueva Salida */}
                    <div className="p-3.5 bg-cyan-50/60 rounded-2xl border border-cyan-200/80 space-y-2.5">
                      <span className="text-xs font-black text-cyan-950 block">
                        + Conectar Nueva Opción / Bifurcación
                      </span>

                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                          Etiqueta de la Opción:
                        </label>
                        <input
                          type="text"
                          placeholder="ej: 1️⃣ Consultar Estado"
                          value={newOutputLabel}
                          onChange={(e) => setNewOutputLabel(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                          Nodo de Destino:
                        </label>
                        <select
                          value={newOutputTarget}
                          onChange={(e) => setNewOutputTarget(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                        >
                          <option value="">-- Seleccionar destino --</option>
                          {nodes
                            .filter((n) => n.id !== selectedNode.id)
                            .map((n) => (
                              <option key={n.id} value={n.id}>
                                {n.icon} {n.title}
                              </option>
                            ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddOutputConnection}
                        className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        + Agregar Conexión
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 3: PROPIEDADES & PALABRAS CLAVE */}
                {drawerTab === 'settings' && (
                  <div className="space-y-3.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Título del Paso:
                      </label>
                      <input
                        type="text"
                        value={selectedNode.title}
                        onChange={(e) => handleUpdateSelectedNode({ title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Icono Emoji:
                        </label>
                        <input
                          type="text"
                          value={selectedNode.icon}
                          onChange={(e) => handleUpdateSelectedNode({ icon: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center font-bold outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Color Temático:
                        </label>
                        <select
                          value={selectedNode.color}
                          onChange={(e) => handleUpdateSelectedNode({ color: e.target.value as any })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                        >
                          <option value="purple">Morado</option>
                          <option value="emerald">Esmeralda</option>
                          <option value="indigo">Índigo</option>
                          <option value="amber">Ámbar</option>
                          <option value="pink">Rosa</option>
                          <option value="blue">Azul</option>
                          <option value="cyan">Cian</option>
                          <option value="slate">Gris</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Palabras Clave de Activación (separadas por coma):
                      </label>
                      <input
                        type="text"
                        value={(selectedNode.keywords || []).join(', ')}
                        onChange={(e) => {
                          const list = e.target.value.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);
                          handleUpdateSelectedNode({ keywords: list });
                        }}
                        placeholder="ej: promo, 2x1, oferta"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Categoría:
                      </label>
                      <input
                        type="text"
                        value={selectedNode.category}
                        onChange={(e) => handleUpdateSelectedNode({ category: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 4: VISTA PREVIA SIMULADA EN WHATSAPP */}
                {drawerTab === 'preview' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-900 rounded-2xl text-white space-y-2">
                      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                        <Bot className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold">Simulación WhatsApp en Vivo</span>
                      </div>

                      <div className="p-3 bg-emerald-950/80 rounded-xl border border-emerald-800 text-xs text-emerald-100 font-sans whitespace-pre-wrap leading-relaxed">
                        {selectedNode.content
                          .replace('{cliente}', 'Mariana')
                          .replace('{pedido_id}', 'ORD-8921')
                          .replace('{total}', '14.500')
                          .replace('{estado}', 'En preparación')
                          .replace('{alias_banco}', 'martinchox33')
                          .replace('{cbu}', '0000003100012345678901')
                          .replace('{banco}', 'Mercado Pago')
                          .replace('{titular}', 'Gonzalez Martin Gustavo')
                          .replace('{direccion}', 'Castro Barros 450, Chamical')}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer del Inspector */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-bold">
                  {hasUnsavedChanges ? '⚠️ Cambios pendientes' : '✓ Todo sincronizado'}
                </span>

                <button
                  type="button"
                  onClick={handleSaveAllFlow}
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : 'Aplicar y Guardar'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. MODAL PARA CREAR NUEVO NODO EN EL FLUJO */}
      {showCreateNodeModal && (
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
                  <h3 className="text-sm font-black text-slate-900">Crear Nuevo Paso en el Flujo</h3>
                  <p className="text-[11px] text-slate-500">Agrega respuestas automáticas, menús o bifurcaciones personalizadas.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateNodeModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Título del Paso:</label>
                <input
                  type="text"
                  placeholder="ej: 🎉 Promoción 2x1 en Gomitas Ácidas"
                  value={newNodeForm.title}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Icono Emoji:</label>
                  <input
                    type="text"
                    value={newNodeForm.icon}
                    onChange={(e) => setNewNodeForm({ ...newNodeForm, icon: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Color Temático:</label>
                  <select
                    value={newNodeForm.color}
                    onChange={(e) => setNewNodeForm({ ...newNodeForm, color: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="cyan">Cian (Personalizado)</option>
                    <option value="purple">Morado</option>
                    <option value="emerald">Esmeralda</option>
                    <option value="pink">Rosa</option>
                    <option value="amber">Ámbar</option>
                    <option value="indigo">Índigo</option>
                    <option value="blue">Azul</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mensaje de Respuesta:</label>
                <textarea
                  rows={5}
                  placeholder="Escribe el texto que enviará el bot cuando se active este paso..."
                  value={newNodeForm.content}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, content: e.target.value })}
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
                  value={newNodeForm.keywords}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, keywords: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Conectar Salida hacia otro Paso (Opcional):
                </label>
                <select
                  value={newNodeForm.targetNodeId}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, targetNodeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                >
                  <option value="">-- Sin conexión inicial --</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.icon} {n.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCreateNodeModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateNode}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md shadow-cyan-200"
              >
                + Crear Nodo
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
