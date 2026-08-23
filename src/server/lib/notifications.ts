import { getStoreSettingsHelper } from '../routes/admin';

export interface NotificationSettings {
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  telegram_enabled?: boolean;
  whatsapp_callmebot_phone?: string;
  whatsapp_callmebot_apikey?: string;
  whatsapp_notifications_enabled?: boolean;
  discord_webhook_url?: string;
  discord_enabled?: boolean;
  notify_on_new_order?: boolean;
  notify_on_new_user?: boolean;
}

export function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function formatForWhatsApp(text: string): string {
  if (!text) return '';
  return text
    .replace(/<b>(.*?)<\/b>/gi, '*$1*')
    .replace(/<strong>(.*?)<\/strong>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '_$1_')
    .replace(/<em>(.*?)<\/em>/gi, '_$1_')
    .replace(/<code>(.*?)<\/code>/gi, '`$1`')
    .replace(/<[^>]*>/g, '') // remove remaining HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // Evitar que PHP en CallMeBot interprete $1..$9 como backreferences regex / variables eliminando el primer dígito
    .replace(/\$(\d)/g, '$ $1');
}

export async function sendTelegramMessage(token: string, chatId: string, text: string): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const cleanToken = token.trim();
    const cleanChatId = chatId.trim();
    if (!cleanToken || !cleanChatId) return { success: false, error: 'Token o Chat ID de Telegram faltante' };

    const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
    
    // 1st attempt: with HTML formatting
    let res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    let data = await res.json().catch(() => ({}));

    // If Telegram rejected HTML entities or tags, 2nd attempt: plain text fallback
    if (!res.ok || !data.ok) {
      console.warn('[Telegram HTML parsing warning, trying plain text]:', data.description || res.statusText);
      const plainText = text
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanChatId,
          text: plainText,
        }),
      });
      data = await res.json().catch(() => ({}));
    }

    if (!res.ok || !data.ok) {
      const errMsg = data.description || `Error HTTP ${res.status}`;
      return { 
        success: false, 
        error: `Telegram error: ${errMsg}. Verificá que el Bot Token sea correcto y hayas presionado "Iniciar" (/start) en tu bot.` 
      };
    }

    return { success: true, message: 'Mensaje enviado a Telegram correctamente' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error de conexión con Telegram' };
  }
}

export async function sendCallMeBotWhatsApp(phone: string, apikey: string, text: string): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const cleanPhone = phone.trim().replace(/\+/g, '').replace(/[\s-]/g, '');
    const cleanKey = apikey.trim();
    if (!cleanPhone || !cleanKey) {
      return { success: false, error: 'El número de teléfono o la API Key de CallMeBot están vacíos.' };
    }

    const waText = formatForWhatsApp(text);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(waText)}&apikey=${encodeURIComponent(cleanKey)}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    const body = await res.text().catch(() => '');
    const cleanBody = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const lowerBody = cleanBody.toLowerCase();

    // Check for explicit CallMeBot failure indicators
    if (
      lowerBody.includes('apikey is invalid') ||
      lowerBody.includes('invalid') ||
      lowerBody.includes('not found') ||
      lowerBody.includes('please create') ||
      lowerBody.includes('not authorized') ||
      lowerBody.includes('color:red') ||
      lowerBody.includes('error') ||
      res.status >= 400
    ) {
      return {
        success: false,
        error: cleanBody || `Error HTTP ${res.status}: CallMeBot no pudo entregar el mensaje. Verificá que hayas enviado "I allow callmebot to send me messages" y que la API Key coincida.`,
      };
    }

    // Check for success indicators
    if (
      lowerBody.includes('message queued') ||
      lowerBody.includes('message sent') ||
      lowerBody.includes('success') ||
      lowerBody.includes('message to:')
    ) {
      return { success: true, message: cleanBody || 'Mensaje enviado a WhatsApp exitosamente.' };
    }

    if (res.status === 200 || res.status === 203) {
      return { success: true, message: cleanBody || 'Mensaje procesado por CallMeBot.' };
    }

    return { success: false, error: cleanBody || `Error de entrega en CallMeBot (${res.status})` };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error de conexión al conectar con CallMeBot WhatsApp' };
  }
}

export async function sendDiscordWebhook(webhookUrl: string, text: string): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const cleanUrl = webhookUrl.trim();
    if (!cleanUrl.startsWith('http')) return { success: false, error: 'URL de Webhook inválida' };

    const cleanText = text.replace(/<[^>]*>/g, '');
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: cleanText }),
    });

    if (!res.ok) {
      return { success: false, error: `Error HTTP ${res.status} al enviar a Webhook` };
    }
    return { success: true, message: 'Mensaje enviado a Webhook correctamente' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error de conexión con Webhook' };
  }
}

