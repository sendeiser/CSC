import { CartItem } from '../types';

export let WHATSAPP_NUMERO_1 = '543826432180';
export let WHATSAPP_NUMERO_2 = '5493826432180';
export const WHATSAPP_NUMERO = WHATSAPP_NUMERO_1;

export interface WhatsAppTemplates {
  msg_transfer: string;
  msg_mercadopago: string;
  msg_general_inquiry: string;
  msg_order_status: string;
  msg_preparing: string;
  msg_ready: string;
}

export interface CustomQuickMessage {
  id: string;
  title: string;
  category?: string;
  content: string;
}

export const DEFAULT_CUSTOM_QUICK_MESSAGES: CustomQuickMessage[] = [
  {
    id: 'msg_location',
    title: '🏬 Ubicación y Horario del Local',
    category: 'Información',
    content: '¡Hola {nombre_cliente}! 🏬 Nos encontramos en {direccion_local}. Nuestro horario de atención es {horarios}. ¡Te esperamos!'
  },
  {
    id: 'msg_cbu',
    title: '💳 Datos CBU / Transferencia',
    category: 'Pagos',
    content: '¡Hola {nombre_cliente}! 💳 Podés transferir a nuestra cuenta:\n• Banco: {banco}\n• Alias: {alias}\n• Titular: {titular}\n\nUna vez realizada, envianos el comprobante por este chat para confirmar tu compra. ¡Gracias!'
  },
  {
    id: 'msg_delivery_info',
    title: '🚚 Información de Envíos',
    category: 'Envíos',
    content: '¡Hola {nombre_cliente}! 🚚 Realizamos envíos a domicilio en Chamical. {notas_envio}. Costo de envío: {costo_envio} (Envío GRATIS en compras superiores a {envio_gratis}).'
  },
  {
    id: 'msg_promo_day',
    title: '🎁 Promoción del Día',
    category: 'Promociones',
    content: '¡Hola {nombre_cliente}! 🍬 Te contamos que hoy tenemos promociones exclusivas en combos y gomitas a granel. ¡Consultanos o mirá nuestro catálogo online en la web!'
  },
  {
    id: 'msg_reminder',
    title: '⏳ Recordatorio de Confirmación',
    category: 'Seguimiento',
    content: '¡Hola {nombre_cliente}! ⏳ Queríamos consultarte si vas a confirmar tu pedido #{numero_pedido} por {monto_total}. Guardamos tu reserva por 24hs. ¡Avisanos si tenés alguna duda!'
  }
];

export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplates = {
  msg_transfer: `Hola! Quiero confirmar mi pedido.

*N° de pedido:* #{numero_pedido}
*Detalle:*
{detalle_productos}

*Subtotal:* {subtotal}
{descuento_linea}*TOTAL:* {monto_total}

*Datos para la transferencia:*
Banco: {banco}
Alias: {alias}
{cbu_linea}Titular: {titular}

Hacer la transferencia por *{monto_total}* al alias de arriba y enviar el comprobante por este chat para confirmar la compra.

*Mis datos:*
Nombre: {nombre_cliente}
{telefono_linea}{direccion_linea}
Gracias!`,

  msg_mercadopago: `Hola! Realicé el pago por Mercado Pago para mi pedido.

*N° de pedido:* #{numero_pedido}
*Forma de pago:* MercadoPago (Pagado)
*Detalle:*
{detalle_productos}

*TOTAL:* {monto_total}

*Mis datos:*
Nombre: {nombre_cliente}
{telefono_linea}{direccion_linea}
Gracias!`,

  msg_general_inquiry: `Hola! Quiero hacer una consulta sobre la tienda.`,

  msg_order_status: `Hola {nombre_cliente}! Te escribimos de Chamical Candy Shop sobre tu pedido #{numero_pedido}: tu pedido se encuentra en {estado_pedido}. ¡Muchas gracias por tu compra!`,

  msg_preparing: `¡Hola {nombre_cliente}! 🍬 Te informamos que tu pedido #{numero_pedido} se encuentra EN PREPARACIÓN. ¡Muchas gracias por tu compra en Chamical Candy Shop!`,

  msg_ready: `¡Hola {nombre_cliente}! 🎉 ¡Buenas noticias! Tu pedido #{numero_pedido} ya se encuentra LISTO para retirar o recibir. ¡Te esperamos!`
};

let currentTemplates: WhatsAppTemplates = { ...DEFAULT_WHATSAPP_TEMPLATES };

export function setWhatsAppNumbers(num1?: string, num2?: string) {
  if (num1) WHATSAPP_NUMERO_1 = num1;
  if (num2) WHATSAPP_NUMERO_2 = num2;
}

