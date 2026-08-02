const API_BASE = '/api'

let authToken: string | null = null

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
    const err = await res.json().catch(() => ({ error: 'Error de conexión' }))
    throw new Error(err.error || `Error ${res.status}`)
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
}

// Cart
export const cart = {
  list: () =>
    request<any[]>('/cart'),

  add: (data: { product_id: string; quantity: number; selected_size: string; item_price: number; weight_grams?: number }) =>
    request<any>('/cart', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, quantity: number) =>
    request<any>(`/cart/${id}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),

  remove: (id: string) =>
    request<{ message: string }>(`/cart/${id}`, { method: 'DELETE' }),
}

// Payments
export const payments = {
  createPreference: (data: { shipping_name: string; shipping_address?: string; shipping_city?: string; promo_code?: string }) =>
    request<{ init_point: string; preference_id: string }>('/payments/create-preference', { method: 'POST', body: JSON.stringify(data) }),
}

// Orders
export const orders = {
  list: () =>
    request<any[]>('/orders'),

  create: (data: { shipping_name: string; shipping_address?: string; shipping_city?: string; promo_code?: string }) =>
    request<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: string) =>
    request<any>(`/orders/${id}`),

  confirm: (payment_id: string, preference_id: string) =>
    request<any>('/orders/confirm', { method: 'POST', body: JSON.stringify({ payment_id, preference_id }) }),
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
  createUser: (data: { email: string; password: string; name?: string; role?: string }) =>
    request<any>('/admin/create-user', { method: 'POST', body: JSON.stringify(data) }),
  getOrders: (status?: string) =>
    request<any[]>(`/admin/orders${status ? '?status=' + status : ''}`),
  updateOrderStatus: (id: string, status: string) =>
    request<any>(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteOrder: (id: string) =>
    request<{ message: string }>(`/admin/orders/${id}`, { method: 'DELETE' }),
  getStats: () => request<{ totalProducts: number; totalUsers: number; totalOrders: number; totalRevenue: number }>('/admin/stats'),
  getPromoCodes: () => request<any[]>('/admin/promo-codes'),
  createPromoCode: (data: any) =>
    request<any>('/admin/promo-codes', { method: 'POST', body: JSON.stringify(data) }),
  getHomepageSections: () => request<any[]>('/admin/homepage'),
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
}

// Homepage (public)
export const homepage = {
  get: () => request<any[]>('/homepage'),
  getAbout: () => request<any>('/homepage/about'),
}

// Categories (public)
export const categories = {
  list: () => request<any[]>('/categories'),
}