export async function dispatchNotifications(text: string, options: { isOrder?: boolean; isUser?: boolean } = {}) {
  try {
    const settings = await getStoreSettingsHelper();
    if (!settings) {
      console.warn('[Notifications]: No se pudo cargar store_settings.');
      return;
    }

    if (options.isOrder && settings.notify_on_new_order === false) {
      console.log('[Notifications]: Alertas de nuevo pedido desactivadas por configuración.');
      return;
    }
    if (options.isUser && settings.notify_on_new_user === false) {
      console.log('[Notifications]: Alertas de nuevo usuario desactivadas por configuración.');
      return;
    }

    const promises: Promise<any>[] = [];

    // 1. Telegram
    const hasTelegram = Boolean(settings.telegram_bot_token && settings.telegram_chat_id);
    const telegramActive = settings.telegram_enabled !== false && hasTelegram;

    if (telegramActive && settings.telegram_bot_token && settings.telegram_chat_id) {
      console.log(`[Notifications]: Enviando alerta a Telegram chat ID: ${settings.telegram_chat_id}...`);
      promises.push(
        sendTelegramMessage(settings.telegram_bot_token, settings.telegram_chat_id, text)
          .then(res => {
            if (!res.success) console.warn('[Telegram Alert Failed]:', res.error);
            else console.log('[Telegram Alert Sent Successfully!]');
          })
          .catch(err => console.warn('[Telegram Alert Error]:', err))
      );
    } else {
      console.log('[Notifications]: Telegram no enviado. (activo:', telegramActive, ', tiene credenciales:', hasTelegram, ')');
    }

    // 2. WhatsApp CallMeBot
    const hasWhatsApp = Boolean(settings.whatsapp_callmebot_phone && settings.whatsapp_callmebot_apikey);
    const whatsappActive = settings.whatsapp_notifications_enabled !== false && hasWhatsApp;

    if (whatsappActive && settings.whatsapp_callmebot_phone && settings.whatsapp_callmebot_apikey) {
      console.log(`[Notifications]: Enviando alerta a WhatsApp: ${settings.whatsapp_callmebot_phone}...`);
      promises.push(
        sendCallMeBotWhatsApp(settings.whatsapp_callmebot_phone, settings.whatsapp_callmebot_apikey, text)
          .then(res => {
            if (!res.success) console.warn('[WhatsApp Alert Failed]:', res.error);
            else console.log('[WhatsApp Alert Sent Successfully!]');
          })
          .catch(err => console.warn('[WhatsApp Alert Error]:', err))
      );
    }

    // 3. Discord / Generic Webhook
    if (settings.discord_enabled && settings.discord_webhook_url) {
      promises.push(
        sendDiscordWebhook(settings.discord_webhook_url, text)
          .then(res => {
            if (!res.success) console.warn('[Discord Webhook Alert Failed]:', res.error);
            else console.log('[Discord Alert Sent Successfully!]');
          })
          .catch(err => console.warn('[Discord Webhook Alert Error]:', err))
      );
    }

    await Promise.allSettled(promises);
  } catch (err) {
    console.error('[Notification Dispatch Error]:', err);
  }
}

export async function notifyNewOrder(order: any, items: any[] = []) {
  try {
    const settings = await getStoreSettingsHelper();
    const rawUrl = settings?.store_website_url || process.env.PUBLIC_URL || process.env.APP_URL || process.env.URL || '';
    const storeUrl = (rawUrl ? rawUrl.trim() : 'https://chamicalcandyshop.com').replace(/\/+$/, '');

    const orderCode = escapeHtml((order.id || '').slice(0, 8).toUpperCase());
    const customer = escapeHtml(order.shipping_name || 'Cliente');
    const address = escapeHtml(order.shipping_address || 'Sin especificar');
    const city = escapeHtml(order.shipping_city || 'Chamical');
    const totalVal = Number(order.total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const dateStr = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

    let itemsList = '';
    if (items && Array.isArray(items) && items.length > 0) {
      itemsList = items.map((i: any) => {
        const prodName = escapeHtml(i.name || i.product?.name || i.products?.name || 'Golosina');
        const qty = i.weight_grams ? `${i.weight_grams}g` : `${i.quantity || 1} un.`;
        return `  • <b>${qty}</b> ${prodName}`;
      }).join('\n');
    }

    const message = [
      `🍬 <b>¡NUEVO PEDIDO RECIBIDO EN CSC!</b> 🍬`,
      ``,
      `🛍️ <b>Pedido:</b> #${orderCode}`,
      `👤 <b>Cliente:</b> ${customer}`,
      `💰 <b>Total:</b> $ ${totalVal}`,
      `📍 <b>Detalle Entrega:</b> ${address}`,
      `🏙️ <b>Ciudad:</b> ${city}`,
      itemsList ? `\n📦 <b>Productos:</b>\n${itemsList}\n` : '',
      `🕒 <b>Fecha:</b> ${dateStr}`,
      ``,
      `🌐 <b>Ingresar a la Web:</b> ${storeUrl}`,
      `👉 <i>Ingresá al panel admin para gestionarlo.</i>`
    ].filter(Boolean).join('\n');

    await dispatchNotifications(message, { isOrder: true });
  } catch (err) {
    console.error('[notifyNewOrder Error]:', err);
  }
}

export async function notifyNewUser(user: { name?: string; email: string }) {
  try {
    const settings = await getStoreSettingsHelper();
    const rawUrl = settings?.store_website_url || process.env.PUBLIC_URL || process.env.APP_URL || process.env.URL || '';
    const storeUrl = (rawUrl ? rawUrl.trim() : 'https://chamicalcandyshop.com').replace(/\/+$/, '');

    const name = escapeHtml(user.name || 'Nuevo Usuario');
    const email = escapeHtml(user.email || 'Sin email');
    const dateStr = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

    const message = [
      `🎉 <b>¡NUEVO USUARIO REGISTRADO EN CSC!</b> 🎉`,
      ``,
      `👤 <b>Nombre:</b> ${name}`,
      `📧 <b>Email:</b> ${email}`,
      `🕒 <b>Fecha:</b> ${dateStr}`,
      ``,
      `🌐 <b>Ingresar a la Web:</b> ${storeUrl}`,
      `👉 <i>Usuario listo para comprar en Chamical Candy Shop.</i>`
    ].join('\n');

    await dispatchNotifications(message, { isUser: true });
  } catch (err) {
    console.error('[notifyNewUser Error]:', err);
  }
}
