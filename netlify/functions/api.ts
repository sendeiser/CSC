import serverless from 'serverless-http'
import app from '../../src/server/index'

const handlerFn = serverless(app)

export const handler = async (event: any, context: any) => {
  if (event.rawPath === '/api/health' || event.path === '/api/health') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ok', env: { url: !!process.env.SUPABASE_URL, key: !!process.env.SUPABASE_ANON_KEY, netlify: process.env.NETLIFY, cors: process.env.CORS_ORIGIN } })
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
