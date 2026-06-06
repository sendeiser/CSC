import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Package, ShoppingCart, Users, Ticket, Plus, Edit3, Trash2, X, Check, AlertCircle, RefreshCw, Star } from 'lucide-react';
import { AdminSection, Product } from '../types';
import { admin as adminApi, products as productsApi, setAuthToken, getAuthToken } from '../lib/api';

interface AdminPanelProps {
  setActiveScreen: (screen: any) => void;
  setSession: React.Dispatch<React.SetStateAction<any>>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ setActiveScreen, setSession }) => {
  const [section, setSection] = useState<AdminSection>('dashboard');
  const [stats, setStats] = useState({ totalProducts: 0, totalUsers: 0, totalOrders: 0, totalRevenue: 0 });
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [newPromo, setNewPromo] = useState({ code: '', percent: 10, max_uses: 100 });
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', role: 'customer' });
  const [createUserError, setCreateUserError] = useState('');

  useEffect(() => {
    loadSection(section)
  }, [section])

  const loadSection = async (s: AdminSection) => {
    setLoading(true)
    try {
      switch (s) {
        case 'dashboard':
          setStats(await adminApi.getStats())
          break
        case 'products':
          setProducts(await productsApi.list())
          break
        case 'orders':
          setOrders(await adminApi.getOrders())
          break
        case 'users':
          setUsers(await adminApi.getUsers())
          break
        case 'promos':
          setPromos(await adminApi.getPromoCodes())
          break
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await adminApi.getUsers().catch(() => {})
    setAuthToken(null)
    setSession({ isLoggedIn: false, email: null, name: null, role: undefined })
    setActiveScreen('inicio')
  }

  const saveProduct = async () => {
    if (!editingProduct) return
    try {
      if (editingProduct.id) {
        await productsApi.update(editingProduct.id, editingProduct)
      } else {
        await adminApi.createPromoCode(editingProduct)
      }
      setShowProductForm(false)
      setEditingProduct(null)
      loadSection('products')
    } catch (err) {
      console.error(err)
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      await productsApi.delete(id)
      loadSection('products')
    } catch (err) {
      console.error(err)
    }
  }

  const createPromo = async () => {
    try {
      await adminApi.createPromoCode(newPromo)
      setNewPromo({ code: '', percent: 10, max_uses: 100 })
      loadSection('promos')
    } catch (err) {
      console.error(err)
    }
  }

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      await adminApi.updateOrderStatus(id, status)
      loadSection('orders')
    } catch (err) {
      console.error(err)
    }
  }

  const updateUserRole = async (id: string, role: string) => {
    try {
      await adminApi.updateUserRole(id, role)
      loadSection('users')
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateUser = async () => {
    setCreateUserError('')
    try {
      await adminApi.createUser({ ...newUser, role: 'admin' })
      setShowCreateUser(false)
      setNewUser({ email: '', password: '', name: '', role: 'customer' })
      loadSection('users')
    } catch (err: any) {
      setCreateUserError(err.message)
    }
  }

  const navItems: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'products', label: 'Productos', icon: <Package className="w-4 h-4" /> },
    { id: 'orders', label: 'Pedidos', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'users', label: 'Usuarios', icon: <Users className="w-4 h-4" /> },
    { id: 'promos', label: 'Cupones', icon: <Ticket className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">C</div>
            <span className="font-headline font-bold">CSC Admin</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                section === item.id ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button onClick={handleLogout} className="w-full text-xs text-slate-400 hover:text-white transition-colors text-left">Cerrar Sesión</button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between md:hidden">
          <h2 className="font-headline font-bold text-lg">Admin</h2>
          <div className="flex space-x-2">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setSection(item.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${section === item.id ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-16"><RefreshCw className="w-8 h-8 text-purple-600 animate-spin" /></div>
          ) : (
            <>
              {section === 'dashboard' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-headline font-bold text-slate-900">Dashboard</h1>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Productos', value: stats.totalProducts, color: 'bg-blue-500', icon: <Package className="w-6 h-6" /> },
                      { label: 'Usuarios', value: stats.totalUsers, color: 'bg-emerald-500', icon: <Users className="w-6 h-6" /> },
                      { label: 'Pedidos', value: stats.totalOrders, color: 'bg-purple-500', icon: <ShoppingCart className="w-6 h-6" /> },
                      { label: 'Ingresos', value: `$${stats.totalRevenue.toFixed(2)}`, color: 'bg-pink-500', icon: <Star className="w-6 h-6" /> },
                    ].map(stat => (
                      <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center space-x-4">
                        <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-white`}>{stat.icon}</div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                          <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {section === 'products' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-headline font-bold text-slate-900">Productos ({products.length})</h1>
                    <button onClick={() => { setEditingProduct({}); setShowProductForm(true) }} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700">
                      <Plus className="w-4 h-4" /><span>Nuevo</span>
                    </button>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr>
                          <th className="text-left px-4 py-3">Producto</th>
                          <th className="text-left px-4 py-3">Categoría</th>
                          <th className="text-left px-4 py-3">Precio</th>
                          <th className="text-left px-4 py-3">Ventas</th>
                          <th className="text-right px-4 py-3">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {products.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                                <span className="font-medium text-slate-900">{p.name}</span>
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-headline font-bold text-lg">Crear Admin</h3>
              <button onClick={() => setShowCreateUser(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input type="password" placeholder="Contraseña" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input type="text" placeholder="Nombre (opcional)" value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              {createUserError && <p className="text-xs text-red-600 flex items-center space-x-1"><AlertCircle className="w-3 h-3" /><span>{createUserError}</span></p>}
              <button onClick={handleCreateUser} className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 text-sm">
                Crear Usuario Admin
              </button>
            </div>
          </motion.div>
        </div>
      )}
                            </td>
                            <td className="px-4 py-3 text-slate-500">{p.category}</td>
                            <td className="px-4 py-3 font-medium">${p.base_price.toFixed(2)}</td>
                            <td className="px-4 py-3 text-slate-500">{p.reviews}</td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => { setEditingProduct(p); setShowProductForm(true) }} className="p-1.5 text-slate-400 hover:text-purple-600"><Edit3 className="w-4 h-4" /></button>
                              <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {section === 'orders' && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-headline font-bold text-slate-900">Pedidos ({orders.length})</h1>
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr><th className="text-left px-4 py-3">ID</th><th className="text-left px-4 py-3">Cliente</th><th className="text-left px-4 py-3">Total</th><th className="text-left px-4 py-3">Estado</th><th className="text-left px-4 py-3">Fecha</th><th className="text-right px-4 py-3">Acción</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders.map((o: any) => (
                          <tr key={o.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">#{o.id.slice(0, 8)}</td>
                            <td className="px-4 py-3 font-medium text-slate-900">{o.profiles?.name || '—'}</td>
                            <td className="px-4 py-3 font-medium">${Number(o.total).toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                o.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                o.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                o.status === 'delivered' ? 'bg-purple-100 text-purple-700' :
                                o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>{o.status}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-right">
                              <select
                                value={o.status}
                                onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                              >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {section === 'users' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-headline font-bold text-slate-900">Usuarios ({users.length})</h1>
                    <button onClick={() => { setNewUser({ email: '', password: '', name: '', role: 'admin' }); setShowCreateUser(true) }} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700">
                      <Plus className="w-4 h-4" /><span>Crear Admin</span>
                    </button>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr><th className="text-left px-4 py-3">Nombre</th><th className="text-left px-4 py-3">Rol</th><th className="text-left px-4 py-3">Creado</th><th className="text-right px-4 py-3">Cambiar Rol</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.map((u: any) => (
                          <tr key={u.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-900">{u.name || '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>{u.role}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-right">
                              <select
                                value={u.role}
                                onChange={(e) => updateUserRole(u.id, e.target.value)}
                                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                              >
                                <option value="customer">customer</option>
                                <option value="admin">admin</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {section === 'promos' && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-headline font-bold text-slate-900">Cupones</h1>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-700">Nuevo Cupón</h3>
                    <div className="flex space-x-3">
                      <input type="text" placeholder="Código" value={newPromo.code} onChange={e => setNewPromo(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                      <input type="number" placeholder="%" value={newPromo.percent} onChange={e => setNewPromo(p => ({ ...p, percent: Number(e.target.value) }))} className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                      <input type="number" placeholder="Usos" value={newPromo.max_uses} onChange={e => setNewPromo(p => ({ ...p, max_uses: Number(e.target.value) }))} className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                      <button onClick={createPromo} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr><th className="text-left px-4 py-3">Código</th><th className="text-left px-4 py-3">%</th><th className="text-left px-4 py-3">Usos</th><th className="text-left px-4 py-3">Activo</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {promos.map((p: any) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.code}</td>
                            <td className="px-4 py-3">{p.percent}%</td>
                            <td className="px-4 py-3 text-slate-500">{p.used_count}/{p.max_uses || '∞'}</td>
                            <td className="px-4 py-3">{p.active ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-500" />}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-headline font-bold text-lg">{editingProduct?.id ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button onClick={() => setShowProductForm(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Slug" value={editingProduct?.slug || ''} onChange={e => setEditingProduct(p => ({ ...p, slug: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input type="text" placeholder="Nombre" value={editingProduct?.name || ''} onChange={e => setEditingProduct(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <textarea placeholder="Descripción" value={editingProduct?.description || ''} onChange={e => setEditingProduct(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm h-24" />
              <select value={editingProduct?.category || 'Gomitas'} onChange={e => setEditingProduct(p => ({ ...p, category: e.target.value as any }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                {['Gomitas', 'Chocolates', 'Acidulados', 'Caramelos', 'Regalos'].map(c => <option key={c}>{c}</option>)}
              </select>
              <input type="number" step="0.01" placeholder="Precio Base" value={editingProduct?.base_price || ''} onChange={e => setEditingProduct(p => ({ ...p, base_price: Number(e.target.value) }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input type="text" placeholder="URL de imagen" value={editingProduct?.image_url || ''} onChange={e => setEditingProduct(p => ({ ...p, image_url: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <button onClick={saveProduct} className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 text-sm">
                {editingProduct?.id ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
