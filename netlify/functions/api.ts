import serverless from 'serverless-http'
import app from '../../src/server/index'

const handlerFn = serverless(app)

export const handler = async (event: any, context: any) => {
  try {
    return await handlerFn(event, context)
  } catch (err: any) {
    console.error('Function error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err?.message || 'Internal error' })
    }
  }
}
