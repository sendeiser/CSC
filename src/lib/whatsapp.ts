import { CartItem } from '../types';

export const WHATSAPP_NUMERO = '543826432180';

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
  const lineas = [
    'Hola! Quiero confirmar mi pedido.',
    '',
    `*N° de pedido:* #${pedido.orderId.slice(0, 8).toUpperCase()}`,
    '*Detalle:*',
    ...pedido.items.map(
      (i) =>
        `• ${i.weight_grams ? `${i.weight_grams}g` : `${i.quantity}x ${i.selectedSize}`} ${i.product.name} = *${fmt(i.itemPrice * i.quantity)}*`
    ),
    '',
    `*Subtotal:* ${fmt(pedido.subTotal)}`,
  ];
  if (pedido.discountAmount > 0) {
    lineas.push(`*Descuento:* -${fmt(pedido.discountAmount)}`);
  }
  lineas.push(`*TOTAL:* ${fmt(pedido.grandTotal)}`);

  if (pedido.formaPago === 'transferencia') {
    lineas.push('', '*Datos para la transferencia:*');
    lineas.push(`Banco: ${DATOS_BANCO.banco}`);
    lineas.push(`Alias: ${DATOS_BANCO.alias}`);
    if (DATOS_BANCO.cbu) lineas.push(`CBU: ${DATOS_BANCO.cbu}`);
    lineas.push(`Titular: ${DATOS_BANCO.titular}`);
    lineas.push(
      '',
      `Hacer la transferencia por *${fmt(pedido.grandTotal)}* al alias de arriba y enviar el comprobante por este chat para confirmar la compra.`
    );
  } else {
    lineas.push('', `*Forma de pago:* MercadoPago (pagado)`);
  }

  lineas.push('', '*Mis datos:*');
  lineas.push(`Nombre: ${pedido.fullName}`);
  if (pedido.phoneField) lineas.push(`Teléfono: ${pedido.phoneField}`);
  if (pedido.addressLine) lineas.push(`Notas / Dirección: ${pedido.addressLine}`);
  lineas.push('', 'Gracias!');
  return lineas.join('\n');
}

export function waLink(mensaje: string): string {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}
