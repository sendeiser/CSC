import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Save, RefreshCw, HelpCircle, Check, Info, Phone, MessageCircle, RotateCcw, Copy, Sparkles, Smartphone, Plus, Trash2, Edit3, Send, Zap } from 'lucide-react';
import { admin as adminApi, homepage as homepageApi } from '../lib/api';
import { useModal } from '../context/ModalContext';
import { DEFAULT_WHATSAPP_TEMPLATES, DEFAULT_CUSTOM_WHATSAPP_MESSAGES, CustomWhatsAppMessage, setWhatsAppNumbers, setWhatsAppTemplates, buildCustomMensajeWhatsApp, waLink } from '../lib/whatsapp';

export const AdminWhatsAppEditor: React.FC = () => {
  const { showAlert } = useModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'transfer' | 'mercadopago' | 'preparing' | 'ready' | 'general' | 'numbers' | 'custom'>('custom');

  const [form, setForm] = useState({
    whatsapp_number_1: '543826432180',
    whatsapp_number_2: '5493826432180',
    active_whatsapp_number: 'num1',
    msg_transfer: DEFAULT_WHATSAPP_TEMPLATES.msg_transfer,
    msg_mercadopago: DEFAULT_WHATSAPP_TEMPLATES.msg_mercadopago,
    msg_general_inquiry: DEFAULT_WHATSAPP_TEMPLATES.msg_general_inquiry,
    msg_order_status: DEFAULT_WHATSAPP_TEMPLATES.msg_order_status,
    msg_preparing: DEFAULT_WHATSAPP_TEMPLATES.msg_preparing,
    msg_ready: DEFAULT_WHATSAPP_TEMPLATES.msg_ready,
    custom_whatsapp_messages: DEFAULT_CUSTOM_WHATSAPP_MESSAGES as CustomWhatsAppMessage[],
  });

  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [customFormTitle, setCustomFormTitle] = useState('');
  const [customFormContent, setCustomFormContent] = useState('');
  const [showAddCustomCard, setShowAddCustomCard] = useState(false);
  const [selectedCustomPreviewId, setSelectedCustomPreviewId] = useState<string | null>(null);

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
          msg_preparing: data.msg_preparing || DEFAULT_WHATSAPP_TEMPLATES.msg_preparing,
          msg_ready: data.msg_ready || DEFAULT_WHATSAPP_TEMPLATES.msg_ready,
          custom_whatsapp_messages: Array.isArray(data.custom_whatsapp_messages) && data.custom_whatsapp_messages.length > 0
            ? data.custom_whatsapp_messages
            : DEFAULT_CUSTOM_WHATSAPP_MESSAGES,
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

  const handleSaveCustomMessage = () => {
    if (!customFormTitle.trim() || !customFormContent.trim()) {
      showAlert({
        title: 'Campos requeridos',
        message: 'Por favor ingresá un título y el contenido de la respuesta rápida.',
        type: 'error',
      });
      return;
    }

    if (editingCustomId) {
      setForm((prev) => ({
        ...prev,
        custom_whatsapp_messages: prev.custom_whatsapp_messages.map((m) =>
          m.id === editingCustomId
            ? { ...m, title: customFormTitle.trim(), content: customFormContent.trim() }
            : m
        ),
      }));
      setEditingCustomId(null);
    } else {
      const newMsg: CustomWhatsAppMessage = {
        id: 'msg_' + Date.now() + Math.random().toString(36).slice(2, 6),
        title: customFormTitle.trim(),
        content: customFormContent.trim(),
      };
      setForm((prev) => ({
        ...prev,
        custom_whatsapp_messages: [...prev.custom_whatsapp_messages, newMsg],
      }));
    }

    setCustomFormTitle('');
    setCustomFormContent('');
    setShowAddCustomCard(false);
  };

  const handleDeleteCustomMessage = (id: string) => {
    setForm((prev) => ({
      ...prev,
      custom_whatsapp_messages: prev.custom_whatsapp_messages.filter((m) => m.id !== id),
    }));
    if (selectedCustomPreviewId === id) setSelectedCustomPreviewId(null);
  };

  const handleStartEditCustom = (msg: CustomWhatsAppMessage) => {
    setEditingCustomId(msg.id);
    setCustomFormTitle(msg.title);
    setCustomFormContent(msg.content);
    setShowAddCustomCard(true);
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
          onClick={() => setActiveTab('custom')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'custom'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 ring-2 ring-amber-300'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span>⚡ Respuestas Rápidas ({form.custom_whatsapp_messages.length})</span>
        </button>

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
          onClick={() => setActiveTab('preparing')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'preparing'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MessageCircle className="w-4 h-4 text-indigo-300" />
          <span>Aviso: En Preparación</span>
        </button>

        <button
          onClick={() => setActiveTab('ready')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'ready'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Check className="w-4 h-4 text-emerald-300" />
          <span>Aviso: Listo para Retirar</span>
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
          
          {/* TAB 0: Respuestas Rápidas Personalizadas */}
          {activeTab === 'custom' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-headline font-bold text-base text-slate-900 flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <span>Respuestas Rápidas Predeterminadas</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Creá y personalizá mensajes para enviarle a los clientes en 1 clic desde el Panel de Pedidos.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingCustomId(null);
                      setCustomFormTitle('');
                      setCustomFormContent('');
                      setShowAddCustomCard(true);
                    }}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear Respuesta</span>
                  </button>
                </div>

                {/* Form to add / edit custom message */}
                {showAddCustomCard && (
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase text-amber-900 tracking-wider">
                        {editingCustomId ? '✏️ Editar Respuesta Rápida' : '➕ Nueva Respuesta Rápida'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowAddCustomCard(false)}
                        className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Título corto (ej: 🚚 Retraso en Delivery):</label>
                        <input
                          type="text"
                          value={customFormTitle}
                          onChange={(e) => setCustomFormTitle(e.target.value)}
                          placeholder="Ej: 🚚 Demora de Reparto en Delivery"
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Mensaje de WhatsApp:</label>
                        <textarea
                          rows={4}
                          value={customFormContent}
                          onChange={(e) => setCustomFormContent(e.target.value)}
                          placeholder="¡Hola {nombre_cliente}! 🚚 Te informamos que tu pedido #{numero_pedido} se encuentra demorado unos minutos..."
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-sans outline-none focus:ring-2 focus:ring-amber-500 bg-white leading-relaxed"
                        />
                      </div>

                      {/* Quick variable inserting buttons */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Insertar Variable Dinámica:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['{nombre_cliente}', '{numero_pedido}', '{monto_total}', '{direccion_cliente}', '{estado_pedido}'].map((tg) => (
                            <button
                              key={tg}
                              type="button"
                              onClick={() => setCustomFormContent((prev) => prev + ' ' + tg)}
                              className="px-2.5 py-1 bg-white hover:bg-amber-100 text-slate-700 font-mono text-[11px] font-bold rounded-lg border border-slate-200 hover:border-amber-300 transition-colors cursor-pointer"
                            >
                              + {tg}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={handleSaveCustomMessage}
                          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center space-x-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>{editingCustomId ? 'Guardar Cambios' : 'Agregar a la Lista'}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* List of Custom Quick Messages */}
                <div className="space-y-3 pt-2">
                  {form.custom_whatsapp_messages.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                      No tenés respuestas rápidas creadas. ¡Hacé clic en "Crear Respuesta" para agregar tu primer mensaje predeterminado!
                    </div>
                  ) : (
                    form.custom_whatsapp_messages.map((msg) => {
                      const isSelectedPreview = selectedCustomPreviewId === msg.id;
                      return (
                        <div
                          key={msg.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isSelectedPreview
                              ? 'bg-amber-50/80 border-amber-300 shadow-md ring-1 ring-amber-300'
                              : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/90'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-xs sm:text-sm text-slate-900">{msg.title}</span>
                              <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">Predeterminado</span>
                            </div>

                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => setSelectedCustomPreviewId(msg.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                                  isSelectedPreview
                                    ? 'bg-amber-600 text-white shadow'
                                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                                }`}
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Ver Previa</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartEditCustom(msg)}
                                className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
                                title="Editar respuesta"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomMessage(msg.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar respuesta"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 font-sans whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60">
                            {msg.content}
                          </p>

                          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-200/50 text-[11px]">
                            <span className="text-slate-400">Mensaje automático listo para vendedores</span>
                            <a
                              href={waLink(
                                buildCustomMensajeWhatsApp(msg.content, {
                                  nombreCliente: 'Juan Pérez',
                                  numeroPedido: 'F74A49D7',
                                  montoTotal: '$4,500.00',
                                  direccionCliente: 'Av. San Martín 123',
                                })
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                            >
                              <span>Probar en WhatsApp</span>
                              <Send className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          )}

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

          {/* TAB 3: Aviso En Preparación */}
          {activeTab === 'preparing' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-headline font-bold text-base text-slate-900">Mensaje: Aviso "En Preparación"</h3>
                  <p className="text-xs text-slate-500">Se envía al presionar el botón "Avisar: En Preparación" en el detalle de un pedido.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetTemplate('msg_preparing')}
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-emerald-700 font-semibold px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer</span>
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Etiquetas dinámicas:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => insertTag('msg_preparing', '{nombre_cliente}')} className="px-2.5 py-1 bg-indigo-50 text-indigo-800 text-xs font-mono font-bold rounded-lg cursor-pointer">
                    {'{nombre_cliente}'}
                  </button>
                  <button type="button" onClick={() => insertTag('msg_preparing', '{numero_pedido}')} className="px-2.5 py-1 bg-indigo-50 text-indigo-800 text-xs font-mono font-bold rounded-lg cursor-pointer">
                    {'{numero_pedido}'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <textarea
                  rows={6}
                  value={form.msg_preparing}
                  onChange={(e) => setForm({ ...form, msg_preparing: e.target.value })}
                  className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-xs sm:text-sm font-mono leading-relaxed text-slate-800 bg-slate-50/50 transition-all"
                />
              </div>
            </motion.div>
          )}

          {/* TAB 4: Aviso Listo para Retirar */}
          {activeTab === 'ready' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-headline font-bold text-base text-slate-900">Mensaje: Aviso "Listo para Retirar"</h3>
                  <p className="text-xs text-slate-500">Se envía al presionar el botón "Avisar: Listo para Retirar" en el detalle de un pedido.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetTemplate('msg_ready')}
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-emerald-700 font-semibold px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer</span>
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Etiquetas dinámicas:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => insertTag('msg_ready', '{nombre_cliente}')} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-mono font-bold rounded-lg cursor-pointer">
                    {'{nombre_cliente}'}
                  </button>
                  <button type="button" onClick={() => insertTag('msg_ready', '{numero_pedido}')} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-mono font-bold rounded-lg cursor-pointer">
                    {'{numero_pedido}'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <textarea
                  rows={6}
                  value={form.msg_ready}
                  onChange={(e) => setForm({ ...form, msg_ready: e.target.value })}
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
            
            {activeTab === 'custom' &&
              renderWhatsAppPreview(
                form.custom_whatsapp_messages.find((m) => m.id === selectedCustomPreviewId)?.content ||
                customFormContent ||
                form.custom_whatsapp_messages[0]?.content ||
                '¡Hola {nombre_cliente}! Esta es una respuesta rápida predeterminada de prueba.'
              )}
            {activeTab === 'transfer' && renderWhatsAppPreview(form.msg_transfer)}
            {activeTab === 'mercadopago' && renderWhatsAppPreview(form.msg_mercadopago)}
            {activeTab === 'preparing' && renderWhatsAppPreview(form.msg_preparing)}
            {activeTab === 'ready' && renderWhatsAppPreview(form.msg_ready)}
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
