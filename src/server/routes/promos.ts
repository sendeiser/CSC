import { Router, Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const router = Router()

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// POST /api/promo-codes/validate
router.post('/validate', async (req: Request, res: Response) => {
  const { code } = req.body
  if (!code || typeof code !== 'string') {
    res.status(400).json({ valid: false, error: 'Por favor ingresá un código de cupón.' })
    return
  }

  const cleanCode = code.trim().toUpperCase()

  try {
    const { data: promo, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', cleanCode)
      .single()

    if (error || !promo) {
      res.status(404).json({ valid: false, error: 'El cupón ingresado no existe.' })
      return
    }

    if (!promo.active) {
      res.status(400).json({ valid: false, error: 'Este cupón se encuentra pausado o inactivo.' })
      return
    }

    if (promo.max_uses && promo.used_count >= promo.max_uses) {
      res.status(400).json({ valid: false, error: 'Este cupón ha alcanzado el límite máximo de usos permitidos.' })
      return
    }

    if (promo.expires_at) {
      const expiry = new Date(promo.expires_at)
      if (expiry.getTime() < Date.now()) {
        res.status(400).json({ valid: false, error: 'Este cupón ya ha expirado.' })
        return
      }
    }

    res.json({
      valid: true,
      promo: {
        id: promo.id,
        code: promo.code,
        percent: promo.percent,
        max_uses: promo.max_uses,
        used_count: promo.used_count,
        expires_at: promo.expires_at
      }
    })
  } catch (err: any) {
    res.status(500).json({ valid: false, error: err.message || 'Error al validar el cupón' })
  }
})

export default router
