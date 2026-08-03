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

async function saveFileBuffer(buffer: Buffer, originalname: string, mimetype: string): Promise<string> {
  const ext = path.extname(originalname).toLowerCase() || '.jpg'
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
  const filePath = `products/${filename}`

  const client = serviceClient || supabase
  await ensureBucketExists(client)

  let { error: uploadError } = await client.storage
    .from('products')
    .upload(filePath, buffer, {
      contentType: mimetype,
      upsert: true,
    })

  if (uploadError && (uploadError.message.includes('not found') || uploadError.message.includes('Bucket') || uploadError.message.includes('does not exist'))) {
    await client.storage.createBucket('products', { public: true }).catch(() => {})
    const retry = await client.storage
      .from('products')
      .upload(filePath, buffer, {
        contentType: mimetype,
        upsert: true,
      })
    uploadError = retry.error
  }

  if (!uploadError) {
    const { data: { publicUrl } } = client.storage
      .from('products')
      .getPublicUrl(filePath)
    return publicUrl
  }

  // Fallback a public/uploads o data URI
  const localDir = path.join(process.cwd(), 'public', 'uploads')
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true })
    }
    const localFilePath = path.join(localDir, filename)
    fs.writeFileSync(localFilePath, buffer)
    return `/uploads/${filename}`
  } catch {
    const base64 = buffer.toString('base64')
    return `data:${mimetype};base64,${base64}`
  }
}

router.post('/', requireAdmin, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No se proporcionó ningún archivo de imagen' })
    return
  }

  try {
    const url = await saveFileBuffer(req.file.buffer, req.file.originalname, req.file.mimetype)
    res.json({ url })
  } catch (err: any) {
    console.error('Upload error:', err)
    res.status(500).json({ error: err?.message || 'Error interno al subir imagen' })
  }
})

router.post('/multiple', requireAdmin, upload.any(), async (req: AuthenticatedRequest, res: Response) => {
  const files = req.files as Express.Multer.File[]
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No se proporcionaron archivos de imagen' })
    return
  }

  try {
    const urls: string[] = []
    for (const file of files) {
      const url = await saveFileBuffer(file.buffer, file.originalname, file.mimetype)
      urls.push(url)
    }
    res.json({ urls })
  } catch (err: any) {
    console.error('Multiple upload error:', err)
    res.status(500).json({ error: err?.message || 'Error interno al subir imágenes' })
  }
})

export default router
