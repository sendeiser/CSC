import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { serviceClient, supabase } from './supabase';
import { getStoreSettingsHelper } from '../routes/admin';
import { generateCatalogCollage, getProductPricingInfo } from './catalogCollage';

// Directorio temporal seguro compatible con Netlify Lambda y local
const isServerless = process.env.NETLIFY === 'true' || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.LAMBDA_TASK_ROOT;
const DATA_DIR = isServerless ? path.join(os.tmpdir(), 'csc_data') : path.join(process.cwd(), 'data');
const AUTH_DIR = path.join(DATA_DIR, 'baileys_auth');
const SETTINGS_FILE = path.join(DATA_DIR, 'whatsapp_bot_settings.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'whatsapp_contacts.json');

export interface SyncedWhatsAppContact {
  jid: string;
  phone: string;
  name: string;
  pushName?: string;
  verifiedName?: string;
  isGroup: boolean;
  lastActive?: string;
}

function ensureDir(dirPath: string) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (_e) {}
}

export interface IgnoredNumber {
  id: string;
  phone: string;
  label: string;
  created_at: string;
}

export const DEFAULT_CHATBOT_KEYWORDS = [
  'pedido', 'candy', 'comprar', 'precio', 'precios', 'gomitas', 
  'catalogo', 'catálogo', 'envio', 'envío', 'local', 'horario', 
  'horarios', 'transferencia', 'alias', 'cbu', 'menu', 'menú', 
  'hola candy', 'promo', 'promos', 'stock', 'tienda', '#csc', 'consulta'
];

export interface CustomMenuOption {
  id: string;
  option_number: string;
  title: string;
  keywords: string[];
  response: string;
}

export interface WhatsAppBotSettings {
  enabled: boolean;
  auto_notify_new_order: boolean; // Enviar WhatsApp automático cuando el cliente termina el pedido
  auto_notify_status_change: boolean;
  auto_chatbot_menu: boolean;
  // Restricciones de números y contactos personales
  ignored_numbers: IgnoredNumber[];
  pause_on_manual_reply: boolean;
  pause_duration_minutes: number;
  // Opción 3: Responder únicamente a clientes con pedidos registrados
  only_reply_to_customers: boolean;
  customer_filter_mode: 'any_order' | 'pending_order';
  // Método 3: Detección inteligente por palabras clave de tienda
  require_keywords_for_chatbot: boolean;
  chatbot_keywords: string[];
  // Soporte para venta conversacional y envío de imágenes
  send_product_images: boolean;
  allow_chat_orders: boolean;
  // Soporte para pasarelas HTTP (UltraMsg, Evolution API, etc.) opcional
  gateway_type?: 'baileys' | 'ultramsg' | 'evolution';
  ultramsg_instance_id?: string;
  ultramsg_token?: string;
  evolution_api_url?: string;
  evolution_api_key?: string;
  evolution_instance_name?: string;
  template_new_order: string;
  template_order_preparing: string;
  template_order_ready: string;
  template_order_shipped: string;
  template_menu: string;
  template_payment_proof: string;
  // Respuestas configurables del Menú Interactivo
  menu_response_1: string;
  menu_response_2: string;
  menu_response_3: string;
  menu_response_4: string;
  menu_response_5: string;
  custom_menu_options: CustomMenuOption[];
}

export const DEFAULT_BOT_SETTINGS: WhatsAppBotSettings = {
  enabled: true,
  auto_notify_new_order: true, // ✅ Mensaje al terminar el pedido
  auto_notify_status_change: true,
  auto_chatbot_menu: true,
  ignored_numbers: [],
  pause_on_manual_reply: true,
  pause_duration_minutes: 120, // 2 horas por defecto
  only_reply_to_customers: false,
  customer_filter_mode: 'any_order',
  require_keywords_for_chatbot: true, // ✅ Método 3 activado por defecto
  chatbot_keywords: DEFAULT_CHATBOT_KEYWORDS,
  send_product_images: true, // ✅ Enviar imágenes de productos
  allow_chat_orders: true, // ✅ Permitir comprar y registrar pedidos directo por WhatsApp
  gateway_type: 'baileys',
  template_new_order: `🍬 *¡Hola {cliente}! Gracias por tu compra en Chamical Candy Shop* 🍭\n\n📦 *Pedido:* #{pedido_id}\n💰 *Total:* \${total}\n📍 *Entrega:* {direccion}\n\n🛒 *Detalle de tus golosinas:*\n{productos}\n\n🏦 *Datos para Transferencia Bancaria:*\n• *Alias:* \`{alias_banco}\`\n• *Banco:* {banco}\n• *Titular:* {titular}\n• *CBU:* \`{cbu}\`\n\n📸 *Por favor envíanos una foto del comprobante de transferencia por aquí para comenzar a preparar tu pedido. ¡Muchas gracias!* 🎉`,
  template_order_preparing: `👨‍🍳 *¡Buenas noticias {cliente}!* 🍬\n\nTu pedido *#{pedido_id}* por *\${total}* ya está *EN PREPARACIÓN*. 🍭\nNuestros expertos están seleccionando y empacando tus golosinas con el mayor cuidado.\n\n¡Te avisaremos apenas esté listo! ⏱️`,
  template_order_ready: `✨ *¡Tu pedido está LISTO {cliente}!* 🎉\n\n📦 Pedido: *#{pedido_id}*\n📍 Ya podés pasar a retirarlo por nuestro local en los horarios habituales.\n\n¡Te esperamos con tus golosinas preparadas! 🍬`,
  template_order_shipped: `🛵 *¡Tu pedido va en camino {cliente}!* 🚀\n\n📦 Pedido: *#{pedido_id}*\n📍 Dirección de entrega: *{direccion}*\n\nEl cadete ya salió con tu pedido. ¡Mantenete atento para recibir tus golosinas! 🍭`,
  template_menu: `🍬 *¡Hola {cliente}! Bienvenido a Chamical Candy Shop* 🍭\n\n¿En qué podemos ayudarte hoy? *Respondé con el número de opción:*\n\n1️⃣ 📦 *Consultar estado de mi pedido*\n2️⃣ 🏦 *Ver datos de transferencia bancaria*\n3️⃣ 📍 *Horarios y ubicación del local*\n4️⃣ 🛍️ *Ver catálogo de productos y precios*\n5️⃣ 👤 *Hablar con una persona del equipo*\n\n_Escribí *COMPRAR* si querés armar un pedido directo por acá._`,
  template_payment_proof: `📸 *¡Comprobante de pago recibido!* 🎉\n\nMuchas gracias por enviarnos tu comprobante. Nuestro equipo lo verificará a la brevedad para confirmar tu pedido. 🍬`,
  menu_response_1: `📦 *Estado de tu Pedido:* #{pedido_id}\n\n• *Estado:* {estado}\n• *Total:* \${total}\n• *Destino:* {direccion}\n\n_Para volver al menú, enviá la palabra *MENU*._`,
  menu_response_2: `🏦 *Datos para Transferencia Bancaria:* 🍬\n\n• *Alias:* \`{alias_banco}\`\n• *Banco:* {banco}\n• *Titular:* {titular}\n• *CBU:* \`{cbu}\`\n\n📸 *Una vez realizada la transferencia, podés enviar la captura o comprobante por este mismo chat.*\n\n_Enviá *MENU* para ver más opciones._`,
  menu_response_3: `📍 *Ubicación y Horarios de Atención:* 🍬\n\n🏠 *Dirección:* {direccion}\n🕒 *Horarios:* {horarios}\n\n¡Te esperamos con las golosinas más ricas! 🍭\n\n_Enviá *MENU* para volver al menú principal._`,
  menu_response_4: `🛍️ *Catálogo y Precios de Chamical Candy Shop* 🍬\n\n{catalogo_lista}\n\n👉 *También podés explorar la tienda web:* {catalogo_url}\n\n_Para armar tu pedido por acá, respondé con el número de producto que querés o escribí *COMPRAR*._`,
  menu_response_5: `👤 *¡Entendido {cliente}! Un asesor de nuestro equipo te responderá a la brevedad.* 🍬\n\nPor favor dejanos tu consulta detallada para poder ayudarte más rápido. ¡Muchas gracias por tu paciencia!`,
  
  // Flujo de compra por WhatsApp
  template_buy_catalog: `🛍️ *¡Vamos a armar tu pedido de golosinas!* 🍬\n\n{catalogo_lista}\n\n👉 *Respondé con el NÚMERO del producto que querés llevar (ej: 1, 2).*`,
  template_product_photo: `🍬 *{producto}* 🍭\n{detalle}{dietas}\n💰 *Precio:* {precio}\n📦 *Stock:* {stock} disponibles\n\n👉 Para pedir este producto escribí *COMPRAR* o su número.`,
  template_weight_prompt: `🍬 *{producto}* (Venta al peso) ⚖️\n💰 *Precio:* \${precio_kg}/kg • Mínimo: *{min_weight}g* (Fraccionable de a *{step_weight}g*)\n\n*¿Qué cantidad querés llevar?*\n{opciones_gramaje}\n\n👉 *Respondé con el número (1 a {cantidad_opciones})* o escribí tus gramos exactos (ej: *75g*, *150g*, *350g*).`,
  template_unit_quantity_prompt: `🍫 *{producto}*\n💰 *Precio:* \${precio_unitario} por unidad\n\n👉 *¿Cuántas unidades querés llevar?* (Escribí la cantidad, ej: 1, 2, 3...)`,
  template_cart_item_added: `✅ *¡Agregaste {producto}!* 🍬 (+{subtotal_item})\n\n🛒 *Tu carrito actual:*\n{carrito_items}\n\n💰 *Subtotal:* \${subtotal}\n\n👉 ¿Querés agregar otro producto? *(Escribí su número)*\n👉 O escribí *LISTO* para continuar y confirmar tu pedido.`,
  template_cart_view: `🛒 *TU CARRITO ACTUAL:* 🍬\n\n{carrito_items}\n\n💰 *Subtotal:* \${subtotal}\n\n👉 Para sumar más productos, escribí su *NÚMERO*.\n👉 Para quitar un producto, escribí *QUITAR [número]* (ej: QUITAR 1).\n👉 O escribí *LISTO* para avanzar con la entrega y el pago.`,
  template_empty_cart: `⚠️ Tu carrito está vacío. Escribí el *NÚMERO* del producto que querés agregar o escribí *CANCELAR*.`,
  template_shipping_prompt: `🛵 *¿Cómo querés recibir tu pedido?*\n\nRespondé con el número de opción:\n1️⃣ *Retiro por el local (Chamical)* — Sin costo\n2️⃣ *Envío a domicilio con cadete (Chamical)*`,
  template_address_prompt: `📍 *Por favor escribí tu dirección de entrega y entrecalles en Chamical:*`,
  template_name_prompt: `👤 *¿A nombre de quién registramos el pedido?* (Escribí tu nombre y apellido):`,
  template_coupon_prompt: `🎟️ *¿Tenés algún Cupón de Descuento?*\n\n👉 Escribí el código de tu cupón (ej: *{ejemplo_cupon}*) o respondé *NO* para continuar sin cupón.`,
  template_coupon_applied: `🎉 *¡Cupón {cupon} aplicado con éxito!* Descuento: -\${descuento} ✨\n\n💳 *¿Cómo preferís abonar tu pedido?*\n\nRespondé con el número:\n1️⃣ *Transferencia Bancaria* (Alias / CBU)\n2️⃣ *Efectivo contra entrega* (Al retirar o recibir)\n3️⃣ *Mercado Pago* (Link directo de pago)`,
  template_coupon_invalid: `ℹ️ El cupón "{cupon}" no es válido o expiró. Continuamos con el valor regular.\n\n💳 *¿Cómo preferís abonar tu pedido?*\n\nRespondé con el número:\n1️⃣ *Transferencia Bancaria* (Alias / CBU)\n2️⃣ *Efectivo contra entrega* (Al retirar o recibir)\n3️⃣ *Mercado Pago* (Link directo de pago)`,
  template_payment_prompt: `💳 *¿Cómo preferís abonar tu pedido?*\n\nRespondé con el número:\n1️⃣ *Transferencia Bancaria* (Alias / CBU)\n2️⃣ *Efectivo contra entrega* (Al retirar o recibir)\n3️⃣ *Mercado Pago* (Link directo de pago)`,
  template_order_summary: `🍬 *RESUMEN DE TU PEDIDO* 🍭\n\n🛒 *Golosinas:*\n{carrito_items}\n\n💵 *Subtotal:* \${subtotal}\n{linea_descuento}🛵 *Entrega:* {metodo_entrega}\n📍 *Dirección:* {direccion}\n👤 *Cliente:* {cliente}\n💳 *Forma de Pago:* {medio_pago}\n\n💰 *TOTAL A PAGAR:* \${total}\n\n¿Está todo correcto?\n👉 Respondé *SI* para confirmar tu pedido o *CANCELAR*.`,
  template_order_confirmed: `🎉 *¡PEDIDO #{pedido_id} REGISTRADO CON ÉXITO!* 🍬\n\nMuchas gracias *{cliente}*, tu pedido ya fue cargado automáticamente.\n\n📦 *Detalle:*\n{carrito_items}\n💰 *Total:* \${total}\n📍 *Entrega:* {direccion}\n\n{instrucciones_pago}`,
  template_order_cancelled: `❌ *Proceso de compra cancelado.* ¿En qué más podemos ayudarte?\n\n{menu}`,
  custom_menu_options: []
};

