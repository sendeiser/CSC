import React, { useState } from 'react';
import { 
  FlaskConical, Play, Cpu, CheckCircle2, Send, 
  UserCheck, RotateCcw, Download, CheckCheck,
  Zap, PhoneCall, MoreVertical, Smartphone
} from 'lucide-react';
import { useModal } from '../context/ModalContext';
import { DEFAULT_CHATBOT_KEYWORDS, DEFAULT_TEMPLATES } from './AdminWhatsAppBot';

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

export const AdminChatbotLab: React.FC = () => {
  const { showAlert } = useModal();

  const [selectedPersona, setSelectedPersona] = useState<TestPersona>(TEST_PERSONAS[0]);
  const [sandboxMode, setSandboxMode] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<'fast' | 'normal' | 'human'>('normal');
  const [runningSuiteId, setRunningSuiteId] = useState<string | null>(null);
  const [currentSuiteStep, setCurrentSuiteStep] = useState<number>(0);
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false);
  const [labInputText, setLabInputText] = useState('');

  const [labChatHistory, setLabChatHistory] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string; image?: string; isSystemNote?: boolean }>>([
    {
      sender: 'bot',
      text: DEFAULT_TEMPLATES.template_menu.replace('{cliente}', 'Mariana'),
      time: '18:30'
    }
  ]);

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

    // 1. Filtro Anti-Spam (Método 3) o Persona Ignorada
    if (persona.isIgnored || (lower.includes('almorzar') || lower.includes('hola pá') || lower.includes('nos vemos') || lower.includes('amigo') || lower.includes('che'))) {
      const hasKeyword = DEFAULT_CHATBOT_KEYWORDS.some((kw: string) => lower.includes(kw.toLowerCase()));
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
      reply = DEFAULT_TEMPLATES.template_payment_proof
        ? DEFAULT_TEMPLATES.template_payment_proof.replace('{cliente}', persona.name).replace('{pedido_id}', persona.activeOrderId || 'A7F39C12')
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
      reply = `❌ *Proceso de compra cancelado.* ¿En qué más podemos ayudarte?\n\n` + DEFAULT_TEMPLATES.template_menu.replace('{cliente}', persona.name);
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
      image = 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop&q=80';
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
    reply = DEFAULT_TEMPLATES.template_menu.replace('{cliente}', persona.name);
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
      message: `La suite "${suite.title}" finalizó sin errores para ${selectedPersona.name}.`,
      type: 'success'
    });
  };

  const handleResetLab = () => {
    setLabChatHistory([
      {
        sender: 'bot',
        text: DEFAULT_TEMPLATES.template_menu.replace('{cliente}', selectedPersona.name),
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Barra Superior de Control del Laboratorio */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-200">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Laboratorio de Pruebas & Sandbox Chatbot</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                sandboxMode ? 'bg-purple-100 text-purple-900 border border-purple-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
              }`}>
                {sandboxMode ? '🟣 Modo Sandbox (En Memoria)' : '🟢 Modo DB Test (Pedidos Reales)'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Simulá compras completas, gramajes fraccionables (25g, 50g, 75g libre), cupones y filtros anti-spam sin necesidad de un segundo celular.
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
                    setLabChatHistory([
                      {
                        sender: 'bot',
                        text: DEFAULT_TEMPLATES.template_menu.replace('{cliente}', p.name),
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
  );
};
