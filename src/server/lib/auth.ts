import { Request, Response, NextFunction } from 'express'
import { supabase, serviceClient } from './supabase'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    res.status(401).json({ error: 'Se requiere autenticación' })
    return
  }

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    res.status(401).json({ error: 'Token inválido o expirado' })
    return
  }

  const db = serviceClient || supabase
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle()

  req.user = {
    id: data.user.id,
    email: data.user.email || '',
    role: profile?.role || 'customer'
  }

  next()
}

export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    res.status(401).json({ error: 'Se requiere autenticación' })
    return
  }

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    res.status(401).json({ error: 'Token inválido o expirado' })
    return
  }

  const db = serviceClient || supabase
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle()

  req.user = {
    id: data.user.id,
    email: data.user.email || '',
    role: profile?.role || 'customer'
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' })
    return
  }

  next()
}
