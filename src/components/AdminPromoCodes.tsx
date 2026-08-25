import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Search, 
  Copy, 
  Sparkles, 
  Percent, 
  Calendar, 
  Users, 
  RefreshCw,
  AlertCircle,
  Tag,
  CheckCircle2,
  Clock,
  Power
} from 'lucide-react';
import { admin as adminApi } from '../lib/api';

interface PromoCode {
  id: string;
  code: string;
  percent: number;
  active: boolean;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  created_at: string;
}

const DISCOUNT_PRESETS = [10, 15, 20, 25, 30, 50];

export const AdminPromoCodes: React.FC = () => {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'exhausted'>('all');

  // Formulario nuevo cupón
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newPercent, setNewPercent] = useState<number>(15);
  const [newMaxUses, setNewMaxUses] = useState<string>('50');
  const [newExpiresAt, setNewExpiresAt] = useState<string>('');
  const [newActive, setNewActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal de edición
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editPercent, setEditPercent] = useState<number>(15);
  const [editMaxUses, setEditMaxUses] = useState<string>('');
  const [editExpiresAt, setEditExpiresAt] = useState<string>('');
  const [editActive, setEditActive] = useState<boolean>(true);
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Notificación toast interna
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadPromos = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getPromoCodes();
      setPromos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast(err.message || 'Error al cargar cupones', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromos();
  }, []);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanCode = newCode.trim().toUpperCase();
    if (!cleanCode) {
      setFormError('Por favor ingresá un código para el cupón.');
      return;
    }
    if (!newPercent || newPercent <= 0 || newPercent > 100) {
      setFormError('El porcentaje de descuento debe estar entre 1% y 100%.');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminApi.createPromoCode({
        code: cleanCode,
        percent: Number(newPercent),
        max_uses: newMaxUses.trim() !== '' ? Number(newMaxUses) : null,
        expires_at: newExpiresAt ? new Date(newExpiresAt).toISOString() : null,
        active: newActive,
      });

      showToast(`¡Cupón "${cleanCode}" creado con éxito!`);
      setNewCode('');
      setNewPercent(15);
      setNewMaxUses('50');
      setNewExpiresAt('');
      setNewActive(true);
      setShowCreateForm(false);
      await loadPromos();
    } catch (err: any) {
      setFormError(err.message || 'Error al crear el cupón');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (promo: PromoCode) => {
    setEditingPromo(promo);
    setEditCode(promo.code);
    setEditPercent(promo.percent);
    setEditMaxUses(promo.max_uses !== null ? String(promo.max_uses) : '');
    setEditExpiresAt(promo.expires_at ? promo.expires_at.slice(0, 10) : '');
    setEditActive(promo.active);
    setEditError('');
  };

  const handleUpdatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo) return;
    setEditError('');

    const cleanCode = editCode.trim().toUpperCase();
    if (!cleanCode) {
      setEditError('El código no puede estar vacío.');
      return;
    }

    setIsEditingSubmitting(true);
    try {
      await adminApi.updatePromoCode(editingPromo.id, {
        code: cleanCode,
        percent: Number(editPercent),
        max_uses: editMaxUses.trim() !== '' ? Number(editMaxUses) : null,
        expires_at: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
        active: editActive,
      });

      showToast(`¡Cupón "${cleanCode}" actualizado correctamente!`);
      setEditingPromo(null);
      await loadPromos();
    } catch (err: any) {
      setEditError(err.message || 'Error al actualizar el cupón');
    } finally {
      setIsEditingSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, code: string, currentStatus: boolean) => {
    try {
      await adminApi.togglePromoCode(id);
      showToast(`Cupón ${code} ${!currentStatus ? 'activado' : 'pausado'}.`);
      setPromos(prev => prev.map(p => p.id === id ? { ...p, active: !currentStatus } : p));
    } catch (err: any) {
      showToast(err.message || 'Error al cambiar estado', 'error');
    }
  };

  const handleDeletePromo = async (id: string, code: string) => {
    if (!window.confirm(`¿Estás seguro de que deseás eliminar permanentemente el cupón "${code}"?`)) {
      return;
    }

    try {
      await adminApi.deletePromoCode(id);
      showToast(`Cupón "${code}" eliminado.`);
      setPromos(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar cupón', 'error');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtrado
  const filteredPromos = promos.filter(p => {
    const matchesSearch = p.code.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    const isExhausted = p.max_uses !== null && p.used_count >= p.max_uses;
    const isExpired = p.expires_at ? new Date(p.expires_at).getTime() < Date.now() : false;

    if (filterStatus === 'active') return p.active && !isExhausted && !isExpired;
    if (filterStatus === 'inactive') return !p.active;
    if (filterStatus === 'exhausted') return isExhausted || isExpired;
    return true;
  });

  const totalUsed = promos.reduce((sum, p) => sum + (p.used_count || 0), 0);
  const activeCount = promos.filter(p => {
    const isExhausted = p.max_uses !== null && p.used_count >= p.max_uses;
    const isExpired = p.expires_at ? new Date(p.expires_at).getTime() < Date.now() : false;
    return p.active && !isExhausted && !isExpired;
  }).length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold flex items-center space-x-2 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-pink-600 text-white flex items-center justify-center shadow-sm">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-headline font-extrabold text-slate-900 tracking-tight">
                Cupones de Descuento
              </h1>
              <p className="text-xs text-slate-500">
                Gestioná códigos promocionales, porcentajes y límites de uso para tus clientes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={loadPromos}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-purple-600 hover:border-purple-200 transition-colors shadow-xs"
            title="Recargar cupones"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 candy-gradient-bg text-white text-sm font-bold rounded-xl shadow-md hover:opacity-95 transition-all"
          >
            {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showCreateForm ? 'Cerrar formulario' : 'Nuevo Cupón'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Cupones</p>
            <p className="text-2xl font-headline font-black text-slate-900 mt-1">{promos.length}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Tag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Cupones Activos</p>
            <p className="text-2xl font-headline font-black text-emerald-600 mt-1">{activeCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Canjes Totales</p>
            <p className="text-2xl font-headline font-black text-pink-600 mt-1">{totalUsed}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Formulario Crear Cupón */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreatePromo} className="bg-white rounded-2xl border border-purple-200 shadow-md p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <h3 className="font-headline font-bold text-base text-slate-900">Crear Nuevo Cupón de Descuento</h3>
                </div>
                <span className="text-xs text-purple-600 font-semibold bg-purple-50 px-2.5 py-1 rounded-full">
                  Configuración rápida
                </span>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Código */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Código del Cupón *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="EJ: BIENVENIDA15, DULCE20"
                      value={newCode}
                      onChange={e => setNewCode(e.target.value.toUpperCase())}
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-wider uppercase focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none bg-slate-50/50"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">El código se convertirá automáticamente a mayúsculas.</p>
                </div>

                {/* Porcentaje de Descuento */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    % Descuento *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newPercent}
                      onChange={e => setNewPercent(Number(e.target.value))}
                      required
                      className="w-full pl-3.5 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                    />
                    <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Límite de Usos */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Máximo de Usos
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Sin límite"
                    value={newMaxUses}
                    onChange={e => setNewMaxUses(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                  />
                  <p className="text-[11px] text-slate-400">Dejar vacío para usos ilimitados.</p>
                </div>
              </div>

              {/* Chips de porcentaje rápido */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-500">Presets rápidos:</span>
                <div className="flex flex-wrap gap-1.5">
                  {DISCOUNT_PRESETS.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewPercent(p)}
                      className={newPercent === p ? 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-purple-700 text-white shadow-xs' : 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-purple-50 text-purple-950 border border-purple-200 hover:bg-purple-100'}
                    >
                      {p}% OFF
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                {/* Fecha de Expiración */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Fecha de Expiración (Opcional)
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={newExpiresAt}
                      onChange={e => setNewExpiresAt(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Dejar vacío si no tiene fecha de vencimiento.</p>
                </div>

                {/* Estado Activo */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Estado Inicial
                  </label>
                  <div className="flex items-center space-x-3 pt-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newActive}
                        onChange={e => setNewActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                    <span className="text-sm font-semibold text-slate-700">
                      {newActive ? 'Activo para compras' : 'Pausado / Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 candy-gradient-bg text-white rounded-xl text-sm font-bold shadow-md hover:opacity-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Guardando...' : 'Guardar Cupón'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'active', label: 'Activos' },
            { id: 'inactive', label: 'Inactivos' },
            { id: 'exhausted', label: 'Agotados / Expirados' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Cupones */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-500">Cargando cupones...</p>
          </div>
        ) : filteredPromos.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto text-2xl border border-slate-200">
              🎟️
            </div>
            <p className="text-base font-bold text-slate-700">No se encontraron cupones</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {searchTerm || filterStatus !== 'all'
                ? 'No hay cupones que coincidan con los filtros actuales.'
                : 'Todavía no creaste ningún cupón de descuento. Creá el primero arriba.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Código</th>
                  <th className="px-5 py-3.5">Descuento</th>
                  <th className="px-5 py-3.5">Usos / Límite</th>
                  <th className="px-5 py-3.5">Vencimiento</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPromos.map(promo => {
                  const isExhausted = promo.max_uses !== null && promo.used_count >= promo.max_uses;
                  const isExpired = promo.expires_at ? new Date(promo.expires_at).getTime() < Date.now() : false;
                  const usagePercent = promo.max_uses ? Math.min(100, Math.round((promo.used_count / promo.max_uses) * 100)) : null;

                  return (
                    <tr key={promo.id} className="hover:bg-slate-50 transition-colors">
                      {/* Código + Copiar */}
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-extrabold text-sm px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 tracking-wider">
                            {promo.code}
                          </span>
                          <button
                            onClick={() => copyToClipboard(promo.code, promo.id)}
                            className="p-1.5 text-slate-500 hover:text-purple-700 rounded-md hover:bg-slate-100 transition-colors"
                            title="Copiar código"
                          >
                            {copiedId === promo.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Descuento */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-pink-100 text-pink-700">
                          {promo.percent}% OFF
                        </span>
                      </td>

                      {/* Usos / Límite con barra */}
                      <td className="px-5 py-4">
                        <div className="space-y-1 max-w-[130px]">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span>{promo.used_count} canjes</span>
                            <span className="text-slate-400 font-normal">
                              {promo.max_uses ? `/ ${promo.max_uses}` : '(Ilimitado)'}
                            </span>
                          </div>
                          {usagePercent !== null && (
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  usagePercent >= 100
                                    ? 'bg-red-500'
                                    : usagePercent >= 75
                                    ? 'bg-amber-500'
                                    : 'bg-purple-600'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Vencimiento */}
                      <td className="px-5 py-4 text-xs">
                        {promo.expires_at ? (
                          <div className="flex items-center space-x-1 text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className={isExpired ? 'text-red-500 font-bold' : ''}>
                              {new Date(promo.expires_at).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sin vencimiento</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-4">
                        {isExpired ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                            <Clock className="w-3 h-3" />
                            <span>Expirado</span>
                          </span>
                        ) : isExhausted ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle className="w-3 h-3" />
                            <span>Agotado</span>
                          </span>
                        ) : promo.active ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Activo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <Power className="w-3 h-3" />
                            <span>Pausado</span>
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Toggle active */}
                          <button
                            onClick={() => handleToggleActive(promo.id, promo.code, promo.active)}
                            className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              promo.active
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={promo.active ? 'Pausar cupón' : 'Activar cupón'}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(promo)}
                            className="p-1.5 text-slate-500 hover:text-purple-700 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Editar cupón"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeletePromo(promo.id, promo.code)}
                            className="p-1.5 text-slate-500 hover:text-red-700 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Eliminar cupón"
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
      </div>

      {/* Modal Editar Cupón */}
      {editingPromo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4" />
                <h3 className="font-headline font-bold text-base">Editar Cupón: {editingPromo.code}</h3>
              </div>
              <button
                onClick={() => setEditingPromo(null)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePromo} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Código *
                  </label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={e => setEditCode(e.target.value.toUpperCase())}
                    required
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    % Descuento *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={editPercent}
                      onChange={e => setEditPercent(Number(e.target.value))}
                      required
                      className="w-full px-3.5 pr-8 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                    />
                    <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Máximo de Usos
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Sin límite"
                    value={editMaxUses}
                    onChange={e => setEditMaxUses(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={editExpiresAt}
                    onChange={e => setEditExpiresAt(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={e => setEditActive(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded-md border-slate-300 focus:ring-purple-500"
                  />
                  <span className="text-sm font-semibold text-slate-700">Cupón Activo para compras</span>
                </label>
              </div>

              <div className="flex justify-end items-center space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPromo(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isEditingSubmitting}
                  className="px-6 py-2 candy-gradient-bg text-white rounded-xl text-sm font-bold shadow-md hover:opacity-95 transition-all disabled:opacity-50"
                >
                  {isEditingSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
