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

export async function sendTelegramMessage(token: string, chatId: string, text: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanToken = token.trim();
    const cleanChatId = chatId.trim();
    if (!cleanToken || !cleanChatId) return { success: false, error: 'Token o Chat ID faltante' };

    const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      return { success: false, error: data.description || `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error de conexión con Telegram' };
  }
}

export async function sendCallMeBotWhatsApp(phone: string, apikey: string, text: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanPhone = phone.trim().replace(/\+/g, '').replace(/\s+/g, '');
    const cleanKey = apikey.trim();
    if (!cleanPhone || !cleanKey) return { success: false, error: 'Teléfono o API Key de CallMeBot faltante' };

    const cleanText = text
      .replace(/<[^>]*>/g, '') // remove HTML tags
      .replace(/&nbsp;/g, ' ');

    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(cleanText)}&apikey=${encodeURIComponent(cleanKey)}`;
    const res = await fetch(url);
    const body = await res.text().catch(() => '');

    if (!res.ok || body.toLowerCase().includes('error')) {
      return { success: false, error: body || `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error de conexión con CallMeBot WhatsApp' };
  }
}

export async function sendDiscordWebhook(webhookUrl: string, text: string): Promise<{ success: boolean; error?: string }> {
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
      return { success: false, error: `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error de conexión con Webhook' };
  }
}

export async function dispatchNotifications(text: string, options: { isOrder?: boolean; isUser?: boolean } = {}) {
  try {
    const settings = await getStoreSettingsHelper();
    if (!settings) return;

    if (options.isOrder && settings.notify_on_new_order === false) return;
    if (options.isUser && settings.notify_on_new_user === false) return;

    const promises: Promise<any>[] = [];

    // 1. Telegram
    if (settings.telegram_enabled && settings.telegram_bot_token && settings.telegram_chat_id) {
      promises.push(
        sendTelegramMessage(settings.telegram_bot_token, settings.telegram_chat_id, text)
          .then(res => {
            if (!res.success) console.warn('[Telegram Alert Failed]:', res.error);
          })
          .catch(err => console.warn('[Telegram Alert Error]:', err))
      );
    }

    // 2. WhatsApp CallMeBot
    if (settings.whatsapp_notifications_enabled && settings.whatsapp_callmebot_phone && settings.whatsapp_callmebot_apikey) {
      promises.push(
        sendCallMeBotWhatsApp(settings.whatsapp_callmebot_phone, settings.whatsapp_callmebot_apikey, text)
          .then(res => {
            if (!res.success) console.warn('[WhatsApp Alert Failed]:', res.error);
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
    const orderCode = (order.id || '').slice(0, 8).toUpperCase();
    const customer = order.shipping_name || 'Cliente';
    const address = order.shipping_address || 'Sin especificar';
    const city = order.shipping_city || 'Chamical';
    const totalVal = Number(order.total || 0).toFixed(2);
    const dateStr = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

    let itemsList = '';
    if (items && Array.isArray(items) && items.length > 0) {
      itemsList = items.map((i: any) => {
        const prodName = i.name || i.product?.name || i.products?.name || 'Golosina';
        const qty = i.weight_grams ? `${i.weight_grams}g` : `${i.quantity || 1} un.`;
        return `  • <b>${qty}</b> ${prodName}`;
      }).join('\n');
    }

    const message = [
      `🍬 <b>¡NUEVO PEDIDO RECIBIDO EN CSC!</b> 🍬`,
      ``,
      `🛍️ <b>Pedido:</b> #${orderCode}`,
      `👤 <b>Cliente:</b> ${customer}`,
      `💰 <b>Total:</b> $${totalVal}`,
      `📍 <b>Detalle Entrega:</b> ${address}`,
      `🏙️ <b>Ciudad:</b> ${city}`,
      itemsList ? `\n📦 <b>Productos:</b>\n${itemsList}\n` : '',
      `🕒 <b>Fecha:</b> ${dateStr}`,
      ``,
      `👉 <i>Ingresá al panel admin para gestionarlo.</i>`
    ].filter(Boolean).join('\n');

    await dispatchNotifications(message, { isOrder: true });
  } catch (err) {
    console.error('[notifyNewOrder Error]:', err);
  }
}

export async function notifyNewUser(user: { name?: string; email: string }) {
  try {
    const name = user.name || 'Nuevo Usuario';
    const email = user.email || 'Sin email';
    const dateStr = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

    const message = [
      `🎉 <b>¡NUEVO USUARIO REGISTRADO EN CSC!</b> 🎉`,
      ``,
      `👤 <b>Nombre:</b> ${name}`,
      `📧 <b>Email:</b> ${email}`,
      `🕒 <b>Fecha:</b> ${dateStr}`,
      ``,
      `👉 <i>Usuario listo para comprar en Chamical Candy Shop.</i>`
    ].join('\n');

    await dispatchNotifications(message, { isUser: true });
  } catch (err) {
    console.error('[notifyNewUser Error]:', err);
  }
}
