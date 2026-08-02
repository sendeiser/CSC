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

  // Image Search State
  const [imgSearchQuery, setImgSearchQuery] = useState('');
  const [imgSearchResults, setImgSearchResults] = useState<any[]>([]);
  const [imgSearchLoading, setImgSearchLoading] = useState(false);
  const [imgSearchError, setImgSearchError] = useState('');
  const [showImgSearch, setShowImgSearch] = useState(false);

  // Image Upload State
  const [imgUploadFile, setImgUploadFile] = useState<File | null>(null);
  const [imgUploadPreview, setImgUploadPreview] = useState<string>('');
  const [imgUploading, setImgUploading] = useState(false);

  const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '';
  const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY || '';

  const searchImages = async (query: string) => {
    if (!query.trim()) return;
    setImgSearchLoading(true);
    setImgSearchError('');
    try {
      let results: any[] = [];
      if (PEXELS_KEY) {
        const res = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20`,
          { headers: { Authorization: PEXELS_KEY } }
        );
        const data = await res.json();
        results = (data.photos || []).map((p: any) => ({
          id: p.id,
          thumb: p.src.small,
          regular: p.src.large,
          alt: p.alt,
          author: p.photographer,
          source: 'Pexels',
        }));
      } else if (UNSPLASH_KEY) {
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&client_id=${UNSPLASH_KEY}`
        );
        const data = await res.json();
        results = (data.results || []).map((p: any) => ({
          id: p.id,
          thumb: p.urls.small,
          regular: p.urls.regular,
          alt: p.alt_description || p.description || query,
          author: p.user?.name,
          source: 'Unsplash',
        }));
      } else {
        // Fallback: Picsum with query as seed
        results = Array.from({ length: 16 }, (_, i) => ({
          id: `${query}-${i}`,
          thumb: `https://picsum.photos/seed/${encodeURIComponent(query)}${i}/300/200`,
          regular: `https://picsum.photos/seed/${encodeURIComponent(query)}${i}/800/600`,
          alt: `${query} ${i + 1}`,
          author: 'Picsum',
          source: 'Picsum (Aleatorio)',
        }));
      }
      setImgSearchResults(results);
    } catch (err: any) {
      setImgSearchError('Error al buscar imágenes. Verifica tu conexión.');
    } finally {
      setImgSearchLoading(false);
    }
  };
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
      let imageUrl = editingProduct.image_url || ''

      // If a local file was selected, upload it first
      if (imgUploadFile) {
        setImgUploading(true)
        const formData = new FormData()
        formData.append('image', imgUploadFile)
        const token = getAuthToken()
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al subir imagen')
        }
        const { url } = await res.json()
        imageUrl = url
        setImgUploading(false)
      }

      const payload = { ...editingProduct, image_url: imageUrl }

      if (editingProduct.id) {
        await productsApi.update(editingProduct.id, payload)
      } else {
        await productsApi.create(payload)
      }
      setShowProductForm(false)
      setEditingProduct(null)
      setImgUploadFile(null)
      setImgUploadPreview('')
      loadSection('products')
    } catch (err: any) {
      setImgUploading(false)
      showAlert({ title: 'Error al guardar', message: err.message || 'No se pudo guardar el producto', type: 'error' })
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
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message || 'Error al actualizar rol', type: 'error' })
    }
  }

  const handleDeleteUser = async (user: any) => {
    const confirmed = await showConfirm({
      title: '¿Eliminar usuario?',
      message: `¿Estás seguro de eliminar al usuario "${user.name || user.email || user.id.slice(0,8)}"? Esta acción eliminará su cuenta permanentemente.`,
      confirmText: 'Eliminar',
      type: 'danger'
    })
    if (!confirmed) return

    try {
      await adminApi.deleteUser(user.id)
      if (selectedCustomer?.id === user.id) setSelectedCustomer(null)
      loadSection('users')
      showAlert({ title: 'Éxito', message: 'Usuario eliminado correctamente', type: 'success' })
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message || 'Error al eliminar usuario', type: 'error' })
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

  const navItems: { id: AdminSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
    { id: 'analytics', label: 'Gráficos', icon: <BarChart2 className="w-4.5 h-4.5" /> },
    { id: 'products', label: 'Productos', icon: <Package className="w-4.5 h-4.5" /> },
    { id: 'orders', label: 'Pedidos', icon: <ShoppingCart className="w-4.5 h-4.5" /> },
    { id: 'users', label: 'Usuarios', icon: <Users className="w-4.5 h-4.5" /> },
    { id: 'promos', label: 'Cupones', icon: <Ticket className="w-4.5 h-4.5" /> },
    { id: 'homepage', label: 'Homepage', icon: <Layout className="w-4.5 h-4.5" /> },
    { id: 'about-page', label: 'Sobre Nosotros', icon: <FileText className="w-4.5 h-4.5" /> },
    { id: 'categories', label: 'Categorías', icon: <Layout className="w-4.5 h-4.5" /> },
  ]

  return (
    <div className="min-h-screen bg-slate-100 flex font-admin">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 z-50 h-screen flex flex-col transition-all duration-300 ${
        mobileSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'
      } md:translate-x-0 md:w-20 lg:w-64 bg-gradient-to-b from-slate-950 via-slate-900 to-purple-950 border-r border-white/5`}>

        {/* Logo */}
        <div className="flex-shrink-0 p-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-lg shadow-purple-900/50">
              C
            </div>
            <div className="inline md:hidden lg:block overflow-hidden">
              <span className="font-headline font-black text-white text-sm block leading-none">CSC Admin</span>
              <span className="text-[10px] text-purple-400 font-medium">Panel de Control</span>
            </div>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-dark">
          {navItems.map(item => {
            const isActive = section === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setSection(item.id); setMobileSidebarOpen(false) }}
                className={`relative w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/50'
                    : 'text-slate-400 hover:bg-white/8 hover:text-white'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-pink-400 rounded-r-full" />
                )}
                <span className="flex-shrink-0 relative">
                  {item.icon}
                  {item.badge && (
                    <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-pink-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center">{item.badge}</span>
                  )}
                </span>
                <span className="inline md:hidden lg:inline truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-white/10 space-y-2">
          <button
            onClick={() => setActiveScreen('inicio')}
            className="w-full text-xs text-purple-300 hover:text-white bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 transition-all px-3.5 py-2.5 rounded-xl text-left truncate font-semibold flex items-center space-x-2"
          >
            <Eye className="w-4 h-4 flex-shrink-0" />
            <span className="inline md:hidden lg:inline">Ver Tienda Pública</span>
          </button>
          <div className="hidden md:hidden lg:flex items-center space-x-3 bg-white/5 rounded-xl px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">Administrador</p>
              <p className="text-[10px] text-slate-400 truncate">admin@csc.com</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all px-3 py-2 rounded-xl text-left truncate font-medium"
          >
            → Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-h-screen">
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center justify-between mb-4 bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex items-center space-x-2 text-slate-700 text-xs font-bold px-2 py-1 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-4.5 h-4.5 text-purple-600" />
              <span>Menú Admin ({navItems.find(i => i.id === section)?.label || 'Menú'})</span>
            </button>
            <button
              onClick={() => setActiveScreen('inicio')}
              className="flex items-center space-x-1 text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1.5 rounded-xl border border-purple-200"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver Tienda</span>
            </button>
          </div>

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
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Productos Activos', value: stats.totalProducts, gradient: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-200', icon: <Package className="w-5 h-5" /> },
                      { label: 'Clientes Registrados', value: stats.totalUsers, gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-200', icon: <Users className="w-5 h-5" /> },
                      { label: 'Pedidos Totales', value: stats.totalOrders, gradient: 'from-purple-500 to-violet-500', shadow: 'shadow-purple-200', icon: <ShoppingCart className="w-5 h-5" /> },
                      { label: 'Ingresos Pagados', value: `$${stats.totalRevenue.toFixed(2)}`, gradient: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-200', icon: <TrendingUp className="w-5 h-5" />, note: 'Pedidos confirmados' },
                    ].map(stat => (
                      <div key={stat.label} className={`bg-white rounded-2xl border border-slate-100 p-5 flex items-center space-x-4 shadow-sm hover:shadow-md hover:shadow-${stat.shadow} transition-all duration-300 group cursor-default`}>
                        <div className={`w-11 h-11 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500 font-medium truncate">{stat.label}</p>
                          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 truncate">{stat.value}</p>
                          {stat.note && <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">{stat.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Periodic Sales Cards */}
                  <div className="relative bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-white rounded-2xl p-6 shadow-xl overflow-hidden">
                    {/* Decorative blur */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl" />

                    <div className="relative flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                      <div>
                        <h3 className="font-headline font-bold text-base text-white">Ventas Periódicas</h3>
                        <p className="text-xs text-purple-300 mt-0.5">Solo pedidos pagados y entregados</p>
                      </div>
                      <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-bold uppercase tracking-wider">
                        ✓ Verificado
                      </span>
                    </div>

                    <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { label: 'Hoy', value: stats.todaySales || 0, icon: '📅' },
                        { label: 'Esta Semana (7d)', value: stats.weeklySales || 0, icon: '📆' },
                        { label: 'Este Mes (30d)', value: stats.monthlySales || 0, icon: '📊' },
                      ].map(({ label, value, icon }) => (
                        <div key={label} className="bg-white/8 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/12 transition-colors">
                          <div className="flex items-center space-x-2 mb-2">
                            <span>{icon}</span>
                            <span className="text-xs text-purple-200 font-semibold">{label}</span>
                          </div>
                          <span className="text-2xl sm:text-3xl font-black text-white block">${value.toFixed(2)}</span>
                        </div>
                      ))}
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
                      <h1 className="text-xl sm:text-2xl font-headline font-bold text-slate-900">Productos <span className="text-purple-600">({products.length})</span></h1>
                      <p className="text-xs text-slate-500 mt-0.5">Gestioná y buscá los productos de tu catálogo</p>
                    </div>
                    <button
                      onClick={() => { setEditingProduct({}); setShowProductForm(true) }}
                      className="flex items-center justify-center space-x-2 px-5 py-2.5 candy-gradient-bg text-white rounded-xl text-sm font-bold hover:opacity-95 w-full sm:w-auto shadow-lg shadow-purple-300/40 transition-all hover:-translate-y-0.5"
                    >
                      <Plus className="w-4 h-4" /><span>Nuevo Producto</span>
                    </button>
                  </div>

                  {/* Products Search & Filters Bar */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Search Bar */}
                      <div className="relative lg:col-span-2">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar producto por nombre..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-400 outline-none bg-slate-50 focus:bg-white transition-colors"
                        />
                      </div>

                      {/* Category Filter */}
                      <div className="flex items-center space-x-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50">
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

                      {/* Sort Filter */}
                      <div className="flex items-center space-x-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50">
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

                  {/* Mobile: Card List */}
                  <div className="sm:hidden space-y-2">
                    {products
                      .filter((p) => {
                        const matchesSearch =
                          (p.name || '').toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                          (p.category || '').toLowerCase().includes(productSearchTerm.toLowerCase());
                        const matchesCategory = productCategoryFilter === 'all' || p.category === productCategoryFilter;
                        const matchesStock = productStockFilter === 'all' ? true : productStockFilter === 'in_stock' ? p.stock > 0 : p.stock <= 0;
                        return matchesSearch && matchesCategory && matchesStock;
                      })
                      .sort((a, b) => {
                        if (productSortBy === 'price_asc') return a.base_price - b.base_price;
                        if (productSortBy === 'price_desc') return b.base_price - a.base_price;
                        if (productSortBy === 'stock_desc') return b.stock - a.stock;
                        if (productSortBy === 'name_asc') return a.name.localeCompare(b.name);
                        return 0;
                      })
                      .map((p) => (
                        <div key={p.id} className={`bg-white rounded-2xl border p-3.5 flex items-center gap-3 shadow-sm ${
                          selectedProductIds.includes(p.id) ? 'border-purple-200 bg-purple-50/30' : 'border-slate-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={selectedProductIds.includes(p.id)}
                            onChange={() => toggleSelectProduct(p.id)}
                            className="rounded text-purple-600 w-4 h-4 flex-shrink-0"
                          />
                          <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-xl object-cover bg-slate-100 flex-shrink-0 border border-slate-100" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 text-sm truncate">{p.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-400">{p.category}</span>
                              <span className="font-black text-purple-700 text-xs">${p.base_price.toFixed(2)}</span>
                            </div>
                            <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                              p.stock > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                              {p.stock > 0 ? '● ' : '○ '}{p.stock}{p.unit_type === 'weight' ? 'g' : ' uds'}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <button
                              onClick={() => { setEditingProduct(p); setShowProductForm(true) }}
                              className="p-2 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteProduct(p.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Desktop: Table */}
                  <div className="hidden sm:block bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-3.5 text-left w-10">
                              <input
                                type="checkbox"
                                checked={products.length > 0 && selectedProductIds.length === products.length}
                                onChange={handleSelectAllProducts}
                                className="rounded text-purple-600 focus:ring-purple-400 w-4 h-4 cursor-pointer"
                              />
                            </th>
                            <th className="text-left px-4 py-3.5">Producto</th>
                            <th className="text-left px-4 py-3.5 hidden md:table-cell">Categoría</th>
                            <th className="text-left px-4 py-3.5">Precio</th>
                            <th className="text-left px-4 py-3.5">Stock</th>
                            <th className="text-left px-4 py-3.5 hidden md:table-cell">Ventas</th>
                            <th className="text-right px-4 py-3.5">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
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
                              <tr key={p.id} className={`hover:bg-slate-50/80 transition-colors group ${isSelected ? 'bg-purple-50/50' : ''}`}>
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
                                    <img src={p.image_url} alt={p.name} className="w-11 h-11 rounded-xl object-cover bg-slate-100 flex-shrink-0 border border-slate-100 shadow-sm" />
                                    <div>
                                      <span className="font-semibold text-slate-900 truncate max-w-[200px] block">{p.name}</span>
                                      <span className="text-[10px] text-slate-400 block md:hidden">{p.category}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell">
                                  <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{p.category}</span>
                                </td>
                                <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">${p.base_price.toFixed(2)}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${
                                    p.stock > 0
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                      : 'bg-red-50 text-red-700 border border-red-100'
                                  }`}>
                                    {p.stock > 0 ? '●' : '○'} {p.stock}{p.unit_type === 'weight' ? 'g' : ' uds'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{p.reviews}</td>
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end space-x-1">
                                    <button
                                      onClick={() => { setEditingProduct(p); setShowProductForm(true) }}
                                      className="p-2 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => deleteProduct(p.id)}
                                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
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
                      <h1 className="text-xl sm:text-2xl font-headline font-bold text-slate-900">CRM <span className="text-purple-600">&amp; Clientes</span></h1>
                      <p className="text-xs text-slate-500 mt-0.5">{users.length} usuarios registrados</p>
                    </div>
                    <button
                      onClick={() => { setNewUser({ email: '', password: '', name: '', role: 'admin' }); setShowCreateUser(true) }}
                      className="flex items-center justify-center space-x-2 px-5 py-2.5 candy-gradient-bg text-white rounded-xl text-sm font-bold hover:opacity-95 w-full sm:w-auto shadow-lg shadow-purple-300/40 transition-all hover:-translate-y-0.5"
                    >
                      <Plus className="w-4 h-4" /><span>Crear Admin</span>
                    </button>
                  </div>

                  {/* CRM Search Bar */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar cliente por nombre, email o rol..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none bg-slate-50 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  {/* Mobile: User Cards */}
                  <div className="sm:hidden space-y-2">
                    {users
                      .filter(u =>
                        (u.name || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                        (u.role || '').toLowerCase().includes(userSearchTerm.toLowerCase())
                      )
                      .map((u: any) => {
                        const ordersCount = u.ordersCount || 0;
                        const totalSpent = u.totalSpent || 0;
                        return (
                          <div key={u.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                                {(u.name || 'U').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 truncate text-sm">{u.name || 'Cliente sin nombre'}</p>
                                <p className="text-[10px] font-mono text-slate-400">ID: {u.id.slice(0, 8)}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                                u.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-600'
                              }`}>{u.role}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div className="bg-slate-50 rounded-xl p-2 text-center">
                                <p className="text-[10px] text-slate-400 font-medium">Pedidos</p>
                                <p className="font-black text-slate-900 text-sm">{ordersCount}</p>
                              </div>
                              <div className="bg-purple-50 rounded-xl p-2 text-center">
                                <p className="text-[10px] text-purple-600 font-medium">Total gastado</p>
                                <p className="font-black text-purple-800 text-sm">${totalSpent.toFixed(2)}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedCustomer(u)}
                                className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-colors border border-purple-200"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ver Ficha CRM</span>
                              </button>
                              <select
                                value={u.role}
                                onChange={(e) => updateUserRole(u.id, e.target.value)}
                                className="text-xs border border-slate-200 rounded-xl px-2 py-2 bg-white font-medium outline-none focus:ring-1 focus:ring-purple-400"
                              >
                                <option value="customer">customer</option>
                                <option value="admin">admin</option>
                              </select>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex-shrink-0"
                                title="Eliminar Usuario"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Desktop: Table */}
                  <div className="hidden sm:block bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-100">
                          <tr>
                            <th className="text-left px-4 py-3.5">Cliente</th>
                            <th className="text-left px-4 py-3.5">Rol</th>
                            <th className="text-left px-4 py-3.5">Pedidos</th>
                            <th className="text-left px-4 py-3.5">Total Gastado</th>
                            <th className="text-left px-4 py-3.5 hidden md:table-cell">Registro</th>
                            <th className="text-right px-4 py-3.5">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {users
                            .filter(u =>
                              (u.name || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                              (u.role || '').toLowerCase().includes(userSearchTerm.toLowerCase())
                            )
                            .map((u: any) => {
                              const ordersCount = u.ordersCount || 0;
                              const totalSpent = u.totalSpent || 0;
                              return (
                                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="px-4 py-3.5">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
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
                                    <div className="flex items-center justify-end space-x-1.5">
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
                                      <button
                                        onClick={() => handleDeleteUser(u)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Eliminar Usuario"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
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
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDeleteUser(selectedCustomer)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors border border-red-200"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar Usuario</span>
                        </button>
                        <button onClick={() => setSelectedCustomer(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
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

      {/* Product Form Modal — Premium Redesign */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="bg-white w-full sm:rounded-2xl sm:max-w-2xl max-h-[96vh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl rounded-t-2xl"
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${editingProduct?.id ? 'bg-amber-100' : 'bg-purple-100'}`}>
                  {editingProduct?.id ? <Edit3 className="w-4 h-4 text-amber-700" /> : <Plus className="w-4 h-4 text-purple-700" />}
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-slate-900">
                    {editingProduct?.id ? 'Editar Producto' : 'Nuevo Producto'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingProduct?.id ? `ID: ${editingProduct.id.slice(0, 8)}...` : 'Completa los datos del nuevo producto'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowProductForm(false); setEditingProduct(null); }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

              {/* Image Picker Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Imagen del Producto
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowImgSearch((s) => !s); setImgSearchResults([]); setImgSearchQuery(''); }}
                    className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-colors ${
                      showImgSearch ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    {showImgSearch ? '✕ Cerrar buscador' : '🔍 Buscar imagen'}
                  </button>
                </div>

                {/* Current image preview */}
                {editingProduct?.image_url ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                    <img
                      src={editingProduct.image_url}
                      alt="Vista previa"
                      className="w-full h-32 object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end justify-between p-3">
                      <span className="text-white text-[10px] font-semibold bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        Imagen Seleccionada
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingProduct((p) => ({ ...p, image_url: '' }))}
                        className="text-white bg-red-500/80 hover:bg-red-600 p-1 rounded-lg backdrop-blur-sm transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : imgUploadPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                    <img
                      src={imgUploadPreview}
                      alt="Vista previa local"
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end justify-between p-3">
                      <span className="text-white text-[10px] font-semibold bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        📁 Archivo local (se subirá al guardar)
                      </span>
                      <button
                        type="button"
                        onClick={() => { setImgUploadFile(null); setImgUploadPreview(''); }}
                        className="text-white bg-red-500/80 hover:bg-red-600 p-1 rounded-lg backdrop-blur-sm transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {/* Upload local */}
                    <label
                      htmlFor="product-img-upload"
                      className="h-24 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/40 flex flex-col items-center justify-center text-purple-500 space-y-1 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <span className="text-xs font-semibold">Subir imagen</span>
                      <span className="text-[10px] text-purple-400">JPG, PNG, WEBP · máx 5MB</span>
                      <input
                        id="product-img-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setImgUploadFile(file)
                          const preview = URL.createObjectURL(file)
                          setImgUploadPreview(preview)
                          // Clear any URL that was set
                          setEditingProduct((p) => ({ ...p, image_url: '' }))
                        }}
                      />
                    </label>
                    {/* Search online */}
                    <div
                      className="h-24 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 space-y-1 cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-colors"
                      onClick={() => setShowImgSearch(true)}
                    >
                      <Eye className="w-7 h-7" />
                      <span className="text-xs font-semibold">Buscar en línea</span>
                      <span className="text-[10px] text-slate-400">Pexels / Unsplash</span>
                    </div>
                  </div>
                )}

                {/* Image Search Panel */}
                {showImgSearch && (
                  <div className="bg-slate-900 rounded-2xl p-4 space-y-3 shadow-xl">
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder={`Buscar en ${PEXELS_KEY ? 'Pexels' : UNSPLASH_KEY ? 'Unsplash' : 'Picsum'}... (ej: gomitas, chocolate)`}
                          value={imgSearchQuery}
                          onChange={(e) => setImgSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && searchImages(imgSearchQuery)}
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => searchImages(imgSearchQuery)}
                        disabled={imgSearchLoading || !imgSearchQuery.trim()}
                        className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
                      >
                        {imgSearchLoading ? '...' : 'Buscar'}
                      </button>
                    </div>

                    {/* Quick search terms */}
                    <div className="flex flex-wrap gap-1.5">
                      {['gomitas', 'chocolate', 'caramelos', 'turrones', 'candy', 'sweet', 'dulces', 'alfajor'].map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => { setImgSearchQuery(term); searchImages(term); }}
                          className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-semibold rounded-lg transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>

                    {imgSearchError && (
                      <p className="text-red-400 text-xs text-center py-2">{imgSearchError}</p>
                    )}

                    {!PEXELS_KEY && !UNSPLASH_KEY && imgSearchResults.length === 0 && !imgSearchLoading && (
                      <div className="bg-amber-900/40 border border-amber-700/50 rounded-xl p-3 text-xs text-amber-300">
                        <p className="font-bold mb-1">💡 Configurar API de Imágenes</p>
                        <p>Para mejores resultados, agrega <code className="bg-black/30 px-1 rounded">VITE_PEXELS_API_KEY</code> o <code className="bg-black/30 px-1 rounded">VITE_UNSPLASH_ACCESS_KEY</code> en tu archivo <code className="bg-black/30 px-1 rounded">.env</code>. Usando imágenes aleatorias de Picsum mientras tanto.</p>
                      </div>
                    )}

                    {/* Results Grid */}
                    {imgSearchResults.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                        {imgSearchResults.map((img) => {
                          const isChosen = editingProduct?.image_url === img.regular;
                          return (
                            <div
                              key={img.id}
                              onClick={() => {
                                setEditingProduct((p) => ({ ...p, image_url: img.regular }));
                                setShowImgSearch(false);
                              }}
                              className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all group ${
                                isChosen ? 'border-purple-500 ring-2 ring-purple-400' : 'border-transparent hover:border-purple-400'
                              }`}
                            >
                              <img
                                src={img.thumb}
                                alt={img.alt}
                                className="w-full h-20 object-cover"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                {isChosen ? (
                                  <span className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                  </span>
                                ) : (
                                  <span className="opacity-0 group-hover:opacity-100 text-white text-[10px] font-bold bg-black/60 px-2 py-0.5 rounded-full">
                                    Seleccionar
                                  </span>
                                )}
                              </div>
                              {img.author && (
                                <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 bg-black/50">
                                  <p className="text-[8px] text-white/70 truncate">{img.author} · {img.source}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {imgSearchLoading && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="h-20 rounded-xl bg-slate-700 animate-pulse" />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Manual URL fallback */}
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type="url"
                      placeholder="O pega directamente una URL de imagen..."
                      value={editingProduct?.image_url || ''}
                      onChange={(e) => setEditingProduct((p) => ({ ...p, image_url: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                    />
                  </div>
                  {editingProduct?.image_url && (
                    <button
                      type="button"
                      onClick={() => setEditingProduct((p) => ({ ...p, image_url: '' }))}
                      className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl border border-slate-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Basic Info Section */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Información Básica</h4>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Nombre del Producto *</label>
                    <input
                      type="text"
                      placeholder="Ej: Gomitas de Frutilla x 500g"
                      value={editingProduct?.name || ''}
                      onChange={(e) => {
                        const name = e.target.value;
                        const slug = name.toLowerCase()
                          .replace(/\s+/g, '-')
                          .replace(/[^a-z0-9-]/g, '')
                          .replace(/-+/g, '-');
                        setEditingProduct((p) => ({ ...p, name, slug }));
                      }}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-600 block">Slug (URL interna)</label>
                      <span className="text-[10px] text-slate-400">Auto-generado desde el nombre</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">/producto/</span>
                      <input
                        type="text"
                        placeholder="mi-producto"
                        value={editingProduct?.slug || ''}
                        onChange={(e) => setEditingProduct((p) => ({ ...p, slug: e.target.value }))}
                        className="w-full pl-20 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-purple-400 bg-white text-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Descripción</label>
                    <textarea
                      placeholder="Describe el producto: sabor, características, presentación..."
                      value={editingProduct?.description || ''}
                      onChange={(e) => setEditingProduct((p) => ({ ...p, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-400 bg-white resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Categoría</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {productCategories.map((c: any) => {
                    const isSelected = editingProduct?.category === c.slug;
                    return (
                      <button
                        key={c.slug}
                        type="button"
                        onClick={() => setEditingProduct((p) => ({ ...p, category: c.slug }))}
                        className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${isSelected ? 'bg-white/20' : c.bg_color}`}>
                          {getCategoryIcon(c.icon) ? React.createElement(getCategoryIcon(c.icon), { className: 'w-3 h-3' }) : null}
                        </span>
                        <span className="truncate">{c.name}</span>
                        {isSelected && <Check className="w-3 h-3 flex-shrink-0 ml-auto" />}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setEditingProduct((p) => ({ ...p, category: '' }))}
                    className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      !editingProduct?.category
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[10px]">Sin categoría</span>
                  </button>
                </div>
              </div>

              {/* Unit Type & Pricing */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tipo de Venta & Precio</h4>

                {/* Unit Type Toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct((p) => ({ ...p, unit_type: 'piece' }))}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-xs font-bold transition-all ${
                      (editingProduct?.unit_type || 'piece') !== 'weight'
                        ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-purple-200'
                    }`}
                  >
                    <Package className="w-5 h-5 mb-1" />
                    Por Unidad / Pieza
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProduct((p) => ({ ...p, unit_type: 'weight' }))}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-xs font-bold transition-all ${
                      editingProduct?.unit_type === 'weight'
                        ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-purple-200'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5 mb-1" />
                    Por Peso (Granel)
                  </button>
                </div>

                {/* Piece pricing */}
                {(editingProduct?.unit_type || 'piece') !== 'weight' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Precio por Unidad ($) *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={editingProduct?.base_price || ''}
                        onChange={(e) => setEditingProduct((p) => ({ ...p, base_price: Number(e.target.value) }))}
                        className="w-full pl-8 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Weight pricing */}
                {editingProduct?.unit_type === 'weight' && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Precio por Kg ($) *</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00 por Kg"
                          value={editingProduct?.price_per_kg || ''}
                          onChange={(e) => setEditingProduct((p) => ({ ...p, price_per_kg: Number(e.target.value), base_price: Number(e.target.value) }))}
                          className="w-full pl-8 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Mínimo (g)</label>
                        <input
                          type="number"
                          placeholder="50"
                          value={editingProduct?.min_weight ?? 50}
                          onChange={(e) => setEditingProduct((p) => ({ ...p, min_weight: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Máximo (g)</label>
                        <input
                          type="number"
                          placeholder="1000"
                          value={editingProduct?.max_weight ?? 1000}
                          onChange={(e) => setEditingProduct((p) => ({ ...p, max_weight: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Paso (g)</label>
                        <input
                          type="number"
                          placeholder="50"
                          value={editingProduct?.weight_step ?? 50}
                          onChange={(e) => setEditingProduct((p) => ({ ...p, weight_step: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stock */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Stock Disponible
                  </label>
                  {(editingProduct?.stock ?? 0) > 0 ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      ✓ En Stock
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      ✗ Sin Stock
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={editingProduct?.stock ?? ''}
                      onChange={(e) => setEditingProduct((p) => ({ ...p, stock: Number(e.target.value) }))}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {editingProduct?.unit_type === 'weight' ? 'gramos (g)' : 'unidades'}
                  </span>
                </div>

                {/* Quick stock presets */}
                <div className="flex flex-wrap gap-2">
                  {(editingProduct?.unit_type === 'weight' ? [500, 1000, 2000, 5000] : [10, 25, 50, 100]).map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setEditingProduct((p) => ({ ...p, stock: qty }))}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                        editingProduct?.stock === qty
                          ? 'bg-purple-700 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-purple-100'
                      }`}
                    >
                      {editingProduct?.unit_type === 'weight' ? `${qty}g` : `${qty} uds`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-slate-100 flex items-center justify-between space-x-3 bg-slate-50/70">
              {editingProduct?.base_price ? (
                <div>
                  <span className="text-[10px] text-slate-500">Precio configurado</span>
                  <p className="text-lg font-black text-purple-700">
                    ${Number(editingProduct.base_price).toFixed(2)}
                    {editingProduct.unit_type === 'weight' ? ' / kg' : ''}
                  </p>
                </div>
              ) : (
                <div />
              )}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => { setShowProductForm(false); setEditingProduct(null); }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveProduct}
                  disabled={imgUploading}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-lg transition-colors"
                >
                  {imgUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Subiendo imagen...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingProduct?.id ? 'Guardar Cambios' : 'Crear Producto'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