export function setWhatsAppTemplates(templates?: Partial<WhatsAppTemplates>) {
  if (!templates) return;
  currentTemplates = {
    msg_transfer: templates.msg_transfer || DEFAULT_WHATSAPP_TEMPLATES.msg_transfer,
    msg_mercadopago: templates.msg_mercadopago || DEFAULT_WHATSAPP_TEMPLATES.msg_mercadopago,
    msg_general_inquiry: templates.msg_general_inquiry || DEFAULT_WHATSAPP_TEMPLATES.msg_general_inquiry,
    msg_order_status: templates.msg_order_status || DEFAULT_WHATSAPP_TEMPLATES.msg_order_status,
    msg_preparing: templates.msg_preparing || DEFAULT_WHATSAPP_TEMPLATES.msg_preparing,
    msg_ready: templates.msg_ready || DEFAULT_WHATSAPP_TEMPLATES.msg_ready,
  };
}

export function getWhatsAppTemplates(): WhatsAppTemplates {
  return currentTemplates;
}

export const DATOS_BANCO = {
  titular: 'Gonzalez Martin Gustavo',
  alias: 'martinchox33',
  banco: 'MercadoPago',
  cbu: '',
};

export interface PedidoWhatsApp {
  orderId: string;
  items: CartItem[];
  fullName: string;
  addressLine?: string;
  cityField?: string;
  phoneField: string;
  subTotal: number;
  discountAmount: number;
  shippingCost?: number;
  grandTotal: number;
  formaPago: 'transferencia' | 'mercadopago';
}

const fmt = (n: number) => '$' + n.toFixed(2);

export function buildMensajePedido(pedido: PedidoWhatsApp): string {
  const tpl = pedido.formaPago === 'transferencia'
    ? (currentTemplates.msg_transfer || DEFAULT_WHATSAPP_TEMPLATES.msg_transfer)
    : (currentTemplates.msg_mercadopago || DEFAULT_WHATSAPP_TEMPLATES.msg_mercadopago);

  const detalleProds = pedido.items.map(
    (i) => {
      let line = `• ${i.weight_grams ? `${i.weight_grams}g` : `${i.quantity}x ${i.selectedSize}`} ${i.product.name} = *${fmt(i.itemPrice * i.quantity)}*`;
      if (i.comboSelections && i.comboSelections.length > 0) {
        line += '\n  _Bandeja armable con:_';
        i.comboSelections.forEach((sel: any) => {
          line += `\n  - ${sel.quantity}${sel.isWeight ? 'g' : ' un.'} de ${sel.name || sel.product?.name}`;
        });
      }
      return line;
    }
  ).join('\n');

  const descLinea = pedido.discountAmount > 0 ? `*Descuento:* -${fmt(pedido.discountAmount)}\n` : '';
  const cbuLinea = DATOS_BANCO.cbu ? `CBU: ${DATOS_BANCO.cbu}\n` : '';
  const telLinea = pedido.phoneField ? `Teléfono: ${pedido.phoneField}\n` : '';
  const dirLinea = pedido.addressLine ? `Notas / Dirección: ${pedido.addressLine}\n` : '';

  let msg = tpl
    .replace(/\{numero_pedido\}/g, pedido.orderId.slice(0, 8).toUpperCase())
    .replace(/\{detalle_productos\}/g, detalleProds)
    .replace(/\{subtotal\}/g, fmt(pedido.subTotal))
    .replace(/\{descuento_linea\}/g, descLinea)
    .replace(/\{descuento\}/g, fmt(pedido.discountAmount))
    .replace(/\{monto_total\}/g, fmt(pedido.grandTotal))
    .replace(/\{banco\}/g, DATOS_BANCO.banco)
    .replace(/\{alias\}/g, DATOS_BANCO.alias)
    .replace(/\{cbu_linea\}/g, cbuLinea)
    .replace(/\{cbu\}/g, DATOS_BANCO.cbu || 'N/A')
    .replace(/\{titular\}/g, DATOS_BANCO.titular)
    .replace(/\{nombre_cliente\}/g, pedido.fullName)
    .replace(/\{telefono_linea\}/g, telLinea)
    .replace(/\{telefono_cliente\}/g, pedido.phoneField || 'N/A')
    .replace(/\{direccion_linea\}/g, dirLinea)
    .replace(/\{direccion_cliente\}/g, pedido.addressLine || 'N/A');

  return msg.trim();
}

export function buildMensajeEstadoPedido(nombreCliente: string, numeroPedido: string, estadoPedido: string): string {
  const tpl = currentTemplates.msg_order_status || DEFAULT_WHATSAPP_TEMPLATES.msg_order_status;
  return tpl
    .replace(/\{nombre_cliente\}/g, nombreCliente || 'Cliente')
    .replace(/\{numero_pedido\}/g, (numeroPedido || '').slice(0, 8).toUpperCase())
    .replace(/\{estado_pedido\}/g, estadoPedido)
    .trim();
}

