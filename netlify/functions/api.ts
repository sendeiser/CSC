import serverless from 'serverless-http'
import app from '../../src/server/index'

const handlerFn = serverless(app)

export const handler = async (event: any, context: any) => {
  if (event.rawPath === '/api/health' || event.path === '/api/health') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ok', env: { url: !!process.env.SUPABASE_URL, anon_key: !!process.env.SUPABASE_ANON_KEY, service_key: !!process.env.SUPABASE_SERVICE_KEY, mp_token: !!process.env.MERCADO_PAGO_ACCESS_TOKEN, netlify: process.env.NETLIFY, cors: process.env.CORS_ORIGIN } })
    }
  }
  try {
    const result = await handlerFn(event, context)
    return result
  } catch (err: any) {
    console.error('Function error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err?.message || 'Internal error', stack: err?.stack })
    }
  }
}
