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

export interface WhatsAppBotSettings {
  enabled: boolean;
  auto_notify_new_order: boolean;
  auto_notify_status_change: boolean;
  auto_chatbot_menu: boolean;
  // Restricciones de números y contactos personales
  ignored_numbers: IgnoredNumber[];
  pause_on_manual_reply: boolean;
  pause_duration_minutes: number;
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
}

export const DEFAULT_BOT_SETTINGS: WhatsAppBotSettings = {
  enabled: true,
  auto_notify_new_order: true,
  auto_notify_status_change: true,
  auto_chatbot_menu: true,
  ignored_numbers: [],
  pause_on_manual_reply: true,
  pause_duration_minutes: 120, // 2 horas por defecto
  gateway_type: 'baileys',
  template_new_order: `🍬 *¡Hola {cliente}! Gracias por tu compra en Chamical Candy Shop* 🍭\n\n📦 *Pedido:* #{pedido_id}\n💰 *Total:* \${total}\n📍 *Entrega:* {direccion}\n\n🛒 *Detalle de tus golosinas:*\n{productos}\n\n🏦 *Datos para Transferencia Bancaria:*\n• *Alias:* \`{alias_banco}\`\n• *Banco:* {banco}\n• *Titular:* {titular}\n• *CBU:* \`{cbu}\`\n\n📸 *Por favor envíanos una foto del comprobante de transferencia por aquí para comenzar a preparar tu pedido. ¡Muchas gracias!* 🎉`,
  template_order_preparing: `👨‍🍳 *¡Buenas noticias {cliente}!* 🍬\n\nTu pedido *#{pedido_id}* por *\${total}* ya está *EN PREPARACIÓN*. 🍭\nNuestros expertos están seleccionando y empacando tus golosinas con el mayor cuidado.\n\n¡Te avisaremos apenas esté listo! ⏱️`,
  template_order_ready: `✨ *¡Tu pedido está LISTO {cliente}!* 🎉\n\n📦 Pedido: *#{pedido_id}*\n📍 Ya podés pasar a retirarlo por nuestro local en los horarios habituales.\n\n¡Te esperamos con tus golosinas preparadas! 🍬`,
  template_order_shipped: `🛵 *¡Tu pedido va en camino {cliente}!* 🚀\n\n📦 Pedido: *#{pedido_id}*\n📍 Dirección de entrega: *{direccion}*\n\nEl cadete ya salió con tu pedido. ¡Mantenete atento para recibir tus golosinas! 🍭`,
  template_menu: `🍬 *¡Hola {cliente}! Bienvenido a Chamical Candy Shop* 🍭\n\n¿En qué podemos ayudarte hoy? *Respondé con el número de opción:*\n\n1️⃣ 📦 *Consultar estado de mi pedido*\n2️⃣ 🏦 *Ver datos de transferencia bancaria*\n3️⃣ 📍 *Horarios y ubicación del local*\n4️⃣ 🛍️ *Ver catálogo online*\n5️⃣ 👤 *Hablar con una persona del equipo*`,
  template_payment_proof: `📸 *¡Comprobante de pago recibido!* 🎉\n\nMuchas gracias por enviarnos tu comprobante. Nuestro equipo lo verificará a la brevedad para confirmar tu pedido. 🍬`
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
      this.sock.ev.on('messages.upsert', async ({ messages, type }: any) => {
        if (type !== 'notify') return;
        const settings = await getBotSettings();
        if (!settings.enabled) return;

        for (const msg of messages) {
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
   * Procesa mensajes entrantes y responde con el Menú Interactivo
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

      // 2. Verificar si el número está en la lista de números excluidos / ignorados (Familia, Amigos, etc.)
      const cleanFromDigits = from.replace(/\D/g, '');
      if (Array.isArray(settings.ignored_numbers) && settings.ignored_numbers.length > 0) {
        const isIgnored = settings.ignored_numbers.some((item: any) => {
          const rawIgnored = typeof item === 'string' ? item : (item.phone || '');
          const cleanIgnored = String(rawIgnored).replace(/\D/g, '');
          if (!cleanIgnored) return false;
          // Comparar números completos o últimos 8 a 10 dígitos para evitar diferencias de prefijos (549, 15, etc.)
          const suffixFrom = cleanFromDigits.slice(-8);
          const suffixIgnored = cleanIgnored.slice(-8);
          return cleanFromDigits === cleanIgnored || cleanFromDigits.includes(cleanIgnored) || cleanIgnored.includes(cleanFromDigits) || (suffixFrom.length >= 8 && suffixFrom === suffixIgnored);
        });

        if (isIgnored) {
          console.log(`[WhatsApp Bot]: 🚫 Número ${from} está en la Lista de Excluidos (Personal/Familiar). Omitiendo bot.`);
          return;
        }
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

      // 3. Si el cliente envió una imagen (posible comprobante)
      if (hasImage) {
        await this.sock.sendMessage(from, { text: settings.template_payment_proof });
        return;
      }

      if (!body) return;

      // 2. Opción 1: Consultar estado de mi pedido
      if (body === '1' || body.includes('estado') || body.includes('mi pedido')) {
        const rawPhone = from.replace('@s.whatsapp.net', '').replace(/^549/, '');
        const db = serviceClient || supabase;

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
        const alias = storeSettings?.bank_alias || 'martinchox33';
        const banco = storeSettings?.bank_name || 'MercadoPago';
        const titular = storeSettings?.bank_holder || 'Gonzalez Martin Gustavo';
        const cbu = storeSettings?.bank_cbu || '';

        const reply = `🏦 *Datos para Transferencia Bancaria:* 🍬\n\n• *Alias:* \`${alias}\`\n• *Banco:* ${banco}\n• *Titular:* ${titular}${cbu ? `\n• *CBU:* \`${cbu}\`` : ''}\n\n📸 *Una vez realizada la transferencia, podés enviar la captura o comprobante por este mismo chat.*\n\n_Enviá *MENU* para ver más opciones._`;
        await this.sock.sendMessage(from, { text: reply });
        return;
      }

      // 4. Opción 3: Horarios y ubicación
      if (body === '3' || body.includes('horario') || body.includes('ubicacion') || body.includes('donde estan') || body.includes('direccion')) {
        const direccion = storeSettings?.pickup_address || storeSettings?.address || 'Chamical, La Rioja, Argentina';
        const horarios = storeSettings?.pickup_schedule || storeSettings?.opening_hours || 'Lunes a Sábados de 09:00 a 13:00 y de 17:30 a 22:00 hs.';

        const reply = `📍 *Ubicación y Horarios de Atención:* 🍬\n\n🏠 *Dirección:* ${direccion}\n🕒 *Horarios:* ${horarios}\n\n¡Te esperamos con las golosinas más ricas! 🍭\n\n_Enviá *MENU* para volver al menú principal._`;
        await this.sock.sendMessage(from, { text: reply });
        return;
      }

      // 5. Opción 4: Catálogo online
      if (body === '4' || body.includes('catalogo') || body.includes('productos') || body.includes('comprar')) {
        const url = storeSettings?.store_website_url || 'https://candyshopchamical.netlify.app';
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
