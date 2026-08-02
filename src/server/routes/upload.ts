import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { requireAdmin, AuthenticatedRequest } from '../lib/auth'

const router = Router()

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (_req, file, cb) => {
    // Generate unique name: timestamp + random + original extension
    const ext = path.extname(file.originalname).toLowerCase()
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    cb(null, unique)
  },
})

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Solo se permiten imágenes (JPEG, PNG, WEBP, GIF, AVIF)'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
})

router.post('/', requireAdmin, upload.single('image'), (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No se proporcionó ningún archivo de imagen' })
    return
  }

  const url = `/uploads/${req.file.filename}`
  res.json({ url, filename: req.file.filename })
})

export default router
