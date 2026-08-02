import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import authRoutes from './routes/auth'
import productRoutes from './routes/products'
import cartRoutes from './routes/cart'
import orderRoutes from './routes/orders'
import favoriteRoutes from './routes/favorites'
import adminRoutes from './routes/admin'
import homepageRoutes from './routes/homepage'
import categoriesRouter from './routes/categories'
import paymentRoutes from './routes/payments'
import uploadRoutes from './routes/upload'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/homepage', homepageRoutes)
app.use('/api/categories', categoriesRouter)
app.use('/api/payments', paymentRoutes)
app.use('/api/upload', uploadRoutes)

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

if (process.env.NETLIFY !== 'true') {
  app.listen(PORT, () => {
    console.log(`CSC API running on http://localhost:${PORT}`)
  })
}

export default app
