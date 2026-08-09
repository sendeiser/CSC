import React, { useState, useEffect } from 'react';
import { Truck, Store, ShoppingBag, Save, RefreshCw, AlertCircle, CheckCircle2, MapPin, Clock, DollarSign, Gift, Info } from 'lucide-react';
import { admin as adminApi } from '../lib/api';
import { useModal } from '../context/ModalContext';
import { StoreSettings } from '../types';

export const AdminShippingEditor: React.FC = () => {
  const { showAlert } = useModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Partial<StoreSettings>>({
    fulfillment_type: 'both',
    delivery_cost: 0,
    free_delivery_over: 0,
    pickup_address: 'Local Chamical Candy Shop - Calle Principal #123, Chamical',
    pickup_schedule: 'Lunes a Sábado de 09:00 a 20:00 hs',
    delivery_notes: 'Envíos en el día dentro del radio urbano de Chamical.',
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getStoreSettings();
      if (res) {
        setSettings({
          ...res,
          fulfillment_type: res.fulfillment_type || 'both',
          delivery_cost: Number(res.delivery_cost || 0),
          free_delivery_over: Number(res.free_delivery_over || 0),
          pickup_address: res.pickup_address || 'Local Chamical Candy Shop - Calle Principal #123, Chamical',
          pickup_schedule: res.pickup_schedule || 'Lunes a Sábado de 09:00 a 20:00 hs',
          delivery_notes: res.delivery_notes || 'Envíos en el día dentro del radio urbano de Chamical.',
        });
      }
    } catch (err: any) {
      showAlert({ title: 'Error al cargar', message: err.message || 'Error al obtener la configuración de envíos', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await adminApi.saveStoreSettings(settings);
      showAlert({
        title: '¡Configuración Guardada!',
        message: 'Las opciones de envío y retiro se actualizaron correctamente para tus clientes.',
        type: 'success'
      });
    } catch (err: any) {
      showAlert({ title: 'Error al guardar', message: err.message || 'No se pudieron guardar las opciones de envío', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <span className="text-sm font-bold text-slate-600">Cargando configuración de envíos...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-2 border border-purple-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-600/40 rounded-2xl border border-purple-400/30">
            <Truck className="w-7 h-7 text-pink-300" />
          </div>
          <div>
            <h2 className="font-headline font-black text-xl sm:text-2xl text-white">
              Opciones de Entrega (Delivery / Retiro en Local)
            </h2>
            <p className="text-xs sm:text-sm text-purple-200">
              Especificá si tu tienda realiza envíos a domicilio, solo retiro en tienda o ambas modalidades.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Fulfillment Mode Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-headline font-bold text-base text-slate-900 flex items-center space-x-2">
              <span>Modalidad de Entrega de la Tienda</span>
            </h3>
            <p className="text-xs text-slate-500">Seleccioná cómo recibirán sus compras los clientes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Both Option */}
          <button
            type="button"
            onClick={() => setSettings(prev => ({ ...prev, fulfillment_type: 'both' }))}
            className={`p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
              settings.fulfillment_type === 'both'
                ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-200 shadow-md'
                : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-slate-50'
            }`}
          >
            {settings.fulfillment_type === 'both' && (
              <span className="absolute top-3 right-3 text-purple-600">
                <CheckCircle2 className="w-5 h-5" />
              </span>
            )}
            <div className="space-y-2">
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl w-fit">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h4 className="font-headline font-bold text-sm text-slate-900">
                Ambas Opciones (Retiro y Delivery)
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                El cliente puede elegir en el carrito entre retirar por el local o solicitar envío a domicilio.
              </p>
            </div>
            <span className="mt-3 inline-block text-[11px] font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full w-fit">
              Recomendado
            </span>
          </button>

          {/* Pickup Only */}
          <button
            type="button"
            onClick={() => setSettings(prev => ({ ...prev, fulfillment_type: 'pickup_only' }))}
            className={`p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
              settings.fulfillment_type === 'pickup_only'
                ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-200 shadow-md'
                : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'
            }`}
          >
            {settings.fulfillment_type === 'pickup_only' && (
              <span className="absolute top-3 right-3 text-indigo-600">
                <CheckCircle2 className="w-5 h-5" />
              </span>
            )}
            <div className="space-y-2">
              <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl w-fit">
                <Store className="w-6 h-6" />
              </div>
              <h4 className="font-headline font-bold text-sm text-slate-900">
                Solo Retiro en Local / Tienda
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                No hay envíos a domicilio. El cliente deberá acudir a retirar su compra personalmente.
              </p>
            </div>
            <span className="mt-3 inline-block text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full w-fit">
              Solo Retiro
            </span>
          </button>

          {/* Delivery Only */}
          <button
            type="button"
            onClick={() => setSettings(prev => ({ ...prev, fulfillment_type: 'delivery_only' }))}
            className={`p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
              settings.fulfillment_type === 'delivery_only'
                ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-200 shadow-md'
                : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-slate-50'
            }`}
          >
            {settings.fulfillment_type === 'delivery_only' && (
              <span className="absolute top-3 right-3 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </span>
            )}
            <div className="space-y-2">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl w-fit">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="font-headline font-bold text-sm text-slate-900">
                Solo Envío a Domicilio / Delivery
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Todos los pedidos se despachan a la dirección indicada por el cliente durante la compra.
              </p>
            </div>
            <span className="mt-3 inline-block text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full w-fit">
              Solo Delivery
            </span>
          </button>
        </div>
      </div>

      {/* 2. Pickup Location Details (if pickup is enabled) */}
      {(settings.fulfillment_type === 'both' || settings.fulfillment_type === 'pickup_only') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h3 className="font-headline font-bold text-base text-slate-900 flex items-center space-x-2">
            <Store className="w-5 h-5 text-indigo-600" />
            <span>Datos del Local para Retiros</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>Dirección Completa del Local *</span>
              </label>
              <input
                type="text"
                value={settings.pickup_address || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, pickup_address: e.target.value }))}
                placeholder="ej: Chamical Candy Shop, Av. Castro Barros N° 123, Chamical"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">Se mostrará a los clientes que elijan retirar en tienda.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Horarios de Atención para Retiro</span>
              </label>
              <input
                type="text"
                value={settings.pickup_schedule || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, pickup_schedule: e.target.value }))}
                placeholder="ej: Lunes a Sábados de 09:00 a 20:00 hs"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">Indica en qué días y horarios pueden pasar por la tienda.</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Delivery Pricing & Coverage Details (if delivery is enabled) */}
      {(settings.fulfillment_type === 'both' || settings.fulfillment_type === 'delivery_only') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h3 className="font-headline font-bold text-base text-slate-900 flex items-center space-x-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <span>Tarifas y Cobertura de Delivery</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Costo de Envío a Domicilio ($)</span>
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={settings.delivery_cost || 0}
                onChange={(e) => setSettings(prev => ({ ...prev, delivery_cost: Number(e.target.value || 0) }))}
                placeholder="0 (Gratis) o monto fijo"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">Si es $0, se mostrará como Envío Gratis por defecto.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                <Gift className="w-4 h-4 text-pink-600" />
                <span>Monto Mínimo para Envío Gratis ($)</span>
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={settings.free_delivery_over || 0}
                onChange={(e) => setSettings(prev => ({ ...prev, free_delivery_over: Number(e.target.value || 0) }))}
                placeholder="ej: 5000 (0 para no aplicar)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">A partir de esta suma en carrito, el envío pasa a ser $0 automáticamente.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                <Info className="w-4 h-4 text-purple-600" />
                <span>Notas / Zona de Cobertura del Delivery</span>
              </label>
              <input
                type="text"
                value={settings.delivery_notes || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, delivery_notes: e.target.value }))}
                placeholder="ej: Envíos en el día dentro del radio urbano de Chamical / Alrededores."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center space-x-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-purple-500/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          {saving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Guardando Cambios...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Guardar Opciones de Entrega</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
