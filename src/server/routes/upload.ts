import { Router, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { requireAdmin, AuthenticatedRequest } from '../lib/auth'
import { serviceClient, supabase } from '../lib/supabase'

const router = Router()

// Usar memoria en vez de disco — compatible con entornos serverless (Netlify Functions)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten imágenes (JPEG, PNG, WEBP, GIF, AVIF)'))
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
})

router.post('/', requireAdmin, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No se proporcionó ningún archivo de imagen' })
    return
  }

  try {
    const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg'
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    const filePath = `products/${filename}`

    // Usar serviceClient si está disponible (tiene permisos de escritura en Storage)
    const client = serviceClient || supabase

    const { error: uploadError } = await client.storage
      .from('products')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError)
      res.status(500).json({ error: 'Error al subir imagen: ' + uploadError.message })
      return
    }

    // Obtener URL pública del archivo subido
    const { data: { publicUrl } } = client.storage
      .from('products')
      .getPublicUrl(filePath)

    res.json({ url: publicUrl, filename })
  } catch (err: any) {
    console.error('Upload error:', err)
    res.status(500).json({ error: err?.message || 'Error interno al subir imagen' })
  }
})

export default router