let inMemorySettings: WhatsAppBotSettings = { ...DEFAULT_BOT_SETTINGS };

export async function getBotSettings(): Promise<WhatsAppBotSettings> {
  const db = serviceClient || supabase;
  try {
    const { data } = await db
      .from('homepage_sections')
      .select('content')
      .eq('section_type', 'whatsapp_bot_settings')
      .limit(1)
      .maybeSingle();

    if (data?.content) {
      inMemorySettings = { ...DEFAULT_BOT_SETTINGS, ...data.content };
      return inMemorySettings;
    }
  } catch (_e) {}

  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      inMemorySettings = { ...DEFAULT_BOT_SETTINGS, ...JSON.parse(raw) };
      return inMemorySettings;
    }
  } catch (_e) {}

  return inMemorySettings;
}

export async function saveBotSettings(settings: Partial<WhatsAppBotSettings>): Promise<WhatsAppBotSettings> {
  const current = await getBotSettings();
  const updated = { ...current, ...settings };
  inMemorySettings = updated;

  const db = serviceClient || supabase;
  try {
    const { data: existing } = await db
      .from('homepage_sections')
      .select('id')
      .eq('section_type', 'whatsapp_bot_settings')
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      await db
        .from('homepage_sections')
        .update({ content: updated })
        .eq('id', existing.id);
    } else {
      await db
        .from('homepage_sections')
        .insert({
          section_type: 'whatsapp_bot_settings',
          title: 'Configuración WhatsApp Bot',
          visible: false,
          order_index: 97,
          content: updated
        });
    }
  } catch (err) {
    console.error('[WhatsApp Bot DB Save Error]:', err);
  }

  try {
    ensureDir(DATA_DIR);
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (_e) {}

  return updated;
}

export interface BotOrderItem {
  productId: string;
  name: string;
  quantity: number;
  weightGrams?: number;
  unitPrice: number;
}

export interface PendingProduct {
  id: string;
  name: string;
  unit_type?: 'weight' | 'piece';
  price_per_kg?: number;
  base_price?: number;
  price?: number;
  min_weight?: number;
  max_weight?: number;
  weight_step?: number;
  sizes?: any;
  options: Array<{ label: string; grams: number; price: number }>;
}

export interface BotOrderSession {
  step: 'SELECTING_PRODUCTS' | 'SELECTING_WEIGHT' | 'SELECTING_QUANTITY' | 'ASK_SHIPPING_METHOD' | 'ASK_ADDRESS' | 'ASK_NAME' | 'ASK_COUPON' | 'ASK_PAYMENT_METHOD' | 'CONFIRMING';
  pendingProduct?: PendingProduct;
  items: BotOrderItem[];
  subtotal: number;
  couponCode?: string;
  discountAmount: number;
  shippingCost: number;
  total: number;
  shippingMethod?: 'pickup' | 'delivery';
  shippingAddress?: string;
  shippingName?: string;
  paymentMethod?: 'transfer' | 'cash' | 'mercadopago';
  lastActivity: number;
}

