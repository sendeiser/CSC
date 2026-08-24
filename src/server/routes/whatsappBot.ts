import { Router, Request, Response } from 'express';
import { whatsappBot, getBotSettings, saveBotSettings } from '../lib/whatsappBot';
import { requireAdmin, AuthenticatedRequest } from '../lib/auth';

const router = Router();

// Estado actual del bot y código QR
router.get('/status', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({
      status: whatsappBot.status,
      qrCode: whatsappBot.qrCode,
      user: whatsappBot.connectedUser
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al obtener estado' });
  }
});

// Iniciar conexión o forzar nuevo QR
router.post('/start', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    await whatsappBot.start();
    res.json({
      message: 'Iniciando conexión de WhatsApp...',
      status: whatsappBot.status,
      qrCode: whatsappBot.qrCode
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al iniciar bot' });
  }
});

// Cerrar sesión y desvincular
router.post('/logout', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    await whatsappBot.logout();
    res.json({
      message: 'Sesión de WhatsApp cerrada correctamente.',
      status: whatsappBot.status
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al cerrar sesión' });
  }
});

// Obtener configuración del bot y plantillas
router.get('/settings', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await getBotSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al obtener configuración' });
  }
});

// Guardar configuración y plantillas
router.put('/settings', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await saveBotSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al guardar configuración' });
  }
});

// Enviar mensaje de prueba
router.post('/send-test', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { phone, message } = req.body;
  if (!phone) {
    res.status(400).json({ error: 'Debes proporcionar un número de teléfono' });
    return;
  }

  const text = message || '🍬 *¡Hola!* Este es un mensaje de prueba enviado automáticamente desde el sistema de Chamical Candy Shop. 🍭✨';
  const sent = await whatsappBot.sendTextMessage(phone, text);

  if (sent) {
    res.json({ success: true, message: `Mensaje de prueba enviado a ${phone}` });
  } else {
    res.status(500).json({
      error: whatsappBot.status !== 'connected'
        ? 'El bot de WhatsApp no está conectado. Escaneá el código QR primero.'
        : 'Error al enviar el mensaje de prueba. Verifica el número ingresado.'
    });
  }
});

export default router;
