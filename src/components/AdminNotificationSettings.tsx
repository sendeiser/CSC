import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Bell, MessageSquare, Send, CheckCircle2, AlertCircle, Save, 
  ExternalLink, Volume2, ShieldCheck, Sparkles, Smartphone, 
  RefreshCw, Check, Globe, HelpCircle, Info
} from 'lucide-react';
import { admin as adminApi } from '../lib/api';
import { StoreSettings } from '../types';
import { useModal } from '../context/ModalContext';
import { playNotificationSound, requestNotificationPermission, showBrowserNotification } from '../lib/soundAlerts';

export const AdminNotificationSettings: React.FC = () => {
  const { showAlert } = useModal();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testingWhatsapp, setTestingWhatsapp] = useState(false);
  const [testingDiscord, setTestingDiscord] = useState(false);

  const [form, setForm] = useState<Partial<StoreSettings>>({
    telegram_bot_token: '',
    telegram_chat_id: '',
    telegram_enabled: false,
    whatsapp_callmebot_phone: '',
    whatsapp_callmebot_apikey: '',
    whatsapp_notifications_enabled: false,
    discord_webhook_url: '',
    discord_enabled: false,
    notify_on_new_order: true,
    notify_on_new_user: true,
    browser_sound_alerts_enabled: true,
  });

  const [browserPermission, setBrowserPermission] = useState<string>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }

    adminApi.getStoreSettings()
      .then((data) => {
        if (data) {
          setForm({
            ...data,
            telegram_bot_token: data.telegram_bot_token || '',
            telegram_chat_id: data.telegram_chat_id || '',
            telegram_enabled: Boolean(data.telegram_enabled),
            whatsapp_callmebot_phone: data.whatsapp_callmebot_phone || data.whatsapp_number_1 || '',
            whatsapp_callmebot_apikey: data.whatsapp_callmebot_apikey || '',
            whatsapp_notifications_enabled: Boolean(data.whatsapp_notifications_enabled),
            discord_webhook_url: data.discord_webhook_url || '',
            discord_enabled: Boolean(data.discord_enabled),
            notify_on_new_order: data.notify_on_new_order !== undefined ? Boolean(data.notify_on_new_order) : true,
            notify_on_new_user: data.notify_on_new_user !== undefined ? Boolean(data.notify_on_new_user) : true,
            browser_sound_alerts_enabled: data.browser_sound_alerts_enabled !== undefined ? Boolean(data.browser_sound_alerts_enabled) : true,
          });
        }
      })
      .catch((err) => {
        console.error('Error al cargar configuración de notificaciones:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await adminApi.saveStoreSettings(form);
      showAlert({
        title: '¡Guardado!',
        message: 'La configuración de notificaciones al celular fue actualizada correctamente.',
        type: 'success',
      });
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: err.message || 'No se pudo guardar la configuración.',
        type: 'danger',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!form.telegram_bot_token || !form.telegram_chat_id) {
      showAlert({
        title: 'Datos Incompletos',
        message: 'Por favor completá el Bot Token y el Chat ID de Telegram antes de probar.',
        type: 'warning',
      });
      return;
    }

    setTestingTelegram(true);
    try {
      const res = await adminApi.testNotification({
        channel: 'telegram',
        token: form.telegram_bot_token,
        chatId: form.telegram_chat_id,
      });
      showAlert({
        title: '¡Prueba Enviada!',
        message: res.message || 'Revisá tu Telegram en el celular. ¡Deberías haber recibido el mensaje de prueba!',
        type: 'success',
      });
    } catch (err: any) {
      showAlert({
        title: 'Error en Telegram',
        message: err.message || 'No se pudo enviar el mensaje a Telegram. Verificá que el token y chat ID sean correctos y hayas iniciado el bot con /start.',
        type: 'danger',
      });
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!form.whatsapp_callmebot_phone || !form.whatsapp_callmebot_apikey) {
      showAlert({
        title: 'Datos Incompletos',
        message: 'Por favor completá el número de teléfono y la API Key de CallMeBot antes de probar.',
        type: 'warning',
      });
      return;
    }

    setTestingWhatsapp(true);
    try {
      const res = await adminApi.testNotification({
        channel: 'whatsapp',
        phone: form.whatsapp_callmebot_phone,
        apikey: form.whatsapp_callmebot_apikey,
      });
      showAlert({
        title: '¡Prueba Enviada a WhatsApp!',
        message: res.message || 'Revisá tu WhatsApp en el celular. ¡Deberías haber recibido el mensaje!',
        type: 'success',
      });
    } catch (err: any) {
      showAlert({
        title: 'Error en WhatsApp CallMeBot',
        message: err.message || 'Verificá que el número incluya código de país y que la API Key sea válida.',
        type: 'danger',
      });
    } finally {
      setTestingWhatsapp(false);
    }
  };

  const handleTestDiscord = async () => {
    if (!form.discord_webhook_url) {
      showAlert({
        title: 'Falta URL de Webhook',
        message: 'Por favor ingresá la URL del Webhook antes de probar.',
        type: 'warning',
      });
      return;
    }

    setTestingDiscord(true);
    try {
      const res = await adminApi.testNotification({
        channel: 'discord',
        webhookUrl: form.discord_webhook_url,
      });
      showAlert({
        title: '¡Webhook Enviado!',
        message: res.message || 'Mensaje de prueba recibido correctamente en tu canal.',
        type: 'success',
      });
    } catch (err: any) {
      showAlert({
        title: 'Error en Webhook',
        message: err.message || 'No se pudo contactar con la URL del Webhook.',
        type: 'danger',
      });
    } finally {
      setTestingDiscord(false);
    }
  };

  const handleEnableBrowserNotifications = async () => {
    const perm = await requestNotificationPermission();
    setBrowserPermission(perm);
    if (perm === 'granted') {
      playNotificationSound();
      showBrowserNotification('🔔 ¡Notificaciones Activadas!', {
        body: 'Recibirás avisos sonoros y en pantalla cada vez que haya un nuevo pedido o usuario.',
      });
      showAlert({
        title: '¡Permiso Concedido!',
        message: 'Tu navegador ahora mostrará notificaciones instantáneas de pedidos y usuarios.',
        type: 'success',
      });
    } else {
      showAlert({
        title: 'Permiso Denegado',
        message: 'El navegador bloqueó las notificaciones. Podés habilitarlas desde la configuración del sitio en tu navegador.',
        type: 'warning',
      });
    }
  };

  const handleTestSound = () => {
    playNotificationSound();
    showBrowserNotification('🍬 ¡Sonido de Pedido Probado!', {
      body: 'Así sonará y se verá cuando recibas un pedido en tu tienda.',
    });
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-500">Cargando configuración de notificaciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header Strip */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-xs font-bold text-pink-300 backdrop-blur-sm">
              <Bell className="w-3.5 h-3.5" />
              <span>Centro de Alertas al Móvil</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-headline font-black text-white">
              Notificaciones al Celular
            </h1>
            <p className="text-xs sm:text-sm text-purple-200 max-w-2xl leading-relaxed">
              Enterate en tiempo real en tu teléfono cuando un cliente haga un <strong>nuevo pedido</strong> o cuando se <strong>registre un nuevo usuario</strong>, con mensajes directos a Telegram, WhatsApp o avisos con sonido.
            </p>
          </div>

          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-purple-900/40 transition-all hover:scale-105 cursor-pointer shrink-0"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Guardar Configuración</span>
          </button>
        </div>
      </div>

      {/* Global Notification Triggers */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-headline font-bold text-slate-900 text-sm">¿Cuándo querés recibir alertas?</h3>
            <p className="text-xs text-slate-500">Seleccioná los eventos de tu tienda que te avisarán al celular</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 text-sm block">🛍️ Nuevos Pedidos</span>
              <span className="text-xs text-slate-500 block">Avisarme con el total, detalle de gomitas y cliente</span>
            </div>
            <input
              type="checkbox"
              checked={form.notify_on_new_order}
              onChange={(e) => setForm({ ...form, notify_on_new_order: e.target.checked })}
              className="w-5 h-5 rounded-lg accent-purple-600 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 text-sm block">👤 Nuevos Registros de Usuarios</span>
              <span className="text-xs text-slate-500 block">Avisarme cuando un cliente cree una cuenta en la web</span>
            </div>
            <input
              type="checkbox"
              checked={form.notify_on_new_user}
              onChange={(e) => setForm({ ...form, notify_on_new_user: e.target.checked })}
              className="w-5 h-5 rounded-lg accent-purple-600 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Channel 1: TELEGRAM BOT ALERTS (Recomendado) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-headline font-black text-slate-900 text-base">Alertas Instantáneas por Telegram</h3>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full tracking-wider">
                  Recomendado ⚡
                </span>
              </div>
              <p className="text-xs text-slate-500">100% gratis, instantáneo (0.5s) y con sonido de notificación en tu celular</p>
            </div>
          </div>

          {/* Toggle Switch */}
          <label className="flex items-center space-x-3 cursor-pointer self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-700">{form.telegram_enabled ? 'Habilitado' : 'Deshabilitado'}</span>
            <div
              onClick={() => setForm({ ...form, telegram_enabled: !form.telegram_enabled })}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${
                form.telegram_enabled ? 'bg-sky-500 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </div>
          </label>
        </div>

        {/* Step-by-step Quick Setup Guide */}
        <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 sm:p-5 space-y-3 text-xs text-sky-950">
          <span className="font-bold flex items-center gap-1.5 text-sky-900 text-sm">
            <Sparkles className="w-4 h-4 text-sky-600" />
            ¿Cómo configurarlo en 1 minuto?
          </span>
          <ol className="list-decimal list-inside space-y-2 leading-relaxed text-sky-900">
            <li>
              En tu Telegram, buscá y abrí <strong>@BotFather</strong> (o hacé{' '}
              <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-sky-700 underline font-bold inline-flex items-center gap-0.5">
                clic aquí <ExternalLink className="w-3 h-3" />
              </a>
              ), enviá el mensaje <code>/newbot</code>, elegí un nombre y copiá el <strong>HTTP API Token</strong> generado.
            </li>
            <li>
              Buscá tu bot recién creado en Telegram y hacé clic en <strong>"Iniciar"</strong> (o enviá <code>/start</code>).
            </li>
            <li>
              Abrí <strong>@userinfobot</strong> en Telegram (o hacé{' '}
              <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-sky-700 underline font-bold inline-flex items-center gap-0.5">
                clic aquí <ExternalLink className="w-3 h-3" />
              </a>
              ) para ver tu número de <strong>Id (Chat ID)</strong>.
            </li>
          </ol>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Telegram Bot Token: *</label>
            <input
              type="text"
              value={form.telegram_bot_token}
              onChange={(e) => setForm({ ...form, telegram_bot_token: e.target.value })}
              placeholder="Ej: 7123456789:AAHk..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-sky-200 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Telegram Chat ID: *</label>
            <input
              type="text"
              value={form.telegram_chat_id}
              onChange={(e) => setForm({ ...form, telegram_chat_id: e.target.value })}
              placeholder="Ej: 123456789"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-sky-200 transition-all"
            />
          </div>
        </div>

        {/* Test Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleTestTelegram}
            disabled={testingTelegram || !form.telegram_bot_token || !form.telegram_chat_id}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            {testingTelegram ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>🧪 Probar Notificación en Telegram</span>
          </button>
        </div>
      </div>

      {/* Channel 2: WHATSAPP NOTIFICATIONS (CallMeBot) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-headline font-black text-slate-900 text-base">Alertas a tu WhatsApp (CallMeBot)</h3>
              <p className="text-xs text-slate-500">Recibí los avisos directamente en un mensaje a tu WhatsApp personal</p>
            </div>
          </div>

          {/* Toggle Switch */}
          <label className="flex items-center space-x-3 cursor-pointer self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-700">{form.whatsapp_notifications_enabled ? 'Habilitado' : 'Deshabilitado'}</span>
            <div
              onClick={() => setForm({ ...form, whatsapp_notifications_enabled: !form.whatsapp_notifications_enabled })}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${
                form.whatsapp_notifications_enabled ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </div>
          </label>
        </div>

        {/* WhatsApp Setup Guide */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-2 text-xs text-emerald-950">
          <span className="font-bold flex items-center gap-1.5 text-emerald-900 text-sm">
            <Info className="w-4 h-4 text-emerald-600" />
            Instrucciones para WhatsApp:
          </span>
          <p className="text-emerald-900 leading-relaxed">
            Para activar alertas gratuitas a tu WhatsApp mediante la API CallMeBot:{' '}
            Agregá a tus contactos el número <strong>+34 644 10 55 84</strong> (o el indicado en{' '}
            <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noopener noreferrer" className="font-bold underline">
              callmebot.com
            </a>
            ) y enviá el mensaje <code>I allow callmebot to send me messages</code> para recibir tu API Key de 6 dígitos.
          </p>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Tu Celular (con código de país sin +):</label>
            <input
              type="text"
              value={form.whatsapp_callmebot_phone}
              onChange={(e) => setForm({ ...form, whatsapp_callmebot_phone: e.target.value })}
              placeholder="Ej: 5493826432180"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-200 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">API Key de CallMeBot:</label>
            <input
              type="text"
              value={form.whatsapp_callmebot_apikey}
              onChange={(e) => setForm({ ...form, whatsapp_callmebot_apikey: e.target.value })}
              placeholder="Ej: 123456"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-200 transition-all"
            />
          </div>
        </div>

        {/* Test Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleTestWhatsApp}
            disabled={testingWhatsapp || !form.whatsapp_callmebot_phone || !form.whatsapp_callmebot_apikey}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            {testingWhatsapp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
            <span>🧪 Probar Notificación en WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Channel 3: BROWSER PUSH & SOUND CHIME */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-pink-500 text-white flex items-center justify-center shadow-md shadow-pink-500/20">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-headline font-black text-slate-900 text-base">Sonido y Notificación en Navegador / PWA</h3>
              <p className="text-xs text-slate-500">Campana sonora instantánea cada vez que se produce una venta o registro</p>
            </div>
          </div>

          <label className="flex items-center space-x-3 cursor-pointer self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-700">{form.browser_sound_alerts_enabled ? 'Habilitado' : 'Deshabilitado'}</span>
            <div
              onClick={() => setForm({ ...form, browser_sound_alerts_enabled: !form.browser_sound_alerts_enabled })}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${
                form.browser_sound_alerts_enabled ? 'bg-pink-500 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </div>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-800">Permiso del Navegador:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                browserPermission === 'granted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {browserPermission === 'granted' ? '✓ Permitido' : '⚠️ Pendiente de Habilitar'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Habilitá las notificaciones para recibir la alerta flotante en la pantalla de tu celular o computadora.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {browserPermission !== 'granted' && (
              <button
                type="button"
                onClick={handleEnableBrowserNotifications}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
              >
                🔔 Activar en este Navegador
              </button>
            )}
            <button
              type="button"
              onClick={handleTestSound}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Probar Campana Sonora</span>
            </button>
          </div>
        </div>
      </div>

      {/* Channel 4: DISCORD / WEBHOOK (Opcional) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-headline font-black text-slate-900 text-base">Discord / Webhook Personalizado (Opcional)</h3>
              <p className="text-xs text-slate-500">Para enviar alertas a un canal de Discord, Slack, Zapier, Make o n8n</p>
            </div>
          </div>

          <label className="flex items-center space-x-3 cursor-pointer self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-700">{form.discord_enabled ? 'Habilitado' : 'Deshabilitado'}</span>
            <div
              onClick={() => setForm({ ...form, discord_enabled: !form.discord_enabled })}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${
                form.discord_enabled ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </div>
          </label>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Webhook URL:</label>
          <input
            type="text"
            value={form.discord_webhook_url}
            onChange={(e) => setForm({ ...form, discord_webhook_url: e.target.value })}
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleTestDiscord}
            disabled={testingDiscord || !form.discord_webhook_url}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            {testingDiscord ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
            <span>🧪 Probar Webhook</span>
          </button>
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-purple-900/30 transition-all hover:scale-105 cursor-pointer"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Guardar Cambios de Notificaciones</span>
        </button>
      </div>
    </div>
  );
};
