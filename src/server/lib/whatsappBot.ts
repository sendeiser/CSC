import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { serviceClient, supabase } from './supabase';
import { getStoreSettingsHelper } from '../routes/admin';

// Directorio temporal seguro compatible con Netlify Lambda y local
const isServerless = process.env.NETLIFY === 'true' || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.LAMBDA_TASK_ROOT;
const DATA_DIR = isServerless ? path.join(os.tmpdir(), 'csc_data') : path.join(process.cwd(), 'data');
const AUTH_DIR = path.join(DATA_DIR, 'baileys_auth');
const SETTINGS_FILE = path.join(DATA_DIR, 'whatsapp_bot_settings.json');

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
  template_menu: `🍬 *¡Hola {cliente}! Bienvenido a Chamical Candy Shop* 🍭\n\n¿En qué podemos ayudarte hoy? *Respondé con el número de opción:*\n\n1️⃣ 📦 *Consultar estado de mi pedido*\n2️⃣ 🏦 *Ver datos de transferencia bancaria*\n3️⃣ 📍 *Horarios y ubicación del local*\n4️⃣ 🛍️ *Ver catálogo de productos y precios*\n5️⃣ 👤 *Hablar con una persona del equipo*\n\n_Escribí *COMPRAR* si querés hacer un pedido directo por acá._`,
  template_payment_proof: `📸 *¡Comprobante de pago recibido!* 🎉\n\nMuchas gracias por enviarnos tu comprobante. Nuestro equipo lo verificará a la brevedad para confirmar tu pedido. 🍬`,
  menu_response_1: `📦 *Estado de tu Pedido:* #{pedido_id}\n\n• *Estado:* {estado}\n• *Total:* \${total}\n• *Destino:* {direccion}\n\n_Para volver al menú, enviá la palabra *MENU*._`,
  menu_response_2: `🏦 *Datos para Transferencia Bancaria:* 🍬\n\n• *Alias:* \`{alias_banco}\`\n• *Banco:* {banco}\n• *Titular:* {titular}\n• *CBU:* \`{cbu}\`\n\n📸 *Una vez realizada la transferencia, podés enviar la captura o comprobante por este mismo chat.*\n\n_Enviá *MENU* para ver más opciones._`,
  menu_response_3: `📍 *Ubicación y Horarios de Atención:* 🍬\n\n🏠 *Dirección:* {direccion}\n🕒 *Horarios:* {horarios}\n\n¡Te esperamos con las golosinas más ricas! 🍭\n\n_Enviá *MENU* para volver al menú principal._`,
  menu_response_4: `🛍️ *Catálogo y Precios de Chamical Candy Shop* 🍬\n\n{catalogo_lista}\n\n👉 *También podés explorar la tienda web:* {catalogo_url}\n\n_Para armar tu pedido por acá, respondé con el número de producto que querés o escribí *COMPRAR*._`,
  menu_response_5: `👤 *¡Entendido {cliente}! Un asesor de nuestro equipo te responderá a la brevedad.* 🍬\n\nPor favor dejanos tu consulta detallada para poder ayudarte más rápido. ¡Muchas gracias por tu paciencia!`,
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
  private orderSessions: Map<string, {
    step: 'SELECTING_PRODUCTS' | 'ASK_SHIPPING_METHOD' | 'ASK_ADDRESS' | 'ASK_NAME' | 'CONFIRMING';
    items: Array<{
      productId: string;
      name: string;
      quantity: number;
      weightGrams?: number;
      unitPrice: number;
    }>;
    shippingName?: string;
    shippingAddress?: string;
    shippingMethod?: 'pickup' | 'delivery';
    total: number;
    lastActivity: number;
  }> = new Map();

  constructor() {
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
        connectTimeoutMs: 45000,
        keepAliveIntervalMs: 25000,
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
          const shouldReconnect = statusCode !== DisconnectReason?.loggedOut;

          this.connectedUser = null;
          this.qrCode = null;

          if (statusCode === DisconnectReason?.loggedOut) {
            this.status = 'disconnected';
            this.clearAuth();
          } else if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts && !isServerless) {
            this.reconnectAttempts++;
            this.status = 'connecting';
            setTimeout(() => {
              this.start().catch(() => {});
            }, 5000);
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

      // Escuchar mensajes entrantes y salientes para el Menú Interactivo y Pausa Inteligente
      this.sock.ev.on('messages.upsert', async (chatUpdate: any) => {
        if (!chatUpdate.messages || chatUpdate.messages.length === 0) return;
        const settings = await getBotSettings();
        if (!settings.enabled) return;

        for (const msg of chatUpdate.messages) {
          if (!msg.key?.remoteJid || msg.key.remoteJid.endsWith('@g.us')) continue;

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
   * Envía un mensaje con imagen a un teléfono de cliente
   */
  public async sendImageMessage(phone: string, imageUrl: string, caption?: string): Promise<boolean> {
    if (this.status === 'connected' && this.sock) {
      try {
        const jid = this.normalizeJid(phone);
        await this.sock.sendMessage(jid, {
          image: { url: imageUrl },
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

      // 5. FLUJO DE COMPRA CONVERSACIONAL
      const activeSession = this.orderSessions.get(from);
      if (activeSession && settings.allow_chat_orders) {
        if (Date.now() - activeSession.lastActivity > 30 * 60 * 1000) {
          this.orderSessions.delete(from);
        } else {
          activeSession.lastActivity = Date.now();

          if (body === 'cancelar' || body === 'salir' || body === 'menu' || body === 'menú') {
            this.orderSessions.delete(from);
            await this.sock.sendMessage(from, { text: '❌ *Proceso de compra cancelado.* ¿En qué más podemos ayudarte?\n\n' + this.formatTemplate(settings.template_menu, commonVars) });
            return;
          }

          // PASO 1: SELECCIONANDO PRODUCTOS
          if (activeSession.step === 'SELECTING_PRODUCTS') {
            if (body === 'listo' || body === 'continuar' || body === 'fin' || body === 'finalizar') {
              if (activeSession.items.length === 0) {
                await this.sock.sendMessage(from, { text: '⚠️ Tu carrito está vacío todavía. Escribí el *NÚMERO* del producto que querés agregar o escribí *CANCELAR*.' });
                return;
              }
              activeSession.step = 'ASK_SHIPPING_METHOD';
              await this.sock.sendMessage(from, {
                text: `🛵 *¿Cómo querés recibir tu pedido?*\n\nRespondé con el número de opción:\n1️⃣ *Retiro por el local (Chamical)*\n2️⃣ *Envío a domicilio con cadete*`
              });
              return;
            }

            const { data: availableProducts } = await db
              .from('products')
              .select('id, name, price, stock, is_bulk, images, image_url')
              .gt('stock', 0)
              .order('created_at', { ascending: false })
              .limit(10);

            const numIdx = parseInt(body.replace(/\D/g, ''), 10);
            let selectedProd: any = null;

            if (!isNaN(numIdx) && numIdx >= 1 && numIdx <= (availableProducts?.length || 0)) {
              selectedProd = availableProducts?.[numIdx - 1];
            } else if (availableProducts) {
              selectedProd = availableProducts.find((p: any) => body.includes(p.name.toLowerCase().slice(0, 5)));
            }

            if (selectedProd) {
              const itemPrice = Number(selectedProd.price || 0);
              activeSession.items.push({
                productId: selectedProd.id,
                name: selectedProd.name,
                quantity: 1,
                unitPrice: itemPrice
              });
              activeSession.total += itemPrice;

              const itemsList = activeSession.items.map((i, idx) => `• ${i.name} - \$${i.unitPrice.toLocaleString('es-AR')}`).join('\n');

              await this.sock.sendMessage(from, {
                text: `✅ *¡Agregaste ${selectedProd.name}!* 🍬\n\n🛒 *Tu carrito actual:*\n${itemsList}\n\n💰 *Total actual:* \$${activeSession.total.toLocaleString('es-AR')}\n\n👉 ¿Querés agregar otro producto? *(Escribí el número)*\n👉 O escribí *LISTO* para continuar y confirmar tu pedido.`
              });
              return;
            } else {
              await this.sock.sendMessage(from, {
                text: `🔍 No entendimos el producto ingresado. Escribí el *NÚMERO* del producto de la lista (ej: 1, 2, 3...) o escribí *LISTO* para finalizar.`
              });
              return;
            }
          }

          // PASO 2: SELECCIÓN DE MÉTODO DE ENVÍO
          if (activeSession.step === 'ASK_SHIPPING_METHOD') {
            if (body === '1' || body.includes('retiro') || body.includes('local')) {
              activeSession.shippingMethod = 'pickup';
              activeSession.shippingAddress = 'Retiro en Local (Chamical)';
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
            activeSession.step = 'CONFIRMING';

            const itemsList = activeSession.items.map((i) => `• ${i.name} - \$${i.unitPrice.toLocaleString('es-AR')}`).join('\n');

            await this.sock.sendMessage(from, {
              text: `🍬 *RESUMEN DE TU PEDIDO* 🍭\n\n🛒 *Golosinas:*\n${itemsList}\n\n💰 *Total a pagar:* \$${activeSession.total.toLocaleString('es-AR')}\n📍 *Entrega:* ${activeSession.shippingAddress}\n👤 *Cliente:* ${activeSession.shippingName}\n\n¿Está todo correcto?\nRespondé *SI* para confirmar tu pedido o *CANCELAR*.`
            });
            return;
          }

          // PASO 5: CONFIRMACIÓN Y REGISTRO EN BASE DE DATOS
          if (activeSession.step === 'CONFIRMING') {
            if (body === 'si' || body === 'confirmar' || body === 'ok' || body === 'dale' || body === 's') {
              try {
                const orderPayload = {
                  shipping_name: activeSession.shippingName || pushName,
                  shipping_address: activeSession.shippingAddress || 'Retiro en Local',
                  shipping_city: 'Chamical',
                  total: activeSession.total,
                  status: 'pending',
                  discount_amount: 0,
                  shipping_cost: 0,
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
                  const confirmMsg = `🎉 *¡PEDIDO #${orderCode} REGISTRADO CON ÉXITO!* 🍬\n\nMuchas gracias *${activeSession.shippingName}*, tu pedido ya fue cargado.\n\n💰 *Total:* \$${activeSession.total.toLocaleString('es-AR')}\n\n🏦 *Datos Transferencia:*\n• *Alias:* \`${commonVars.alias_banco}\`\n• *Banco:* ${commonVars.banco}\n\n📸 *Enviá el comprobante por acá para comenzar a preparar tus golosinas.* ✨`;
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
      if (settings.allow_chat_orders && (body === 'comprar' || body === 'hacer pedido' || body === 'pedir' || body === 'nuevo pedido')) {
        const { data: products } = await db.from('products').select('id, name, price, stock, is_bulk, images, image_url').gt('stock', 0).order('created_at', { ascending: false }).limit(8);

        if (!products || products.length === 0) {
          await this.sock.sendMessage(from, { text: '🍬 En este momento no hay productos con stock disponible. Por favor consulta más tarde.' });
          return;
        }

        this.orderSessions.set(from, {
          step: 'SELECTING_PRODUCTS',
          items: [],
          total: 0,
          lastActivity: Date.now()
        });

        const productsList = products.map((p: any, idx: number) => `${idx + 1}️⃣ *${p.name}* - \$${Number(p.price || 0).toLocaleString('es-AR')}`).join('\n');
        await this.sock.sendMessage(from, { text: `🛍️ *¡Vamos a armar tu pedido!* 🍬\n\n${productsList}\n\n👉 *Respondé con el NÚMERO del producto (ej: 1, 2, 3).*` });
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

      // 12. Opción 4: Catálogo
      if (body === '4' || body.includes('catalogo') || body.includes('productos') || body.includes('precio')) {
        const { data: prods } = await db.from('products').select('id, name, price, images, image_url').gt('stock', 0).limit(8);
        const catalogListText = prods?.map((p: any, i: number) => `${i + 1}️⃣ *${p.name}* - \$${Number(p.price || 0).toLocaleString('es-AR')}`).join('\n') || '';
        
        if (settings.send_product_images && prods?.[0]?.image_url) {
          await this.sendImageMessage(from, prods[0].image_url, `🍬 *${prods[0].name}* - \$${Number(prods[0].price || 0).toLocaleString('es-AR')}`);
        }
        
        await this.sock.sendMessage(from, { text: this.formatTemplate(settings.menu_response_4 || DEFAULT_BOT_SETTINGS.menu_response_4, { ...commonVars, catalogo_lista: catalogListText }) });
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
