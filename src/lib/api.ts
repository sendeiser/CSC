import { StoreSettings } from '../types'

const API_BASE = '/api'

let authToken: string | null = null

// Callback opcional para forzar logout desde afuera (ej: App.tsx)
let onAuthExpired: (() => void) | null = null
export function setOnAuthExpired(cb: (() => void) | null) {
  onAuthExpired = cb
}

export function setAuthToken(token: string | null) {
  authToken = token
  if (token) {
    localStorage.setItem('csc_token', token)
  } else {
    localStorage.removeItem('csc_token')
  }
}

export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = localStorage.getItem('csc_token')
  }
  return authToken
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    // Si el token venció/es inválido, limpiar sesión automáticamente
    if (res.status === 401 || res.status === 403) {
      setAuthToken(null)
      onAuthExpired?.()
      throw new Error('Tu sesión expiró. Por favor ingresá de nuevo.')
    }
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error('El servidor no está disponible en este momento. Intentá de nuevo en unos instantes.')
    }
    const text = await res.text().catch(() => '')
    let errDetail = `Error ${res.status}`
    try {
      const json = JSON.parse(text)
      errDetail = json.error || json.message || errDetail
    } catch {
      if (text && text.length < 200) errDetail = text
    }
    throw new Error(errDetail)
  }

  return res.json()
}

// Auth
export const auth = {
  signup: (data: { email: string; password: string; name?: string }) =>
    request<{ user: any; session: any }>('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<{ user: any; session: { access_token: string } }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () =>
    request<{ message: string }>('/auth/logout', { method: 'POST' }),

  me: () =>
    request<{ id: string; email: string; name: string; role: string }>('/auth/me'),

  updateProfile: (data: { name: string }) =>
    request<{ id: string; name: string; role: string }>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
}

// Products
export const products = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<any[]>('/products' + qs)
  },

  get: (slug: string) =>
    request<any>('/products/' + slug),

  create: (data: any) =>
    request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    request<any>('/products/' + id, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<any>('/products/' + id, { method: 'DELETE' }),
  bulkDelete: (ids: string[]) =>
    request<{ message: string }>('/products/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
}

// Cart
export const cart = {
  list: () =>
    request<any[]>('/cart'),

  add: (data: { product_id: string; quantity: number; selected_size: string; item_price: number; weight_grams?: number; combo_selections?: any[] }) =>
    request<any>('/cart', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, payload: number | { quantity?: number; weight_grams?: number }) =>
    request<any>(`/cart/${id}`, { method: 'PUT', body: JSON.stringify(typeof payload === 'number' ? { quantity: payload } : payload) }),

  remove: (id: string) =>
    request<{ message: string }>(`/cart/${id}`, { method: 'DELETE' }),
}

// Payments
export const payments = {
  createPreference: (data: { shipping_name: string; shipping_address?: string; shipping_city?: string; promo_code?: string; items?: any[] }) =>
    request<{ init_point: string; preference_id: string }>('/payments/create-preference', { method: 'POST', body: JSON.stringify(data) }),
}

// Orders
export const orders = {
  list: () =>
    request<any[]>('/orders'),

  create: (data: { shipping_name: string; shipping_address?: string; shipping_city?: string; promo_code?: string; items?: any[] }) =>
    request<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: string) =>
    request<any>(`/orders/${id}`),

  confirm: (payment_id: string, preference_id: string) =>
    request<any>('/orders/confirm', { method: 'POST', body: JSON.stringify({ payment_id, preference_id }) }),

  uploadReceipt: (id: string, receipt_url: string) =>
    request<any>(`/orders/${id}/receipt`, { method: 'POST', body: JSON.stringify({ receipt_url }) }),

  searchByCode: (orderId: string, email?: string) =>
    request<any>(`/orders/search?order_id=${encodeURIComponent(orderId)}${email ? '&email=' + encodeURIComponent(email) : ''}`),
}

// Favorites
export const favorites = {
  list: () =>
    request<any[]>('/favorites'),

  add: (product_id: string) =>
    request<any>('/favorites', { method: 'POST', body: JSON.stringify({ product_id }) }),

  remove: (productId: string) =>
    request<{ message: string }>(`/favorites/${productId}`, { method: 'DELETE' }),
}