export function buildMensajeEnPreparacion(nombreCliente: string, numeroPedido: string): string {
  const tpl = currentTemplates.msg_preparing || DEFAULT_WHATSAPP_TEMPLATES.msg_preparing;
  return tpl
    .replace(/\{nombre_cliente\}/g, nombreCliente || 'Cliente')
    .replace(/\{numero_pedido\}/g, (numeroPedido || '').slice(0, 8).toUpperCase())
    .trim();
}

export function buildMensajeListo(nombreCliente: string, numeroPedido: string): string {
  const tpl = currentTemplates.msg_ready || DEFAULT_WHATSAPP_TEMPLATES.msg_ready;
  return tpl
    .replace(/\{nombre_cliente\}/g, nombreCliente || 'Cliente')
    .replace(/\{numero_pedido\}/g, (numeroPedido || '').slice(0, 8).toUpperCase())
    .trim();
}

export function waLink(mensaje: string, targetPhone?: string): string {
  const phone = (targetPhone || WHATSAPP_NUMERO_1).replace(/[^0-9]/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`;
}

export function buildMensajePersonalizado(templateContent: string, order?: any, extraVars?: Record<string, any>): string {
  if (!templateContent) return '';

  const nombreCliente = order ? (order.shipping_name || order.profiles?.name || 'Cliente') : 'Cliente';
  const numeroPedido = order?.id ? order.id.slice(0, 8).toUpperCase() : 'N/A';
  const montoTotal = order?.total ? `$${Number(order.total).toFixed(2)}` : '$0.00';

  let result = templateContent
    .replace(/\{nombre_cliente\}/g, nombreCliente)
    .replace(/\{numero_pedido\}/g, numeroPedido)
    .replace(/\{monto_total\}/g, montoTotal)
    .replace(/\{banco\}/g, DATOS_BANCO.banco)
    .replace(/\{alias\}/g, DATOS_BANCO.alias)
    .replace(/\{titular\}/g, DATOS_BANCO.titular)
    .replace(/\{cbu\}/g, DATOS_BANCO.cbu || 'N/A')
    .replace(/\{direccion_local\}/g, extraVars?.pickup_address || 'Av. Presidente Perón N°145 (Frente del Super X Día), Chamical')
    .replace(/\{horarios\}/g, extraVars?.pickup_schedule || 'Lunes a Sábado de 09:00 a 20:00 hs')
    .replace(/\{notas_envio\}/g, extraVars?.delivery_notes || 'Envíos en el día dentro del radio urbano.')
    .replace(/\{costo_envio\}/g, extraVars?.delivery_cost !== undefined ? `$${Number(extraVars.delivery_cost).toFixed(2)}` : '$0.00')
    .replace(/\{envio_gratis\}/g, extraVars?.free_delivery_over !== undefined ? `$${Number(extraVars.free_delivery_over).toFixed(2)}` : '$0.00');

  return result.trim();
}

export function extractCustomerPhone(order: any): string {
  if (!order) return '';

  // 1. Perfil del usuario
  if (order.profiles?.phone && String(order.profiles.phone).trim()) {
    const raw = String(order.profiles.phone).trim().replace(/[^0-9]/g, '');
    if (raw.length >= 8) {
      if (raw.startsWith('549')) return raw;
      if (raw.startsWith('54')) return `549${raw.slice(2)}`;
      return `549${raw}`;
    }
  }

  // 2. Parsear notas / dirección buscando [Tel: ...] o [Teléfono: ...]
  const address = order.shipping_address || '';
  const match = address.match(/\[Tel(?:éfono)?:?\s*([^\]]+)\]/i);

  let phoneStr = '';
  if (match && match[1]) {
    phoneStr = match[1].trim();
  } else {
    const numberMatch = address.match(/(\+?54\s*9?\s*\d{8,11}|\b38\d{8,9}\b|\b15\d{7,8}\b|\b\d{10,12}\b)/);
    if (numberMatch && numberMatch[1]) {
      phoneStr = numberMatch[1].trim();
    }
  }

  if (phoneStr) {
    const cleanDigits = phoneStr.replace(/[^0-9]/g, '');
    if (cleanDigits.length >= 8) {
      if (cleanDigits.startsWith('549')) return cleanDigits;
      if (cleanDigits.startsWith('54')) return `549${cleanDigits.slice(2)}`;
      return `549${cleanDigits}`;
    }
    return cleanDigits;
  }

  return '';
}
