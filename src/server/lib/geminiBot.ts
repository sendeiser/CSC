import { GoogleGenAI } from '@google/genai';
import { supabase } from './supabase';
import { getBotSettings } from './whatsappBot';

export interface GeminiBotContext {
  customerName?: string;
  customerPhone?: string;
  storeSettings?: any;
  availableProducts?: any[];
}

export class GeminiBotService {
  private static instance: GeminiBotService;
  private client: GoogleGenAI | null = null;
  private currentApiKey: string = '';

  private constructor() {
    this.initClient();
  }

  public static getInstance(): GeminiBotService {
    if (!GeminiBotService.instance) {
      GeminiBotService.instance = new GeminiBotService();
    }
    return GeminiBotService.instance;
  }

  private initClient(customKey?: string) {
    const key = (customKey || process.env.GEMINI_API_KEY || '').trim();
    if (key && key !== 'MY_GEMINI_API_KEY' && key !== this.currentApiKey) {
      try {
        this.client = new GoogleGenAI({ apiKey: key });
        this.currentApiKey = key;
      } catch (err) {
        console.warn('[GeminiBot]: Error al inicializar cliente GenAI:', err);
      }
    }
  }

  /**
   * Genera una respuesta inteligente con Gemini para WhatsApp
   */
  public async generateReply(
    userMessage: string,
    context?: GeminiBotContext
  ): Promise<string | null> {
    const key = (process.env.GEMINI_API_KEY || '').trim();
    if (!key || key === 'MY_GEMINI_API_KEY') {
      return null;
    }

    this.initClient(key);
    if (!this.client) return null;

    try {
      // 1. Obtener productos activos de la tienda para darle contexto en tiempo real
      let productContext = '';
      if (context?.availableProducts && context.availableProducts.length > 0) {
        productContext = context.availableProducts
          .map(p => `- ${p.name}: $${p.price_per_kg ? `${Math.round(p.price_per_kg / 20)} x50g ($${p.price_per_kg}/kg)` : p.base_price || p.price} (Stock: ${p.stock ?? 'disponible'})`)
          .slice(0, 30)
          .join('\n');
      } else {
        const { data: prods } = await supabase
          .from('products')
          .select('name, price_per_kg, base_price, unit_type, stock')
          .limit(25);
        if (prods && prods.length > 0) {
          productContext = prods
            .map(p => `- ${p.name}: $${p.price_per_kg ? `${Math.round(p.price_per_kg / 20)} x50g` : p.base_price}`)
            .join('\n');
        }
      }

      const systemInstruction = `
Eres el asistente virtual amable, dulce y servicial de "Chamical Candy Shop" (tienda de gomitas y golosinas en Chamical, La Rioja, Argentina).

Tono y estilo:
- Muy cálido, amigable y simpático con emojis de golosinas (🍬, 🍭, ✨, 🎉).
- Respuestas breves y directas, ideales para leer rápidamente en WhatsApp (máximo 2 a 4 párrafos cortos).
- Usá formato WhatsApp con asteriscos para *negrita*.

Datos clave de la tienda:
- Ubicación: Chamical, La Rioja. Hacemos envíos a domicilio con cadetería local o retiro por el local.
- Medios de pago: Transferencia bancaria (Alias/CBU), Efectivo al recibir o Mercado Pago.
- Vendemos gomitas por peso (fraccionables desde 25g/50g), combos armables a elección del cliente y golosinas por unidad.

Productos destacados en stock:
${productContext}

Instrucciones de comportamiento:
1. Si el cliente pregunta qué productos o gomitas hay, recomendale 2 o 3 opciones ricas e indícale que puede escribir *CATALOGO* o *COMPRAR* para ver todas las fotos numeradas y armar su pedido.
2. Si el cliente quiere comprar o ver precios detallados, decile con entusiasmo que escriba la palabra *COMPRAR* o *CATALOGO*.
3. Si el cliente tiene dudas sobre envíos, pagos o ubicación, respondé con claridad.
4. Si el cliente saluda o agradece, sé súper cordial y ponete a su disposición.
`;

      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userMessage,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const replyText = response?.text?.trim();
      return replyText || null;
    } catch (err: any) {
      console.warn('[GeminiBot Service Error]:', err?.message || err);
      // Fallback a gemini-1.5-flash si 2.5 no está disponible
      try {
        if (this.client) {
          const fallbackResp = await this.client.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: userMessage,
          });
          return fallbackResp?.text?.trim() || null;
        }
      } catch (_e) {}
      return null;
    }
  }
}

export const geminiBot = GeminiBotService.getInstance();