// Admin
export const admin = {
  getUsers: () => request<any[]>('/admin/users'),
  updateUserRole: (id: string, role: string) =>
    request<any>(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  deleteUser: (id: string) =>
    request<{ message: string }>(`/admin/users/${id}`, { method: 'DELETE' }),
  createUser: (data: { email: string; password: string; name?: string; role?: string }) =>
    request<any>('/admin/create-user', { method: 'POST', body: JSON.stringify(data) }),
  getOrders: (status?: string) =>
    request<any[]>(`/admin/orders${status ? '?status=' + status : ''}`),
  updateOrderStatus: (id: string, status: string) =>
    request<any>(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteOrder: (id: string) =>
    request<{ message: string }>(`/admin/orders/${id}`, { method: 'DELETE' }),
  bulkDeleteOrders: (ids: string[]) =>
    request<{ message: string }>('/admin/orders/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
  bulkUpdateOrderStatus: (ids: string[], status: string) =>
    request<{ message: string }>('/admin/orders/bulk-status', { method: 'PUT', body: JSON.stringify({ ids, status }) }),
  createManualOrder: (data: { shipping_name?: string; shipping_address?: string; status?: string; payment_method?: string; items: any[] }) =>
    request<any>('/admin/orders/manual', { method: 'POST', body: JSON.stringify(data) }),
  getStats: () => request<{ totalProducts: number; totalUsers: number; totalOrders: number; totalRevenue: number }>('/admin/stats'),
  getPromoCodes: () => request<any[]>('/admin/promo-codes'),
  createPromoCode: (data: any) =>
    request<any>('/admin/promo-codes', { method: 'POST', body: JSON.stringify(data) }),
  getHomepageSections: () => request<any[]>('/admin/homepage'),
  createHomepageSection: (data: any) =>
    request<any>('/admin/homepage/sections', { method: 'POST', body: JSON.stringify(data) }),
  updateHomepageSection: (id: string, data: any) =>
    request<any>(`/admin/homepage/sections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  reorderHomepageSections: (sections: { id: string; order_index: number; visible: boolean }[]) =>
    request<any>('/admin/homepage/sections/reorder', { method: 'PUT', body: JSON.stringify({ sections }) }),
  deleteHomepageSection: (id: string) =>
    request<any>(`/admin/homepage/sections/${id}`, { method: 'DELETE' }),
  getAbout: () => request<any>('/admin/about'),
  updateAbout: (data: any) =>
    request<any>('/admin/about', { method: 'PUT', body: JSON.stringify(data) }),
  getCategories: () => request<any[]>('/admin/categories'),
  createCategory: (data: any) =>
    request<any>('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: any) =>
    request<any>(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) =>
    request<any>(`/admin/categories/${id}`, { method: 'DELETE' }),
  getFinancialSettings: () => request<any>('/admin/financial-settings'),
  updateFinancialSettings: (data: any) =>
    request<any>('/admin/financial-settings', { method: 'PUT', body: JSON.stringify(data) }),
  getExpenses: () => request<{ expenses: any[]; summary: any }>('/admin/expenses'),
  createExpense: (data: any) =>
    request<any>('/admin/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id: string, data: any) =>
    request<any>(`/admin/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id: string) =>
    request<{ message: string }>(`/admin/expenses/${id}`, { method: 'DELETE' }),
  getStoreSettings: () => request<StoreSettings>('/admin/store-settings'),
  updateStoreSettings: (data: any) =>
    request<any>('/admin/store-settings', { method: 'PUT', body: JSON.stringify(data) }),
  saveStoreSettings: (data: any) =>
    request<any>('/admin/store-settings', { method: 'PUT', body: JSON.stringify(data) }),
}

// Homepage (public)
export const homepage = {
  get: () => request<any[]>('/homepage'),
  getAbout: () => request<any>('/homepage/about'),
  getSettings: () => request<StoreSettings>('/homepage/settings'),
}

// Categories (public)
export const categories = {
  list: () => request<any[]>('/categories'),
}

// Upload (Admin)
export const upload = {
  single: async (file: File): Promise<{ url: string }> => {
    const token = getAuthToken()
    const formData = new FormData()
    formData.append('image', file)
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al subir imagen' }))
      throw new Error(err.error || 'Error al subir imagen')
    }
    return res.json()
  },
  multiple: async (files: File[]): Promise<{ urls: string[] }> => {
    const token = getAuthToken()
    const formData = new FormData()
    files.forEach((f) => formData.append('images', f))
    const res = await fetch('/api/upload/multiple', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error al subir imágenes' }))
      throw new Error(err.error || 'Error al subir imágenes')
    }
    return res.json()
  },
}
