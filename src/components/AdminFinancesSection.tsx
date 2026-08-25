import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, TrendingUp, TrendingDown, Package, Plus, Edit3, Trash2, 
  Search, Filter, Calendar, ArrowDownRight, ArrowUpRight, Download, 
  RefreshCw, Check, X, AlertCircle, ShoppingBag, Truck, Lightbulb, 
  Layers, Wallet, HelpCircle, FileText, ChevronDown, Sparkles
} from 'lucide-react';
import { admin as adminApi } from '../lib/api';
import { ExpenseItem } from '../types';
import { useModal } from '../context/ModalContext';

export const EXPENSE_CATEGORIES = [
  { id: 'packaging', label: '📦 Packaging y Bandejas', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { id: 'stock', label: '🍬 Materia Prima y Golosinas', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'shipping', label: '🚚 Envíos y Fletes', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'services', label: '💡 Servicios y Local', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'supplies', label: '🏷️ Insumos y Limpieza', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'marketing', label: '📢 Publicidad y Marketing', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { id: 'other', label: '⚙️ Otros Gastos', color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

export const INCOME_CATEGORIES = [
  { id: 'sales_extra', label: '💰 Venta Externa / Evento', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'capital', label: '💵 Aporte de Capital', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  { id: 'other_income', label: '✨ Otros Ingresos', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
];

export const AdminFinancesSection: React.FC = () => {
  const { showConfirm, showAlert } = useModal();

  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statsData, setStatsData] = useState<any>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Modal Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);
  const [formData, setFormData] = useState({
    type: 'expense' as 'expense' | 'income',
    category: 'Packaging y Bandejas',
    description: '',
    amount: '',
    payment_method: 'Efectivo',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [resExp, resStats] = await Promise.all([
        adminApi.getExpenses(),
        adminApi.getStats()
      ]);
      setExpenses(Array.isArray(resExp.expenses) ? resExp.expenses : []);
      setStatsData(resStats);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos financieros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = (type: 'expense' | 'income' = 'expense') => {
    setEditingItem(null);
    setFormData({
      type,
      category: type === 'expense' ? 'Packaging y Bandejas' : 'Venta Externa / Evento',
      description: '',
      amount: '',
      payment_method: 'Efectivo',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: ExpenseItem) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      category: item.category,
      description: item.description,
      amount: String(item.amount),
      payment_method: item.payment_method || 'Efectivo',
      date: item.date || new Date().toISOString().split('T')[0],
      notes: item.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.amount || Number(formData.amount) <= 0) {
      showAlert({
        title: 'Datos Incompletos',
        message: 'Por favor ingresá un concepto y un monto válido mayor a 0.',
        type: 'warning',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type: formData.type,
        category: formData.category,
        description: formData.description.trim(),
        amount: Number(formData.amount),
        payment_method: formData.payment_method,
        date: formData.date,
        notes: formData.notes.trim(),
      };

      if (editingItem) {
        await adminApi.updateExpense(editingItem.id, payload);
      } else {
        await adminApi.createExpense(payload);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      showAlert({
        title: 'Error al Guardar',
        message: err.message || 'No se pudo guardar el registro.',
        type: 'danger',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: ExpenseItem) => {
    const confirmed = await showConfirm({
      title: '¿Eliminar este registro?',
      message: `¿Estás seguro de eliminar "${item.description}" por $${Number(item.amount).toFixed(2)}? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await adminApi.deleteExpense(item.id);
      await loadData();
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: err.message || 'No se pudo eliminar el registro.',
        type: 'danger',
      });
    }
  };

  // Filtered list
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    return expenses.filter(item => {
      // Type
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;

      // Category
      if (categoryFilter !== 'all') {
        const itemCat = String(item.category || '').toLowerCase();
        if (!itemCat.includes(categoryFilter.toLowerCase())) return false;
      }

      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchDesc = String(item.description || '').toLowerCase().includes(query);
        const matchNotes = String(item.notes || '').toLowerCase().includes(query);
        const matchCat = String(item.category || '').toLowerCase().includes(query);
        const matchPay = String(item.payment_method || '').toLowerCase().includes(query);
        if (!matchDesc && !matchNotes && !matchCat && !matchPay) return false;
      }

      // Period
      if (periodFilter !== 'all') {
        const itemDate = new Date(item.date || item.created_at || todayStr);
        if (periodFilter === 'today') {
          if (item.date !== todayStr) return false;
        } else if (periodFilter === 'week') {
          if (itemDate < weekAgo) return false;
        } else if (periodFilter === 'month') {
          if (itemDate < monthAgo) return false;
        }
      }

      return true;
    });
  }, [expenses, typeFilter, categoryFilter, searchTerm, periodFilter]);

  // Calculations on filtered data
  const totalFilteredExpenses = useMemo(() => {
    return filteredExpenses
      .filter(e => e.type !== 'income')
      .reduce((acc, e) => acc + Number(e.amount || 0), 0);
  }, [filteredExpenses]);

  const totalFilteredIncomes = useMemo(() => {
    return filteredExpenses
      .filter(e => e.type === 'income')
      .reduce((acc, e) => acc + Number(e.amount || 0), 0);
  }, [filteredExpenses]);

  // Overall calculations
  const totalOrdersRevenue = Number(statsData?.totalRevenue || 0);
  const totalRegisteredExpenses = useMemo(() => {
    return expenses
      .filter(e => e.type !== 'income')
      .reduce((acc, e) => acc + Number(e.amount || 0), 0);
  }, [expenses]);

  const totalRegisteredIncomes = useMemo(() => {
    return expenses
      .filter(e => e.type === 'income')
      .reduce((acc, e) => acc + Number(e.amount || 0), 0);
  }, [expenses]);

  const totalPackagingCost = useMemo(() => {
    return expenses
      .filter(e => e.type !== 'income' && String(e.category || '').toLowerCase().includes('packaging'))
      .reduce((acc, e) => acc + Number(e.amount || 0), 0);
  }, [expenses]);

  const totalStockCost = useMemo(() => {
    return expenses
      .filter(e => e.type !== 'income' && (
        String(e.category || '').toLowerCase().includes('stock') ||
        String(e.category || '').toLowerCase().includes('materia') ||
        String(e.category || '').toLowerCase().includes('golosina')
      ))
      .reduce((acc, e) => acc + Number(e.amount || 0), 0);
  }, [expenses]);

  // Total Income (Sales + Manual Extras) - Total Expenses
  const globalNetProfit = (totalOrdersRevenue + totalRegisteredIncomes) - totalRegisteredExpenses;

  // Category breakdown for chart
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => {
      if (e.type !== 'income') {
        const cat = e.category || 'Otros';
        map[cat] = (map[cat] || 0) + Number(e.amount || 0);
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  // Export CSV
  const handleExportCSV = () => {
    if (expenses.length === 0) {
      showAlert({ title: 'Sin datos', message: 'No hay movimientos para exportar.', type: 'info' });
      return;
    }

    const headers = ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Medio de Pago', 'Monto ($)', 'Notas'];
    const rows = expenses.map(e => [
      e.date || '',
      e.type === 'income' ? 'Ingreso' : 'Gasto',
      `"${e.category || ''}"`,
      `"${e.description || ''}"`,
      `"${e.payment_method || ''}"`,
      Number(e.amount || 0).toFixed(2),
      `"${e.notes || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `finanzas_csc_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-xs font-bold text-pink-300 backdrop-blur-sm">
              <Wallet className="w-3.5 h-3.5" />
              <span>Libro de Gastos e Ingresos</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-headline font-black text-white">
              Control de Finanzas & Reposición
            </h1>
            <p className="text-xs sm:text-sm text-purple-200 max-w-2xl leading-relaxed">
              Llevá el registro exacto del dinero que gastás en <strong>packaging, bolsas, bandejas plásticas, golosinas por bulto y fletes</strong>, contrastado con lo que vas ganando de las ventas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => openCreateModal('expense')}
              className="inline-flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-rose-900/30 transition-all hover:scale-105 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Gasto</span>
            </button>

            <button
              onClick={() => openCreateModal('income')}
              className="inline-flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-900/30 transition-all hover:scale-105 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ingreso Extra</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center space-x-2 px-3.5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-2xl border border-white/20 transition-all cursor-pointer"
              title="Exportar a CSV / Excel"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>

            <button
              onClick={loadData}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all cursor-pointer"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Main KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales (From Orders) */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-2 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Ventas Cobradas (Tienda)</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            ${totalOrdersRevenue.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">
            Pedidos pagados y entregados
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-2 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Gastos Registrados</span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600">
            -${totalRegisteredExpenses.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">
            {expenses.filter(e => e.type !== 'income').length} egresos cargados
          </p>
        </div>

        {/* Net Cash Balance */}
        <div className={`rounded-3xl border p-5 shadow-sm space-y-2 transition-all ${
          globalNetProfit >= 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white border-emerald-400' : 'bg-gradient-to-br from-rose-500 to-red-700 text-white border-rose-400'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold opacity-90">Ganancia Real / Balance Neto</span>
            <div className="w-9 h-9 rounded-2xl bg-white/20 text-white flex items-center justify-center">
              <DollarSign className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black">
            ${globalNetProfit.toFixed(2)}
          </p>
          <p className="text-[11px] opacity-80 font-medium">
            Ventas (+ Extras) menos Gastos
          </p>
        </div>

        {/* Packaging Expense Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Inversión en Packaging</span>
            <div className="w-9 h-9 rounded-2xl bg-pink-50 text-pink-700 flex items-center justify-center border border-pink-100">
              <Package className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ${totalPackagingCost.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            Bandejas, bolsas, sellado y stickers
          </p>
        </div>
      </div>

      {/* Reposition & Expense Breakdown Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Packaging & Material Reposition Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-slate-900 text-sm">Control de Packaging & Insumos</h3>
              <p className="text-xs text-slate-500">Bandejas armables, cajas y bolsas</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Gastos en Packaging:</span>
                <span className="font-bold text-slate-800">${totalPackagingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Gastos en Golosinas/Stock:</span>
                <span className="font-bold text-slate-800">${totalStockCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-slate-200 pt-2">
                <span className="font-bold text-purple-900">Total Materia + Empaque:</span>
                <span className="font-black text-purple-700">${(totalPackagingCost + totalStockCost).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                <Sparkles className="w-3.5 h-3.5" />
                💡 Fondo de Reabastecimiento
              </span>
              <p className="text-[11px] leading-relaxed text-emerald-750">
                Tus ingresos cubren los costos de packaging. Cada vez que compres bandejas o gomitas por bulto, cargá el gasto aquí para mantener tu ganancia neta siempre exacta.
              </p>
            </div>
          </div>
        </div>

        {/* Expenses by Category Progress */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-headline font-bold text-slate-900 text-sm">Distribución de Gastos por Categoría</h3>
              <p className="text-xs text-slate-500">Dónde se está yendo el dinero invertido</p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-xl">
              Total: ${totalRegisteredExpenses.toFixed(2)}
            </span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No hay gastos cargados aún. Hacé clic en "Registrar Gasto" para empezar.
            </div>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map(([cat, amount]) => {
                const pct = totalRegisteredExpenses > 0 ? (amount / totalRegisteredExpenses) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 font-semibold">{cat}</span>
                      <span className="text-slate-900 font-bold">
                        ${amount.toFixed(2)} <span className="text-slate-400 font-normal">({pct.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-pink-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(3, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Movements Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-sm">
        {/* Table Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-headline font-bold text-base text-slate-900">Historial de Movimientos</h3>
            <p className="text-xs text-slate-500">Filtrá y consultá todos los gastos e ingresos registrados</p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
              <button
                onClick={() => setTypeFilter('all')}
                className={typeFilter === 'all' ? 'px-3 py-1.5 rounded-xl transition-all bg-white text-slate-900 shadow-sm' : 'px-3 py-1.5 rounded-xl transition-all text-slate-700 hover:text-slate-900'}
              >
                Todos
              </button>
              <button
                onClick={() => setTypeFilter('expense')}
                className={typeFilter === 'expense' ? 'px-3 py-1.5 rounded-xl transition-all bg-rose-600 text-white shadow-sm' : 'px-3 py-1.5 rounded-xl transition-all text-rose-950/70 hover:text-rose-950'}
              >
                Gastos
              </button>
              <button
                onClick={() => setTypeFilter('income')}
                className={typeFilter === 'income' ? 'px-3 py-1.5 rounded-xl transition-all bg-emerald-600 text-white shadow-sm' : 'px-3 py-1.5 rounded-xl transition-all text-emerald-950/70 hover:text-emerald-950'}
              >
                Ingresos Extras
              </button>
            </div>

            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-2xl px-3 py-2 outline-none cursor-pointer"
            >
              <option value="all">📅 Todo el Historial</option>
              <option value="today">📅 Solo Hoy</option>
              <option value="week">📅 Últimos 7 Días</option>
              <option value="month">📅 Últimos 30 Días</option>
            </select>
          </div>
        </div>

        {/* Search Bar & Category filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por concepto, notas, medio de pago..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-2xl px-3 py-2.5 outline-none cursor-pointer"
          >
            <option value="all">🏷️ Todas las Categorías</option>
            <option value="packaging">📦 Packaging y Bandejas</option>
            <option value="stock">🍬 Materia Prima / Golosinas</option>
            <option value="shipping">🚚 Envíos / Fletes</option>
            <option value="services">💡 Servicios / Local</option>
            <option value="supplies">🏷️ Insumos / Limpieza</option>
            <option value="marketing">📢 Publicidad</option>
            <option value="other">⚙️ Otros</option>
          </select>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-purple-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Cargando movimientos...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="py-16 text-center space-y-3 border border-dashed border-slate-200 rounded-3xl">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No se encontraron movimientos</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm || categoryFilter !== 'all' || typeFilter !== 'all' || periodFilter !== 'all'
                ? 'Probá cambiando los filtros o el texto de búsqueda.'
                : 'Aún no registraste gastos ni ingresos. ¡Hacé clic en los botones de arriba para empezar!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4 rounded-l-xl">Fecha</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Concepto / Detalle</th>
                  <th className="py-3 px-4">Medio de Pago</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                  <th className="py-3 px-4 text-center rounded-r-xl">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredExpenses.map((item) => {
                  const isIncome = item.type === 'income';
                  return (
                    <tr key={item.id} className="hover:bg-purple-50/30 transition-colors group">
                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {item.date || new Date().toISOString().split('T')[0]}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isIncome ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            <ArrowDownRight className="w-3 h-3" />
                            <span>Ingreso</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Egreso</span>
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100 text-slate-800">
                          {item.category || (isIncome ? 'Ingreso Extra' : 'Otros')}
                        </span>
                      </td>

                      {/* Description & Notes */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{item.description}</p>
                        {item.notes && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.notes}</p>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-600">
                        {item.payment_method || 'Efectivo'}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-black text-sm">
                        <span className={isIncome ? 'text-emerald-600' : 'text-rose-600'}>
                          {isIncome ? '+' : '-'}${Number(item.amount || 0).toFixed(2)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar"
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
        )}

        {/* Subtotal of filtered items */}
        {filteredExpenses.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
            <span>Mostrando {filteredExpenses.length} registro(s)</span>
            <div className="flex items-center space-x-4">
              {totalFilteredIncomes > 0 && (
                <span className="text-emerald-700">Ingresos filtrados: +${totalFilteredIncomes.toFixed(2)}</span>
              )}
              <span className="text-rose-700">Gastos filtrados: -${totalFilteredExpenses.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal Create/Edit Movement */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 z-10 space-y-6 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                    formData.type === 'expense' ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}>
                    {formData.type === 'expense' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-slate-900 text-lg">
                      {editingItem ? 'Editar Movimiento' : (formData.type === 'expense' ? 'Registrar Nuevo Gasto' : 'Registrar Ingreso Extra')}
                    </h3>
                    <p className="text-xs text-slate-500">Cargá el detalle para tu libro financiero</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Type toggle */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, type: 'expense', category: 'Packaging y Bandejas' });
                    }}
                    className={formData.type === 'expense' ? 'py-2 rounded-xl transition-all bg-rose-600 text-white shadow-sm' : 'py-2 rounded-xl transition-all text-rose-950/70 hover:text-rose-950'}
                  >
                    💸 Gasto / Egreso
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, type: 'income', category: 'Venta Externa / Evento' });
                    }}
                    className={formData.type === 'income' ? 'py-2 rounded-xl transition-all bg-emerald-600 text-white shadow-sm' : 'py-2 rounded-xl transition-all text-emerald-950/70 hover:text-emerald-950'}
                  >
                    💰 Ingreso Extra
                  </button>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Categoría:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all"
                  >
                    {formData.type === 'expense' ? (
                      <>
                        <option value="Packaging y Bandejas">📦 Packaging y Bandejas (Bolsas, cajas, selladoras)</option>
                        <option value="Materia Prima y Golosinas">🍬 Materia Prima y Golosinas (Bultos, gomitas)</option>
                        <option value="Envíos y Fletes">🚚 Envíos, Cadetes y Fletes</option>
                        <option value="Servicios y Local">💡 Servicios, Alquiler y Luz</option>
                        <option value="Insumos y Limpieza">🏷️ Insumos, Limpieza y Guantes</option>
                        <option value="Publicidad y Marketing">📢 Publicidad y Marketing</option>
                        <option value="Otros Gastos">⚙️ Otros Gastos Generales</option>
                      </>
                    ) : (
                      <>
                        <option value="Venta Externa / Evento">💰 Venta Externa / Evento / Feria</option>
                        <option value="Aporte de Capital">💵 Aporte de Capital Inicial / Socio</option>
                        <option value="Otros Ingresos">✨ Otros Ingresos</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Concept / Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Concepto / Descripción: *</label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={formData.type === 'expense' ? 'Ej: 100 bandejas plásticas 500g + 200 moños' : 'Ej: Venta de golosinas en evento barrial'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                </div>

                {/* Amount & Payment Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Monto ($): *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                        className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Medio de Pago:</label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all"
                    >
                      <option value="Efectivo">💵 Efectivo</option>
                      <option value="Transferencia">🏦 Transferencia Bancaria</option>
                    </select>
                  </div>
                </div>

                {/* Date & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Fecha:</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Notas / Proveedor (opcional):</label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Ej: Comprado en Distribuidora La Rioja"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </div>
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={submitting}
                    className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-6 py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 ${
                      formData.type === 'expense'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {submitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>{editingItem ? 'Guardar Cambios' : (formData.type === 'expense' ? 'Guardar Gasto' : 'Guardar Ingreso')}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
