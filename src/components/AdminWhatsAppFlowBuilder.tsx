import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Bot, Sparkles, Plus, Trash2, Check, RefreshCw, Eye, 
  RotateCcw, ArrowRight, CornerDownRight, Smartphone,
  Layers, MessageSquare, ShoppingBag, Truck, CreditCard,
  CheckCircle2, X, ZoomIn, ZoomOut, Maximize2, Zap,
  Sliders, ShieldCheck, Tag, Info, Image as ImageIcon,
  FlaskConical, Move, MousePointer, HelpCircle
} from 'lucide-react';
import { useModal } from '../context/ModalContext';
import type { CustomMenuOption } from '../lib/whatsappBotConstants';
import { DEFAULT_TEMPLATES } from '../lib/whatsappBotConstants';

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
  color: string; // 'purple' | 'emerald' | 'indigo' | 'amber' | 'pink' | 'blue' | 'slate'
  x: number;
  y: number;
  fieldKey?: string;
  content: string;
  inputs: Array<{ id: string; label: string }>;
  outputs: FlowNodeOutput[];
}

export const INITIAL_FLOW_NODES: FlowNode[] = [
  // 1. DISPARADOR INICIAL
  {
    id: 'node_trigger',
    type: 'trigger',
    title: '⚡ Mensaje Entrante WhatsApp',
    category: 'Disparador',
    description: 'Filtro inteligente de palabras clave comerciales (Método 3)',
    icon: '⚡',
    color: 'emerald',
    x: 40,
    y: 180,
    content: 'Detecta palabras como "hola", "pedido", "comprar", "gomitas", "precio", "1", "2", "3", "4", "5", etc.',
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
    x: 380,
    y: 80,
    fieldKey: 'template_menu',
    content: DEFAULT_TEMPLATES.template_menu,
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
    x: 740,
    y: 20,
    fieldKey: 'menu_response_1',
    content: DEFAULT_TEMPLATES.menu_response_1,
    inputs: [{ id: 'in_opt1', label: 'Opción 1' }],
    outputs: []
  },
  {
    id: 'node_opt2',
    type: 'option',
    title: '🏦 Opción 2: Datos Bancarios',
    category: 'Menú & Opciones',
    description: 'Envía Alias, CBU, Banco y Titular',
    icon: '🏦',
    color: 'emerald',
    x: 740,
    y: 140,
    fieldKey: 'menu_response_2',
    content: DEFAULT_TEMPLATES.menu_response_2,
    inputs: [{ id: 'in_opt2', label: 'Opción 2' }],
    outputs: [{ id: 'out_proof', label: '📸 Envía Comprobante', targetNodeId: 'node_proof', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200' }]
  },
  {
    id: 'node_opt3',
    type: 'option',
    title: '📍 Opción 3: Horarios y Ubicación',
    category: 'Menú & Opciones',
    description: 'Envía dirección física en Chamical y horarios',
    icon: '📍',
    color: 'amber',
    x: 740,
    y: 260,
    fieldKey: 'menu_response_3',
    content: DEFAULT_TEMPLATES.menu_response_3,
    inputs: [{ id: 'in_opt3', label: 'Opción 3' }],
    outputs: []
  },
  {
    id: 'node_opt4',
    type: 'option',
    title: '🛍️ Opción 4: Catálogo y Precios',
    category: 'Menú & Opciones',
    description: 'Envía lista de productos y link a la tienda web',
    icon: '🛍️',
    color: 'pink',
    x: 740,
    y: 380,
    fieldKey: 'menu_response_4',
    content: DEFAULT_TEMPLATES.menu_response_4,
    inputs: [{ id: 'in_opt4', label: 'Opción 4' }],
    outputs: [{ id: 'out_start_buy', label: '🛒 Iniciar Compra', targetNodeId: 'node_buy_catalog', badgeColor: 'bg-pink-100 text-pink-900 border-pink-200' }]
  },
  {
    id: 'node_opt5',
    type: 'option',
    title: '👤 Opción 5: Asesor Humano',
    category: 'Menú & Opciones',
    description: 'Deriva la consulta al equipo de atención',
    icon: '👤',
    color: 'slate',
    x: 740,
    y: 500,
    fieldKey: 'menu_response_5',
    content: DEFAULT_TEMPLATES.menu_response_5,
    inputs: [{ id: 'in_opt5', label: 'Opción 5' }],
    outputs: []
  },

  // 4. FLUJO DE COMPRA DIRECTA POR CHAT
  {
    id: 'node_buy_catalog',
    type: 'buy_catalog',
    title: '🛒 Catálogo de Compra Directa',
    category: 'Compra por Chat',
    description: 'Lista los productos activos desde Supabase con stock > 0',
    icon: '🛒',
    color: 'pink',
    x: 380,
    y: 640,
    fieldKey: 'template_buy_catalog',
    content: DEFAULT_TEMPLATES.template_buy_catalog,
    inputs: [{ id: 'in_buy', label: 'Entrada' }],
    outputs: [
      { id: 'buy_out_weight', label: '⚖️ Elige Golosina al Peso', targetNodeId: 'node_weight', badgeColor: 'bg-purple-100 text-purple-900 border-purple-200' },
      { id: 'buy_out_unit', label: '🍫 Elige Producto por Unidad', targetNodeId: 'node_unit', badgeColor: 'bg-amber-100 text-amber-900 border-amber-200' },
      { id: 'buy_out_photo', label: '📸 Pide "FOTO [N]"', targetNodeId: 'node_photo', badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200' }
    ]
  },
  {
    id: 'node_photo',
    type: 'product_photo',
    title: '📸 Ficha y Foto HD de Producto',
    category: 'Compra por Chat',
    description: 'Envía la foto real, precio, dietas y descripción',
    icon: '📸',
    color: 'indigo',
    x: 740,
    y: 640,
    fieldKey: 'template_product_photo',
    content: DEFAULT_TEMPLATES.template_product_photo,
    inputs: [{ id: 'in_photo', label: 'Entrada' }],
    outputs: [
      { id: 'photo_out_buy', label: '👉 Elegir Cantidad', targetNodeId: 'node_weight', badgeColor: 'bg-purple-100 text-purple-900 border-purple-200' }
    ]
  },
  {
    id: 'node_weight',
    type: 'weight_calc',
    title: '⚖️ Selección de Gramajes (Venta al Peso)',
    category: 'Compra por Chat',
    description: 'Pregunta 25g, 50g, 100g, 250g, 500g o gramos libres',
    icon: '⚖️',
    color: 'purple',
    x: 1080,
    y: 640,
    fieldKey: 'template_weight_prompt',
    content: DEFAULT_TEMPLATES.template_weight_prompt,
    inputs: [{ id: 'in_weight', label: 'Entrada' }],
    outputs: [
      { id: 'weight_out_cart', label: '➕ Sumar al Carrito', targetNodeId: 'node_cart', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200' }
    ]
  },
  {
    id: 'node_unit',
    type: 'weight_calc',
    title: '🍫 Cantidad por Unidad',
    category: 'Compra por Chat',
    description: 'Pregunta cuántas unidades llevar (1, 2, 3...)',
    icon: '🍫',
    color: 'amber',
    x: 1080,
    y: 780,
    fieldKey: 'template_unit_quantity_prompt',
    content: DEFAULT_TEMPLATES.template_unit_quantity_prompt,
    inputs: [{ id: 'in_unit', label: 'Entrada' }],
    outputs: [
      { id: 'unit_out_cart', label: '➕ Sumar al Carrito', targetNodeId: 'node_cart', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200' }
    ]
  },
  {
    id: 'node_cart',
    type: 'cart',
    title: '🛒 Carrito & Subtotales',
    category: 'Compra por Chat',
    description: 'Muestra lista de items agregados y subtotal en vivo',
    icon: '🛒',
    color: 'emerald',
    x: 1420,
    y: 640,
    fieldKey: 'template_cart_item_added',
    content: DEFAULT_TEMPLATES.template_cart_item_added,
    inputs: [{ id: 'in_cart', label: 'Entrada' }],
    outputs: [
      { id: 'cart_out_more', label: '➕ Sumar más golosinas', targetNodeId: 'node_buy_catalog', badgeColor: 'bg-pink-100 text-pink-900 border-pink-200' },
      { id: 'cart_out_ready', label: '🛵 Escribe "LISTO"', targetNodeId: 'node_shipping', badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200' }
    ]
  },
  {
    id: 'node_shipping',
    type: 'shipping',
    title: '🛵 Método de Entrega & Dirección',
    category: 'Compra por Chat',
    description: 'Opciones: Retiro en Local vs. Cadete a Domicilio',
    icon: '🛵',
    color: 'indigo',
    x: 1760,
    y: 640,
    fieldKey: 'template_shipping_prompt',
    content: DEFAULT_TEMPLATES.template_shipping_prompt,
    inputs: [{ id: 'in_shipping', label: 'Entrada' }],
    outputs: [
      { id: 'ship_out_coupon', label: '🎟️ Preguntar Cupón', targetNodeId: 'node_coupon', badgeColor: 'bg-amber-100 text-amber-900 border-amber-200' }
    ]
  },
  {
    id: 'node_coupon',
    type: 'coupon',
    title: '🎟️ Validador de Cupones Promo',
    category: 'Compra por Chat',
    description: 'Valida códigos en la tabla promo_codes de Supabase',
    icon: '🎟️',
    color: 'amber',
    x: 2100,
    y: 640,
    fieldKey: 'template_coupon_prompt',
    content: DEFAULT_TEMPLATES.template_coupon_prompt,
    inputs: [{ id: 'in_coupon', label: 'Entrada' }],
    outputs: [
      { id: 'coupon_out_pay', label: '💳 Selección de Pago', targetNodeId: 'node_payment', badgeColor: 'bg-purple-100 text-purple-900 border-purple-200' }
    ]
  },
  {
    id: 'node_payment',
    type: 'payment',
    title: '💳 Medio de Pago & Resumen',
    category: 'Compra por Chat',
    description: 'Opciones: Transferencia, Efectivo o Mercado Pago',
    icon: '💳',
    color: 'purple',
    x: 2440,
    y: 640,
    fieldKey: 'template_order_summary',
    content: DEFAULT_TEMPLATES.template_order_summary,
    inputs: [{ id: 'in_payment', label: 'Entrada' }],
    outputs: [
      { id: 'pay_out_confirm', label: '👍 Cliente responde "SI"', targetNodeId: 'node_confirmed', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200' }
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
    x: 2780,
    y: 640,
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
    x: 1080,
    y: 140,
    fieldKey: 'template_payment_proof',
    content: DEFAULT_TEMPLATES.template_payment_proof,
    inputs: [{ id: 'in_proof', label: 'Entrada' }],
    outputs: []
  }
];

export interface AdminWhatsAppFlowBuilderProps {
  settings: any;
  onUpdateSettings: (newSettings: any) => Promise<void>;
  onOpenLab?: () => void;
}

export const AdminWhatsAppFlowBuilder: React.FC<AdminWhatsAppFlowBuilderProps> = ({
  settings,
  onUpdateSettings,
  onOpenLab
}) => {
  const { showAlert } = useModal();
  const [nodes, setNodes] = useState<FlowNode[]>(() => {
    // Sincronizar contenidos iniciales con las plantillas actuales de settings
    return INITIAL_FLOW_NODES.map((node) => {
      if (node.fieldKey && settings[node.fieldKey]) {
        return { ...node, content: settings[node.fieldKey] };
      }
      return node;
    });
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string>('node_menu');
  const [zoom, setZoom] = useState<number>(0.9);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 20 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [nodeStartPos, setNodeStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Sincronizar cambios en settings hacia los nodos
  useEffect(() => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.fieldKey && settings[node.fieldKey]) {
          return { ...node, content: settings[node.fieldKey] };
        }
        return node;
      })
    );
  }, [settings]);

  // Manejo de Drag del Canvas (Pan)
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
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  // Manejo de Drag de Nodos Individuales
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

  // Actualizar contenido de una plantilla desde el inspector del nodo
  const handleUpdateNodeContent = (newContent: string) => {
    const updatedNodes = nodes.map((n) => (n.id === selectedNodeId ? { ...n, content: newContent } : n));
    setNodes(updatedNodes);

    const activeNode = nodes.find((n) => n.id === selectedNodeId);
    if (activeNode?.fieldKey) {
      const updatedSettings = { ...settings, [activeNode.fieldKey]: newContent };
      // Actualización local inmediata
      onUpdateSettings(updatedSettings);
    }
  };

  // Guardar todo el flujo visual en la base de datos
  const handleSaveFlowToDatabase = async () => {
    setIsSaving(true);
    try {
      const newSettingsPayload = { ...settings };
      nodes.forEach((node) => {
        if (node.fieldKey) {
          newSettingsPayload[node.fieldKey] = node.content;
        }
      });
      await onUpdateSettings(newSettingsPayload);
      showAlert({
        title: '¡Flujo Visual Guardado!',
        message: 'Todas las rutas, nodos y plantillas del bot se guardaron en la base de datos de Supabase.',
        type: 'success'
      });
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: err.message || 'No se pudo guardar el flujo en la base de datos',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Restaurar plantilla original del nodo activo
  const handleRestoreActiveTemplate = () => {
    const activeNode = nodes.find((n) => n.id === selectedNodeId);
    if (activeNode?.fieldKey && (DEFAULT_TEMPLATES as any)[activeNode.fieldKey] !== undefined) {
      const defaultText = (DEFAULT_TEMPLATES as any)[activeNode.fieldKey];
      handleUpdateNodeContent(defaultText);
      showAlert({ title: 'Plantilla Restaurada', message: 'Se restableció el texto original del nodo.', type: 'info' });
    }
  };

  // Insertar variable en el nodo activo
  const handleInsertVar = (varTag: string) => {
    const activeNode = nodes.find((n) => n.id === selectedNodeId);
    if (activeNode) {
      handleUpdateNodeContent((activeNode.content || '') + varTag);
    }
  };

  // Resetear Zoom y Pan (Fit View)
  const handleFitView = () => {
    setZoom(0.85);
    setPan({ x: 30, y: 30 });
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  // Cálculo de Cables Bézier SVG conectando salidas con entradas
  const renderConnections = () => {
    const connections: Array<{
      id: string;
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      label: string;
      colorClass: string;
    }> = [];

    nodes.forEach((sourceNode) => {
      sourceNode.outputs.forEach((output, outIdx) => {
        if (output.targetNodeId) {
          const targetNode = nodes.find((n) => n.id === output.targetNodeId);
          if (targetNode) {
            const startX = sourceNode.x + 280; // Ancho de tarjeta
            const startY = sourceNode.y + 70 + outIdx * 28;
            const endX = targetNode.x;
            const endY = targetNode.y + 40;

            connections.push({
              id: `${sourceNode.id}_${output.id}_to_${targetNode.id}`,
              startX,
              startY,
              endX,
              endY,
              label: output.label,
              colorClass: sourceNode.color === 'emerald' ? '#10b981' : sourceNode.color === 'pink' ? '#ec4899' : sourceNode.color === 'indigo' ? '#6366f1' : '#9333ea'
            });
          }
        }
      });
    });

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ minWidth: '4000px', minHeight: '2000px' }}>
        <defs>
          <marker id="arrow-purple" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 Z" fill="#9333ea" />
          </marker>
          <marker id="arrow-emerald" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 Z" fill="#10b981" />
          </marker>
          <marker id="arrow-pink" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 Z" fill="#ec4899" />
          </marker>
          <marker id="arrow-indigo" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 Z" fill="#6366f1" />
          </marker>
        </defs>

        {connections.map((c) => {
          const deltaX = Math.abs(c.endX - c.startX) * 0.5;
          const pathD = `M ${c.startX} ${c.startY} C ${c.startX + Math.max(40, deltaX)} ${c.startY}, ${c.endX - Math.max(40, deltaX)} ${c.endY}, ${c.endX} ${c.endY}`;
          const isSelected = selectedNode?.id && (c.id.includes(selectedNode.id));

          return (
            <g key={c.id}>
              {/* Sombra de cable */}
              <path
                d={pathD}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth={isSelected ? '5' : '3'}
                strokeOpacity="0.4"
              />
              {/* Cable Principal Bézier */}
              <path
                d={pathD}
                fill="none"
                stroke={c.colorClass}
                strokeWidth={isSelected ? '3.5' : '2.5'}
                strokeDasharray={isSelected ? '6,3' : 'none'}
                className={isSelected ? 'animate-pulse' : ''}
                markerEnd={
                  c.colorClass === '#10b981' ? 'url(#arrow-emerald)' :
                  c.colorClass === '#ec4899' ? 'url(#arrow-pink)' :
                  c.colorClass === '#6366f1' ? 'url(#arrow-indigo)' :
                  'url(#arrow-purple)'
                }
              />
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-4">
      
      {/* BARRA SUPERIOR DE HERRAMIENTAS Y ACCIONES DEL FLOW BUILDER */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-200 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900 tracking-tight">Constructor de Flujos Visual (Estilo n8n)</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200">
                {nodes.length} Nodos Conectados
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Arrastra los nodos por el lienzo, edita sus plantillas y conecta las rutas de conversación.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Controles de Zoom */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
              className="p-1.5 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Reducir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[10px] font-mono">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(1))))}
              className="p-1.5 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleFitView}
              className="p-1.5 hover:bg-white rounded-lg transition-colors cursor-pointer ml-1"
              title="Ajustar Vista (Fit View)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Botón Abrir Sandbox */}
          {onOpenLab && (
            <button
              type="button"
              onClick={onOpenLab}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
              <span>Probar en Sandbox</span>
            </button>
          )}

          {/* Botón Guardar en Base de Datos */}
          <button
            type="button"
            onClick={handleSaveFlowToDatabase}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-200 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Flujo en BD'}</span>
          </button>
        </div>
      </div>

      {/* ÁREA DE TRABAJO: LIENZO (CANVAS) A LA IZQUIERDA + INSPECTOR A LA DERECHA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* LIENZO DE NODOS VISUALES (8 COLS) */}
        <div className="lg:col-span-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden relative h-[650px] select-none">
          
          {/* Fondo Punteado n8n Grid */}
          <div 
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing relative bg-[#0b1120] bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:24px_24px]"
          >
            {/* Contenedor Escalado y Desplazado */}
            <div 
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                transition: isPanning || draggedNodeId ? 'none' : 'transform 0.15s ease-out'
              }}
              className="absolute inset-0"
            >
              {/* Conectores SVG Curvados */}
              {renderConnections()}

              {/* Render de Nodos Interactivos */}
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                return (
                  <div
                    key={node.id}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      width: '280px'
                    }}
                    className={`flow-node-card absolute rounded-2xl shadow-xl transition-shadow cursor-pointer ${
                      isSelected 
                        ? 'ring-3 ring-purple-500 shadow-purple-500/20 z-30' 
                        : 'hover:ring-2 hover:ring-slate-500 z-10'
                    } ${
                      node.color === 'emerald' ? 'bg-slate-900/95 border-2 border-emerald-500/70' :
                      node.color === 'pink' ? 'bg-slate-900/95 border-2 border-pink-500/70' :
                      node.color === 'indigo' ? 'bg-slate-900/95 border-2 border-indigo-500/70' :
                      node.color === 'amber' ? 'bg-slate-900/95 border-2 border-amber-500/70' :
                      node.color === 'blue' ? 'bg-slate-900/95 border-2 border-sky-500/70' :
                      'bg-slate-900/95 border-2 border-purple-500/70'
                    }`}
                  >
                    {/* Header del Nodo */}
                    <div className="p-3 bg-slate-800/80 rounded-t-2xl border-b border-slate-700/80 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{node.icon}</span>
                        <div>
                          <p className="text-xs font-black text-white truncate max-w-[170px]">{node.title}</p>
                          <p className="text-[9px] text-slate-400 font-semibold">{node.category}</p>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                        node.color === 'emerald' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                        node.color === 'pink' ? 'bg-pink-950 text-pink-300 border border-pink-700' :
                        node.color === 'indigo' ? 'bg-indigo-950 text-indigo-300 border border-indigo-700' :
                        node.color === 'amber' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                        'bg-purple-950 text-purple-300 border border-purple-700'
                      }`}>
                        {node.type}
                      </span>
                    </div>

                    {/* Cuerpo del Nodo: Vista previa del mensaje */}
                    <div className="p-3 space-y-2 text-xs">
                      <p className="text-[11px] text-slate-300 line-clamp-2 font-mono bg-slate-950/70 p-2 rounded-xl border border-slate-800 leading-snug">
                        {node.content}
                      </p>

                      {/* Salidas / Conexiones */}
                      {node.outputs.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Rutas de Salida:</span>
                          <div className="space-y-1">
                            {node.outputs.map((out) => (
                              <div
                                key={out.id}
                                className="flex items-center justify-between p-1 px-2 rounded-lg bg-slate-800/90 text-[10px] text-slate-200 border border-slate-700/60"
                              >
                                <span className="truncate max-w-[190px] font-medium">{out.label}</span>
                                <div className="w-2 h-2 rounded-full bg-purple-400 ring-2 ring-purple-600 shrink-0" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mini Guía Flotante */}
          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800 text-[10px] text-slate-400 flex items-center gap-3 pointer-events-none">
            <span className="flex items-center gap-1">
              <Move className="w-3 h-3 text-purple-400" />
              <span>Arrastra para mover nodos</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MousePointer className="w-3 h-3 text-emerald-400" />
              <span>Clic para editar plantilla</span>
            </span>
          </div>
        </div>

        {/* PANEL INSPECTOR LATERAL DEL NODO SELECCIONADO (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
            
            {/* Header del Inspector */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
                  {selectedNode.icon}
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 truncate max-w-[190px]">{selectedNode.title}</h3>
                  <p className="text-[10px] text-purple-700 font-semibold">{selectedNode.category}</p>
                </div>
              </div>

              {selectedNode.fieldKey && (
                <button
                  type="button"
                  onClick={handleRestoreActiveTemplate}
                  className="text-[10px] text-slate-500 hover:text-purple-700 flex items-center gap-1 font-semibold cursor-pointer"
                  title="Restaurar a texto predeterminado"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Original</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              {selectedNode.description}
            </p>

            {/* Chips de Variables Dinámicas */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                🏷️ Variables disponibles (toca para insertar):
              </span>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                {[
                  { tag: '{cliente}', label: 'Cliente' },
                  { tag: '{pedido_id}', label: 'ID Pedido' },
                  { tag: '{total}', label: 'Total $' },
                  { tag: '{subtotal}', label: 'Subtotal' },
                  { tag: '{descuento}', label: 'Descuento' },
                  { tag: '{cupon}', label: 'Cupón' },
                  { tag: '{catalogo_lista}', label: 'Lista Productos' },
                  { tag: '{direccion}', label: 'Dirección' },
                  { tag: '{alias_banco}', label: 'Alias' },
                  { tag: '{banco}', label: 'Banco' },
                  { tag: '{cbu}', label: 'CBU' },
                  { tag: '{horarios}', label: 'Horarios' }
                ].map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleInsertVar(v.tag)}
                    className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-colors"
                  >
                    {v.tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor de Contenido / Mensaje */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-700 block uppercase tracking-wider">
                📝 Plantilla de Mensaje del Bot:
              </label>
              <textarea
                rows={9}
                value={selectedNode.content}
                onChange={(e) => handleUpdateNodeContent(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono leading-relaxed outline-none focus:ring-2 focus:ring-purple-400 text-slate-800 shadow-inner"
                placeholder="Escribe el mensaje de este paso..."
              />
            </div>

            {/* Rutas de Salida Configuradas */}
            {selectedNode.outputs.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-700 block uppercase tracking-wider">
                  🔀 Ramificaciones / Opciones de Salida:
                </span>
                <div className="space-y-1.5">
                  {selectedNode.outputs.map((out, idx) => (
                    <div key={out.id} className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{out.label}</span>
                      <span className="text-[10px] font-mono text-purple-700 font-bold">
                        👉 {nodes.find((n) => n.id === out.targetNodeId)?.title?.slice(0, 18) || 'Fin de flujo'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón Guardar Rápido */}
            <button
              type="button"
              onClick={handleSaveFlowToDatabase}
              disabled={isSaving}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-purple-200 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Guardando en BD...' : 'Guardar Cambios del Flujo'}</span>
            </button>

          </div>
        </div>

      </div>

    </div>
  );
};
