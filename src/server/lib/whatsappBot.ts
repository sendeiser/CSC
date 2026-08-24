import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  WASocket,
  proto
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { serviceClient, supabase } from './supabase';
import { getStoreSettingsHelper } from '../routes/admin';

const DATA_DIR = path.join(process.cwd(), 'data');
const AUTH_DIR = path.join(DATA_DIR, 'baileys_auth');
const SETTINGS_FILE = path.join(DATA_DIR, 'whatsapp_bot_settings.json');

// Crear directorios si no existen
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface WhatsAppBotSettings {
  enabled: boolean;
  auto_notify_new_order: boolean;
  auto_notify_status_change: boolean;
  auto_chatbot_menu: boolean;
  template_new_order: string;
  template_order_preparing: string;
  template_order_ready: string;
  template_order_shipped: string;
  template_menu: string;
  template_payment_proof: string;
}

export const DEFAULT_BOT_SETTINGS: WhatsAppBotSettings = {
  enabled: true,
  auto_notify_new_order: true,
  auto_notify_status_change: true,
  auto_chatbot_menu: true,
  template_new_order: `🍬 *¡Hola {cliente}! Gracias por tu compra en Chamical Candy Shop* 🍭\n\n📦 *Pedido:* #{pedido_id}\n💰 *Total:* \${total}\n📍 *Entrega:* {direccion}\n\n🛒 *Detalle de tus golosinas:*\n{productos}\n\n🏦 *Datos para Transferencia Bancaria:*\n• *Alias:* \`{alias_banco}\`\n• *Banco:* {banco}\n• *Titular:* {titular}\n• *CBU:* \`{cbu}\`\n\n📸 *Por favor envíanos una foto del comprobante de transferencia por aquí para comenzar a preparar tu pedido. ¡Muchas gracias!* 🎉`,
  template_order_preparing: `👨‍🍳 *¡Buenas noticias {cliente}!* 🍬\n\nTu pedido *#{pedido_id}* por *\${total}* ya está *EN PREPARACIÓN*. 🍭\nNuestros expertos están seleccionando y empacando tus golosinas con el mayor cuidado.\n\n¡Te avisaremos apenas esté listo! ⏱️`,
  template_order_ready: `✨ *¡Tu pedido está LISTO {cliente}!* 🎉\n\n📦 Pedido: *#{pedido_id}*\n📍 Ya podés pasar a retirarlo por nuestro local en los horarios habituales.\n\n¡Te esperamos con tus golosinas preparadas! 🍬`,
  template_order_shipped: `🛵 *¡Tu pedido va en camino {cliente}!* 🚀\n\n📦 Pedido: *#{pedido_id}*\n📍 Dirección de entrega: *{direccion}*\n\nEl cadete ya salió con tu pedido. ¡Mantenete atento para recibir tus golosinas! 🍭`,
  template_menu: `🍬 *¡Hola {cliente}! Bienvenido a Chamical Candy Shop* 🍭\n\n¿En qué podemos ayudarte hoy? *Respondé con el número de opción:*\n\n1️⃣ 📦 *Consultar estado de mi pedido*\n2️⃣ 🏦 *Ver datos de transferencia bancaria*\n3️⃣ 📍 *Horarios y ubicación del local*\n4️⃣ 🛍️ *Ver catálogo online*\n5️⃣ 👤 *Hablar con una persona del equipo*`,
  template_payment_proof: `📸 *¡Comprobante de pago recibido!* 🎉\n\nMuchas gracias por enviarnos tu comprobante. Nuestro equipo lo verificará a la brevedad para confirmar tu pedido. 🍬`
};

export function getBotSettings(): WhatsAppBotSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return { ...DEFAULT_BOT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (_e) {}
  return DEFAULT_BOT_SETTINGS;
}

export function saveBotSettings(settings: Partial<WhatsAppBotSettings>): WhatsAppBotSettings {
  const current = getBotSettings();
  const updated = { ...current, ...settings };
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('[WhatsApp Bot Settings Save Error]:', err);
  }
  return updated;
}

