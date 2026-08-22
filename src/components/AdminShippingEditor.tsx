import React, { useState, useEffect } from 'react';
import { Truck, Store, ShoppingBag, Save, RefreshCw, AlertCircle, CheckCircle2, MapPin, Clock, DollarSign, Gift, Info, Landmark, Copy, Check, Sparkles, CreditCard, Building2, UserCheck, ShieldCheck } from 'lucide-react';
import { admin as adminApi } from '../lib/api';
import { useModal } from '../context/ModalContext';
import { StoreSettings } from '../types';
import { setBankData } from '../lib/whatsapp';

export const AdminShippingEditor: React.FC = () => {
  const { showAlert } = useModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedAlias, setCopiedAlias] = useState(false);

  const [settings, setSettings] = useState<Partial<StoreSettings>>({
    fulfillment_type: 'both',
    delivery_cost: 0,
    free_delivery_over: 0,
    pickup_address: 'Local Chamical Candy Shop - Calle Principal #123, Chamical',
    pickup_schedule: 'Lunes a Sábado de 09:00 a 20:00 hs',
    delivery_notes: 'Envíos en el día dentro del radio urbano de Chamical.',
    bank_alias: 'martinchox33',
    bank_name: 'MercadoPago',
    bank_holder: 'Gonzalez Martin Gustavo',
    bank_cbu: '',
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
          bank_alias: res.bank_alias || 'martinchox33',
          bank_name: res.bank_name || 'MercadoPago',
          bank_holder: res.bank_holder || 'Gonzalez Martin Gustavo',
          bank_cbu: res.bank_cbu || '',
        });
        setBankData(res);
      }
    } catch (err: any) {
      showAlert({ title: 'Error al cargar', message: err.message || 'Error al obtener la configuración', type: 'error' });
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
      const updated = await adminApi.saveStoreSettings(settings);
      setBankData(updated || settings);
      showAlert({
        title: '¡Configuración Guardada!',
        message: 'Los datos bancarios (Alias, Banco, Titular) y las opciones de entrega se actualizaron correctamente para todos los clientes.',
        type: 'success'
      });
    } catch (err: any) {
      showAlert({ title: 'Error al guardar', message: err.message || 'No se pudieron guardar los cambios', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyAlias = () => {
    if (!settings.bank_alias) return;
    navigator.clipboard.writeText(settings.bank_alias);
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 2000);
  };

  const QUICK_BANKS = ['MercadoPago', 'Santander', 'Ualá', 'Brubank', 'Galicia', 'Banco Nación', 'Personal Pay', 'Banco Macro'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <span className="text-sm font-bold text-slate-600">Cargando configuración de envíos y pagos...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-2 border border-purple-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-600/40 rounded-2xl border border-purple-400/30">
            <Landmark className="w-7 h-7 text-pink-300" />
          </div>
          <div>
            <h2 className="font-headline font-black text-xl sm:text-2xl text-white">
              Datos Bancarios (Alias / Pagos) y Opciones de Entrega
            </h2>
            <p className="text-xs sm:text-sm text-purple-200">
              Modificá el Alias y datos de transferencia que ven los clientes al pagar, además de las tarifas y modalidades de entrega.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 1: DATOS BANCARIOS PARA TRANSFERENCIAS (ALIAS, BANCO, TITULAR)     */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-purple-200 p-6 space-y-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-headline font-bold text-base text-slate-900 flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <CreditCard className="w-5 h-5" />
              </span>
              <span>Datos Bancarios para Pago por Transferencia</span>
            </h3>
            <p className="text-xs text-slate-500">
              Esta información se mostrará automáticamente al cliente en la pantalla de compra, en su resumen y en el mensaje de WhatsApp.
            </p>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold rounded-full">
            Transferencia / CVU
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ALIAS BANCARIO */}
          <div className="md:col-span-2 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-2xl p-4.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-purple-950 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-pink-600" />
                <span>Alias de Transferencia (Clave para tus clientes) *</span>
              </label>
              <span className="text-[10px] font-bold text-purple-700 bg-white/80 border border-purple-200 px-2 py-0.5 rounded-md">
                Se copia con 1 clic
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                type="text"
                required
                value={settings.bank_alias || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, bank_alias: e.target.value.trim() }))}
                placeholder="ej: martinchox33 o candyshop.chamical"
                className="w-full pl-4 pr-24 py-3 rounded-xl border-2 border-purple-400 bg-white text-base font-mono font-black text-purple-900 outline-none focus:ring-4 focus:ring-purple-300/50 shadow-inner"
              />
              <button
                type="button"
                onClick={handleCopyAlias}
                className="absolute right-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer shadow-sm"
              >
                {copiedAlias ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAlias ? '¡Copiado!' : 'Probar'}</span>
              </button>
            </div>
            <p className="text-[11px] text-purple-800">
              💡 Este es el <strong>Alias</strong> exacto que los compradores usarán en MercadoPago, Ualá o su Home Banking.
            </p>
          </div>

          {/* BANCO O BILLETERA */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Banco o Billetera Virtual *</span>
            </label>
            <input
              type="text"
              required
              value={settings.bank_name || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, bank_name: e.target.value }))}
              placeholder="ej: MercadoPago, Santander, Ualá..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            />
            {/* Chips rápidos */}
            <div className="flex flex-wrap gap-1 pt-1">
              {QUICK_BANKS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, bank_name: b }))}
                  className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold transition-all cursor-pointer ${
                    settings.bank_name === b
                      ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-purple-50 hover:text-purple-700'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* TITULAR DE LA CUENTA */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4 text-purple-600" />
              <span>Nombre del Titular de la Cuenta *</span>
            </label>
            <input
              type="text"
              required
              value={settings.bank_holder || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, bank_holder: e.target.value }))}
              placeholder="ej: Gonzalez Martin Gustavo"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            />
            <p className="text-[11px] text-slate-400">Nombre completo tal como figura en la cuenta bancaria.</p>
          </div>

          {/* CBU / CVU NUMÉRICO (OPCIONAL) */}
          <div className="md:col-span-2 space-y-1">
            <label className="block text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>CBU / CVU Numérico (Opcional - 22 dígitos)</span>
            </label>
            <input
              type="text"
              maxLength={22}
              value={settings.bank_cbu || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, bank_cbu: e.target.value.replace(/[^0-9]/g, '') }))}
              placeholder="00000031000... (Opcional si solo usas Alias)"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            />
          </div>
        </div>

        {/* LIVE PREVIEW DE LA TARJETA DE TRANSFERENCIA */}
        <div className="bg-slate-50 border border-purple-100 rounded-2xl p-4 space-y-2">
          <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block flex items-center space-x-1">
            <span>👁️ Vista previa de cómo lo verá tu cliente:</span>
          </span>
          <div className="max-w-md mx-auto bg-gradient-to-br from-purple-50 to-pink-50 border border-pink-200 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="font-headline font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                <Landmark className="w-4 h-4 text-purple-600" />
                <span>Pagá por transferencia</span>
              </h4>
              <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                {settings.bank_name || 'Banco'}
              </span>
            </div>

            <div className="bg-white rounded-xl p-3 space-y-1.5 text-xs border border-pink-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Banco / Billetera</span>
                <span className="font-semibold text-slate-800">{settings.bank_name || 'MercadoPago'}</span>
              </div>
              <div className="flex justify-between items-center bg-purple-50/70 px-2 py-1 rounded-lg">
                <span className="text-purple-900 font-bold">Alias</span>
                <span className="font-mono font-black text-purple-700 text-sm">{settings.bank_alias || 'sin-alias'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Titular</span>
                <span className="font-semibold text-slate-800">{settings.bank_holder || 'Titular'}</span>
              </div>
              {settings.bank_cbu && (
                <div className="flex justify-between">
                  <span className="text-slate-500">CBU/CVU</span>
                  <span className="font-mono text-[11px] text-slate-700">{settings.bank_cbu}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 2: MODALIDAD DE ENTREGA (DELIVERY / RETIRO EN LOCAL)              */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-headline font-bold text-base text-slate-900 flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-pink-100 text-pink-700">
                <Truck className="w-5 h-5" />
              </span>
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
              Solo Tienda
            </span>
          </button>

          {/* Delivery Only */}
          <button
            type="button"
            onClick={() => setSettings(prev => ({ ...prev, fulfillment_type: 'delivery_only' }))}
            className={`p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
              settings.fulfillment_type === 'delivery_only'
                ? 'border-pink-600 bg-pink-50/60 ring-2 ring-pink-200 shadow-md'
                : 'border-slate-200 bg-white hover:border-pink-200 hover:bg-slate-50'
            }`}
          >
            {settings.fulfillment_type === 'delivery_only' && (
              <span className="absolute top-3 right-3 text-pink-600">
                <CheckCircle2 className="w-5 h-5" />
              </span>
            )}
            <div className="space-y-2">
              <div className="p-2.5 bg-pink-100 text-pink-700 rounded-xl w-fit">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="font-headline font-bold text-sm text-slate-900">
                Solo Envíos a Domicilio
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                No hay opción de retiro en local. Todas las compras son enviadas directamente al domicilio.
              </p>
            </div>
            <span className="mt-3 inline-block text-[11px] font-bold text-pink-700 bg-pink-100 px-2.5 py-0.5 rounded-full w-fit">
              Solo Envíos
            </span>
          </button>
        </div>
      </div>

      {/* 2. Pickup Details (if fulfillment includes pickup) */}
      {settings.fulfillment_type !== 'delivery_only' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Store className="w-5 h-5 text-indigo-600" />
            <h3 className="font-headline font-bold text-base text-slate-900">
              Datos para Retiro en Tienda / Local
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-purple-600" />
                <span>Dirección de Retiro</span>
              </label>
              <input
                type="text"
                value={settings.pickup_address || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, pickup_address: e.target.value }))}
                placeholder="ej: Calle Principal #123, Chamical"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Horarios de Atención / Retiro</span>
              </label>
              <input
                type="text"
                value={settings.pickup_schedule || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, pickup_schedule: e.target.value }))}
                placeholder="ej: Lunes a Sábado de 09:00 a 20:00 hs"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Delivery Rates and Thresholds (if fulfillment includes delivery) */}
      {settings.fulfillment_type !== 'pickup_only' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Truck className="w-5 h-5 text-pink-600" />
            <h3 className="font-headline font-bold text-base text-slate-900">
              Tarifas y Condiciones de Envío a Domicilio
            </h3>
          </div>

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
              <span>Guardando Datos...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Guardar Datos Bancarios y Envíos</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
