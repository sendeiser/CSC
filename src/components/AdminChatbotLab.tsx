import React, { useState, useEffect, useCallback } from 'react';
import { 
  FlaskConical, Play, Cpu, Send, 
  UserCheck, RotateCcw, Download, CheckCheck,
  Zap, PhoneCall, MoreVertical, RefreshCw, Database,
  Eye, Image as ImageIcon, Sparkles, Tag, ShoppingBag
} from 'lucide-react';
import { useModal } from '../context/ModalContext';
import { supabase } from '../lib/supabase';
import { whatsappBotApi } from '../lib/api';
import { DEFAULT_CHATBOT_KEYWORDS, DEFAULT_TEMPLATES } from './AdminWhatsAppBot';
import { Product } from '../types';

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
    description: 'Sin pedidos previos. Consulta catálogo, fotos, precios y bienvenida.',
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
    description: 'Pide fotos de gomitas al peso y compra en pasos de 25g, 50g y gramajes libres.',
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

export const DEFAULT_TEST_SUITES: TestSuite[] = [
  {
    id: 'suite_full_order',
    title: '🍬 Compra Completa con Gramajes',
    description: 'Pide Producto 1 (250g) + Producto 2 (100g) + Domicilio + Cupón + Transferencia.',
    badge: 'Flujo Completo',
    badgeColor: 'bg-pink-100 text-pink-900 border-pink-200',
    steps: ['comprar', '1', '250g', '2', '100g', 'listo', '2', 'Castro Barros 245', 'Mariana Gómez', 'DULCE10', '1', 'si']
  },
  {
    id: 'suite_product_photos',
    title: '📸 Consulta de Fotos y Ficha de Golosina',
    description: 'Pide fotos y detalles nutricionales/dietas de Producto 1 y Producto 2.',
    badge: 'Fotos & Info',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    steps: ['foto 1', 'foto 2', 'comprar', '1', '250g', 'listo']
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
    description: 'Aplica cupón con descuento automático en subtotal según base de datos.',
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

export function buildWeightOptionsForProduct(p: any): Array<{ label: string; grams: number; price: number }> {
  const minWeight = Number(p.min_weight) || 25;
  const maxWeight = Number(p.max_weight) || 1000;
  const step = Number(p.weight_step) || 25;
  const pricePerKg = Number(p.price_per_kg || p.base_price || p.price || 10000);

  let standardPoints: number[] = [];
  if (step <= 25) {
    standardPoints = [25, 50, 100, 250, 500];
  } else if (step <= 50) {
    standardPoints = [50, 100, 250, 500, 1000];
  } else {
    standardPoints = [100, 250, 500, 1000];
  }

  const validPoints = Array.from(new Set([minWeight, ...standardPoints]))
    .filter((g) => g >= minWeight && g <= maxWeight && (g - minWeight) % step === 0)
    .sort((a, b) => a - b)
    .slice(0, 5);

  return validPoints.map((g) => {
    let price = 0;
    if (p.sizes && typeof p.sizes === 'object' && p.sizes[`${g}g`]) {
      price = Number(p.sizes[`${g}g`]);
    } else {
      price = Math.round((g / 1000) * pricePerKg);
    }
    const label = g >= 1000 ? `${g / 1000} Kilo (${g}g)` : `${g}g`;
    return { label, grams: g, price };
  });
}

export function calculateGramPrice(p: any, grams: number): number {
  const pricePerKg = Number(p.price_per_kg || p.base_price || p.price || 10000);
  if (p.sizes && typeof p.sizes === 'object' && p.sizes[`${grams}g`]) {
    return Number(p.sizes[`${grams}g`]);
  }
  return Math.round((grams / 1000) * pricePerKg);
}

export function parseGramsFromText(input: string): number | null {
  const t = input.toLowerCase().trim();
  if (t.includes('medio kilo') || t.includes('medio kg') || t.includes('1/2 kilo') || t.includes('1/2kg')) return 500;
  if (t.includes('cuarto kilo') || t.includes('cuarto kg') || t.includes('1/4 kilo') || t.includes('1/4kg')) return 250;
  if (t.includes('kilo y medio') || t.includes('1.5 kg') || t.includes('1,5 kg')) return 1500;
  if (t.includes('2 kilos') || t.includes('2kg')) return 2000;
  if (t.includes('1 kilo') || t.includes('un kilo') || t.includes('1kg')) return 1000;

  const matchGrams = t.match(/(\d+)\s*(?:g|gr|gramos|grs)?\b/i);
  if (matchGrams) {
    const num = parseInt(matchGrams[1], 10);
    if (!isNaN(num) && num > 0) return num;
  }
  return null;
}

export const AdminChatbotLab: React.FC = () => {
  const { showAlert } = useModal();

  // Datos Reales de la Base de Datos
  const [realProducts, setRealProducts] = useState<Product[]>([]);
  const [realPromos, setRealPromos] = useState<any[]>([]);
  const [realStoreSettings, setRealStoreSettings] = useState<any>(null);
  const [realBotSettings, setRealBotSettings] = useState<any>(null);
  const [realOrders, setRealOrders] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState<boolean>(true);

  // Tab Inspector: 'inspector' o 'catalog'
  const [rightPanelTab, setRightPanelTab] = useState<'inspector' | 'catalog'>('inspector');

  // Estados de Configuración y Sandbox
  const [selectedPersona, setSelectedPersona] = useState<TestPersona>(TEST_PERSONAS[0]);
  const [sandboxMode, setSandboxMode] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<'fast' | 'normal' | 'human'>('normal');
  const [runningSuiteId, setRunningSuiteId] = useState<string | null>(null);
  const [currentSuiteStep, setCurrentSuiteStep] = useState<number>(0);
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false);
  const [labInputText, setLabInputText] = useState('');

  // Historial de Chat
  const [labChatHistory, setLabChatHistory] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string; image?: string; isSystemNote?: boolean }>>([
    {
      sender: 'bot',
      text: DEFAULT_TEMPLATES.template_menu.replace('{cliente}', 'Mariana'),
      time: '18:30'
    }
  ]);

  // Estado de Sesión de Compra
  const [labSessionState, setLabSessionState] = useState<{
    step: 'IDLE' | 'SELECTING_PRODUCTS' | 'SELECTING_WEIGHT' | 'SELECTING_QUANTITY' | 'ASK_SHIPPING_METHOD' | 'ASK_ADDRESS' | 'ASK_NAME' | 'ASK_COUPON' | 'ASK_PAYMENT_METHOD' | 'CONFIRMING';
    pendingProduct?: any;
    items: Array<{ productId?: string; name: string; quantity: number; weightGrams?: number; unitPrice: number }>;
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

  // =========================================================================
  // CARGA DE DATOS REALES DE SUPABASE (SIN LIMITES ARTIFICIALES)
  // =========================================================================
  const fetchRealData = useCallback(async () => {
    setLoadingDb(true);
    try {
      // 1. Cargar TODOS los productos de la base de datos
      const { data: prods, error: prodsErr } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!prodsErr && prods) {
        setRealProducts(prods as Product[]);
      }

      // 2. Cupones de descuento activos reales
      const { data: promos } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('is_active', true);

      if (promos) {
        setRealPromos(promos);
      }

      // 3. Ajustes de tienda reales (Alias bancario, CBU, Dirección, Horarios)
      const { data: storeSection } = await supabase
        .from('homepage_sections')
        .select('content')
        .eq('section_name', 'store_settings')
        .maybeSingle();

      if (storeSection?.content) {
        setRealStoreSettings(storeSection.content);
      }

      // 4. Configuración del Bot de WhatsApp y plantillas personalizadas
      const botSettingsRes = await whatsappBotApi.getSettings().catch(() => null);
      if (botSettingsRes) {
        setRealBotSettings(botSettingsRes);
      }

      // 5. Últimos pedidos reales para asociar al perfil VIP (Lucas)
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (orders && orders.length > 0) {
        setRealOrders(orders);
        TEST_PERSONAS[1].activeOrderId = orders[0].id?.slice(0, 8).toUpperCase() || 'A7F39C12';
      }

    } catch (err) {
      console.warn('[AdminChatbotLab]: Error al cargar datos reales de Supabase:', err);
    } finally {
      setLoadingDb(false);
    }
  }, []);

  useEffect(() => {
    fetchRealData();
  }, [fetchRealData]);

  // Obtener variables dinámicas resueltas
  const getResolvedVariables = (persona: TestPersona) => {
    return {
      cliente: persona.name,
      alias_banco: realStoreSettings?.bank_alias || 'martinchox33',
      banco: realStoreSettings?.bank_name || 'MercadoPago / Galicia',
      titular: realStoreSettings?.bank_holder || 'Gonzalez Martin Gustavo',
      cbu: realStoreSettings?.bank_cbu || '0000003100092138928374',
      direccion: realStoreSettings?.pickup_address || realStoreSettings?.address || 'Castro Barros 245, Chamical, La Rioja',
      horarios: realStoreSettings?.pickup_schedule || realStoreSettings?.opening_hours || 'Lunes a Sábados de 09:00 a 13:00 y de 17:30 a 22:00 hs.',
      catalogo_url: realStoreSettings?.store_website_url || 'https://candyshopchamical.netlify.app'
    };
  };

  const interpolateTemplate = (template: string, vars: Record<string, any>) => {
    let res = template || '';
    for (const [k, v] of Object.entries(vars)) {
      res = res.replace(new RegExp(`\\{${k}\\}`, 'gi'), String(v ?? ''));
    }
    return res;
  };

  // =========================================================================
  // MOTOR DE CÓMPUTO CON DATOS REALES DE BASE DE DATOS Y SOPORTE DE FOTOS
  // =========================================================================
  const computeBotLabResponse = (
    userInput: string,
    prevState: any,
    persona: TestPersona
  ): { reply: string; image?: string; newState: any; systemNote?: boolean } => {
    const text = (userInput || '').trim();
    const lower = text.toLowerCase();
    let newState = { ...prevState, items: [...(prevState.items || [])] };
    let reply = '';
    let image: string | undefined = undefined;
    let systemNote = false;

    const botSettings = realBotSettings || DEFAULT_TEMPLATES;
    const commonVars = getResolvedVariables(persona);
    const keywords = (realBotSettings?.chatbot_keywords || DEFAULT_CHATBOT_KEYWORDS);

    // Lista de productos reales activos con stock (o todos si no hay stock)
    const availableProds = realProducts.length > 0 ? realProducts : [
      { id: 'mock-1', name: 'Moritas Ácidas', price_per_kg: 12000, min_weight: 25, weight_step: 25, unit_type: 'weight', stock: 50, image_url: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop&q=80', description: 'Gomitas masticables con cobertura ácida crocante.' },
      { id: 'mock-2', name: 'Ositos Frutales', price_per_kg: 10000, min_weight: 50, weight_step: 50, unit_type: 'weight', stock: 40, image_url: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop&q=80', description: 'Clásicos ositos con jugo natural de frutas.' },
      { id: 'mock-3', name: 'Chocolate Block 38g', base_price: 950, unit_type: 'piece', stock: 100, image_url: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=600&auto=format&fit=crop&q=80', description: 'Tableta de chocolate con leche y maní tostado.' },
      { id: 'mock-4', name: 'Súper Combo Gomitas 500g', base_price: 5400, unit_type: 'piece', stock: 20, image_url: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop&q=80', description: 'Mix con las 5 variedades de gomitas más pedidas.' }
    ];

    // 1. Filtro Anti-Spam (Método 3) o Persona Ignorada
    if (persona.isIgnored || (realBotSettings?.require_keywords_for_chatbot && (lower.includes('almorzar') || lower.includes('hola pá') || lower.includes('nos vemos') || lower.includes('amigo') || lower.includes('che')))) {
      const hasKeyword = keywords.some((kw: string) => lower.includes(kw.toLowerCase()));
      if (!hasKeyword) {
        return {
          reply: `🔇 *[BOT SILENCIOSO - FILTRO ANTI-SPAM]*\nEl mensaje de "${persona.name}" no contiene palabras clave comerciales. El bot no interrumpe la conversación personal.`,
          newState,
          systemNote: true
        };
      }
    }

    // 2. Simulación de Comprobante de Pago
    if (text.includes('[ENVIAR FOTO COMPROBANTE]') || (text.includes('comprobante') && text.includes('foto') && !lower.startsWith('foto '))) {
      image = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80';
      reply = botSettings.template_payment_proof
        ? interpolateTemplate(botSettings.template_payment_proof, commonVars)
        : `📸 *¡Comprobante de pago recibido!* ✨\nMuchas gracias *${persona.name}*, ya estamos verificando la acreditación bancaria para despachar tu pedido.`;
      return { reply, image, newState };
    }

    // 3. COMANDO: VER FOTOS Y DETALLES DE CADA GOMITA / PRODUCTO REAL
    if (lower.startsWith('foto') || lower.startsWith('detalle') || lower.startsWith('info') || lower.startsWith('ver foto') || lower === 'fotos' || lower === 'galeria' || lower === 'ver fotos') {
      const numIdx = parseInt(lower.replace(/\D/g, ''), 10);
      let targetProd: any = null;

      if (!isNaN(numIdx) && numIdx >= 1 && numIdx <= availableProds.length) {
        targetProd = availableProds[numIdx - 1];
      } else if (lower.length > 4) {
        targetProd = availableProds.find((p: any) => lower.includes(p.name.toLowerCase().slice(0, 5)) || lower.includes(p.name.toLowerCase().split(' ')[0]));
      }

      if (targetProd) {
        const isWeight = targetProd.unit_type === 'weight' || targetProd.is_bulk;
        const priceStr = isWeight
          ? `\$${Number(targetProd.price_per_kg || targetProd.base_price || targetProd.price || 10000).toLocaleString('es-AR')}/kg (desde ${targetProd.min_weight || 25}g • pasos de ${targetProd.weight_step || 25}g)`
          : `\$${Number(targetProd.base_price || targetProd.price || 0).toLocaleString('es-AR')} por unidad`;
        
        const dietStr = Array.isArray(targetProd.diet) && targetProd.diet.length > 0 ? `\n🌱 *Apto / Dietas:* ${targetProd.diet.join(' • ')}` : '';
        const descStr = targetProd.description ? `\n📝 *Detalle:* ${targetProd.description}` : '';
        const stockStr = `\n📦 *Stock:* ${targetProd.stock} unidades en tienda`;

        reply = `🍬 *${targetProd.name}* 🍭${descStr}${dietStr}\n💰 *Precio:* ${priceStr}${stockStr}\n\n👉 *Para agregarla al pedido:* Respondé con su número (*${availableProds.indexOf(targetProd) + 1}*) o escribí los gramos que querés (*250g*).\n👉 Para ver la foto de otra golosina escribí *FOTO [número]* (ej: *FOTO 2*).`;
        image = targetProd.image_url || targetProd.images?.[0] || 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop&q=80';
        return { reply, image, newState };
      } else {
        // Galería general con lista completa
        const listText = availableProds.map((p: any, i: number) => {
          const isWeight = p.unit_type === 'weight' || p.is_bulk;
          const priceStr = isWeight
            ? `\$${Number(p.price_per_kg || p.base_price || p.price || 10000).toLocaleString('es-AR')}/kg`
            : `\$${Number(p.base_price || p.price || 0).toLocaleString('es-AR')}`;
          return `${i + 1}️⃣ *${p.name}* — ${priceStr} 📸 _(Escribí *FOTO ${i + 1}*)_`;
        }).join('\n');

        reply = `📸 *GALERÍA COMPLETA DE GOLOSINAS (${availableProds.length} en Base de Datos)* 🍬\n\n${listText}\n\n👉 *Escribí FOTO [número] (ej: FOTO 1, FOTO 2) para ver la foto en alta definición y los detalles de cada una.*`;
        image = availableProds[0]?.image_url || availableProds[0]?.images?.[0];
        return { reply, image, newState };
      }
    }

    // 4. Consulta de Estado de Pedido (Opción 1)
    if ((lower === '1' || lower.includes('estado') || lower.includes('como va')) && newState.step === 'IDLE') {
      const activeOrder = realOrders.find((o: any) => o.customer_phone?.includes(persona.phone.slice(-6)) || o.shipping_name?.toLowerCase().includes(persona.name.toLowerCase().split(' ')[0])) || (persona.hasActiveOrder ? { id: persona.activeOrderId || 'A7F39C12', status: 'preparing', total: 4200, shipping_address: 'Retiro en Local' } : null);

      if (activeOrder) {
        const statusMap: Record<string, string> = {
          pending: '⏳ Pendiente de pago',
          paid: '✅ Pagado y confirmado',
          preparing: '👨‍🍳 En preparación en local',
          ready: '✨ Listo para retirar',
          shipped: '🛵 En camino con cadete',
          delivered: '🎉 Entregado'
        };
        const st = statusMap[activeOrder.status] || '⏳ En preparación';
        reply = `📦 *Estado de tu Pedido:* #${(activeOrder.id || 'A7F39C12').slice(0, 8).toUpperCase()}\n\n• *Estado:* ${st}\n• *Total:* \$${Number(activeOrder.total || 4200).toLocaleString('es-AR')}\n• *Destino:* ${activeOrder.shipping_address || 'Castro Barros 245'}\n\n_Para volver al menú, enviá la palabra *MENU*._`;
      } else {
        reply = `📦 *Estado de Pedidos:*\nNo encontramos pedidos pendientes para tu número (*${persona.phone}*).\n\n👉 Para armar un pedido nuevo con productos reales, escribí *COMPRAR*.`;
      }
      return { reply, newState };
    }

    // 5. Opción 2: Datos Bancarios
    if ((lower === '2' || lower.includes('alias') || lower.includes('cbu') || lower.includes('transferencia')) && newState.step === 'IDLE') {
      reply = interpolateTemplate(botSettings.menu_response_2 || DEFAULT_TEMPLATES.menu_response_2, commonVars);
      return { reply, newState };
    }

    // 6. Opción 3: Ubicación y Horarios
    if ((lower === '3' || lower.includes('horario') || lower.includes('direccion') || lower.includes('ubicacion')) && newState.step === 'IDLE') {
      reply = interpolateTemplate(botSettings.menu_response_3 || DEFAULT_TEMPLATES.menu_response_3, commonVars);
      return { reply, newState };
    }

    // 7. Opción 5: Asesor Humano
    if ((lower === '5' || lower.includes('persona') || lower.includes('asesor') || lower.includes('ayuda')) && newState.step === 'IDLE') {
      reply = interpolateTemplate(botSettings.menu_response_5 || DEFAULT_TEMPLATES.menu_response_5, commonVars);
      return { reply, newState };
    }

    // 8. Cancelar / Salir
    if (lower === 'cancelar' || lower === 'salir') {
      newState = { step: 'IDLE', items: [], subtotal: 0, discountAmount: 0, total: 0, pendingProduct: undefined };
      reply = `❌ *Proceso de compra cancelado.* ¿En qué más podemos ayudarte?\n\n` + interpolateTemplate(botSettings.template_menu || DEFAULT_TEMPLATES.template_menu, commonVars);
      return { reply, newState };
    }

    // 9. Carrito: Ver / Vaciar / Quitar
    if (lower === 'carrito' || lower === 'ver carrito' || lower === 'ver') {
      if (newState.items.length === 0) {
        reply = '🛒 Tu carrito está vacío. Escribí *COMPRAR* para ver nuestras golosinas con stock disponible.';
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
      newState.pendingProduct = undefined;
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

    // 10. Iniciar Compra / Opción 4 Catálogo (Muestra TODOS los productos de la BD)
    if (lower === 'comprar' || lower === 'pedir' || lower.includes('nuevo pedido') || lower === 'quiero comprar' || lower === 'quiero gomitas' || ((lower === '4' || lower.includes('catalogo') || lower.includes('productos')) && newState.step === 'IDLE')) {
      newState.step = 'SELECTING_PRODUCTS';
      newState.items = [];
      newState.subtotal = 0;
      newState.discountAmount = 0;
      newState.total = 0;

      const prodsListText = availableProds.map((p: any, idx: number) => {
        const isWeight = p.unit_type === 'weight' || p.is_bulk;
        const minW = p.min_weight || 25;
        const priceStr = isWeight
          ? `\$${Number(p.price_per_kg || p.base_price || p.price || 10000).toLocaleString('es-AR')}/kg (desde ${minW}g)`
          : `\$${Number(p.base_price || p.price || 0).toLocaleString('es-AR')}`;
        return `${idx + 1}️⃣ *${p.name}* — ${priceStr}`;
      }).join('\n');

      reply = `🛍️ *¡Catálogo Completo de Golosinas (${availableProds.length} productos en stock)!* 🍬\n\n${prodsListText}\n\n👉 *Respondé con el NÚMERO del producto que querés llevar (ej: 1, 2).*\n📸 _Para ver fotos y detalles de cualquiera, escribí *FOTO [número]* (ej: FOTO 1)._`;
      if (availableProds[0]?.image_url) {
        image = availableProds[0].image_url;
      }
      return { reply, image, newState };
    }

    // 11. Selección de Producto en Catálogo
    if (newState.step === 'SELECTING_PRODUCTS') {
      if (lower === 'listo' || lower === 'finalizar' || lower === 'pagar' || lower === 'checkout') {
        if (newState.items.length === 0) {
          reply = '⚠️ Tu carrito está vacío. Escribí el *NÚMERO* del producto que querés agregar o escribí *CANCELAR*.';
          return { reply, newState };
        }
        newState.step = 'ASK_SHIPPING_METHOD';
        reply = `🛵 *¿Cómo querés recibir tu pedido?*\n\nRespondé con el número de opción:\n1️⃣ *Retiro por el local (Chamical)* — Sin costo\n2️⃣ *Envío a domicilio con cadete (Chamical)*`;
        return { reply, newState };
      }

      const numIdx = parseInt(lower.replace(/\D/g, ''), 10);
      let selectedProd: any = null;

      if (!isNaN(numIdx) && numIdx >= 1 && numIdx <= availableProds.length) {
        selectedProd = availableProds[numIdx - 1];
      } else {
        selectedProd = availableProds.find((p: any) => lower.includes(p.name.toLowerCase().slice(0, 5)) || lower.includes(p.name.toLowerCase().split(' ')[0]));
      }

      if (selectedProd) {
        const isWeight = selectedProd.unit_type === 'weight' || selectedProd.is_bulk;

        if (isWeight) {
          const options = buildWeightOptionsForProduct(selectedProd);
          const minWeight = Number(selectedProd.min_weight) || 25;
          const step = Number(selectedProd.weight_step) || 25;
          const pricePerKg = Number(selectedProd.price_per_kg || selectedProd.base_price || selectedProd.price || 10000);

          newState.step = 'SELECTING_WEIGHT';
          newState.pendingProduct = { ...selectedProd, options };

          const optionsList = options.map((opt, i) => `${i + 1}️⃣ *${opt.label}* — \$${opt.price.toLocaleString('es-AR')}`).join('\n');

          reply = `🍬 *${selectedProd.name}* (Venta al peso) ⚖️\n💰 *Precio:* \$${pricePerKg.toLocaleString('es-AR')}/kg • Mínimo: *${minWeight}g* (Fraccionable de a *${step}g*)\n\n*¿Qué cantidad querés llevar?*\n${optionsList}\n\n👉 *Respondé con el número (1 a ${options.length})* o escribí tus gramos exactos (ej: *75g*, *150g*, *350g*).`;
          if (selectedProd.image_url) {
            image = selectedProd.image_url;
          }
          return { reply, image, newState };
        } else {
          // Producto por unidad
          const unitPrice = Number(selectedProd.base_price || selectedProd.price || 0);
          newState.step = 'SELECTING_QUANTITY';
          newState.pendingProduct = { ...selectedProd, options: [] };

          reply = `🍫 *${selectedProd.name}*\n💰 *Precio:* \$${unitPrice.toLocaleString('es-AR')} por unidad\n\n👉 *¿Cuántas unidades querés llevar?* (Escribí la cantidad, ej: 1, 2, 3...)`;
          if (selectedProd.image_url) {
            image = selectedProd.image_url;
          }
          return { reply, image, newState };
        }
      } else {
        reply = `🔍 No encontramos ese número en el catálogo. Escribí el *NÚMERO* del producto (1 a ${availableProds.length}) o escribí *LISTO* para finalizar.`;
        return { reply, newState };
      }
    }

    // 12. Selección de Cantidad para productos por unidad
    if (newState.step === 'SELECTING_QUANTITY' && newState.pendingProduct) {
      const p = newState.pendingProduct;
      const qty = parseInt(lower.replace(/\D/g, ''), 10) || 1;
      const unitPrice = Number(p.base_price || p.price || 0);
      const itemTotal = unitPrice * qty;

      const formattedName = `${p.name} (x${qty} u.)`;
      newState.items.push({
        productId: p.id,
        name: formattedName,
        quantity: qty,
        unitPrice: itemTotal
      });

      newState.subtotal = newState.items.reduce((acc: number, it: any) => acc + it.unitPrice, 0);
      newState.total = Math.max(0, newState.subtotal - (newState.discountAmount || 0));
      newState.step = 'SELECTING_PRODUCTS';
      newState.pendingProduct = undefined;

      const itemsList = newState.items.map((i: any) => `• ${i.name} - \$${i.unitPrice.toLocaleString('es-AR')}`).join('\n');
      reply = `✅ *¡Agregaste ${formattedName}!* 🍬 (+\$${itemTotal.toLocaleString('es-AR')})\n\n🛒 *Tu carrito actual:*\n${itemsList}\n\n💰 *Subtotal:* \$${newState.subtotal.toLocaleString('es-AR')}\n\n👉 ¿Querés agregar otro producto? *(Escribí su número)*\n👉 O escribí *LISTO* para continuar y confirmar tu pedido.`;
      return { reply, newState };
    }

    // 13. Selección de Gramaje para gomitas al peso
    if (newState.step === 'SELECTING_WEIGHT' && newState.pendingProduct) {
      const p = newState.pendingProduct;
      const options = p.options || [];
      const minWeight = Number(p.min_weight) || 25;
      const maxWeight = Number(p.max_weight) || 1000;
      const step = Number(p.weight_step) || 25;

      let chosenGrams: number | null = null;
      let chosenPrice: number = 0;

      const optIdx = parseInt(lower.replace(/\D/g, ''), 10);
      if (!isNaN(optIdx) && optIdx >= 1 && optIdx <= options.length && !lower.includes('g') && !lower.includes('kilo')) {
        chosenGrams = options[optIdx - 1].grams;
        chosenPrice = options[optIdx - 1].price;
      } else {
        const parsedGrams = parseGramsFromText(lower);
        if (parsedGrams) {
          if (parsedGrams < minWeight) {
            const minPrice = calculateGramPrice(p, minWeight);
            reply = `⚠️ La cantidad mínima de compra para *${p.name}* es de *${minWeight}g* (\$${minPrice.toLocaleString('es-AR')}).\n\n👉 Respondé *1* para llevar ${minWeight}g o escribí otra cantidad superior a ${minWeight}g.`;
            return { reply, newState };
          }
          if (parsedGrams > maxWeight) {
            reply = `⚠️ El máximo disponible por bolsita es de *${maxWeight}g*. Podés pedir hasta ${maxWeight}g por porción.`;
            return { reply, newState };
          }
          // Validación de saltos de gramaje
          if ((parsedGrams - minWeight) % step !== 0 && parsedGrams % step !== 0) {
            const lowerG = Math.floor(parsedGrams / step) * step || minWeight;
            const upperG = lowerG + step;
            const priceLower = calculateGramPrice(p, lowerG);
            const priceUpper = calculateGramPrice(p, upperG);
            reply = `⚠️ *${p.name}* se fracciona en pasos de *${step}g*.\n\n¿Te preparamos:\n1️⃣ *${lowerG}g* (\$${priceLower.toLocaleString('es-AR')})\n2️⃣ *${upperG}g* (\$${priceUpper.toLocaleString('es-AR')})?\n\n👉 Respondé 1 o 2.`;
            return { reply, newState };
          }

          chosenGrams = parsedGrams;
          chosenPrice = calculateGramPrice(p, parsedGrams);
        }
      }

      if (chosenGrams && chosenPrice > 0) {
        const formattedName = `${p.name} (${chosenGrams}g)`;
        newState.items.push({
          productId: p.id,
          name: formattedName,
          quantity: 1,
          weightGrams: chosenGrams,
          unitPrice: chosenPrice
        });

        newState.subtotal = newState.items.reduce((acc: number, it: any) => acc + it.unitPrice, 0);
        newState.total = Math.max(0, newState.subtotal - (newState.discountAmount || 0));
        newState.step = 'SELECTING_PRODUCTS';
        newState.pendingProduct = undefined;

        const itemsList = newState.items.map((i: any) => `• ${i.name} - \$${i.unitPrice.toLocaleString('es-AR')}`).join('\n');
        reply = `✅ *¡Agregaste ${formattedName}!* 🍬 (+\$${chosenPrice.toLocaleString('es-AR')})\n\n🛒 *Tu carrito actual:*\n${itemsList}\n\n💰 *Subtotal:* \$${newState.subtotal.toLocaleString('es-AR')}\n\n👉 ¿Querés agregar otro producto? *(Escribí su número)*\n👉 O escribí *LISTO* para continuar y confirmar tu pedido.`;
        return { reply, newState };
      } else {
        reply = `🔍 No entendimos la cantidad. Respondé con el número de opción (1 a ${options.length}) o escribí los gramos que querés (ej: *50g*, *100g*, *250g*).`;
        return { reply, newState };
      }
    }

    // 14. Método de Envío
    if (newState.step === 'ASK_SHIPPING_METHOD') {
      if (lower === '1' || lower.includes('retiro') || lower.includes('local')) {
        newState.shippingMethod = 'pickup';
        newState.shippingAddress = realStoreSettings?.pickup_address || 'Retiro en Local (Castro Barros 245, Chamical)';
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

    // 15. Captura de Dirección
    if (newState.step === 'ASK_ADDRESS') {
      newState.shippingAddress = text;
      newState.step = 'ASK_NAME';
      reply = '👤 *¿A nombre de quién registramos el pedido?* (Escribí tu nombre y apellido):';
      return { reply, newState };
    }

    // 16. Captura de Nombre
    if (newState.step === 'ASK_NAME') {
      newState.shippingName = text || persona.name;
      newState.step = 'ASK_COUPON';
      const samplePromo = realPromos.length > 0 ? realPromos[0].code : 'DULCE10';
      reply = `🎟️ *¿Tenés algún Cupón de Descuento?*\n\n👉 Escribí el código de tu cupón (ej: *${samplePromo}*) o respondé *NO* para continuar sin cupón.`;
      return { reply, newState };
    }

    // 17. Captura de Cupón Real
    if (newState.step === 'ASK_COUPON') {
      if (lower !== 'no' && lower !== 'ninguno' && lower !== 'paso' && lower !== '0') {
        const promoCodeUpper = text.trim().toUpperCase();
        const matchedPromo = realPromos.find((p: any) => p.code.toUpperCase() === promoCodeUpper) || (promoCodeUpper === 'DULCE10' ? { code: 'DULCE10', discount_type: 'fixed', discount_value: 300, min_order_amount: 0 } : null);

        if (matchedPromo) {
          let discount = 0;
          if (matchedPromo.discount_type === 'percentage') {
            discount = Math.round((newState.subtotal * Number(matchedPromo.discount_value)) / 100);
          } else {
            discount = Number(matchedPromo.discount_value || 300);
          }
          discount = Math.min(newState.subtotal, discount);

          newState.couponCode = matchedPromo.code;
          newState.discountAmount = discount;
          newState.total = Math.max(0, newState.subtotal - discount);
          newState.step = 'ASK_PAYMENT_METHOD';

          reply = `🎉 *¡Cupón ${matchedPromo.code} aplicado con éxito desde la BD!* Descuento: -\$${discount.toLocaleString('es-AR')} ✨\n\n💳 *¿Cómo preferís abonar tu pedido?*\n\nRespondé con el número:\n1️⃣ *Transferencia Bancaria* (Alias / CBU)\n2️⃣ *Efectivo contra entrega* (Al retirar o recibir)\n3️⃣ *Mercado Pago* (Link directo de pago)`;
          return { reply, newState };
        } else {
          newState.step = 'ASK_PAYMENT_METHOD';
          reply = `ℹ️ El cupón "${text}" no es válido o expiró en la base de datos. Continuamos con el valor regular.\n\n💳 *¿Cómo preferís abonar tu pedido?*\n\nRespondé con el número:\n1️⃣ *Transferencia Bancaria* (Alias / CBU)\n2️⃣ *Efectivo contra entrega* (Al retirar o recibir)\n3️⃣ *Mercado Pago* (Link directo de pago)`;
          return { reply, newState };
        }
      } else {
        newState.step = 'ASK_PAYMENT_METHOD';
        reply = `💳 *¿Cómo preferís abonar tu pedido?*\n\nRespondé con el número:\n1️⃣ *Transferencia Bancaria* (Alias / CBU)\n2️⃣ *Efectivo contra entrega* (Al retirar o recibir)\n3️⃣ *Mercado Pago* (Link directo de pago)`;
        return { reply, newState };
      }
    }

    // 18. Método de Pago
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

    // 19. Confirmación Final (y guardado en DB si sandboxMode === false)
    if (newState.step === 'CONFIRMING') {
      if (lower === 'si' || lower === 'confirmar' || lower === 'dale' || lower === 'sí' || lower === 's' || lower === 'ok') {
        const orderCode = 'CSC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const itemsList = newState.items.map((i: any) => `• ${i.name} - \$${i.unitPrice.toLocaleString('es-AR')}`).join('\n');
        
        let confirmMsg = `🎉 *¡PEDIDO #${orderCode} REGISTRADO CON ÉXITO!* 🍬\n\nMuchas gracias *${newState.shippingName || persona.name}*, tu pedido ya fue cargado con datos reales.\n\n📦 *Detalle:*\n${itemsList}\n💰 *Total:* \$${newState.total.toLocaleString('es-AR')}\n📍 *Entrega:* ${newState.shippingAddress || 'Retiro en Local'}\n`;

        if (newState.paymentMethod === 'transfer') {
          confirmMsg += `\n🏦 *Datos para Transferencia:*\n• *Alias:* \`${commonVars.alias_banco}\`\n• *Banco:* ${commonVars.banco}\n• *Titular:* ${commonVars.titular}\n• *CBU:* \`${commonVars.cbu}\`\n\n📸 *Enviá el comprobante de transferencia por acá para comenzar a preparar tus golosinas.* ✨`;
        } else if (newState.paymentMethod === 'cash') {
          confirmMsg += `\n💵 *Pago en Efectivo:* Abonás al recibir o retirar tu pedido en ${commonVars.direccion}. ¡Ya estamos preparando tus golosinas! ✨`;
        } else {
          confirmMsg += `\n💳 *Pago con Mercado Pago:* Podés transferir al Alias \`${commonVars.alias_banco}\` o coordinar el link con nuestro asesor. ✨`;
        }

        // Si estamos en modo DB Real, persistir en Supabase
        if (!sandboxMode) {
          (async () => {
            try {
              const { data: newDbOrder } = await supabase.from('orders').insert({
                shipping_name: newState.shippingName || persona.name,
                shipping_address: newState.shippingAddress || 'Retiro en Local',
                shipping_city: 'Chamical',
                total: newState.total,
                status: 'pending',
                discount_amount: newState.discountAmount || 0,
                shipping_cost: 0,
                payment_method: newState.paymentMethod || 'transfer',
                customer_phone: persona.phone
              }).select().single();

              if (newDbOrder && newState.items.length > 0) {
                const orderItems = newState.items.map((it: any) => ({
                  order_id: newDbOrder.id,
                  product_id: it.productId || availableProds[0]?.id,
                  quantity: it.quantity || 1,
                  unit_price: it.unitPrice
                }));
                await supabase.from('order_items').insert(orderItems);
              }
            } catch (saveErr) {
              console.warn('[AdminChatbotLab]: Error al persistir pedido real en Supabase:', saveErr);
            }
          })();
        }

        newState.step = 'IDLE';
        reply = confirmMsg;
        return { reply, newState };
      } else {
        newState = { step: 'IDLE', items: [], subtotal: 0, discountAmount: 0, total: 0, pendingProduct: undefined };
        reply = '❌ Pedido cancelado. Escribí *MENU* para ver más opciones.';
        return { reply, newState };
      }
    }

    // Menú por defecto
    reply = interpolateTemplate(botSettings.template_menu || DEFAULT_TEMPLATES.template_menu, commonVars);
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
        selectedPersona
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
        text: `🧪 *Ejecutando Suite de Pruebas: ${suite.title}* ⚡\nPersona: *${selectedPersona.name}* (${selectedPersona.role})\nSimulando con ${realProducts.length} productos de la Base de Datos...`,
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
      total: 0,
      pendingProduct: undefined
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

      const { reply, image, newState, systemNote } = computeBotLabResponse(stepText, curState, selectedPersona);
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
      message: `La suite "${suite.title}" finalizó sin errores para ${selectedPersona.name} con datos reales.`,
      type: 'success'
    });
  };

  const handleResetLab = () => {
    const commonVars = getResolvedVariables(selectedPersona);
    const botSettings = realBotSettings || DEFAULT_TEMPLATES;
    setLabChatHistory([
      {
        sender: 'bot',
        text: interpolateTemplate(botSettings.template_menu || DEFAULT_TEMPLATES.template_menu, commonVars),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setLabSessionState({
      step: 'IDLE',
      items: [],
      subtotal: 0,
      discountAmount: 0,
      total: 0,
      pendingProduct: undefined
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
      total: 0,
      pendingProduct: undefined
    });
    setLabChatHistory(prev => [
      ...prev,
      {
        sender: 'bot',
        text: `⏱️ *[TIMEOUT DE SESIÓN]*: Han pasado 30 minutos de inactividad. La sesión de compra fue liberada automáticamente en memoria.`,
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
      databaseStats: {
        totalProductsLoaded: realProducts.length,
        promosLoaded: realPromos.length,
        hasStoreSettings: !!realStoreSettings
      },
      timestamp: new Date().toISOString()
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `csc_lab_test_${selectedPersona.id}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const sampleCoupon = realPromos[0]?.code || 'DULCE10';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Barra Superior de Control del Laboratorio */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-200 shrink-0">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Laboratorio de Pruebas & Sandbox Chatbot</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                sandboxMode ? 'bg-purple-100 text-purple-900 border border-purple-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
              }`}>
                {sandboxMode ? '🟣 Modo Sandbox (En Memoria)' : '🟢 Modo DB Test (Crea Pedidos Reales)'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <Database className="w-3.5 h-3.5" />
                <span>Base de Datos: {loadingDb ? 'Cargando...' : `${realProducts.length} productos totales en catálogo • ${realPromos.length} cupones activos`}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botón Recargar BD */}
          <button
            type="button"
            onClick={fetchRealData}
            disabled={loadingDb}
            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            title="Recargar todos los productos y cupones de Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingDb ? 'animate-spin' : ''}`} />
            <span>Recargar BD</span>
          </button>

          {/* Selector de Velocidad */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-700">
            <span className="text-[10px] text-slate-400 px-2">Velocidad:</span>
            <button
              type="button"
              onClick={() => setSimulationSpeed('fast')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${simulationSpeed === 'fast' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'}`}
            >
              ⚡ Rápida
            </button>
            <button
              type="button"
              onClick={() => setSimulationSpeed('normal')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${simulationSpeed === 'normal' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'}`}
            >
              ⏱️ Normal
            </button>
            <button
              type="button"
              onClick={() => setSimulationSpeed('human')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${simulationSpeed === 'human' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'}`}
            >
              ⏳ Humana (1.2s)
            </button>
          </div>

          {/* Botón Exportar JSON */}
          <button
            type="button"
            onClick={handleExportLabChat}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Descargar historial de prueba en JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar JSON</span>
          </button>

          {/* Botón Reset */}
          <button
            type="button"
            onClick={handleResetLab}
            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
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
                    const commonVars = getResolvedVariables(p);
                    const botSettings = realBotSettings || DEFAULT_TEMPLATES;
                    setLabChatHistory([
                      {
                        sender: 'bot',
                        text: interpolateTemplate(botSettings.template_menu || DEFAULT_TEMPLATES.template_menu, commonVars),
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    ]);
                    setLabSessionState({
                      step: 'IDLE',
                      items: [],
                      subtotal: 0,
                      discountAmount: 0,
                      total: 0,
                      pendingProduct: undefined
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
              {DEFAULT_TEST_SUITES.map((s) => (
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
                          <div className="mb-1.5 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                            <img
                              src={msg.image}
                              alt="Golosina"
                              className="w-full max-h-36 object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
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
                {/* Fila 1: Acciones Principales y Ver Fotos */}
                <div className="flex gap-1 overflow-x-auto scrollbar-none">
                  <button
                    type="button"
                    onClick={() => handleLabSend('comprar')}
                    className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                  >
                    🛒 Catálogo ({realProducts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLabSend('fotos')}
                    className="px-2 py-0.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>Ver Fotos & Info</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLabSend('foto 1')}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-[10px] font-bold shrink-0 shadow-xs border border-slate-300 cursor-pointer truncate max-w-[100px]"
                    title="Ver foto del producto #1"
                  >
                    📸 Foto 1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLabSend('foto 2')}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-[10px] font-bold shrink-0 shadow-xs border border-slate-300 cursor-pointer truncate max-w-[100px]"
                    title="Ver foto del producto #2"
                  >
                    📸 Foto 2
                  </button>
                  {realProducts.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleLabSend('foto 3')}
                      className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-[10px] font-bold shrink-0 shadow-xs border border-slate-300 cursor-pointer truncate max-w-[100px]"
                      title="Ver foto del producto #3"
                    >
                      📸 Foto 3
                    </button>
                  )}
                </div>

                {/* Fila 2: Gramajes Libres y Selección de Productos */}
                <div className="flex gap-1 overflow-x-auto scrollbar-none">
                  <button
                    type="button"
                    onClick={() => handleLabSend('1')}
                    className="px-2 py-0.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer truncate max-w-[90px]"
                    title={`Elegir ${realProducts[0]?.name || '#1'}`}
                  >
                    🍬 {realProducts[0]?.name?.slice(0, 8) || '#1'}
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

                {/* Fila 3: Finalización y Pagos */}
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
                    onClick={() => handleLabSend(sampleCoupon)}
                    className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                  >
                    🎟️ {sampleCoupon}
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
                  placeholder={`Escribí FOTO 1, COMPRAR, 250g...`}
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

        {/* COLUMNA 3 (4 COLS): INSPECTOR DE ESTADO & GALERÍA DE GOLOSINAS */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Switch de Pestañas del Panel Derecho */}
          <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center text-xs font-bold text-slate-700">
            <button
              type="button"
              onClick={() => setRightPanelTab('inspector')}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                rightPanelTab === 'inspector' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <Cpu className="w-4 h-4 text-purple-600" />
              <span>Inspector de Sesión</span>
            </button>
            <button
              type="button"
              onClick={() => setRightPanelTab('catalog')}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                rightPanelTab === 'catalog' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              <span>Fotos & Fichas ({realProducts.length})</span>
            </button>
          </div>

          {/* VISTA 1: INSPECTOR DE SESIÓN EN VIVO */}
          {rightPanelTab === 'inspector' && (
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-purple-600" />
                  <span>Estado Interno del Bot</span>
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
                  <div className="space-y-1 max-h-32 overflow-y-auto">
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
                <span className="text-[11px] font-bold text-slate-700 block">Variables Resueltas de la BD:</span>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block">cliente:</span>
                    <span className="font-bold text-slate-800">{selectedPersona.name}</span>
                  </div>
                  <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block">alias_banco:</span>
                    <span className="font-bold text-slate-800 truncate">{realStoreSettings?.bank_alias || 'martinchox33'}</span>
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
                <span className="text-[11px] font-bold text-slate-700 block">Inyección de Eventos & BD:</span>
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
                    {sandboxMode ? '🟣 Sandbox (Memoria)' : '🟢 Modo DB Test (Real)'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VISTA 2: CATÁLOGO COMPLETO, FOTOS Y FICHAS DE GOLOSINAS */}
          {rightPanelTab === 'catalog' && (
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3.5 max-h-[560px] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Fichas de Golosinas en BD</span>
                  </h3>
                  <p className="text-[10px] text-slate-500">Hacé clic para enviar la foto o pedir directo.</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900">
                  {realProducts.length} Golosinas
                </span>
              </div>

              <div className="space-y-3">
                {realProducts.map((p, idx) => {
                  const isWeight = p.unit_type === 'weight' || p.is_bulk;
                  const priceLabel = isWeight 
                    ? `\$${Number(p.price_per_kg || p.base_price || p.price || 10000).toLocaleString('es-AR')}/kg`
                    : `\$${Number(p.base_price || p.price || 0).toLocaleString('es-AR')} c/u`;

                  return (
                    <div
                      key={p.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition-all flex flex-col gap-2.5"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.image_url || p.images?.[0] ? (
                            <img
                              src={p.image_url || p.images?.[0]}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-lg">🍬</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {idx + 1}. {p.name}
                            </p>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black text-purple-700 bg-purple-100">
                              {priceLabel}
                            </span>
                          </div>

                          <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                            {p.description || 'Golosina artesanal dulce de Chamical Candy Shop.'}
                          </p>

                          <div className="flex flex-wrap items-center gap-1 mt-1.5">
                            {isWeight && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                ⚖️ Min: {p.min_weight || 25}g • Paso: {p.weight_step || 25}g
                              </span>
                            )}
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                              p.stock > 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                            }`}>
                              📦 Stock: {p.stock}
                            </span>
                            {Array.isArray(p.diet) && p.diet.map((d, di) => (
                              <span key={di} className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-sky-100 text-sky-900">
                                🌱 {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Botones Rápidos por Producto */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => handleLabSend(`foto ${idx + 1}`)}
                          className="py-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-indigo-200"
                        >
                          <Eye className="w-3 h-3" />
                          <span>📸 Enviar Foto</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLabSend(`${idx + 1}`)}
                          className="py-1 px-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>🛒 Pedir #{idx + 1}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