class WhatsAppBotService {
  private sock: WASocket | null = null;
  public status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected' = 'disconnected';
  public qrCode: string | null = null;
  public connectedUser: any = null;
  private isInitializing: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    // Si hay una sesión previa guardada, intentar reconectar automáticamente
    if (fs.existsSync(AUTH_DIR) && fs.readdirSync(AUTH_DIR).length > 0) {
      setTimeout(() => {
        this.start().catch(console.error);
      }, 3000);
    }
  }

  public async start(): Promise<void> {
    if (this.isInitializing) return;
    this.isInitializing = true;
    this.status = 'connecting';

    try {
      const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
      const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] as any }));

      const logger = pino({ level: 'silent' });

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
        keepAliveIntervalMs: 25000,
        emitOwnEvents: false
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
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
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          console.log(`[WhatsApp Bot]: Conexión cerrada. Razón/Código: ${statusCode}. Reconectar: ${shouldReconnect}`);
          this.connectedUser = null;
          this.qrCode = null;

          if (statusCode === DisconnectReason.loggedOut) {
            this.status = 'disconnected';
            this.clearAuth();
          } else if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.status = 'connecting';
            setTimeout(() => {
              this.start().catch(console.error);
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

      // Escuchar mensajes entrantes para el Menú Interactivo (Chatbot)
      this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const settings = getBotSettings();
        if (!settings.enabled || !settings.auto_chatbot_menu) return;

        for (const msg of messages) {
          if (!msg.key.fromMe && msg.key.remoteJid && !msg.key.remoteJid.endsWith('@g.us')) {
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
        fs.mkdirSync(AUTH_DIR, { recursive: true });
      }
    } catch (err) {
      console.error('[WhatsApp Bot Clear Auth Error]:', err);
    }
  }

  /**
   * Normaliza un número de teléfono a formato WhatsApp (ej: 5493826XXXXXX@s.whatsapp.net)
   */
  public normalizeJid(phone: string): string {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = clean.substring(1);
    }
    // Si empieza con 54 y le falta el 9
    if (clean.startsWith('54') && !clean.startsWith('549') && clean.length >= 10) {
      clean = '549' + clean.substring(2);
    } else if (!clean.startsWith('54')) {
      // Asumir Argentina por defecto si tiene 10 dígitos (código de área + número)
      clean = '549' + clean;
    }
    return `${clean}@s.whatsapp.net`;
  }

  /**
   * Envía un mensaje directo a un teléfono de cliente
   */
  public async sendTextMessage(phone: string, text: string): Promise<boolean> {
    if (this.status !== 'connected' || !this.sock) {
      console.warn('[WhatsApp Bot]: No se puede enviar mensaje porque el bot no está conectado.');
      return false;
    }
    try {
      const jid = this.normalizeJid(phone);
      await this.sock.sendMessage(jid, { text });
      console.log(`[WhatsApp Bot]: ✅ Mensaje enviado a ${phone}`);
      return true;
    } catch (err) {
      console.error(`[WhatsApp Bot Send Error to ${phone}]:`, err);
      return false;
    }
  }

  /**
   * Interpola variables dinámicas en una plantilla
   */
  public formatTemplate(template: string, data: Record<string, any>): string {
    let result = template;
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
    const settings = getBotSettings();
    if (!settings.enabled || !settings.auto_notify_new_order) return false;

    const phone = customerPhone || order.shipping_address?.match(/\d{8,15}/)?.[0] || order.customer_phone;
    if (!phone) return false;

    const storeSettings = await getStoreSettingsHelper();

    // Formatear resumen de productos
    let itemsSummary = '';
    if (Array.isArray(order.items) && order.items.length > 0) {
      itemsSummary = order.items.map((item: any) => {
        const title = item.title || item.products?.title || 'Producto';
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
      alias_banco: storeSettings?.bank_alias || 'CHAMICAL.CANDY.SHOP',
      banco: storeSettings?.bank_name || 'Banco Galicia / Mercado Pago',
      titular: storeSettings?.bank_holder || 'Chamical Candy Shop',
      cbu: storeSettings?.bank_cbu || '0000003100010000000000'
    };

    const message = this.formatTemplate(settings.template_new_order, templateData);
    return this.sendTextMessage(phone, message);
  }

  /**
   * Envía notificación de cambio de estado de pedido
   */
  public async notifyOrderStatus(order: any, newStatus: string, customerPhone?: string): Promise<boolean> {
    const settings = getBotSettings();
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
  }

  /**
   * Procesa mensajes entrantes y responde con el Menú Interactivo
   */
  private async handleIncomingMessage(msg: proto.IWebMessageInfo): Promise<void> {
    try {
      const from = msg.key.remoteJid;
      if (!from || !this.sock) return;

      const pushName = msg.pushName || 'Hola';
      const body = (
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        ''
      ).trim().toLowerCase();

      const hasImage = !!msg.message?.imageMessage || !!msg.message?.documentMessage;
      const settings = getBotSettings();
      const storeSettings = await getStoreSettingsHelper();

      // 1. Si el cliente envió una imagen (posible comprobante)
      if (hasImage) {
        await this.sock.sendMessage(from, { text: settings.template_payment_proof });
        return;
      }

      if (!body) return;

      // 2. Opción 1: Consultar estado de mi pedido
      if (body === '1' || body.includes('estado') || body.includes('mi pedido')) {
        const rawPhone = from.replace('@s.whatsapp.net', '').replace(/^549/, '');
        const db = serviceClient || supabase;

        // Buscar el pedido más reciente de este cliente
        const { data: recentOrders } = await db
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        const customerOrder = recentOrders?.find((o: any) => 
          (o.shipping_address && o.shipping_address.includes(rawPhone)) ||
          (o.customer_phone && o.customer_phone.includes(rawPhone))
        ) || recentOrders?.[0];

        if (customerOrder) {
          const statusTextMap: Record<string, string> = {
            paid: '✅ Pagado / Confirmado',
            preparing: '⏳ En preparación',
            en_preparacion: '⏳ En preparación',
            ready: '🍬 Listo para retirar',
            listo: '🍬 Listo para retirar',
            shipped: '🛵 En camino',
            delivered: '🎉 Entregado',
            cancelled: '❌ Cancelado'
          };
          const statusLabel = statusTextMap[customerOrder.status] || '⏳ Pendiente de confirmación';

          const reply = `📦 *Estado de tu Pedido:* #${customerOrder.id?.slice(0, 8).toUpperCase()}\n\n• *Estado:* ${statusLabel}\n• *Total:* \$${Number(customerOrder.total || 0).toLocaleString('es-AR')}\n• *Destino:* ${customerOrder.shipping_address || 'Retiro en tienda'}\n\n_Para volver al menú, enviá la palabra *MENU*._`;
          await this.sock.sendMessage(from, { text: reply });
        } else {
          await this.sock.sendMessage(from, {
            text: `🔍 No encontramos un pedido reciente asociado a tu número.\nSi tenés el código de tu pedido (ej: #A1B2C3D4), envialo aquí o escribí *5* para hablar con un asesor. 🍬`
          });
        }
        return;
      }

      // 3. Opción 2: Datos de transferencia bancaria
      if (body === '2' || body.includes('alias') || body.includes('transferencia') || body.includes('cbu') || body.includes('banco')) {
        const alias = storeSettings?.bank_alias || 'CHAMICAL.CANDY.SHOP';
        const banco = storeSettings?.bank_name || 'Banco Galicia / Mercado Pago';
        const titular = storeSettings?.bank_holder || 'Chamical Candy Shop';
        const cbu = storeSettings?.bank_cbu || '0000003100010000000000';

        const reply = `🏦 *Datos para Transferencia Bancaria:* 🍬\n\n• *Alias:* \`${alias}\`\n• *Banco:* ${banco}\n• *Titular:* ${titular}\n• *CBU:* \`${cbu}\`\n\n📸 *Una vez realizada la transferencia, podés enviar la captura o comprobante por este mismo chat.*\n\n_Enviá *MENU* para ver más opciones._`;
        await this.sock.sendMessage(from, { text: reply });
        return;
      }

      // 4. Opción 3: Horarios y ubicación
      if (body === '3' || body.includes('horario') || body.includes('ubicacion') || body.includes('donde estan') || body.includes('direccion')) {
        const direccion = storeSettings?.address || 'Chamical, La Rioja, Argentina';
        const horarios = storeSettings?.opening_hours || 'Lunes a Sábados de 09:00 a 13:00 y de 17:30 a 22:00 hs.';

        const reply = `📍 *Ubicación y Horarios de Atención:* 🍬\n\n🏠 *Dirección:* ${direccion}\n🕒 *Horarios:* ${horarios}\n\n¡Te esperamos con las golosinas más ricas! 🍭\n\n_Enviá *MENU* para volver al menú principal._`;
        await this.sock.sendMessage(from, { text: reply });
        return;
      }

      // 5. Opción 4: Catálogo online
      if (body === '4' || body.includes('catalogo') || body.includes('productos') || body.includes('comprar')) {
        const url = 'https://candyshopchamical.netlify.app';
        const reply = `🛍️ *Catálogo Online de Chamical Candy Shop* 🍬\n\nPodés explorar todos nuestros productos, combos, gomitas por peso y armar tu carrito directamente en nuestra tienda web:\n👉 ${url}\n\n_Enviá *MENU* para ver más opciones._`;
        await this.sock.sendMessage(from, { text: reply });
        return;
      }

      // 6. Opción 5: Hablar con persona / asesor
      if (body === '5' || body.includes('humano') || body.includes('asesor') || body.includes('persona') || body.includes('ayuda')) {
        const reply = `👤 *¡Entendido! Un asesor de nuestro equipo te responderá a la brevedad.* 🍬\n\nPor favor dejanos tu consulta detallada para poder ayudarte más rápido. ¡Muchas gracias por tu paciencia!`;
        await this.sock.sendMessage(from, { text: reply });
        return;
      }

      // 7. Por defecto: Enviar el Menú Interactivo
      const menuText = this.formatTemplate(settings.template_menu, { cliente: pushName });
      await this.sock.sendMessage(from, { text: menuText });

    } catch (err) {
      console.error('[WhatsApp Bot Message Handle Error]:', err);
    }
  }
}

export const whatsappBot = new WhatsAppBotService();
