import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Save, RefreshCw, HelpCircle, Check, Info, Phone, MessageCircle, RotateCcw, Copy, Sparkles, Smartphone, Plus, Trash2, Edit3, X, Bot } from 'lucide-react';
import { admin as adminApi, homepage as homepageApi } from '../lib/api';
import { useModal } from '../context/ModalContext';
import { DEFAULT_WHATSAPP_TEMPLATES, DEFAULT_CUSTOM_QUICK_MESSAGES, CustomQuickMessage, setWhatsAppNumbers, setWhatsAppTemplates, waLink } from '../lib/whatsapp';
import { AdminWhatsAppBot } from './AdminWhatsAppBot';

export const AdminWhatsAppEditor: React.FC = () => {
  const { showAlert } = useModal();
  const [mainView, setMainView] = useState<'bot' | 'templates'>('bot');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'transfer' | 'mercadopago' | 'preparing' | 'ready' | 'general' | 'numbers' | 'custom_quick'>('transfer');

  const [form, setForm] = useState<{
    whatsapp_number_1: string;
    whatsapp_number_2: string;
    active_whatsapp_number: 'num1' | 'num2';
    msg_transfer: string;
    msg_mercadopago: string;
    msg_general_inquiry: string;
    msg_order_status: string;
    msg_preparing: string;
    msg_ready: string;
    custom_messages: CustomQuickMessage[];
    bank_alias?: string;
    bank_name?: string;
    bank_holder?: string;
    bank_cbu?: string;
  }>({
    whatsapp_number_1: '543826432180',
    whatsapp_number_2: '5493826432180',
    active_whatsapp_number: 'num1',
    msg_transfer: DEFAULT_WHATSAPP_TEMPLATES.msg_transfer,
    msg_mercadopago: DEFAULT_WHATSAPP_TEMPLATES.msg_mercadopago,
    msg_general_inquiry: DEFAULT_WHATSAPP_TEMPLATES.msg_general_inquiry,
    msg_order_status: DEFAULT_WHATSAPP_TEMPLATES.msg_order_status,
    msg_preparing: DEFAULT_WHATSAPP_TEMPLATES.msg_preparing,
    msg_ready: DEFAULT_WHATSAPP_TEMPLATES.msg_ready,
    custom_messages: DEFAULT_CUSTOM_QUICK_MESSAGES,
    bank_alias: 'martinchox33',
    bank_name: 'MercadoPago',
    bank_holder: 'Gonzalez Martin Gustavo',
    bank_cbu: '',
  });

  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Quick custom message modal state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [editingMsg, setEditingMsg] = useState<CustomQuickMessage | null>(null);
  const [customMsgForm, setCustomMsgForm] = useState<{ title: string; category: string; content: string }>({
    title: '',
    category: 'General',
    content: ''
  });
  const [selectedCustomId, setSelectedCustomId] = useState<string | null>(null);

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
          custom_messages: (Array.isArray(data.custom_messages) && data.custom_messages.length > 0)
            ? data.custom_messages
            : DEFAULT_CUSTOM_QUICK_MESSAGES,
          bank_alias: data.bank_alias || 'martinchox33',
          bank_name: data.bank_name || 'MercadoPago',
          bank_holder: data.bank_holder || 'Gonzalez Martin Gustavo',
          bank_cbu: data.bank_cbu || '',
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

  const handleOpenAddCustomModal = () => {
    setEditingMsg(null);
    setCustomMsgForm({ title: '', category: 'General', content: '' });
    setShowCustomModal(true);
  };

  const handleOpenEditCustomModal = (msg: CustomQuickMessage) => {
    setEditingMsg(msg);
    setCustomMsgForm({ title: msg.title, category: msg.category || 'General', content: msg.content });
    setShowCustomModal(true);
  };

  const handleSaveCustomMessageModal = () => {
    if (!customMsgForm.title.trim() || !customMsgForm.content.trim()) {
      showAlert({
        title: 'Campos incompletos',
        message: 'Por favor asigná un título y el contenido del mensaje.',
        type: 'warning',
      });
      return;
    }

    setForm((prev) => {
      let updated: CustomQuickMessage[];
      if (editingMsg) {
        updated = prev.custom_messages.map((m) =>
          m.id === editingMsg.id
            ? { ...m, title: customMsgForm.title.trim(), category: customMsgForm.category, content: customMsgForm.content.trim() }
            : m
        );
      } else {
        const newMsg: CustomQuickMessage = {
          id: 'custom_' + Date.now(),
          title: customMsgForm.title.trim(),
          category: customMsgForm.category || 'General',
          content: customMsgForm.content.trim(),
        };
        updated = [...prev.custom_messages, newMsg];
      }
      return { ...prev, custom_messages: updated };
    });

    setShowCustomModal(false);
  };

  const handleDeleteCustomMessage = (id: string) => {
    setForm((prev) => ({
      ...prev,
      custom_messages: prev.custom_messages.filter((m) => m.id !== id),
    }));
  };

  const handleRestoreDefaultCustomMessages = () => {
    setForm((prev) => ({
      ...prev,
      custom_messages: DEFAULT_CUSTOM_QUICK_MESSAGES,
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
    const sampleText = (rawText || '')
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
      .replace(/\{direccion_local\}/g, 'Av. Presidente Perón N°145 (Frente del Super X Día)')
      .replace(/\{horarios\}/g, 'Lunes a Sábado de 09:00 a 20:00 hs')
      .replace(/\{costo_envio\}/g, '$500.00')
      .replace(/\{envio_gratis\}/g, '$10,000.00')
      .replace(/\{notas_envio\}/g, 'Envíos en el día dentro del radio urbano.')
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
      <div className="bg-slate-900 rounded-[32px] p-2.5 shadow-2xl border-4 border-slate-800 max-w-sm mx-auto overflow-hidden">
        {/* Phone Top Notch Bar */}
        <div className="flex items-center justify-between px-4 py-1 text-[10px] text-slate-400 font-mono select-none">
          <span>09:41</span>
          <div className="w-16 h-2.5 bg-slate-800 rounded-full" />
          <span>100% 🔋</span>
        </div>

        {/* WhatsApp App Header Bar */}
        <div className="bg-[#075e54] text-white px-3 py-2.5 flex items-center justify-between shadow-md rounded-t-2xl">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-white p-0.5 shadow-sm overflow-hidden flex-shrink-0">
              <img src="/logo.png" alt="Candy Shop" className="w-full h-full object-contain rounded-full" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-xs block text-white">Chamical Candy Shop 🍬</span>
              <span className="text-[10px] text-emerald-200 block">En línea</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-emerald-100">
            <Phone className="w-4 h-4" />
            <Smartphone className="w-4 h-4" />
          </div>
        </div>

        {/* WhatsApp Wallpaper Chat Background */}
        <div className="bg-[#efeae2] p-3 min-h-[300px] max-h-[380px] overflow-y-auto rounded-b-2xl space-y-3 font-sans text-xs">
          <div className="text-center my-1">
            <span className="bg-white/80 backdrop-blur-sm text-slate-500 text-[10px] font-semibold px-2.5 py-0.5 rounded-md shadow-xs">
              HOY
            </span>
          </div>

          {/* Outgoing Message Bubble (Green) */}
          <div className="bg-[#d9fdd3] text-slate-900 p-3 rounded-2xl rounded-tr-none shadow-sm ml-auto max-w-[88%] border border-emerald-100 relative leading-relaxed text-xs">
            {formattedLines}
            <div className="mt-1.5 flex items-center justify-end space-x-1 text-[10px] text-emerald-800 font-medium">
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-sky-600 font-bold">✓✓</span>
            </div>
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
      {/* Selector Principal de Modo */}
      <div className="bg-slate-200/70 p-1.5 rounded-2xl flex items-center gap-1.5 border border-slate-200 shadow-xs">
        <button
          onClick={() => setMainView('bot')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            mainView === 'bot'
              ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bot className="w-4.5 h-4.5 text-emerald-600" />
          <span>🤖 WhatsApp Bot & Envíos Automáticos (Baileys)</span>
        </button>

        <button
          onClick={() => setMainView('templates')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            mainView === 'templates'
              ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4.5 h-4.5 text-purple-600" />
          <span>💬 Plantillas y Enlaces de WhatsApp Web</span>
        </button>
      </div>

      {mainView === 'bot' ? (
        <AdminWhatsAppBot />
      ) : (
        <>
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(16,185,129,0.25),transparent_50%)] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold text-emerald-300">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Personalización de Mensajes</span>
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
          onClick={() => setActiveTab('custom_quick')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'custom_quick'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-300" />
          <span>Respuestas Rápidas ({form.custom_messages.length})</span>
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
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-700 hover:text-slate-950 font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
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
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-700 hover:text-slate-950 font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
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
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-700 hover:text-slate-950 font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
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
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-700 hover:text-slate-950 font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
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
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-700 hover:text-slate-950 font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
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

          {/* TAB 6: Respuestas Rápidas Prediseñadas */}
          {activeTab === 'custom_quick' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-headline font-bold text-base text-slate-900 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Respuestas Rápidas Prediseñadas</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Creá mensajes predeterminados reutilizables para responder a tus clientes al instante desde la lista de pedidos o por WhatsApp.
                  </p>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleRestoreDefaultCustomMessages}
                    className="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
                    title="Restablecer ejemplos prediseñados sugeridos"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restablecer Ejemplos</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenAddCustomModal}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nueva Respuesta Rápida</span>
                  </button>
                </div>
              </div>

              {form.custom_messages.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6 space-y-3">
                  <MessageCircle className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No tenés respuestas rápidas creadas</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Podés crear respuestas automáticas personalizadas o cargar nuestros ejemplos prediseñados sugeridos.
                  </p>
                  <button
                    type="button"
                    onClick={handleRestoreDefaultCustomMessages}
                    className="px-4 py-2 bg-purple-100 text-purple-700 font-bold text-xs rounded-xl hover:bg-purple-200 transition-colors"
                  >
                    Cargar Ejemplos Sugeridos
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {form.custom_messages.map((msg) => (
                    <div
                      key={msg.id}
                      onClick={() => setSelectedCustomId(msg.id)}
                      className={`border rounded-2xl p-4 space-y-3 transition-all cursor-pointer ${
                        selectedCustomId === msg.id
                          ? 'border-purple-500 bg-purple-50/30 shadow-md ring-2 ring-purple-200'
                          : 'border-slate-200 bg-slate-50/50 hover:border-purple-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900">{msg.title}</span>
                          {msg.category && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                              {msg.category}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditCustomModal(msg);
                            }}
                            className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar mensaje"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomMessage(msg.id);
                            }}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar mensaje"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                        {msg.content}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(msg.content);
                            setCopiedTag(msg.id);
                            setTimeout(() => setCopiedTag(null), 1500);
                          }}
                          className="text-[11px] font-bold text-slate-600 hover:text-purple-700 flex items-center space-x-1"
                        >
                          {copiedTag === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedTag === msg.id ? '¡Copiado!' : 'Copiar Texto'}</span>
                        </button>

                        <a
                          href={waLink(
                            msg.content
                              .replace(/\{nombre_cliente\}/g, 'Cliente')
                              .replace(/\{numero_pedido\}/g, 'DEMO1234')
                              .replace(/\{monto_total\}/g, '$4,500.00'),
                            form.whatsapp_number_1
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Probar Enviar</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
            {activeTab === 'preparing' && renderWhatsAppPreview(form.msg_preparing)}
            {activeTab === 'ready' && renderWhatsAppPreview(form.msg_ready)}
            {activeTab === 'general' && renderWhatsAppPreview(form.msg_general_inquiry)}
            {activeTab === 'custom_quick' && (
              selectedCustomId
                ? renderWhatsAppPreview((form.custom_messages.find(m => m.id === selectedCustomId)?.content || ''))
                : renderWhatsAppPreview(form.custom_messages[0]?.content || 'Seleccioná una respuesta rápida para ver la simulación.')
            )}
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

      {/* Modal para Crear / Editar Respuesta Rápida */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </span>
                <h3 className="font-headline font-bold text-base text-slate-900">
                  {editingMsg ? 'Editar Respuesta Rápida' : 'Nueva Respuesta Rápida'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Título del Mensaje:</label>
                <input
                  type="text"
                  placeholder="Ej: 🏬 Ubicación del Local, 💳 Datos CBU..."
                  value={customMsgForm.title}
                  onChange={(e) => setCustomMsgForm({ ...customMsgForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Categoría / Etiqueta:</label>
                <select
                  value={customMsgForm.category}
                  onChange={(e) => setCustomMsgForm({ ...customMsgForm, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="Información">Información</option>
                  <option value="Pagos">Pagos</option>
                  <option value="Envíos">Envíos</option>
                  <option value="Promociones">Promociones</option>
                  <option value="Seguimiento">Seguimiento</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contenido del Mensaje:</label>
                <textarea
                  rows={5}
                  placeholder="Escribí el texto con etiquetas como {nombre_cliente}, {numero_pedido}, {monto_total}..."
                  value={customMsgForm.content}
                  onChange={(e) => setCustomMsgForm({ ...customMsgForm, content: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 outline-none focus:ring-2 focus:ring-purple-400 leading-relaxed"
                />
              </div>

              {/* Tag Quick Insert Bar */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1.5">Insertar Variable Dinámica:</span>
                <div className="flex flex-wrap gap-1.5">
                  {tagList.map((t) => (
                    <button
                      key={t.tag}
                      type="button"
                      onClick={() => setCustomMsgForm({ ...customMsgForm, content: customMsgForm.content + ' ' + t.tag })}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer border border-slate-200"
                    >
                      {t.tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCustomMessageModal}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow transition-colors cursor-pointer"
              >
                {editingMsg ? 'Guardar Cambios' : 'Crear Respuesta'}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
