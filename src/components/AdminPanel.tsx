import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Package, ShoppingCart, Users, Ticket, Plus, Edit3, Trash2, X, Check, Save, AlertCircle, RefreshCw, Star, Layout, FileText, Menu, Search, Eye, MessageCircle, BarChart2, TrendingUp, PieChart, Filter, ArrowUpDown } from 'lucide-react';
import { AdminSection, Product } from '../types';
import { admin as adminApi, products as productsApi, categories as categoriesApi, setAuthToken, getAuthToken } from '../lib/api';
import AdminHomepageEditor from './AdminHomepageEditor';
import AdminAboutPageEditor from './AdminAboutPageEditor';
import { AdminOrdersSection } from './AdminOrdersSection';
import { getCategoryIcon } from '../lib/categoryIcons';
import { useModal } from '../context/ModalContext';
import { WHATSAPP_NUMERO } from '../lib/whatsapp';

interface AdminPanelProps {
  setActiveScreen: (screen: any) => void;
  setSession: React.Dispatch<React.SetStateAction<any>>;
}

function AdminCategoriesScreen() {
  const { showConfirm } = useModal()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Record<string, any>>({})
  const [newCategory, setNewCategory] = useState<any>(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.getCategories()
      setCategories(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e.message || 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const startAdd = () => {
    setNewCategory({ name: '', slug: '', icon: 'Package', color: 'from-purple-400 to-violet-400', bg_color: 'bg-purple-50', text_color: 'text-purple-700', order_index: categories.length + 1 })
  }

  const saveNew = async () => {
    if (!newCategory.name.trim() || !newCategory.slug.trim()) return
    try {
      await adminApi.createCategory(newCategory)
      setNewCategory(null)
      await load()
    } catch (e: any) {
      setError(e.message || 'Error al crear')
    }
  }

  const saveEdit = async (id: string) => {
    try {
      await adminApi.updateCategory(id, editing[id])
      setEditing(prev => { const n = { ...prev }; delete n[id]; return n })
      await load()
    } catch (e: any) {
      setError(e.message || 'Error al guardar')
    }
  }

  const remove = async (id: string) => {
    const confirmed = await showConfirm({
      title: '¿Eliminar categoría?',
      message: 'Los productos existentes conservarán su categoría.',
      confirmText: 'Eliminar',
      type: 'danger',
    })
    if (!confirmed) return
    try {
      await adminApi.deleteCategory(id)
      await load()
    } catch (e: any) {
      setError(e.message || 'Error al eliminar')
    }
  }

  const startEdit = (cat: any) => {
    setEditing(prev => ({ ...prev, [cat.id]: { ...cat } }))
  }

  if (loading) return <div className="animate-pulse space-y-3">{Array.from({length: 5}).map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl" />)}</div>

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="font-headline font-bold text-xl text-slate-800">Categorías de Productos</h2>
        <button onClick={startAdd} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 w-full sm:w-auto"><Plus className="w-4 h-4" />Agregar categoría</button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={load} className="ml-auto text-xs font-medium underline hover:no-underline">Reintentar</button>
        </div>
      )}

      {newCategory && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-purple-800">Nueva categoría</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <input type="text" value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="Nombre" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input type="text" value={newCategory.slug} onChange={e => setNewCategory({ ...newCategory, slug: e.target.value })} placeholder="Slug" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input type="text" value={newCategory.icon} onChange={e => setNewCategory({ ...newCategory, icon: e.target.value })} placeholder="Icono (ej: Package)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input type="text" value={newCategory.color} onChange={e => setNewCategory({ ...newCategory, color: e.target.value })} placeholder="Color (ej: from-pink-400...)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input type="text" value={newCategory.bg_color} onChange={e => setNewCategory({ ...newCategory, bg_color: e.target.value })} placeholder="Bg color" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input type="text" value={newCategory.text_color} onChange={e => setNewCategory({ ...newCategory, text_color: e.target.value })} placeholder="Text color" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input type="number" value={newCategory.order_index} onChange={e => setNewCategory({ ...newCategory, order_index: Number(e.target.value) })} placeholder="Orden" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setNewCategory(null)} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800">Cancelar</button>
            <button onClick={saveNew} className="px-4 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700">Guardar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Orden</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Icono</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">Colores</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => {
                const isEditing = editing[cat.id]
                const Icon = getCategoryIcon(isEditing?.icon || cat.icon)
                return (
                  <tr key={cat.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isEditing ? (
                        <input type="number" value={isEditing.order_index} onChange={e => setEditing({ ...editing, [cat.id]: { ...isEditing, order_index: Number(e.target.value) } })} className="w-16 px-2 py-1 border border-slate-200 rounded text-sm" />
                      ) : (
                        <span className="text-slate-600">{cat.order_index}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input type="text" value={isEditing.name} onChange={e => setEditing({ ...editing, [cat.id]: { ...isEditing, name: e.target.value } })} className="w-full px-2 py-1 border border-slate-200 rounded text-sm" />
                      ) : (
                        <span className="font-medium text-slate-800">{cat.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {isEditing ? (
                        <input type="text" value={isEditing.slug} onChange={e => setEditing({ ...editing, [cat.id]: { ...isEditing, slug: e.target.value } })} className="w-full px-2 py-1 border border-slate-200 rounded text-sm" />
                      ) : (
                        <code className="text-xs text-slate-500">{cat.slug}</code>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {isEditing ? (
                        <input type="text" value={isEditing.icon} onChange={e => setEditing({ ...editing, [cat.id]: { ...isEditing, icon: e.target.value } })} className="w-full px-2 py-1 border border-slate-200 rounded text-sm" />
                      ) : (
                        <span className="inline-flex items-center gap-1"><Icon className="w-4 h-4 text-slate-500" /><span className="text-xs text-slate-400">{cat.icon}</span></span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {isEditing ? (
                        <div className="space-y-1 min-w-[140px]">
                          <input type="text" value={isEditing.color} onChange={e => setEditing({ ...editing, [cat.id]: { ...isEditing, color: e.target.value } })} className="w-full px-2 py-1 border border-slate-200 rounded text-sm" placeholder="color" />
                          <input type="text" value={isEditing.bg_color} onChange={e => setEditing({ ...editing, [cat.id]: { ...isEditing, bg_color: e.target.value } })} className="w-full px-2 py-1 border border-slate-200 rounded text-sm" placeholder="bg" />
                          <input type="text" value={isEditing.text_color} onChange={e => setEditing({ ...editing, [cat.id]: { ...isEditing, text_color: e.target.value } })} className="w-full px-2 py-1 border border-slate-200 rounded text-sm" placeholder="text" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cat.bg_color} ${cat.text_color}`}>Preview</span>
                          <span className={`w-4 h-4 rounded bg-gradient-to-br ${cat.color}`} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <button onClick={() => saveEdit(cat.id)} className="px-2 py-1 text-xs text-purple-600 font-medium hover:bg-purple-50 rounded"><Save className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditing(prev => { const n = { ...prev }; delete n[cat.id]; return n })} className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded">Cancelar</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(cat)} className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded">Editar</button>
                            <button onClick={() => remove(cat.id)} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded">Eliminar</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ setActiveScreen, setSession }) => {
  const { showConfirm, showAlert } = useModal();
  const [section, setSection] = useState<AdminSection>('dashboard');
  const [stats, setStats] = useState<{
    totalProducts: number;
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
    todaySales?: number;
    weeklySales?: number;
    monthlySales?: number;
    totalInventoryCost?: number;
    totalInventoryValue?: number;
    netProfit?: number;
    profitMargin?: number;
    salesByDay?: any[];
    topProducts?: any[];
    salesByCategory?: any[];
    statusCounts?: Record<string, number>;
    recentOrders?: any[];
  }>({
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    todaySales: 0,
    weeklySales: 0,
    monthlySales: 0,
    totalInventoryCost: 0,
    totalInventoryValue: 0,
    netProfit: 0,
    profitMargin: 0,
    salesByDay: [],
    topProducts: [],
    salesByCategory: [],
    statusCounts: {},
    recentOrders: [],
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Products Search & Filter State
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStockFilter, setProductStockFilter] = useState('all');
  const [productSortBy, setProductSortBy] = useState('default');
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [newPromo, setNewPromo] = useState({ code: '', percent: 10, max_uses: 100 });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const handleSelectAllProducts = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProductIds(products.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteProducts = async () => {
    if (!selectedProductIds.length) return;
    const confirmed = await showConfirm({
      title: '¿Eliminar productos seleccionados?',
      message: `Se eliminarán ${selectedProductIds.length} productos del catálogo permanentemente.`,
      confirmText: `Eliminar (${selectedProductIds.length})`,
      type: 'danger',
    });
    if (!confirmed) return;
    try {
      await productsApi.bulkDelete(selectedProductIds);
      setSelectedProductIds([]);
      await loadSection('products');
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message || 'Error al eliminar productos', type: 'error' });
    }
  };
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '', role: 'customer' });
  const [createUserError, setCreateUserError] = useState('');
  const [productCategories, setProductCategories] = useState<any[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    loadSection(section)
  }, [section])

  useEffect(() => {
    adminApi.getCategories().then(setProductCategories).catch(() => {})
  }, [])

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
    const confirmed = await showConfirm({
      title: '¿Eliminar producto?',
      message: 'Esta acción eliminará el producto del catálogo.',
      confirmText: 'Eliminar',
      type: 'danger',
    })
    if (!confirmed) return
    try {
      await productsApi.delete(id)
      await loadSection('products')
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message || 'Error al eliminar el producto', type: 'error' })
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
    { id: 'analytics', label: 'Gráficos & Analytics', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'products', label: 'Productos', icon: <Package className="w-4 h-4" /> },
    { id: 'orders', label: 'Pedidos', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'users', label: 'Usuarios & CRM', icon: <Users className="w-4 h-4" /> },
    { id: 'promos', label: 'Cupones', icon: <Ticket className="w-4 h-4" /> },
    { id: 'homepage', label: 'Homepage', icon: <Layout className="w-4 h-4" /> },
    { id: 'about-page', label: 'Sobre Nosotros', icon: <FileText className="w-4 h-4" /> },
    { id: 'categories', label: 'Categorías', icon: <Layout className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 z-50 h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:w-20 lg:w-64`}>
        <div className="flex-shrink-0 p-5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">C</div>
            <span className="font-headline font-bold inline md:hidden lg:block">CSC Admin</span>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setSection(item.id); setMobileSidebarOpen(false) }}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                section === item.id ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="inline md:hidden lg:inline">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="flex-shrink-0 p-4 border-t border-slate-700">
          <button onClick={handleLogout} className="w-full text-xs text-slate-400 hover:text-white transition-colors text-left truncate">Cerrar Sesión</button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 max-h-screen">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between md:px-6">
          <div className="flex items-center space-x-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="md:hidden text-slate-600 hover:text-slate-900">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="font-headline font-bold text-lg truncate">
              {navItems.find(i => i.id === section)?.label || 'Admin'}
            </h2>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-16"><RefreshCw className="w-8 h-8 text-purple-600 animate-spin" /></div>
          ) : (
            <>
              {section === 'dashboard' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-headline font-bold text-slate-900">Dashboard General & Financiero</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Rendimientos, ventas periódicas, inversión en productos y estado de pedidos</p>
                  </div>

                  {/* Main Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Productos Activos', value: stats.totalProducts, color: 'bg-blue-500', icon: <Package className="w-6 h-6" /> },
                      { label: 'Clientes Registrados', value: stats.totalUsers, color: 'bg-emerald-500', icon: <Users className="w-6 h-6" /> },
                      { label: 'Pedidos Totales', value: stats.totalOrders, color: 'bg-purple-500', icon: <ShoppingCart className="w-6 h-6" /> },
                      { label: 'Ingresos Pagados', value: `$${stats.totalRevenue.toFixed(2)}`, color: 'bg-pink-500', icon: <Star className="w-6 h-6" />, note: 'Solo pedidos pagados' },
                    ].map(stat => (
                      <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center space-x-4 shadow-sm">
                        <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0`}>{stat.icon}</div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                          <p className="text-2xl font-black text-slate-900 mt-0.5">{stat.value}</p>
                          {stat.note && <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">{stat.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Periodic Sales Cards (Daily, Weekly, Monthly) */}
                  <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl p-5 shadow-lg space-y-3">
                    <div className="flex items-center justify-between border-b border-purple-800 pb-3">
                      <div>
                        <h3 className="font-headline font-bold text-base text-purple-100">Ventas Periódicas Confirmadas</h3>
                        <p className="text-xs text-purple-300">Ingresos contabilizados únicamente de pedidos pagados/entregados</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                        Pago Verificado
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                        <span className="text-xs text-purple-200 font-semibold block">Ventas de Hoy</span>
                        <span className="text-2xl font-black text-white mt-1 block">${(stats.todaySales || 0).toFixed(2)}</span>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                        <span className="text-xs text-purple-200 font-semibold block">Ventas esta Semana (7 días)</span>
                        <span className="text-2xl font-black text-white mt-1 block">${(stats.weeklySales || 0).toFixed(2)}</span>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                        <span className="text-xs text-purple-200 font-semibold block">Ventas este Mes (30 días)</span>
                        <span className="text-2xl font-black text-white mt-1 block">${(stats.monthlySales || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Analytics: Inventory Investment & Profit Margins */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm">
                      <h3 className="font-headline font-bold text-sm text-slate-800 uppercase tracking-wider">
                        Inversión & Valuación de Productos
                      </h3>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <span className="text-xs text-slate-500 font-semibold block">Inversión Total en Stock</span>
                          <span className="text-xl font-black text-slate-900 mt-1 block">${(stats.totalInventoryCost || 0).toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400">Costo total de inventario</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <span className="text-xs text-slate-500 font-semibold block">Valor Comercial Stock</span>
                          <span className="text-xl font-black text-purple-700 mt-1 block">${(stats.totalInventoryValue || 0).toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400">Precio de venta potencial</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm">
                      <h3 className="font-headline font-bold text-sm text-slate-800 uppercase tracking-wider">
                        Rendimientos & Ganancia Neta
                      </h3>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                          <span className="text-xs text-emerald-800 font-semibold block">Ganancia Neta Estimada</span>
                          <span className="text-xl font-black text-emerald-900 mt-1 block">${(stats.netProfit || 0).toFixed(2)}</span>
                          <span className="text-[10px] text-emerald-700">Ingresos pagados - Costos</span>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                          <span className="text-xs text-blue-800 font-semibold block">Margen de Rendimiento</span>
                          <span className="text-xl font-black text-blue-900 mt-1 block">{(stats.profitMargin || 0).toFixed(1)}%</span>
                          <span className="text-[10px] text-blue-700">Margen neto de beneficio</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Orders Status Breakdown */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm">
                    <h3 className="font-headline font-bold text-sm text-slate-800 uppercase tracking-wider">
                      Desglose por Estado de Pedidos
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                        <span className="text-xs text-amber-700 font-medium block">Pendientes</span>
                        <span className="text-2xl font-black text-amber-900">{stats.statusCounts?.pending || 0}</span>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                        <span className="text-xs text-emerald-700 font-medium block">Pagados</span>
                        <span className="text-2xl font-black text-emerald-900">{stats.statusCounts?.paid || 0}</span>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                        <span className="text-xs text-blue-700 font-medium block">Enviados</span>
                        <span className="text-2xl font-black text-blue-900">{stats.statusCounts?.shipped || 0}</span>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
                        <span className="text-xs text-purple-700 font-medium block">Entregados</span>
                        <span className="text-2xl font-black text-purple-900">{stats.statusCounts?.delivered || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Orders Widget */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-3">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-headline font-bold text-base text-slate-900">Últimos Pedidos Recibidos</h3>
                        <p className="text-xs text-slate-400">Actividad reciente de compras en la tienda</p>
                      </div>
                      <button
                        onClick={() => setSection('orders')}
                        className="text-xs font-bold text-purple-600 hover:text-purple-800 underline"
                      >
                        Ver todos los pedidos →
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                          <tr>
                            <th className="text-left px-4 py-3">ID Pedido</th>
                            <th className="text-left px-4 py-3">Cliente</th>
                            <th className="text-left px-4 py-3">Total</th>
                            <th className="text-left px-4 py-3">Estado</th>
                            <th className="text-left px-4 py-3">Fecha</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(!stats.recentOrders || stats.recentOrders.length === 0) ? (
                            <tr>
                              <td colSpan={5} className="text-center py-6 text-slate-400 text-xs">
                                No hay pedidos recientes registrados.
                              </td>
                            </tr>
                          ) : (
                            stats.recentOrders.map((o: any) => (
                              <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs font-bold text-purple-700">
                                  #{o.id.slice(0, 8).toUpperCase()}
                                </td>
                                <td className="px-4 py-3 font-medium text-slate-900">
                                  {o.shipping_name || o.profiles?.name || 'Cliente'}
                                </td>
                                <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                                  ${Number(o.total || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    o.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                    o.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                    o.status === 'delivered' ? 'bg-purple-100 text-purple-700' :
                                    o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>{o.status}</span>
                                </td>
                                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                                  {new Date(o.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics Section */}
              {section === 'analytics' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-headline font-bold text-slate-900">Gráficos & Analytics de Rendimiento</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Métricas clave de ventas, productos más vendidos y rendimiento por categoría</p>
                  </div>

                  {/* Chart 1: Daily Sales (Last 7 Days) */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-headline font-bold text-lg text-slate-900 flex items-center space-x-2">
                          <TrendingUp className="w-5 h-5 text-purple-600" />
                          <span>Evolución de Ventas (Últimos 7 Días)</span>
                        </h3>
                        <p className="text-xs text-slate-400">Ingresos confirmados día por día</p>
                      </div>
                      <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                        Total 7d: ${(stats.weeklySales || 0).toFixed(2)}
                      </span>
                    </div>

                    {/* SVG/CSS Bar Chart */}
                    <div className="pt-4">
                      {(!stats.salesByDay || stats.salesByDay.length === 0) ? (
                        <p className="text-center py-10 text-slate-400 text-xs">Sin suficiente información de ventas recientes.</p>
                      ) : (
                        <div className="flex items-end justify-between gap-2 h-52 pt-6 pb-2 px-2 border-b border-slate-100">
                          {(() => {
                            const maxVal = Math.max(...stats.salesByDay.map((d: any) => d.total || 0), 100);
                            return stats.salesByDay.map((day: any, idx: number) => {
                              const heightPct = Math.max(Math.round((day.total / maxVal) * 100), 6);
                              return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                                  <div className="text-[11px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white px-2 py-0.5 rounded shadow">
                                    ${day.total.toFixed(0)}
                                  </div>
                                  <div
                                    style={{ height: `${heightPct}%` }}
                                    className="w-full max-w-[48px] bg-gradient-to-t from-purple-700 to-indigo-500 rounded-t-xl group-hover:from-purple-600 group-hover:to-indigo-400 transition-all shadow-sm"
                                  />
                                  <div className="text-center">
                                    <span className="text-[11px] font-bold text-slate-700 block">{day.date}</span>
                                    <span className="text-[10px] text-slate-400 block capitalize">{day.dayName}</span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Chart 2: Top 5 Best Sellers */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="font-headline font-bold text-base text-slate-900 flex items-center space-x-2">
                          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                          <span>Productos Más Vendidos</span>
                        </h3>
                        <span className="text-xs text-slate-400">Ranking por Ingresos</span>
                      </div>

                      <div className="space-y-3">
                        {(!stats.topProducts || stats.topProducts.length === 0) ? (
                          <p className="text-center py-6 text-slate-400 text-xs">Aún no hay ventas registradas.</p>
                        ) : (
                          stats.topProducts.map((prod: any, idx: number) => {
                            const topRevenue = stats.topProducts![0]?.revenue || 1;
                            const pct = Math.round((prod.revenue / topRevenue) * 100);
                            return (
                              <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                                      #{idx + 1}
                                    </span>
                                    {prod.image_url && (
                                      <img src={prod.image_url} alt={prod.name} className="w-9 h-9 rounded-lg object-cover bg-white border border-slate-200" />
                                    )}
                                    <div>
                                      <p className="font-bold text-xs text-slate-900">{prod.name}</p>
                                      <span className="text-[10px] text-slate-400">{prod.category} • {prod.totalSold} unidades sold</span>
                                    </div>
                                  </div>
                                  <span className="font-black text-xs text-purple-700">${prod.revenue.toFixed(2)}</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                  <div className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Chart 3: Sales by Category */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="font-headline font-bold text-base text-slate-900 flex items-center space-x-2">
                          <PieChart className="w-5 h-5 text-indigo-600" />
                          <span>Distribución por Categoría</span>
                        </h3>
                        <span className="text-xs text-slate-400">Ingresos Totales</span>
                      </div>

                      <div className="space-y-3">
                        {(!stats.salesByCategory || stats.salesByCategory.length === 0) ? (
                          <p className="text-center py-6 text-slate-400 text-xs">Sin registros de ventas por categoría.</p>
                        ) : (
                          stats.salesByCategory.map((cat: any, idx: number) => {
                            const maxCatRevenue = stats.salesByCategory![0]?.revenue || 1;
                            const pct = Math.round((cat.revenue / maxCatRevenue) * 100);
                            return (
                              <div key={idx} className="space-y-1.5">
                                <div className="flex justify-between text-xs font-semibold">
                                  <span className="text-slate-700">{cat.category}</span>
                                  <span className="text-purple-700 font-bold">${cat.revenue.toFixed(2)}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div className="bg-purple-600 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {section === 'products' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h1 className="text-2xl font-headline font-bold text-slate-900">Productos ({products.length})</h1>
                      <p className="text-xs text-slate-500 mt-0.5">Gestioná y buscá los productos de tu catálogo</p>
                    </div>
                    <button onClick={() => { setEditingProduct({}); setShowProductForm(true) }} className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 w-full sm:w-auto shadow-sm">
                      <Plus className="w-4 h-4" /><span>Nuevo Producto</span>
                    </button>
                  </div>

                  {/* Products Search & Filters Bar */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar producto por nombre..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-400 outline-none"
                        />
                      </div>

                      {/* Category Filter */}
                      <div className="flex items-center space-x-2 border border-slate-200 rounded-xl px-3 py-1.5 bg-white">
                        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <select
                          value={productCategoryFilter}
                          onChange={(e) => setProductCategoryFilter(e.target.value)}
                          className="w-full text-xs font-semibold text-slate-700 outline-none bg-transparent cursor-pointer"
                        >
                          <option value="all">Todas las Categorías</option>
                          {[...new Set(products.map(p => p.category).filter(Boolean))].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      {/* Stock Filter */}
                      <div className="flex items-center space-x-2 border border-slate-200 rounded-xl px-3 py-1.5 bg-white">
                        <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <select
                          value={productStockFilter}
                          onChange={(e) => setProductStockFilter(e.target.value)}
                          className="w-full text-xs font-semibold text-slate-700 outline-none bg-transparent cursor-pointer"
                        >
                          <option value="all">Todos los Stocks</option>
                          <option value="in_stock">Con Stock (&gt; 0)</option>
                          <option value="out_of_stock">Sin Stock / Agotados</option>
                        </select>
                      </div>

                      {/* Sort Filter */}
                      <div className="flex items-center space-x-2 border border-slate-200 rounded-xl px-3 py-1.5 bg-white">
                        <ArrowUpDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <select
                          value={productSortBy}
                          onChange={(e) => setProductSortBy(e.target.value)}
                          className="w-full text-xs font-semibold text-slate-700 outline-none bg-transparent cursor-pointer"
                        >
                          <option value="default">Orden por Defecto</option>
                          <option value="name_asc">Nombre: A - Z</option>
                          <option value="price_asc">Precio: Menor a Mayor</option>
                          <option value="price_desc">Precio: Mayor a Menor</option>
                          <option value="stock_desc">Stock: Mayor a Menor</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Bulk Action Bar for Products */}
                  {selectedProductIds.length > 0 && (
                    <div className="bg-purple-900 text-white p-3 rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center space-x-2 px-2">
                        <span className="w-6 h-6 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold">{selectedProductIds.length}</span>
                        <span className="text-xs font-semibold">productos seleccionados</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleBulkDeleteProducts}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl shadow transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar Seleccionados</span>
                        </button>
                        <button
                          onClick={() => setSelectedProductIds([])}
                          className="px-3 py-1.5 bg-purple-800 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-colors"
                        >
                          Desmarcar
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left w-10">
                              <input
                                type="checkbox"
                                checked={products.length > 0 && selectedProductIds.length === products.length}
                                onChange={handleSelectAllProducts}
                                className="rounded text-purple-600 focus:ring-purple-400 w-4 h-4 cursor-pointer"
                              />
                            </th>
                            <th className="text-left px-4 py-3">Producto</th>
                            <th className="text-left px-4 py-3 hidden md:table-cell">Categoría</th>
                            <th className="text-left px-4 py-3">Precio</th>
                            <th className="text-left px-4 py-3">Stock</th>
                            <th className="text-left px-4 py-3 hidden md:table-cell">Ventas</th>
                            <th className="text-right px-4 py-3">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {products
                            .filter((p) => {
                              const matchesSearch =
                                (p.name || '').toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                                (p.category || '').toLowerCase().includes(productSearchTerm.toLowerCase());
                              const matchesCategory =
                                productCategoryFilter === 'all' || p.category === productCategoryFilter;
                              const matchesStock =
                                productStockFilter === 'all'
                                  ? true
                                  : productStockFilter === 'in_stock'
                                  ? p.stock > 0
                                  : p.stock <= 0;
                              return matchesSearch && matchesCategory && matchesStock;
                            })
                            .sort((a, b) => {
                              if (productSortBy === 'price_asc') return a.base_price - b.base_price;
                              if (productSortBy === 'price_desc') return b.base_price - a.base_price;
                              if (productSortBy === 'stock_desc') return b.stock - a.stock;
                              if (productSortBy === 'name_asc') return a.name.localeCompare(b.name);
                              return 0;
                            })
                            .map((p) => {
                            const isSelected = selectedProductIds.includes(p.id);
                            return (
                              <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-purple-50/40' : ''}`}>
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelectProduct(p.id)}
                                    className="rounded text-purple-600 focus:ring-purple-400 w-4 h-4 cursor-pointer"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center space-x-3">
                                    <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100 flex-shrink-0 hidden sm:block border border-slate-200" />
                                    <span className="font-medium text-slate-900 truncate max-w-[120px] sm:max-w-none">{p.name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{p.category}</td>
                                <td className="px-4 py-3 font-medium whitespace-nowrap">${p.base_price.toFixed(2)}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${p.stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                    {p.stock}{p.unit_type === 'weight' ? 'g' : ' uds'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{p.reviews}</td>
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                  <button onClick={() => { setEditingProduct(p); setShowProductForm(true) }} className="p-1.5 text-slate-400 hover:text-purple-600"><Edit3 className="w-4 h-4" /></button>
                                  <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {section === 'orders' && (
                <AdminOrdersSection
                  orders={orders}
                  products={products}
                  onUpdateStatus={updateOrderStatus}
                  onRefreshOrders={() => loadSection('orders')}
                  onDeleteOrder={async (id: string) => {
                    const confirmed = await showConfirm({
                      title: '¿Eliminar pedido?',
                      message: 'Esta acción eliminará el pedido permanentemente.',
                      confirmText: 'Eliminar',
                      type: 'danger',
                    })
                    if (!confirmed) return
                    try {
                      await adminApi.deleteOrder(id)
                      await loadSection('orders')
                    } catch (e: any) {
                      showAlert({ title: 'Error', message: e.message || 'Error al eliminar pedido', type: 'error' })
                    }
                  }}
                />
              )}

              {section === 'users' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h1 className="text-2xl font-headline font-bold text-slate-900">CRM & Gestión de Clientes</h1>
                      <p className="text-xs text-slate-500 mt-0.5">{users.length} usuarios y clientes registrados</p>
                    </div>
                    <button onClick={() => { setNewUser({ email: '', password: '', name: '', role: 'admin' }); setShowCreateUser(true) }} className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 w-full sm:w-auto shadow-sm">
                      <Plus className="w-4 h-4" /><span>Crear Admin</span>
                    </button>
                  </div>

                  {/* CRM Search Bar */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar cliente por nombre o rol..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
                          <tr>
                            <th className="text-left px-4 py-3">Cliente</th>
                            <th className="text-left px-4 py-3">Rol</th>
                            <th className="text-left px-4 py-3">Pedidos</th>
                            <th className="text-left px-4 py-3">Total Gastado</th>
                            <th className="text-left px-4 py-3 hidden md:table-cell">Registro</th>
                            <th className="text-right px-4 py-3">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {users
                            .filter(u =>
                              (u.name || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                              (u.role || '').toLowerCase().includes(userSearchTerm.toLowerCase())
                            )
                            .map((u: any) => {
                              const ordersCount = u.ordersCount || 0;
                              const totalSpent = u.totalSpent || 0;
                              return (
                                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                        {(u.name || 'U').slice(0, 2).toUpperCase()}
                                      </div>
                                      <div>
                                        <div className="font-bold text-slate-900 truncate max-w-[160px] sm:max-w-none">{u.name || 'Cliente sin nombre'}</div>
                                        <div className="text-[11px] font-mono text-slate-400">ID: {u.id.slice(0, 8)}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-600'}`}>{u.role}</span>
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-slate-700">
                                    <span className="bg-slate-100 px-2.5 py-1 rounded-full text-xs">
                                      {ordersCount} {ordersCount === 1 ? 'pedido' : 'pedidos'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 font-black text-slate-900 whitespace-nowrap">
                                    ${totalSpent.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell whitespace-nowrap">
                                    {new Date(u.created_at).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end space-x-2">
                                      <button
                                        onClick={() => setSelectedCustomer(u)}
                                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold transition-colors border border-purple-200"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>Ficha CRM</span>
                                      </button>
                                      <select
                                        value={u.role}
                                        onChange={(e) => updateUserRole(u.id, e.target.value)}
                                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white font-medium outline-none focus:ring-1 focus:ring-purple-400"
                                      >
                                        <option value="customer">customer</option>
                                        <option value="admin">admin</option>
                                      </select>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer CRM Detail Modal */}
              {selectedCustomer && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-purple-600 text-white font-black text-lg flex items-center justify-center shadow">
                          {(selectedCustomer.name || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-headline font-bold text-xl text-slate-900">{selectedCustomer.name || 'Cliente sin nombre'}</h3>
                          <p className="text-xs text-slate-400">Registrado el {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button onClick={() => setSelectedCustomer(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Customer CRM Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl">
                        <span className="text-xs text-purple-700 font-medium block">Pedidos Comprados</span>
                        <span className="text-xl font-black text-purple-900">{selectedCustomer.ordersCount || 0}</span>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                        <span className="text-xs text-emerald-700 font-medium block">Total Invertido</span>
                        <span className="text-xl font-black text-emerald-900">${(selectedCustomer.totalSpent || 0).toFixed(2)}</span>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl col-span-2 sm:col-span-1">
                        <span className="text-xs text-blue-700 font-medium block">Rol Actual</span>
                        <span className="text-xl font-black text-blue-900 capitalize">{selectedCustomer.role}</span>
                      </div>
                    </div>

                    {/* Contact Action */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-xs uppercase text-slate-700">Atención al Cliente</h4>
                        <p className="text-xs text-slate-500">Contactar al cliente directamente por WhatsApp</p>
                      </div>
                      <a
                        href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(`Hola ${selectedCustomer.name || ''}, te contactamos desde Chamical Candy Shop!`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Contactar por WhatsApp</span>
                      </a>
                    </div>

                    {/* Customer Order History */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Historial de Compras ({selectedCustomer.orders?.length || 0})</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {(!selectedCustomer.orders || selectedCustomer.orders.length === 0) ? (
                          <p className="text-xs text-slate-400 py-4 text-center">Este cliente aún no realizó ningún pedido.</p>
                        ) : (
                          selectedCustomer.orders.map((o: any) => (
                            <div key={o.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs flex justify-between items-center">
                              <div>
                                <span className="font-mono font-bold text-purple-700">#{o.id.slice(0, 8).toUpperCase()}</span>
                                <span className="text-slate-400 ml-2">{new Date(o.created_at).toLocaleDateString()}</span>
                                <p className="text-slate-500 text-[11px] mt-0.5">{o.order_items?.length || 0} productos comprados</p>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-slate-900 block">${Number(o.total || 0).toFixed(2)}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  o.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                                  o.status === 'delivered' ? 'bg-purple-100 text-purple-800' :
                                  'bg-amber-100 text-amber-800'
                                }`}>{o.status}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {section === 'promos' && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-headline font-bold text-slate-900">Cupones</h1>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-700">Nuevo Cupón</h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input type="text" placeholder="Código" value={newPromo.code} onChange={e => setNewPromo(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                      <div className="flex gap-3">
                        <input type="number" placeholder="%" value={newPromo.percent} onChange={e => setNewPromo(p => ({ ...p, percent: Number(e.target.value) }))} className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                        <input type="number" placeholder="Usos" value={newPromo.max_uses} onChange={e => setNewPromo(p => ({ ...p, max_uses: Number(e.target.value) }))} className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                        <button onClick={createPromo} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700"><Plus className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                          <tr><th className="text-left px-4 py-3">Código</th><th className="text-left px-4 py-3">%</th><th className="text-left px-4 py-3">Usos</th><th className="text-left px-4 py-3">Activo</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {promos.map((p: any) => (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.code}</td>
                              <td className="px-4 py-3">{p.percent}%</td>
                              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{p.used_count}/{p.max_uses || '∞'}</td>
                              <td className="px-4 py-3">{p.active ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-500" />}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {section === 'homepage' && <AdminHomepageEditor />}
              {section === 'about-page' && <AdminAboutPageEditor />}
              {section === 'categories' && <AdminCategoriesScreen />}
            </>
          )}
        </div>
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
              <select value={editingProduct?.category || ''} onChange={e => setEditingProduct(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Seleccionar categoría</option>
                {productCategories.map((c: any) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
              <select value={editingProduct?.unit_type || 'piece'} onChange={e => setEditingProduct(p => ({ ...p, unit_type: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="piece">Por pieza</option>
                <option value="weight">Por peso (granel)</option>
              </select>
              {editingProduct?.unit_type !== 'weight' && (
                <input type="number" step="0.01" placeholder="Precio Base" value={editingProduct?.base_price || ''} onChange={e => setEditingProduct(p => ({ ...p, base_price: Number(e.target.value) }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              )}
              {editingProduct?.unit_type === 'weight' && (
                <>
                  <input type="number" step="0.01" placeholder="Precio por KG" value={editingProduct?.price_per_kg || ''} onChange={e => setEditingProduct(p => ({ ...p, price_per_kg: Number(e.target.value) }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" placeholder="Min (g)" value={editingProduct?.min_weight || 50} onChange={e => setEditingProduct(p => ({ ...p, min_weight: Number(e.target.value) }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                    <input type="number" placeholder="Max (g)" value={editingProduct?.max_weight || 1000} onChange={e => setEditingProduct(p => ({ ...p, max_weight: Number(e.target.value) }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                    <input type="number" placeholder="Incremento (g)" value={editingProduct?.weight_step || 50} onChange={e => setEditingProduct(p => ({ ...p, weight_step: Number(e.target.value) }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                </>
              )}
              <input type="text" placeholder="URL de imagen" value={editingProduct?.image_url || ''} onChange={e => setEditingProduct(p => ({ ...p, image_url: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <input type="number" placeholder="Stock" value={editingProduct?.stock ?? ''} onChange={e => setEditingProduct(p => ({ ...p, stock: Number(e.target.value) }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
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
