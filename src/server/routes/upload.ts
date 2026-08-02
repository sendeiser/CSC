import { Router, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
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

async function ensureBucketExists(client: any) {
  try {
    const { data: bucket, error } = await client.storage.getBucket('products')
    if (error || !bucket) {
      await client.storage.createBucket('products', {
        public: true,
        fileSizeLimit: 5242880,
      })
    }
  } catch (e) {
    console.warn('[Upload] Failed to auto-create bucket:', e)
  }
}

router.post('/', requireAdmin, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No se proporcionó ningún archivo de imagen' })
    return
  }

  try {
    const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg'
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    const filePath = `products/${filename}`

    const client = serviceClient || supabase

    // Intentar asegurar que el bucket 'products' exista en Supabase
    await ensureBucketExists(client)

    let { error: uploadError } = await client.storage
      .from('products')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      })

    // Si falló por bucket no encontrado o no existente, intentar crear bucket y reintentar
    if (uploadError && (uploadError.message.includes('not found') || uploadError.message.includes('Bucket') || uploadError.message.includes('does not exist'))) {
      await client.storage.createBucket('products', { public: true }).catch(() => {})
      const retry = await client.storage
        .from('products')
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        })
      uploadError = retry.error
    }

    if (!uploadError) {
      const { data: { publicUrl } } = client.storage
        .from('products')
        .getPublicUrl(filePath)
      res.json({ url: publicUrl, filename })
      return
    }

    // Fallback: Si Supabase Storage falla (ej: sin permisos o bucket no creado en cloud), guardar localmente o data URI
    console.warn('[Upload] Supabase Storage error, using resilient fallback:', uploadError?.message)
    const localDir = path.join(process.cwd(), 'public', 'uploads')
    try {
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true })
      }
      const localFilePath = path.join(localDir, filename)
      fs.writeFileSync(localFilePath, req.file.buffer)
      res.json({ url: `/uploads/${filename}`, filename })
      return
    } catch {
      // Si el filesystem es read-only (Netlify), devolver Data URI base64
      const base64 = req.file.buffer.toString('base64')
      const dataUri = `data:${req.file.mimetype};base64,${base64}`
      res.json({ url: dataUri, filename })
      return
    }
  } catch (err: any) {
    console.error('Upload error:', err)
    res.status(500).json({ error: err?.message || 'Error interno al subir imagen' })
  }
})

export default router
