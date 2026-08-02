import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

function getClient() {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN
  if (!token) console.error('[MP] ERROR: MERCADO_PAGO_ACCESS_TOKEN is empty')
  return new MercadoPagoConfig({
    accessToken: token || '',
  })
}

interface PreferenceItem {
  id?: string
  title: string
  quantity: number
  unit_price: number
  currency_id?: string
}

interface PreferenceResult {
  id: string
  init_point: string
}

export async function createPreference(
  items: PreferenceItem[],
  payerName: string,
  backUrls: { success: string; failure: string; pending: string },
  payerEmail?: string
): Promise<PreferenceResult> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN
  const publicUrl = process.env.PUBLIC_URL || process.env.APP_URL

  const body: any = {
    items: items.map(item => ({
      id: item.id,
      title: item.title,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      currency_id: item.currency_id || 'ARS',
    })),
    payer: {
      name: payerName,
      ...(payerEmail ? { email: payerEmail } : {}),
    },
    back_urls: backUrls,
    auto_return: 'approved',
  }

  if (publicUrl && (publicUrl.startsWith('http://') || publicUrl.startsWith('https://'))) {
    body.notification_url = `${publicUrl}/api/payments/webhook`
  }

  const preference = await new Preference(getClient()).create({ body })
  const initPoint = (token && token.startsWith('TEST-'))
    ? (preference.sandbox_init_point || preference.init_point!)
    : preference.init_point!

  return { id: preference.id!, init_point: initPoint }
}

export async function getPayment(paymentId: string) {
  const payment = await new Payment(getClient()).get({ id: paymentId })
  return { status: payment.status, preference_id: (payment as any).preference_id }
}

