import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Save, RefreshCw, HelpCircle, Check, Info, Phone, MessageCircle, RotateCcw, Copy, Sparkles, Smartphone, Plus } from 'lucide-react';
import { admin as adminApi, homepage as homepageApi } from '../lib/api';
import { useModal } from '../context/ModalContext';
import { DEFAULT_WHATSAPP_TEMPLATES, setWhatsAppNumbers, setWhatsAppTemplates } from '../lib/whatsapp';

export const AdminWhatsAppEditor: React.FC = () => {
  const { showAlert } = useModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'transfer' | 'mercadopago' | 'general' | 'status' | 'numbers'>('transfer');

  const [form, setForm] = useState({
    whatsapp_number_1: '543826432180',
    whatsapp_number_2: '5493826432180',
    active_whatsapp_number: 'num1',
    msg_transfer: DEFAULT_WHATSAPP_TEMPLATES.msg_transfer,
    msg_mercadopago: DEFAULT_WHATSAPP_TEMPLATES.msg_mercadopago,
    msg_general_inquiry: DEFAULT_WHATSAPP_TEMPLATES.msg_general_inquiry,
    msg_order_status: DEFAULT_WHATSAPP_TEMPLATES.msg_order_status,
  });

  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await homepageApi.getSettings();
      if (data) {
        setForm({
          whatsapp_number_1: data.whatsapp_number_1 || '543826432180',
          whatsapp_number_2: data.whatsapp_number_2 || '5493826432180',
          active_whatsapp_number: data.active_whatsapp_number || 'num1',
          msg_transfer: data.msg_transfer || DEFAULT_WHATSAPP_TEMPLATES.msg_transfer,
          msg_mercadopago: data.msg_mercadopago || DEFAULT_WHATSAPP_TEMPLATES.msg_mercadopago,
          msg_general_inquiry: data.msg_general_inquiry || DEFAULT_WHATSAPP_TEMPLATES.msg_general_inquiry,
          msg_order_status: data.msg_order_status || DEFAULT_WHATSAPP_TEMPLATES.msg_order_status,
        });
      }
    } catch (err: any) {
      console.error('Error al cargar configuración de WhatsApp:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await adminApi.saveStoreSettings(form);
      setWhatsAppNumbers(form.whatsapp_number_1, form.whatsapp_number_2);
      setWhatsAppTemplates(form);
      showAlert({
        title: '¡Mensajes Guardados!',
        message: 'Los mensajes por defecto de WhatsApp han sido actualizados con éxito.',
        type: 'info',
      });
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: err.message || 'Error al guardar los mensajes de WhatsApp',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetTemplate = (key: keyof typeof DEFAULT_WHATSAPP_TEMPLATES) => {
    setForm((prev) => ({
      ...prev,
      [key]: DEFAULT_WHATSAPP_TEMPLATES[key],
    }));
  };

  const insertTag = (field: keyof typeof form, tag: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field] + ' ' + tag,
    }));
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 1500);
  };

  const renderWhatsAppPreview = (rawText: string) => {
    const sampleText = rawText
      .replace(/\{numero_pedido\}/g, 'A1B2C3D4')
      .replace(/\{detalle_productos\}/g, '• 500g Gomitas Dulces = $2,500.00\n• 2x Chocolate Block = $1,800.00')
      .replace(/\{subtotal\}/g, '$4,300.00')
      .replace(/\{descuento_linea\}/g, '*Descuento:* -$300.00\n')
      .replace(/\{descuento\}/g, '$300.00')
      .replace(/\{monto_total\}/g, '$4,000.00')
      .replace(/\{banco\}/g, 'MercadoPago')
      .replace(/\{alias\}/g, 'martinchox33')
      .replace(/\{cbu_linea\}/g, '')
      .replace(/\{cbu\}/g, '00000031000123456789')
      .replace(/\{titular\}/g, 'Gonzalez Martin Gustavo')
      .replace(/\{nombre_cliente\}/g, 'Juan Pérez')
      .replace(/\{telefono_linea\}/g, 'Teléfono: 3826123456\n')
      .replace(/\{telefono_cliente\}/g, '3826123456')
      .replace(/\{direccion_linea\}/g, 'Notas / Dirección: Av. San Martín 123\n')
      .replace(/\{direccion_cliente\}/g, 'Av. San Martín 123')
      .replace(/\{estado_pedido\}/g, 'En Preparación');

    // Convert *bold* to <strong>
    const formattedLines = sampleText.split('\n').map((line, idx) => {
      const parts = line.split(/(\*[^*]+\*)/g);
      return (
        <div key={idx} className="min-h-[1.2em]">
          {parts.map((part, pIdx) => {
            if (part.startsWith('*') && part.endsWith('*')) {
              return <strong key={pIdx} className="font-extrabold text-slate-900">{part.slice(1, -1)}</strong>;
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </div>
      );
    });

    return (
      <div className="bg-[#efeae2] p-4 rounded-2xl border border-emerald-900/10 shadow-inner font-sans text-xs sm:text-sm text-slate-800 space-y-2">
        <div className="flex items-center space-x-2 border-b border-emerald-900/10 pb-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white">
            <MessageCircle className="w-4 h-4 fill-white" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-xs block">Vista Previa WhatsApp</span>
            <span className="text-[10px] text-slate-500">Ejemplo de visualización en el teléfono del cliente</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-sm max-w-[92%] relative border border-slate-200/60 leading-relaxed">
          {formattedLines}
          <div className="mt-2 text-right text-[10px] text-slate-400 font-mono">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
          </div>
        </div>
      </div>
    );
  };

  const tagList = [
    { tag: '{numero_pedido}', label: 'N° de Pedido', desc: 'ID de la orden (ej: #A1B2C3D4)' },
    { tag: '{monto_total}', label: 'Monto Total', desc: 'Total final a pagar ($)' },
    { tag: '{detalle_productos}', label: 'Lista de Productos', desc: 'Productos, pesos y cantidades' },
    { tag: '{subtotal}', label: 'Subtotal', desc: 'Subtotal antes del descuento ($)' },
    { tag: '{descuento_linea}', label: 'Línea Descuento', desc: 'Muestra el descuento si aplica' },
    { tag: '{banco}', label: 'Banco / Entidad', desc: 'Nombre del banco (MercadoPago)' },
    { tag: '{alias}', label: 'Alias de CBU', desc: 'Alias para la transferencia' },
    { tag: '{titular}', label: 'Titular de Cuenta', desc: 'Nombre del titular de la cuenta' },
    { tag: '{nombre_cliente}', label: 'Nombre Cliente', desc: 'Nombre de quien compra' },
    { tag: '{telefono_cliente}', label: 'Teléfono Cliente', desc: 'Teléfono de contacto' },
    { tag: '{direccion_cliente}', label: 'Dirección Cliente', desc: 'Notas o dirección de entrega' },
  ];

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Cargando mensajes de WhatsApp...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(16,185,129,0.25),transparent_50%)] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold text-emerald-300">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Personalización de Mensajes Automáticos</span>
            </div>
            <h2 className="font-headline font-black text-2xl sm:text-3xl text-white">
              Mensajes de WhatsApp por Defecto
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Configurá los mensajes predeterminados que se envían cuando un cliente hace un pedido por transferencia bancaria, Mercado Pago o al consultar a la tienda.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            {saving ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <Save className="w-4.5 h-4.5" />}
            <span>{saving ? 'Guardando...' : 'Guardar Mensajes'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('transfer')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'transfer'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Compra por Transferencia</span>
        </button>

        <button
          onClick={() => setActiveTab('mercadopago')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'mercadopago'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Compra Mercado Pago</span>
        </button>

        <button
          onClick={() => setActiveTab('status')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'status'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>Notificación de Estado</span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'general'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Consulta General</span>
        </button>

        <button
          onClick={() => setActiveTab('numbers')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'numbers'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Números de Teléfono</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left / Main Editor Column */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* TAB 1: Transferencia */}
          {activeTab === 'transfer' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-headline font-bold text-base text-slate-900">Mensaje por Defecto: Compra por Transferencia</h3>
                  <p className="text-xs text-slate-500">Se genera automáticamente cuando el cliente finaliza el pedido eligiendo transferencia bancaria.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetTemplate('msg_transfer')}
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-emerald-700 font-semibold px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                  title="Restablecer al mensaje original"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer</span>
                </button>
              </div>

              {/* Tag Quick Inserter */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Insertar Etiqueta Dinámica en el Mensaje:</span>
                <div className="flex flex-wrap gap-1.5">
                  {tagList.map((t) => (
                    <button
                      key={t.tag}
                      type="button"
                      onClick={() => insertTag('msg_transfer', t.tag)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-800 text-xs font-mono font-bold rounded-lg transition-all hover:scale-105 active:scale-95 flex items-center space-x-1 cursor-pointer"
                    >
                      <span>{t.tag}</span>
                      {copiedTag === t.tag ? <Check className="w-3 h-3 text-emerald-600" /> : <Plus className="w-3 h-3 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Plantilla del Mensaje</label>
                <textarea
                  rows={14}
                  value={form.msg_transfer}
                  onChange={(e) => setForm({ ...form, msg_transfer: e.target.value })}
                  className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-xs sm:text-sm font-mono leading-relaxed text-slate-800 bg-slate-50/50 transition-all"
                />
              </div>
            </motion.div>
          )}

          {/* TAB 2: Mercado Pago */}
          {activeTab === 'mercadopago' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-headline font-bold text-base text-slate-900">Mensaje por Defecto: Compra por Mercado Pago</h3>
                  <p className="text-xs text-slate-500">Se genera cuando el cliente paga online con Mercado Pago y notifica a la tienda por WhatsApp.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetTemplate('msg_mercadopago')}
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-emerald-700 font-semibold px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer</span>
                </button>
              </div>

              {/* Tag Quick Inserter */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Insertar Etiqueta Dinámica:</span>
                <div className="flex flex-wrap gap-1.5">
                  {tagList.map((t) => (
                    <button
                      key={t.tag}
                      type="button"
                      onClick={() => insertTag('msg_mercadopago', t.tag)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-800 text-xs font-mono font-bold rounded-lg transition-all hover:scale-105 active:scale-95 flex items-center space-x-1 cursor-pointer"
                    >
                      <span>{t.tag}</span>
                      {copiedTag === t.tag ? <Check className="w-3 h-3 text-emerald-600" /> : <Plus className="w-3 h-3 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div className="space-y-2">
                <textarea
                  rows={14}
                  value={form.msg_mercadopago}
                  onChange={(e) => setForm({ ...form, msg_mercadopago: e.target.value })}
                  className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-xs sm:text-sm font-mono leading-relaxed text-slate-800 bg-slate-50/50 transition-all"
                />
              </div>
            </motion.div>
          )}

          {/* TAB 3: Notificación de Estado */}
          {activeTab === 'status' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-headline font-bold text-base text-slate-900">Mensaje de Notificación de Estado al Cliente</h3>
                  <p className="text-xs text-slate-500">Se usa desde el panel de órdenes cuando hacés clic en "Contactar por WhatsApp" para informar el avance del pedido.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetTemplate('msg_order_status')}
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-emerald-700 font-semibold px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer</span>
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Etiquetas disponibles:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => insertTag('msg_order_status', '{nombre_cliente}')} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-mono font-bold rounded-lg">
                    {'{nombre_cliente}'}
                  </button>
                  <button type="button" onClick={() => insertTag('msg_order_status', '{numero_pedido}')} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-mono font-bold rounded-lg">
                    {'{numero_pedido}'}
                  </button>
                  <button type="button" onClick={() => insertTag('msg_order_status', '{estado_pedido}')} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-mono font-bold rounded-lg">
                    {'{estado_pedido}'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <textarea
                  rows={6}
                  value={form.msg_order_status}
                  onChange={(e) => setForm({ ...form, msg_order_status: e.target.value })}
                  className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-xs sm:text-sm font-mono leading-relaxed text-slate-800 bg-slate-50/50 transition-all"
                />
              </div>
            </motion.div>
          )}

          {/* TAB 4: Consulta General */}
          {activeTab === 'general' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-headline font-bold text-base text-slate-900">Mensaje de Consulta General</h3>
                  <p className="text-xs text-slate-500">Se abre al tocar el botón flotante verde de WhatsApp en la tienda pública.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetTemplate('msg_general_inquiry')}
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-emerald-700 font-semibold px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer</span>
                </button>
              </div>

              <div className="space-y-2">
                <textarea
                  rows={5}
                  value={form.msg_general_inquiry}
                  onChange={(e) => setForm({ ...form, msg_general_inquiry: e.target.value })}
                  className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-xs sm:text-sm font-mono leading-relaxed text-slate-800 bg-slate-50/50 transition-all"
                />
              </div>
            </motion.div>
          )}

          {/* TAB 5: Números de Teléfono */}
          {activeTab === 'numbers' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="font-headline font-bold text-base text-slate-900">Configuración de Teléfonos de WhatsApp</h3>
                <p className="text-xs text-slate-500">Establecé los números receptores para la atención de clientes en Chamical.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Teléfono Principal 1 (Formato Internacional):</label>
                  <input
                    type="text"
                    value={form.whatsapp_number_1}
                    onChange={(e) => setForm({ ...form, whatsapp_number_1: e.target.value })}
                    placeholder="543826432180"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Ejemplo: 543826432180 (incluir código de país sin signo +)</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Teléfono Secundario 2 (Opcional):</label>
                  <input
                    type="text"
                    value={form.whatsapp_number_2}
                    onChange={(e) => setForm({ ...form, whatsapp_number_2: e.target.value })}
                    placeholder="5493826432180"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Línea Activa Principal:</label>
                  <select
                    value={form.active_whatsapp_number}
                    onChange={(e) => setForm({ ...form, active_whatsapp_number: e.target.value as 'num1' | 'num2' })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="num1">Teléfono Principal 1 ({form.whatsapp_number_1})</option>
                    <option value="num2">Teléfono Secundario 2 ({form.whatsapp_number_2})</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

        </div>

        {/* Right Column: Interactive WhatsApp Live Preview & Tag Guide */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Live Preview Container */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-slate-800 font-headline font-bold text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Simulación en Vivo de Mensaje</span>
            </div>
            
            {activeTab === 'transfer' && renderWhatsAppPreview(form.msg_transfer)}
            {activeTab === 'mercadopago' && renderWhatsAppPreview(form.msg_mercadopago)}
            {activeTab === 'status' && renderWhatsAppPreview(form.msg_order_status)}
            {activeTab === 'general' && renderWhatsAppPreview(form.msg_general_inquiry)}
            {activeTab === 'numbers' && renderWhatsAppPreview('Hola! Me comunico a este número para hacer un pedido en Chamical Candy Shop.')}
          </div>

          {/* Dynamic Tags Glossary Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-headline font-bold text-sm border-b border-slate-800 pb-2">
              <Info className="w-4 h-4 text-emerald-400" />
              <span>Guía de Variables Dinámicas</span>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              Las etiquetas entre llaves se reemplazarán automáticamente por los datos reales del cliente y del pedido al momento del envío:
            </p>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 text-xs">
              {tagList.map((t) => (
                <div key={t.tag} className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <code className="font-mono text-emerald-300 font-bold">{t.tag}</code>
                    <span className="text-[11px] text-slate-400 block">{t.desc}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(t.tag);
                      setCopiedTag(t.tag);
                      setTimeout(() => setCopiedTag(null), 1500);
                    }}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Copiar etiqueta"
                  >
                    {copiedTag === t.tag ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Floating Save Button Bar at bottom */}
      <div className="sticky bottom-4 z-20 bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs sm:text-sm block">¿Listo para aplicar tus cambios?</span>
            <span className="text-[11px] text-slate-400 hidden sm:block">Los clientes recibirán las nuevas plantillas de mensajes inmediatamente.</span>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center space-x-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Guardando...' : 'Guardar Mensajes'}</span>
        </button>
      </div>
    </div>
  );
};