export function buildWeightOptionsForProduct(p: any): Array<{ label: string; grams: number; price: number }> {
  const minWeight = Number(p.min_weight) || 25;
  const maxWeight = Number(p.max_weight) || 1000;
  const step = Number(p.weight_step) || 25;
  const pricePerKg = Number(p.price_per_kg || p.base_price || p.price || 10000);

  const standardPoints = [50, 100, 150, 250, 500];
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

class WhatsAppBotService {
  private sock: any = null;
  public status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected' = 'disconnected';
  public qrCode: string | null = null;
  public connectedUser: any = null;
  private isInitializing: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  // Registro en memoria de chats temporalmente pausados: remoteJid -> timestamp fin de pausa
  private pausedChats: Map<string, number> = new Map();
  // Registro en memoria de sesiones de compra activas por WhatsApp
  private orderSessions: Map<string, BotOrderSession> = new Map();
  // Registro de contactos y chats sincronizados
  private contactsMap: Map<string, SyncedWhatsAppContact> = new Map();
  private saveContactsTimeout: any = null;

  constructor() {
    // Cargar contactos sincronizados previos si existen
    try {
      if (fs.existsSync(CONTACTS_FILE)) {
        const raw = fs.readFileSync(CONTACTS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const c of parsed) {
            if (c?.phone) this.contactsMap.set(c.phone, c);
          }
        }
      }
    } catch (_e) {}

    // Si no es serverless y hay sesión guardada previa, iniciar conexión
    if (!isServerless) {
      try {
        if (fs.existsSync(AUTH_DIR) && fs.readdirSync(AUTH_DIR).length > 0) {
          setTimeout(() => {
            this.start().catch(() => {});
          }, 3000);
        }
      } catch (_e) {}
    }
  }

  private saveContactsToFile(): void {
    if (this.saveContactsTimeout) return;
    this.saveContactsTimeout = setTimeout(() => {
      this.saveContactsTimeout = null;
      try {
        ensureDir(DATA_DIR);
        const list = Array.from(this.contactsMap.values());
        fs.writeFileSync(CONTACTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
      } catch (_e) {}
    }, 2000);
  }

  public async getContacts(): Promise<SyncedWhatsAppContact[]> {
    return Array.from(this.contactsMap.values()).sort((a, b) => {
      if (a.name && !b.name) return -1;
      if (!a.name && b.name) return 1;
      return (b.lastActive || '').localeCompare(a.lastActive || '');
    });
  }

  public async start(): Promise<void> {
    if (this.isInitializing) return;
    this.isInitializing = true;
    this.status = 'connecting';

    try {
      ensureDir(DATA_DIR);
      ensureDir(AUTH_DIR);

      // Carga dinámica de Baileys para no bloquear el inicio en entornos serverless
      const baileys = await import('@whiskeysockets/baileys');
      const makeWASocket = baileys.default || baileys.makeWASocket;
      const { useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, DisconnectReason } = baileys;

      const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
      const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] as any }));

      let logger: any = { level: 'silent', child: () => logger, trace: () => {}, debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, fatal: () => {} };
      try {
        const pino = (await import('pino')).default;
        logger = pino({ level: 'silent' });
      } catch (_e) {}

      this.sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        generateHighQualityLinkPreview: true,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 15000,
        defaultQueryTimeoutMs: 60000,
        syncFullHistory: false,
        retryRequestDelayMs: 250,
        emitOwnEvents: false
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            this.qrCode = await QRCode.toDataURL(qr, { scale: 8, margin: 2 });
            this.status = 'qr_ready';
            console.log('[WhatsApp Bot]: Nuevo código QR generado.');
          } catch (err) {
            console.error('[WhatsApp Bot QR Error]:', err);
          }
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason?.loggedOut;

          this.connectedUser = null;
          this.qrCode = null;

          if (isLoggedOut) {
            console.log('[WhatsApp Bot]: ❌ Sesión cerrada por el usuario o desvinculada desde WhatsApp en el teléfono.');
            this.status = 'disconnected';
            this.reconnectAttempts = 0;
            this.clearAuth();
          } else if (!isServerless) {
            // Reconexión automática continua ante microcortes, código 515 (restartRequired), 428 (connectionLost), etc.
            this.reconnectAttempts++;
            const isRestartRequired = statusCode === 515;
            const delay = isRestartRequired ? 1500 : Math.min(2000 * Math.pow(1.3, Math.min(this.reconnectAttempts, 8)), 20000);
            
            this.status = 'connecting';
            console.log(`[WhatsApp Bot]: 🔄 Conexión interrumpida (código ${statusCode || 'desconocido'}). Reconectando intento #${this.reconnectAttempts} en ${(delay/1000).toFixed(1)}s...`);

            setTimeout(() => {
              this.start().catch((err) => {
                console.error('[WhatsApp Bot Auto-Reconnect Error]:', err);
              });
            }, delay);
          } else {
            this.status = 'disconnected';
          }
        } else if (connection === 'open') {
          this.status = 'connected';
          this.qrCode = null;
          this.reconnectAttempts = 0;
          this.connectedUser = this.sock?.user || null;
          console.log(`[WhatsApp Bot]: ✅ Conectado exitosamente como ${this.connectedUser?.name || this.connectedUser?.id}`);
        }
      });

      // Escuchar y sincronizar contactos de WhatsApp
      this.sock.ev.on('contacts.upsert', (contacts: any[]) => {
        if (!Array.isArray(contacts)) return;
        for (const c of contacts) {
          if (!c.id || c.id.endsWith('@g.us')) continue;
          const phone = c.id.split('@')[0].replace(/\D/g, '');
          if (!phone) continue;
          const existing = this.contactsMap.get(phone) || { jid: c.id, phone, name: phone, isGroup: false };
          const name = c.name || c.notify || c.verifiedName || existing.name || phone;
          this.contactsMap.set(phone, { ...existing, jid: c.id, phone, name, pushName: c.notify || existing.pushName });
        }
        this.saveContactsToFile();
      });

      this.sock.ev.on('contacts.update', (contacts: any[]) => {
        if (!Array.isArray(contacts)) return;
        for (const c of contacts) {
          if (!c.id || c.id.endsWith('@g.us')) continue;
          const phone = c.id.split('@')[0].replace(/\D/g, '');
          if (!phone) continue;
          const existing = this.contactsMap.get(phone) || { jid: c.id, phone, name: phone, isGroup: false };
          const name = c.name || c.notify || c.verifiedName || existing.name || phone;
          this.contactsMap.set(phone, { ...existing, jid: c.id, phone, name, pushName: c.notify || existing.pushName });
        }
        this.saveContactsToFile();
      });

      this.sock.ev.on('chats.upsert', (chats: any[]) => {
        if (!Array.isArray(chats)) return;
        for (const ch of chats) {
          if (!ch.id || ch.id.endsWith('@g.us')) continue;
          const phone = ch.id.split('@')[0].replace(/\D/g, '');
          if (!phone) continue;
          const existing = this.contactsMap.get(phone) || { jid: ch.id, phone, name: phone, isGroup: false };
          const name = ch.name || existing.name || phone;
          this.contactsMap.set(phone, { ...existing, jid: ch.id, phone, name });
        }
        this.saveContactsToFile();
      });

      // Escuchar mensajes entrantes y salientes para el Menú Interactivo y Pausa Inteligente
      this.sock.ev.on('messages.upsert', async (chatUpdate: any) => {
        if (!chatUpdate.messages || chatUpdate.messages.length === 0) return;
        const settings = await getBotSettings();

        for (const msg of chatUpdate.messages) {
          if (!msg.key?.remoteJid || msg.key.remoteJid.endsWith('@g.us')) continue;

          // Registrar contacto desde mensaje
          const msgPhone = msg.key.remoteJid.split('@')[0].replace(/\D/g, '');
          if (msgPhone) {
            const existing = this.contactsMap.get(msgPhone) || { jid: msg.key.remoteJid, phone: msgPhone, name: msgPhone, isGroup: false };
            const pushName = msg.pushName || existing.pushName || '';
            const name = (pushName && pushName !== msgPhone) ? pushName : existing.name;
            this.contactsMap.set(msgPhone, {
              ...existing,
              jid: msg.key.remoteJid,
              phone: msgPhone,
              name,
              pushName,
              lastActive: new Date().toISOString()
            });
            this.saveContactsToFile();
          }

          if (!settings.enabled) continue;

          // Si el mensaje lo envié yo manualmente desde el WhatsApp de la tienda/personal
          if (msg.key.fromMe) {
            if (settings.pause_on_manual_reply) {
              const minutes = Number(settings.pause_duration_minutes) || 120;
              const pausedUntil = Date.now() + minutes * 60 * 1000;
              this.pausedChats.set(msg.key.remoteJid, pausedUntil);
              console.log(`[WhatsApp Bot]: ⏸️ Chat ${msg.key.remoteJid} pausado por respuesta manual del admin por ${minutes} minutos.`);
            }
            continue;
          }

          // Si el mensaje viene de un cliente y el chatbot está activo
          if (settings.auto_chatbot_menu) {
            await this.handleIncomingMessage(msg);
          }
        }
      });

    } catch (err) {
      console.error('[WhatsApp Bot Init Error]:', err);
      this.status = 'disconnected';
    } finally {
      this.isInitializing = false;
    }
  }

  public async logout(): Promise<void> {
    try {
      if (this.sock) {
        await this.sock.logout().catch(() => {});
        this.sock = null;
      }
    } catch (_e) {}
    this.clearAuth();
    this.status = 'disconnected';
    this.qrCode = null;
    this.connectedUser = null;
  }

  private clearAuth(): void {
    try {
      if (fs.existsSync(AUTH_DIR)) {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      }
    } catch (_e) {}
  }

  /**
   * Normaliza un número de teléfono a formato WhatsApp (ej: 5493826XXXXXX@s.whatsapp.net)
   */
  public normalizeJid(phone: string): string {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = clean.substring(1);
    }
    if (clean.startsWith('54') && !clean.startsWith('549') && clean.length >= 10) {
      clean = '549' + clean.substring(2);
    } else if (!clean.startsWith('54')) {
      clean = '549' + clean;
    }
    return `${clean}@s.whatsapp.net`;
  }

  /**
   * Envía un mensaje directo a un teléfono de cliente
   */
  public async sendTextMessage(phone: string, text: string): Promise<boolean> {
    // 1. Si Baileys está conectado, enviar directo por WebSocket
    if (this.status === 'connected' && this.sock) {
      try {
        const jid = this.normalizeJid(phone);
        await this.sock.sendMessage(jid, { text });
        console.log(`[WhatsApp Bot]: ✅ Mensaje enviado a ${phone} vía Baileys`);
        return true;
      } catch (err) {
        console.error(`[WhatsApp Bot Baileys Send Error to ${phone}]:`, err);
      }
    }

    // 2. Si hay pasarela HTTP configurada (UltraMsg / Evolution API / CallMeBot)
    const settings = await getBotSettings();
    if (settings.gateway_type === 'ultramsg' && settings.ultramsg_instance_id && settings.ultramsg_token) {
      try {
        const cleanPhone = phone.replace(/\D/g, '');
        const res = await fetch(`https://api.ultramsg.com/${settings.ultramsg_instance_id}/messages/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: settings.ultramsg_token,
            to: cleanPhone,
            body: text
          })
        });
        const data = await res.json().catch(() => ({}));
        if (data.sent === 'true' || data.id) {
          console.log(`[WhatsApp Bot]: ✅ Mensaje enviado a ${phone} vía UltraMsg`);
          return true;
        }
      } catch (err) {
        console.error('[UltraMsg Send Error]:', err);
      }
    }

    return false;
  }

  /**
   * Envía un mensaje con imagen (URL o Buffer) a un teléfono de cliente
   */
  public async sendImageMessage(phone: string, imageSource: string | Buffer, caption?: string): Promise<boolean> {
    if (this.status === 'connected' && this.sock) {
      try {
        const jid = this.normalizeJid(phone);
        const imagePayload = Buffer.isBuffer(imageSource) ? imageSource : { url: imageSource };
        await this.sock.sendMessage(jid, {
          image: imagePayload,
          caption: caption || ''
        });
        console.log(`[WhatsApp Bot]: 📸 Imagen enviada a ${phone} vía Baileys`);
        return true;
      } catch (err) {
        console.error(`[WhatsApp Bot Baileys Image Send Error to ${phone}]:`, err);
      }
    }

    const settings = await getBotSettings();
    if (settings.gateway_type === 'ultramsg' && settings.ultramsg_instance_id && settings.ultramsg_token) {
      try {
        const cleanPhone = phone.replace(/\D/g, '');
        const res = await fetch(`https://api.ultramsg.com/${settings.ultramsg_instance_id}/messages/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: settings.ultramsg_token,
            to: cleanPhone,
            image: imageUrl,
            caption: caption || ''
          })
        });
        const data = await res.json().catch(() => ({}));
        if (data.sent === 'true' || data.id) {
          console.log(`[WhatsApp Bot]: 📸 Imagen enviada a ${phone} vía UltraMsg`);
          return true;
        }
      } catch (err) {
        console.error('[UltraMsg Image Send Error]:', err);
      }
    }

    return false;
  }

  /**
   * Interpola variables dinámicas en una plantilla
   */
  public formatTemplate(template: string, data: Record<string, any>): string {
    let result = template || '';
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`\\{${key}\\}`, 'gi');
      result = result.replace(regex, String(value ?? ''));
    }
    return result;
  }

  /**
   * Envía notificación automática de nuevo pedido
   */
  public async notifyNewOrder(order: any, customerPhone?: string): Promise<boolean> {
    try {
      const settings = await getBotSettings();
      if (!settings.enabled || !settings.auto_notify_new_order) return false;

      const phone = customerPhone || order.shipping_address?.match(/\d{8,15}/)?.[0] || order.customer_phone;
      if (!phone) return false;

      const storeSettings = await getStoreSettingsHelper();

      // Formatear resumen de productos
      let itemsSummary = '';
      if (Array.isArray(order.items) && order.items.length > 0) {
        itemsSummary = order.items.map((item: any) => {
          const title = item.name || item.title || item.products?.title || 'Producto';
          const qtyOrWeight = item.weight_grams ? `${item.weight_grams}g` : `${item.quantity || 1} u.`;
          const price = Number(item.unit_price || item.item_price || 0);
          return `• ${title} (${qtyOrWeight}) - \$${price.toLocaleString('es-AR')}`;
        }).join('\n');
      } else {
        itemsSummary = '• Golosinas surtidas';
      }

      const templateData = {
        cliente: order.shipping_name || 'Estimado/a cliente',
        pedido_id: order.id ? order.id.slice(0, 8).toUpperCase() : 'N/A',
        total: Number(order.total || 0).toLocaleString('es-AR'),
        direccion: order.shipping_address || 'Retiro en tienda',
        productos: itemsSummary,
        alias_banco: storeSettings?.bank_alias || 'martinchox33',
        banco: storeSettings?.bank_name || 'MercadoPago',
        titular: storeSettings?.bank_holder || 'Gonzalez Martin Gustavo',
        cbu: storeSettings?.bank_cbu || ''
      };

      const message = this.formatTemplate(settings.template_new_order, templateData);
      return this.sendTextMessage(phone, message);
    } catch (err) {
      console.warn('[WhatsApp Bot notifyNewOrder Error]:', err);
      return false;
    }
  }

  /**
   * Envía notificación de cambio de estado de pedido
   */
  public async notifyOrderStatus(order: any, newStatus: string, customerPhone?: string): Promise<boolean> {
    try {
      const settings = await getBotSettings();
      if (!settings.enabled || !settings.auto_notify_status_change) return false;

      const phone = customerPhone || order.customer_phone || order.shipping_address?.match(/\d{8,15}/)?.[0];
      if (!phone) return false;

      let templateToUse = '';
      if (newStatus === 'preparing' || newStatus === 'en_preparacion') {
        templateToUse = settings.template_order_preparing;
      } else if (newStatus === 'ready' || newStatus === 'listo') {
        templateToUse = settings.template_order_ready;
      } else if (newStatus === 'shipped' || newStatus === 'enviado' || newStatus === 'delivered') {
        templateToUse = settings.template_order_shipped;
      } else {
        return false;
      }

      const templateData = {
        cliente: order.shipping_name || 'Estimado/a cliente',
        pedido_id: order.id ? order.id.slice(0, 8).toUpperCase() : 'N/A',
        total: Number(order.total || 0).toLocaleString('es-AR'),
        direccion: order.shipping_address || 'Retiro en tienda',
        estado: newStatus
      };

      const message = this.formatTemplate(templateToUse, templateData);
      return this.sendTextMessage(phone, message);
    } catch (err) {
      console.warn('[WhatsApp Bot notifyOrderStatus Error]:', err);
      return false;
    }
  }

  /**
   * Procesa mensajes entrantes y responde con el Menú Interactivo / Venta Conversacional
   */
  private async handleIncomingMessage(msg: any): Promise<void> {
    try {
      const from = msg.key.remoteJid;
      if (!from || !this.sock) return;

      const settings = await getBotSettings();

      // 1. Verificar si el chat está temporalmente pausado por respuesta manual del admin
      const pausedUntil = this.pausedChats.get(from);
      if (pausedUntil && pausedUntil > Date.now()) {
        const remainingMinutes = Math.ceil((pausedUntil - Date.now()) / 60000);
        console.log(`[WhatsApp Bot]: ⏸️ Chat ${from} está pausado manualmente (${remainingMinutes} min restantes). Omitiendo bot.`);
        return;
      }

      // 2. Verificar si el número está en la lista de números excluidos
      const cleanFromDigits = from.replace(/\D/g, '');
      if (Array.isArray(settings.ignored_numbers) && settings.ignored_numbers.length > 0) {
        const isIgnored = settings.ignored_numbers.some((item: any) => {
          const rawIgnored = typeof item === 'string' ? item : (item.phone || '');
          const cleanIgnored = String(rawIgnored).replace(/\D/g, '');
          if (!cleanIgnored) return false;
          const suffixFrom = cleanFromDigits.slice(-8);
          const suffixIgnored = cleanIgnored.slice(-8);
          return cleanFromDigits === cleanIgnored || cleanFromDigits.includes(cleanIgnored) || cleanIgnored.includes(cleanFromDigits) || (suffixFrom.length >= 8 && suffixFrom === suffixIgnored);
        });

        if (isIgnored) return;
      }

      // 3. Filtro Solo Clientes
      if (settings.only_reply_to_customers) {
        const rawDigits = from.replace(/\D/g, '');
        const suffixDigits = rawDigits.slice(-8);
        const db = serviceClient || supabase;

        try {
          const { data: customerOrders } = await db
            .from('orders')
            .select('id, status, shipping_address, customer_phone')
            .or(`customer_phone.ilike.%${suffixDigits}%,shipping_address.ilike.%${suffixDigits}%`)
            .limit(5);

          if (!customerOrders || customerOrders.length === 0) return;
        } catch (_err) {}
      }

      const pushName = msg.pushName || 'Hola';
      const body = (
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        ''
      ).trim().toLowerCase();

      const hasImage = !!msg.message?.imageMessage || !!msg.message?.documentMessage;
      const storeSettings = await getStoreSettingsHelper();
      const db = serviceClient || supabase;

      // 4. Comprobante de pago
      if (hasImage) {
        await this.sock.sendMessage(from, { text: settings.template_payment_proof });
        return;
      }

      if (!body) return;

      // Preparar variables comunes
      const commonVars: Record<string, any> = {
        cliente: pushName,
        alias_banco: storeSettings?.bank_alias || 'martinchox33',
        banco: storeSettings?.bank_name || 'MercadoPago',
        titular: storeSettings?.bank_holder || 'Gonzalez Martin Gustavo',
        cbu: storeSettings?.bank_cbu || '',
        direccion: storeSettings?.pickup_address || storeSettings?.address || 'Chamical, La Rioja, Argentina',
        horarios: storeSettings?.pickup_schedule || storeSettings?.opening_hours || 'Lunes a Sábados de 09:00 a 13:00 y de 17:30 a 22:00 hs.',
        catalogo_url: storeSettings?.store_website_url || 'https://candyshopchamical.netlify.app'
      };

      // 5. FLUJO DE COMPRA CONVERSACIONAL Y GESTIÓN DE CARRITO
      const activeSession = this.orderSessions.get(from);
      if (activeSession && settings.allow_chat_orders) {
        if (Date.now() - activeSession.lastActivity > 30 * 60 * 1000) {
          this.orderSessions.delete(from);
        } else {
          activeSession.lastActivity = Date.now();

          // Comando cancelar
          if (body === 'cancelar' || body === 'salir' || body === 'menu' || body === 'menú') {
            this.orderSessions.delete(from);
            await this.sock.sendMessage(from, {
              text: '❌ *Proceso de compra cancelado.* ¿En qué más podemos ayudarte?\n\n' + this.formatTemplate(settings.template_menu, commonVars)
            });
            return;
          }

          // Comando Ver Carrito
          if (body === 'carrito' || body === 'ver carrito' || body === 'ver') {
            if (activeSession.items.length === 0) {
              await this.sock.sendMessage(from, { text: '🛒 Tu carrito está vacío todavía. Escribí el *NÚMERO* del producto que querés agregar.' });
              return;
            }
            const itemsList = activeSession.items.map((i, idx) => `${idx + 1}️⃣ ${i.name} - \$${i.unitPrice.toLocaleString('es-AR')}`).join('\n');
            await this.sock.sendMessage(from, {
              text: `🛒 *TU CARRITO ACTUAL:* 🍬\n\n${itemsList}\n\n💰 *Subtotal:* \$${activeSession.subtotal.toLocaleString('es-AR')}\n\n👉 Para sumar más productos, escribí su *NÚMERO*.\n👉 Para quitar un producto, escribí *QUITAR [número]* (ej: QUITAR 1).\n👉 O escribí *LISTO* para avanzar con la entrega y el pago.`
            });
            return;
          }

          // Comando Vaciar Carrito
          if (body === 'vaciar' || body === 'borrar carrito') {
            activeSession.items = [];
            activeSession.subtotal = 0;
            activeSession.total = 0;
            activeSession.step = 'SELECTING_PRODUCTS';
            activeSession.pendingProduct = undefined;
            await this.sock.sendMessage(from, { text: '🗑️ *Vaciaste tu carrito.* Podés elegir nuevos productos de la lista escribiendo su *NÚMERO*.' });
            return;
          }

          // Comando Quitar Item
          if (body.startsWith('quitar') || body.startsWith('eliminar') || body.startsWith('borrar')) {
            const numToRemove = parseInt(body.replace(/\D/g, ''), 10);
            if (!isNaN(numToRemove) && numToRemove >= 1 && numToRemove <= activeSession.items.length) {
              const removed = activeSession.items.splice(numToRemove - 1, 1)[0];
              activeSession.subtotal = activeSession.items.reduce((sum, it) => sum + it.unitPrice, 0);
              activeSession.total = Math.max(0, activeSession.subtotal - (activeSession.discountAmount || 0));
              
              if (activeSession.items.length === 0) {
                await this.sock.sendMessage(from, { text: `🗑️ Quitaste *${removed.name}*. Tu carrito quedó vacío. Escribí el número de un producto para agregar.` });
              } else {
                const itemsList = activeSession.items.map((i, idx) => `${idx + 1}️⃣ ${i.name} - \$${i.unitPrice.toLocaleString('es-AR')}`).join('\n');
                await this.sock.sendMessage(from, {
                  text: `🗑️ Quitaste *${removed.name}*.\n\n🛒 *Carrito restante:*\n${itemsList}\n\n💰 *Total:* \$${activeSession.total.toLocaleString('es-AR')}\n\n👉 Escribí otro número o escribí *LISTO* para finalizar.`
                });
              }
              return;
            } else {
              await this.sock.sendMessage(from, { text: '⚠️ Para quitar un producto escribí *QUITAR* seguido del número del ítem en tu carrito (ej: *QUITAR 1*).' });
              return;
            }
          }

          // PASO 1: SELECCIÓN DE PRODUCTOS DEL CATÁLOGO
          if (activeSession.step === 'SELECTING_PRODUCTS') {
            if (body === 'listo' || body === 'continuar' || body === 'fin' || body === 'finalizar' || body === 'pagar' || body === 'checkout') {
              if (activeSession.items.length === 0) {
                await this.sock.sendMessage(from, { text: '⚠️ Tu carrito está vacío. Escribí el *NÚMERO* del producto que querés agregar o escribí *CANCELAR*.' });
                return;
              }
              activeSession.step = 'ASK_SHIPPING_METHOD';
              await this.sock.sendMessage(from, {
                text: `🛵 *¿Cómo querés recibir tu pedido?*\n\nRespondé con el número de opción:\n1️⃣ *Retiro por el local (Chamical)* — Sin costo\n2️⃣ *Envío a domicilio con cadete (Chamical)*`
              });
              return;
            }

            const { data: availableProducts } = await db
              .from('products')
              .select('id, name, price, base_price, price_per_kg, unit_type, min_weight, max_weight, weight_step, sizes, stock, is_bulk, images, image_url')
              .gt('stock', 0)
              .order('created_at', { ascending: false })
              .limit(12);

            const numIdx = parseInt(body.replace(/\D/g, ''), 10);
            let selectedProd: any = null;

            if (!isNaN(numIdx) && numIdx >= 1 && numIdx <= (availableProducts?.length || 0)) {
              selectedProd = availableProducts?.[numIdx - 1];
            } else if (availableProducts) {
              selectedProd = availableProducts.find((p: any) => body.includes(p.name.toLowerCase().slice(0, 5)));
            }

            if (selectedProd) {
              const isWeight = selectedProd.unit_type === 'weight' || selectedProd.is_bulk;
              const pricing = getProductPricingInfo(selectedProd);

              if (isWeight) {
                const options = buildWeightOptionsForProduct(selectedProd);
                const minWeight = Number(selectedProd.min_weight) || 25;
                const step = Number(selectedProd.weight_step) || 25;

                activeSession.step = 'SELECTING_WEIGHT';
                activeSession.pendingProduct = {
                  ...selectedProd,
                  options
                };

                const optionsList = options.map((opt, i) => `${i + 1}️⃣ *${opt.label}* — \$${opt.price.toLocaleString('es-AR')}`).join('\n');

                if (settings.send_product_images && selectedProd.image_url) {
                  await this.sendImageMessage(
                    from,
                    selectedProd.image_url,
                    `🍬 *${selectedProd.name}* (Venta al peso)\n💰 *${pricing.displayPriceShort}* • \$${pricing.pricePerKg.toLocaleString('es-AR')}/kg`
                  );
                }

                await this.sock.sendMessage(from, {
                  text: `🍬 *${selectedProd.name}* (Venta al peso) ⚖️\n💰 *Precio:* *${pricing.displayPriceShort}* (\$${pricing.pricePerKg.toLocaleString('es-AR')}/kg)\n\n*¿Qué cantidad querés llevar?*\n${optionsList}\n\n👉 *Respondé con el número (1 a ${options.length})* o escribí tus gramos exactos (ej: *50g*, *100g*, *150g*).`
                });
                return;
              } else {
                // Producto por unidad
                const unitPrice = pricing.unitPrice;
                activeSession.step = 'SELECTING_QUANTITY';
                activeSession.pendingProduct = {
                  ...selectedProd,
                  options: []
                };

                if (settings.send_product_images && selectedProd.image_url) {
                  await this.sendImageMessage(
                    from,
                    selectedProd.image_url,
                    `🍫 *${selectedProd.name}* — \$${unitPrice.toLocaleString('es-AR')}`
                  );
                }

                await this.sock.sendMessage(from, {
                  text: `🍫 *${selectedProd.name}*\n💰 *Precio:* \$${unitPrice.toLocaleString('es-AR')} por unidad\n\n👉 *¿Cuántas unidades querés llevar?* (Escribí la cantidad, ej: 1, 2, 3...)`
                });
                return;
              }
            } else {
              await this.sock.sendMessage(from, {
                text: `🔍 No entendimos la opción. Escribí el *NÚMERO* del producto de la lista (ej: 1, 2, 3...) o escribí *LISTO* para finalizar tu pedido.`
              });
              return;
            }
          }

          // PASO 1.B: SELECCIÓN DE GRAMAJE PARA GOMITAS AL PESO
          if (activeSession.step === 'SELECTING_WEIGHT' && activeSession.pendingProduct) {
            const p = activeSession.pendingProduct;
            const options = p.options || [];
            const minWeight = Number(p.min_weight) || 25;
            const maxWeight = Number(p.max_weight) || 1000;
            const step = Number(p.weight_step) || 25;

            let chosenGrams: number | null = null;
            let chosenPrice: number = 0;

            const optIdx = parseInt(body.replace(/\D/g, ''), 10);
            if (!isNaN(optIdx) && optIdx >= 1 && optIdx <= options.length && !body.includes('g') && !body.includes('kilo')) {
              chosenGrams = options[optIdx - 1].grams;
              chosenPrice = options[optIdx - 1].price;
            } else {
              const parsedGrams = parseGramsFromText(body);
              if (parsedGrams) {
                if (parsedGrams < minWeight) {
                  const minPrice = calculateGramPrice(p, minWeight);
                  await this.sock.sendMessage(from, {
                    text: `⚠️ La cantidad mínima de compra para *${p.name}* es de *${minWeight}g* (\$${minPrice.toLocaleString('es-AR')}).\n\n👉 Respondé *1* para llevar ${minWeight}g o escribí otra cantidad superior a ${minWeight}g.`
                  });
                  return;
                }
                if (parsedGrams > maxWeight) {
                  await this.sock.sendMessage(from, {
                    text: `⚠️ El máximo disponible por bolsita es de *${maxWeight}g*. Podés pedir hasta ${maxWeight}g por porción.`
                  });
                  return;
                }
                // Validar múltiplos de step
                if ((parsedGrams - minWeight) % step !== 0 && parsedGrams % step !== 0) {
                  const lower = Math.floor(parsedGrams / step) * step || minWeight;
                  const upper = lower + step;
                  const priceLower = calculateGramPrice(p, lower);
                  const priceUpper = calculateGramPrice(p, upper);
                  await this.sock.sendMessage(from, {
                    text: `⚠️ *${p.name}* se fracciona en pasos de *${step}g*.\n\n¿Te preparamos:\n1️⃣ *${lower}g* (\$${priceLower.toLocaleString('es-AR')})\n2️⃣ *${upper}g* (\$${priceUpper.toLocaleString('es-AR')})?\n\n👉 Respondé 1 o 2.`
                  });
                  return;
                }

                chosenGrams = parsedGrams;
                chosenPrice = calculateGramPrice(p, parsedGrams);
              }
            }

            if (chosenGrams && chosenPrice > 0) {
              const formattedName = `${p.name} (${chosenGrams}g)`;
              activeSession.items.push({
                productId: p.id,
                name: formattedName,
                quantity: 1,
                weightGrams: chosenGrams,
                unitPrice: chosenPrice
              });

              activeSession.subtotal = activeSession.items.reduce((acc, it) => acc + it.unitPrice, 0);
              activeSession.total = Math.max(0, activeSession.subtotal - (activeSession.discountAmount || 0));
              activeSession.step = 'SELECTING_PRODUCTS';
              activeSession.pendingProduct = undefined;

              const itemsList = activeSession.items.map((i, idx) => `• ${i.name} - \$${i.unitPrice.toLocaleString('es-AR')}`).join('\n');

              await this.sock.sendMessage(from, {
                text: `✅ *¡Agregaste ${formattedName}!* 🍬 (+\$${chosenPrice.toLocaleString('es-AR')})\n\n🛒 *Tu carrito actual:*\n${itemsList}\n\n💰 *Subtotal:* \$${activeSession.subtotal.toLocaleString('es-AR')}\n\n👉 ¿Querés agregar otro producto? *(Escribí su número)*\n👉 O escribí *LISTO* para continuar y confirmar tu pedido.`
              });
              return;
            } else {
              await this.sock.sendMessage(from, {
                text: `🔍 No entendimos la cantidad. Respondé con el número de opción (1 a ${options.length}) o escribí los gramos que querés (ej: *50g*, *100g*, *250g*).`
              });
              return;
            }
          }

          // PASO 1.C: SELECCIÓN DE CANTIDAD PARA PRODUCTOS POR UNIDAD
          if (activeSession.step === 'SELECTING_QUANTITY' && activeSession.pendingProduct) {
            const p = activeSession.pendingProduct;
            const qty = parseInt(body.replace(/\D/g, ''), 10) || 1;
            const unitPrice = Number(p.base_price || p.price || 0);
            const totalPrice = unitPrice * qty;
            const formattedName = `${p.name} (x${qty})`;

            activeSession.items.push({
              productId: p.id,
              name: formattedName,
              quantity: qty,
              unitPrice: totalPrice
            });

            activeSession.subtotal = activeSession.items.reduce((acc, it) => acc + it.unitPrice, 0);
            activeSession.total = Math.max(0, activeSession.subtotal - (activeSession.discountAmount || 0));
            activeSession.step = 'SELECTING_PRODUCTS';
            activeSession.pendingProduct = undefined;

            const itemsList = activeSession.items.map((i) => `• ${i.name} - \$${i.unitPrice.toLocaleString('es-AR')}`).join('\n');

            await this.sock.sendMessage(from, {
              text: `✅ *¡Agregaste ${formattedName}!* 🍫 (+\$${totalPrice.toLocaleString('es-AR')})\n\n🛒 *Tu carrito actual:*\n${itemsList}\n\n💰 *Subtotal:* \$${activeSession.subtotal.toLocaleString('es-AR')}\n\n👉 ¿Querés agregar otro producto? *(Escribí su número)*\n👉 O escribí *LISTO* para continuar y confirmar tu pedido.`
            });
            return;
          }

          // PASO 2: SELECCIÓN DE MÉTODO DE ENVÍO
          if (activeSession.step === 'ASK_SHIPPING_METHOD') {
            if (body === '1' || body.includes('retiro') || body.includes('local')) {
              activeSession.shippingMethod = 'pickup';
              activeSession.shippingAddress = commonVars.direccion || 'Retiro en Local (Chamical)';
              activeSession.step = 'ASK_NAME';
              await this.sock.sendMessage(from, { text: '👤 *¿A nombre de quién registramos el pedido?* (Escribí tu nombre y apellido):' });
              return;
            } else if (body === '2' || body.includes('envio') || body.includes('domicilio') || body.includes('cadete')) {
              activeSession.shippingMethod = 'delivery';
              activeSession.step = 'ASK_ADDRESS';
              await this.sock.sendMessage(from, { text: '📍 *Por favor escribí tu dirección de entrega y entrecalles en Chamical:*' });
              return;
            } else {
              await this.sock.sendMessage(from, { text: 'Respondé *1* para Retiro en el Local o *2* para Envío a Domicilio.' });
              return;
            }
          }

          // PASO 3: CAPTURA DE DIRECCIÓN
          if (activeSession.step === 'ASK_ADDRESS') {
            activeSession.shippingAddress = body.trim();
            activeSession.step = 'ASK_NAME';
            await this.sock.sendMessage(from, { text: '👤 *¿A nombre de quién registramos el pedido?* (Escribí tu nombre y apellido):' });
            return;
          }

          // PASO 4: CAPTURA DE NOMBRE DEL CLIENTE
          if (activeSession.step === 'ASK_NAME') {
            activeSession.shippingName = body.trim();
            activeSession.step = 'ASK_COUPON';
            await this.sock.sendMessage(from, {
              text: `🎟️ *¿Tenés algún Cupón de Descuento?*\n\n👉 Escribí el código de tu cupón (ej: *DULCE10*) o respondé *NO* para continuar sin cupón.`
            });
            return;
          }

          // PASO 4.B: CAPTURA Y VALIDACIÓN DE CUPÓN
          if (activeSession.step === 'ASK_COUPON') {
            if (body === 'no' || body === 'ninguno' || body === 'paso' || body === '-' || body === 'n') {
              activeSession.step = 'ASK_PAYMENT_METHOD';
              await this.sock.sendMessage(from, {
                text: `💳 *¿Cómo preferís abonar tu pedido?*\n\nRespondé con el número:\n1️⃣ *Transferencia Bancaria* (Alias / CBU)\n2️⃣ *Efectivo contra entrega* (Al retirar o al recibir)\n3️⃣ *Mercado Pago* (Link directo de pago)`
              });
              return;
            } else {
              // Validar cupón con Supabase
              try {
                const { data: promo } = await db
                  .from('promo_codes')
                  .select('*')
                  .ilike('code', body.trim())
                  .eq('active', true)
                  .maybeSingle();

                if (promo) {
                  let discount = 0;
                  if (promo.discount_percentage) {
                    discount = Math.round((activeSession.subtotal * promo.discount_percentage) / 100);
                  } else if (promo.discount_amount) {
                    discount = Math.min(activeSession.subtotal, Number(promo.discount_amount));
                  }
                  if (promo.max_discount_amount) {
                    discount = Math.min(discount, Number(promo.max_discount_amount));
                  }

                  activeSession.couponCode = promo.code;
                  activeSession.discountAmount = discount;
                  activeSession.total = Math.max(0, activeSession.subtotal - discount);

                  await this.sock.sendMessage(from, {
                    text: `🎉 *¡Cupón ${promo.code} aplicado con éxito!* Descuento: -\$${discount.toLocaleString('es-AR')} ✨`
                  });
                } else {
                  await this.sock.sendMessage(from, {
                    text: `ℹ️ El cupón ingresado no es válido o ya expiró. Continuamos con el valor regular.`
                  });
                }
              } catch (_e) {}

              activeSession.step = 'ASK_PAYMENT_METHOD';
              await this.sock.sendMessage(from, {
                text: `💳 *¿Cómo preferís abonar tu pedido?*\n\nRespondé con el número:\n1️⃣ *Transferencia Bancaria* (Alias / CBU)\n2️⃣ *Efectivo contra entrega* (Al retirar o al recibir)\n3️⃣ *Mercado Pago* (Link directo de pago)`
              });
              return;
            }
          }

          // PASO 4.C: SELECCIÓN DE MÉTODO DE PAGO
          if (activeSession.step === 'ASK_PAYMENT_METHOD') {
            if (body === '1' || body.includes('transferencia') || body.includes('alias')) {
              activeSession.paymentMethod = 'transfer';
            } else if (body === '2' || body.includes('efectivo') || body.includes('cash')) {
              activeSession.paymentMethod = 'cash';
            } else if (body === '3' || body.includes('mercadopago') || body.includes('mp') || body.includes('tarjeta')) {
              activeSession.paymentMethod = 'mercadopago';
            } else {
              activeSession.paymentMethod = 'transfer';
            }

            activeSession.step = 'CONFIRMING';
            const itemsList = activeSession.items.map((i) => `• ${i.name} - \$${i.unitPrice.toLocaleString('es-AR')}`).join('\n');
            const payLabel = activeSession.paymentMethod === 'transfer' ? '🏦 Transferencia Bancaria' : activeSession.paymentMethod === 'cash' ? '💵 Efectivo contra entrega' : '💳 Mercado Pago';
            const shippingLabel = activeSession.shippingMethod === 'delivery' ? '🛵 Envío a Domicilio con cadete' : '🏠 Retiro en Local';

            let summaryText = `🍬 *RESUMEN DE TU PEDIDO* 🍭\n\n🛒 *Golosinas:*\n${itemsList}\n\n💵 *Subtotal:* \$${activeSession.subtotal.toLocaleString('es-AR')}`;
            if (activeSession.discountAmount > 0) {
              summaryText += `\n🎟️ *Cupón (${activeSession.couponCode}):* -\$${activeSession.discountAmount.toLocaleString('es-AR')}`;
            }
            summaryText += `\n🛵 *Entrega:* ${shippingLabel}\n📍 *Dirección:* ${activeSession.shippingAddress}\n👤 *Cliente:* ${activeSession.shippingName}\n💳 *Forma de Pago:* ${payLabel}\n\n💰 *TOTAL A PAGAR:* \$${activeSession.total.toLocaleString('es-AR')}\n\n¿Está todo correcto?\n👉 Respondé *SI* para confirmar tu pedido o *CANCELAR*.`;

            await this.sock.sendMessage(from, { text: summaryText });
            return;
          }

          // PASO 5: CONFIRMACIÓN Y REGISTRO EN BASE DE DATOS
          if (activeSession.step === 'CONFIRMING') {
            if (body === 'si' || body === 'confirmar' || body === 'ok' || body === 'dale' || body === 's' || body === 'sí') {
              try {
                const orderPayload = {
                  shipping_name: activeSession.shippingName || pushName,
                  shipping_address: activeSession.shippingAddress || 'Retiro en Local',
                  shipping_city: 'Chamical',
                  total: activeSession.total,
                  status: 'pending',
                  discount_amount: activeSession.discountAmount || 0,
                  shipping_cost: 0,
                  payment_method: activeSession.paymentMethod || 'transfer',
                  customer_phone: from.replace('@s.whatsapp.net', '')
                };

                let { data: newOrder, error: orderErr } = await db.from('orders').insert(orderPayload).select().single();
                if (orderErr && (orderErr.message?.includes('user_id') || (orderErr as any).code === '23502')) {
                  const { data: profile } = await db.from('profiles').select('id').limit(1).maybeSingle();
                  if (profile?.id) {
                    const fallbackRes = await db.from('orders').insert({ ...orderPayload, user_id: profile.id }).select().single();
                    if (!fallbackRes.error && fallbackRes.data) {
                      newOrder = fallbackRes.data;
                      orderErr = null;
                    }
                  }
                }

                if (newOrder) {
                  const orderItemsPayload = activeSession.items.map((it) => ({
                    order_id: newOrder.id,
                    product_id: it.productId,
                    quantity: it.quantity,
                    unit_price: it.unitPrice
                  }));
                  await db.from('order_items').insert(orderItemsPayload);

                  const orderCode = newOrder.id ? newOrder.id.slice(0, 8).toUpperCase() : 'CSC-ORD';
                  const itemsList = activeSession.items.map((i) => `• ${i.name} - \$${i.unitPrice.toLocaleString('es-AR')}`).join('\n');

                  let confirmMsg = `🎉 *¡PEDIDO #${orderCode} REGISTRADO CON ÉXITO!* 🍬\n\nMuchas gracias *${activeSession.shippingName}*, tu pedido ya fue cargado.\n\n📦 *Detalle:*\n${itemsList}\n💰 *Total:* \$${activeSession.total.toLocaleString('es-AR')}\n📍 *Entrega:* ${activeSession.shippingAddress}\n`;

                  if (activeSession.paymentMethod === 'transfer') {
                    confirmMsg += `\n🏦 *Datos para Transferencia:*\n• *Alias:* \`${commonVars.alias_banco}\`\n• *Banco:* ${commonVars.banco}\n• *Titular:* ${commonVars.titular}\n\n📸 *Enviá el comprobante de transferencia por acá para comenzar a preparar tus golosinas.* ✨`;
                  } else if (activeSession.paymentMethod === 'cash') {
                    confirmMsg += `\n💵 *Pago en Efectivo:* Abonás al recibir o retirar tu pedido. ¡Ya estamos preparando tus golosinas! ✨`;
                  } else {
                    confirmMsg += `\n💳 *Pago con Mercado Pago:* Podés transferir al Alias \`${commonVars.alias_banco}\` o coordinar el link con nuestro asesor. ✨`;
                  }

                  await this.sock.sendMessage(from, { text: confirmMsg });
                  this.orderSessions.delete(from);
                  return;
                }
              } catch (dbErr) {
                await this.sock.sendMessage(from, { text: '⚠️ Ocurrió un error al guardar tu pedido. Por favor escribí *5* para que un asesor te asista.' });
                this.orderSessions.delete(from);
                return;
              }
            } else {
              this.orderSessions.delete(from);
              await this.sock.sendMessage(from, { text: '❌ Pedido cancelado. Escribí *MENU* para ver más opciones.' });
              return;
            }
          }
        }
      }

      // 6. INICIAR PEDIDO DIRECTO POR WHATSAPP
      if (settings.allow_chat_orders && (body === 'comprar' || body === 'hacer pedido' || body === 'pedir' || body === 'nuevo pedido' || body === 'quiero comprar' || body === 'quiero gomitas')) {
        const { data: products } = await db
          .from('products')
          .select('id, name, price, base_price, price_per_kg, unit_type, min_weight, max_weight, weight_step, sizes, stock, is_bulk, images, image_url')
          .gt('stock', 0)
          .order('created_at', { ascending: false })
          .limit(6);

        if (!products || products.length === 0) {
          await this.sock.sendMessage(from, { text: '🍬 En este momento no hay productos con stock disponible. Por favor consulta más tarde.' });
          return;
        }

        this.orderSessions.set(from, {
          step: 'SELECTING_PRODUCTS',
          items: [],
          subtotal: 0,
          discountAmount: 0,
          shippingCost: 0,
          total: 0,
          lastActivity: Date.now()
        });

        const productsList = products.map((p: any, idx: number) => {
          const pricing = getProductPricingInfo(p);
          return `${idx + 1}️⃣ *${p.name}* — 💰 *${pricing.displayPriceFull}*`;
        }).join('\n');

        const catalogCaption = `🛍️ *¡VAMOS A ARMAR TU PEDIDO DE GOLOSINAS!* 🍬\n\n${productsList}\n\n👉 *Respondé con el NÚMERO (1, 2, 3...) de la golosina que querés.*`;

        if (settings.send_product_images) {
          try {
            const collageBuffer = await generateCatalogCollage(products);
            await this.sendImageMessage(from, collageBuffer, catalogCaption);
            return;
          } catch (collErr) {
            console.warn('[WhatsApp Bot]: Error enviando collage en compra:', collErr);
          }
        }

        await this.sock.sendMessage(from, { text: catalogCaption });
        return;
      }

      // 7. Método 3: Detección Inteligente por Palabras Clave
      if (settings.require_keywords_for_chatbot) {
        const keywords = Array.isArray(settings.chatbot_keywords) && settings.chatbot_keywords.length > 0 ? settings.chatbot_keywords : DEFAULT_CHATBOT_KEYWORDS;
        const normalizeText = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const normalizedBody = normalizeText(body);
        const isMenuOption = /^[1-9]$/.test(body.trim());
        const customKeywords = (settings.custom_menu_options || []).flatMap((opt: any) => opt.keywords || [opt.option_number]);
        const hasMatchingKeyword = isMenuOption || [...keywords, ...customKeywords].some((kw) => {
          const cleanKw = normalizeText(String(kw).trim());
          return cleanKw.length > 0 && normalizedBody.includes(cleanKw);
        });
        if (!hasMatchingKeyword) return;
      }

      // 8. Opciones personalizadas
      if (Array.isArray(settings.custom_menu_options) && settings.custom_menu_options.length > 0) {
        const matchedCustom = settings.custom_menu_options.find((opt: any) => {
          if (!opt) return false;
          if (body === String(opt.option_number).trim().toLowerCase()) return true;
          const kws = Array.isArray(opt.keywords) ? opt.keywords : [];
          return kws.some((k: string) => body.includes(String(k).trim().toLowerCase()));
        });
        if (matchedCustom && matchedCustom.response) {
          const reply = this.formatTemplate(matchedCustom.response, commonVars);
          await this.sock.sendMessage(from, { text: reply });
          return;
        }
      }

      // 9. Opción 1: Estado Pedido
      if (body === '1' || body.includes('estado') || body.includes('mi pedido')) {
        const rawPhone = from.replace('@s.whatsapp.net', '').replace(/^549/, '');
        const { data: recentOrders } = await db.from('orders').select('*').order('created_at', { ascending: false }).limit(5);
        const customerOrder = recentOrders?.find((o: any) => (o.shipping_address && o.shipping_address.includes(rawPhone)) || (o.customer_phone && o.customer_phone.includes(rawPhone))) || recentOrders?.[0];
        
        if (customerOrder) {
          const statusMap: Record<string, string> = { paid: '✅ Pagado', preparing: '⏳ En preparación', ready: '🍬 Listo', shipped: '🛵 En camino' };
          const reply = this.formatTemplate(settings.menu_response_1 || DEFAULT_BOT_SETTINGS.menu_response_1, { ...commonVars, pedido_id: customerOrder.id?.slice(0, 8).toUpperCase(), estado: statusMap[customerOrder.status] || 'Pendiente' });
          await this.sock.sendMessage(from, { text: reply });
        } else {
          await this.sock.sendMessage(from, { text: `🔍 No encontramos un pedido asociado a tu número.` });
        }
        return;
      }

      // 10. Opción 2: Bancario
      if (body === '2' || body.includes('alias') || body.includes('transferencia')) {
        await this.sock.sendMessage(from, { text: this.formatTemplate(settings.menu_response_2 || DEFAULT_BOT_SETTINGS.menu_response_2, commonVars) });
        return;
      }

      // 11. Opción 3: Ubicación
      if (body === '3' || body.includes('horario') || body.includes('direccion')) {
        await this.sock.sendMessage(from, { text: this.formatTemplate(settings.menu_response_3 || DEFAULT_BOT_SETTINGS.menu_response_3, commonVars) });
        return;
      }

      // 12. Fotos y Detalles de Productos Específicos
      if (body.startsWith('foto') || body.startsWith('detalle') || body.startsWith('info') || body.startsWith('ver foto') || body === 'fotos' || body === 'galeria') {
        const { data: prods } = await db.from('products').select('*').gt('stock', 0).order('created_at', { ascending: false });
        if (prods && prods.length > 0) {
          const numIdx = parseInt(body.replace(/\D/g, ''), 10);
          let targetProd: any = null;
          if (!isNaN(numIdx) && numIdx >= 1 && numIdx <= prods.length) {
            targetProd = prods[numIdx - 1];
          } else if (body.length > 4) {
            targetProd = prods.find((p: any) => body.includes(p.name.toLowerCase().slice(0, 5)));
          }

          if (targetProd) {
            const pricing = getProductPricingInfo(targetProd);
            const dietStr = Array.isArray(targetProd.diet) && targetProd.diet.length > 0 ? `\n🌱 *Dietas / Apto:* ${targetProd.diet.join(' • ')}` : '';
            const descStr = targetProd.description ? `\n📝 *Detalle:* ${targetProd.description}` : '';

            const caption = `🍬 *${targetProd.name}* 🍭${descStr}${dietStr}\n💰 *Precio:* *${pricing.displayPriceFull}*\n📦 *Stock:* ${targetProd.stock} disponibles\n\n👉 Para pedir este producto escribí *COMPRAR* o su número.`;
            
            if (targetProd.image_url) {
              await this.sendImageMessage(from, targetProd.image_url, caption);
            } else {
              await this.sock.sendMessage(from, { text: caption });
            }
            return;
          } else {
            // Galería general con Collage de Fotos Numeradas
            const catalogListText = prods.slice(0, 6).map((p: any, i: number) => {
              const pricing = getProductPricingInfo(p);
              return `${i + 1}️⃣ *${p.name}* — 💰 *${pricing.displayPriceFull}*`;
            }).join('\n');

            const caption = `📸 *GALERÍA & CATÁLOGO DE GOLOSINAS* 🍬\n\n${catalogListText}\n\n👉 *Escribí el NÚMERO (1, 2, 3...) para pedir o escribí FOTO [número] para verla en detalle.*`;

            try {
              const collageBuffer = await generateCatalogCollage(prods);
              await this.sendImageMessage(from, collageBuffer, caption);
            } catch (err) {
              await this.sock.sendMessage(from, { text: caption });
            }
            return;
          }
        }
      }

      // 13. Opción 4: Catálogo con Collage de Fotos Numeradas y Precios x50g
      if (body === '4' || body.includes('catalogo') || body.includes('productos') || body.includes('precio') || body.includes('precios') || body.includes('lista')) {
        const { data: prods } = await db.from('products').select('*').gt('stock', 0).order('created_at', { ascending: false }).limit(6);
        const catalogListText = prods?.map((p: any, i: number) => {
          const pricing = getProductPricingInfo(p);
          return `${i + 1}️⃣ *${p.name}* — 💰 *${pricing.displayPriceFull}*`;
        }).join('\n') || '';

        // Iniciar sesión interactiva de compra si está habilitada
        if (settings.allow_chat_orders && prods && prods.length > 0) {
          this.orderSessions.set(from, {
            step: 'SELECTING_PRODUCTS',
            items: [],
            subtotal: 0,
            discountAmount: 0,
            shippingCost: 0,
            total: 0,
            lastActivity: Date.now()
          });
        }

        const catalogCaption = `🛍️ *CATÁLOGO DE GOLOSINAS & PRECIOS* 🍬\n\n${catalogListText}\n\n👉 *Respondé con el NÚMERO (1, 2, 3...) de la golosina para agregarla a tu pedido.*`;

        if (settings.send_product_images && prods && prods.length > 0) {
          try {
            const collageBuffer = await generateCatalogCollage(prods);
            await this.sendImageMessage(from, collageBuffer, catalogCaption);
            return;
          } catch (collErr) {
            console.warn('[WhatsApp Bot]: Error enviando collage en opción 4:', collErr);
          }
        }
        
        await this.sock.sendMessage(from, {
          text: this.formatTemplate(settings.menu_response_4 || DEFAULT_BOT_SETTINGS.menu_response_4, { ...commonVars, catalogo_lista: catalogListText })
        });
        return;
      }

      // 13. Opción 5: Asesor
      if (body === '5' || body.includes('asesor') || body.includes('persona')) {
        await this.sock.sendMessage(from, { text: this.formatTemplate(settings.menu_response_5 || DEFAULT_BOT_SETTINGS.menu_response_5, commonVars) });
        return;
      }

      // 14. Menú por defecto
      await this.sock.sendMessage(from, { text: this.formatTemplate(settings.template_menu, commonVars) });

    } catch (err) {
      console.error('[WhatsApp Bot Message Handle Error]:', err);
    }
  }
}

export const whatsappBot = new WhatsAppBotService();
