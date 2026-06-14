import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
})

interface PreferenceItem {
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
  backUrls: { success: string; failure: string; pending: string }
): Promise<PreferenceResult> {
  const body = {
    items: items.map(item => ({
      title: item.title,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      currency_id: item.currency_id || 'ARS',
    })),
    payer: { name: payerName },
    back_urls: backUrls,
    notification_url: `${process.env.PUBLIC_URL || ''}/api/payments/webhook`,
  }

  const preference = await new Preference(client).create({ body })
  return { id: preference.id!, init_point: preference.init_point! }
}

export async function getPayment(paymentId: string) {
  const payment = await new Payment(client).get({ id: paymentId })
  return { status: payment.status, preference_id: payment.preference_id }
}
