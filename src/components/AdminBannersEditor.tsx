import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Eye, EyeOff, Save, RefreshCw, Sparkles, Image, ArrowUp, ArrowDown, X, Package, Flame, Link, Check, AlertCircle } from 'lucide-react';
import { PromoSlide, DEFAULT_PROMO_SLIDES } from './PromoCarousel';
import { Product } from '../types';
import { admin as adminApi, products as productsApi, upload as uploadApi } from '../lib/api';
import { useModal } from '../context/ModalContext';

const GRADIENT_THEMES = [
  { id: 'from-pink-600 via-purple-600 to-indigo-800', label: '🌸 Rosa & Púrpura' },
  { id: 'from-amber-500 via-rose-600 to-purple-800', label: '🌅 Atardecer Dulce' },
  { id: 'from-emerald-600 via-teal-600 to-indigo-900', label: '🍃 Esmeralda & Menta' },
  { id: 'from-blue-600 via-indigo-600 to-purple-800', label: '⚡ Azul Neón' },
  { id: 'from-slate-900 via-purple-950 to-pink-950', label: '✨ Noche Elegante' },
  { id: 'from-red-600 via-rose-600 to-amber-600', label: '🔥 Fuego & Frutilla' },
];

export const AdminBannersEditor: React.FC = () => {
  const { showAlert, showConfirm } = useModal();
  const [slides, setSlides] = useState<PromoSlide[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sectionId, setSectionId] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<PromoSlide | null>(null);
  const [slideForm, setSlideForm] = useState<Partial<PromoSlide>>({
    type: 'ad',
    badge: '🔥 ¡PROMO DE LA SEMANA!',
    title: '',
    subtitle: '',
    image_url: '',
    bg_gradient: 'from-pink-600 via-purple-600 to-indigo-800',
    button_text: 'Ver Oferta',
    button_link: 'catalogo',
    active: true,
  });

  const [uploadingImg, setUploadingImg] = useState(false);

  // Load sections & products
  const loadData = async () => {
    setLoading(true);
    try {
      const [secData, prodData] = await Promise.all([
        adminApi.getHomepageSections(),
        productsApi.list(),
      ]);

      setProducts(prodData || []);

      const bannerSec = (secData || []).find((s: any) => s.section_type === 'banners');
      if (bannerSec) {
        setSectionId(bannerSec.id);
        const existingSlides = bannerSec.content?.slides || [];
        setSlides(existingSlides.length > 0 ? existingSlides : DEFAULT_PROMO_SLIDES);
      } else {
        setSlides(DEFAULT_PROMO_SLIDES);
      }
    } catch (e: any) {
      console.error(e);
      setSlides(DEFAULT_PROMO_SLIDES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save all slides to backend
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      if (sectionId) {
        await adminApi.updateHomepageSection(sectionId, {
          content: { slides },
        });
      } else {
        const created = await adminApi.createHomepageSection({
          section_type: 'banners',
          title: 'Carrusel de Publicidades y Productos Nuevos',
          subtitle: 'Banners promocionales destacados en la página principal',
          content: { slides },
          order_index: 0,
          visible: true,
        });
        if (created?.id) setSectionId(created.id);
      }

      showAlert({
        title: '¡Cambios Guardados!',
        message: 'El carrusel de publicidades se actualizó correctamente en la tienda.',
        type: 'success',
      });
    } catch (e: any) {
      showAlert({
        title: 'Error al Guardar',
        message: e.message || 'No se pudieron guardar las publicidades.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Open modal for new slide
  const handleOpenNewModal = () => {
    setEditingSlide(null);
    setSlideForm({
      type: 'ad',
      badge: '🔥 ¡PROMO DE LA SEMANA!',
      title: '',
      subtitle: '',
      image_url: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=800&q=80',
      bg_gradient: 'from-pink-600 via-purple-600 to-indigo-800',
      button_text: 'Ver Oferta',
      button_link: 'catalogo',
      active: true,
    });
    setShowModal(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (slide: PromoSlide) => {
    setEditingSlide(slide);
    setSlideForm({ ...slide });
    setShowModal(true);
  };

  // Handle slide form submit
  const handleSaveSlideModal = () => {
    if (!slideForm.title?.trim()) {
      showAlert({
        title: 'Campo requerido',
        message: 'Ingresá un título para la publicidad o producto.',
        type: 'warning',
      });
      return;
    }

    if (editingSlide) {
      setSlides((prev) =>
        prev.map((s) => (s.id === editingSlide.id ? ({ ...s, ...slideForm } as PromoSlide) : s))
      );
    } else {
      const newSlide: PromoSlide = {
        id: 'slide_' + Date.now(),
        type: slideForm.type || 'ad',
        badge: slideForm.badge || '🔥 ¡PROMO ESPECIAL!',
        title: slideForm.title.trim(),
        subtitle: slideForm.subtitle?.trim() || '',
        image_url: slideForm.image_url?.trim() || 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=800&q=80',
        bg_gradient: slideForm.bg_gradient || 'from-pink-600 via-purple-600 to-indigo-800',
        product_id: slideForm.product_id || undefined,
        button_text: slideForm.button_text?.trim() || 'Ver Más',
        button_link: slideForm.button_link || 'catalogo',
        active: slideForm.active !== false,
        order_index: slides.length + 1,
      };
      setSlides((prev) => [...prev, newSlide]);
    }

    setShowModal(false);
  };

  // Delete slide
  const handleDeleteSlide = async (id: string) => {
    const ok = await showConfirm({
      title: '¿Eliminar publicidad?',
      message: 'Esta diapositiva se quitará del carrusel.',
      type: 'danger',
    });
    if (ok) {
      setSlides((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Toggle active status
  const handleToggleActive = (id: string) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  // Reorder slides
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newSlides = [...slides];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSlides.length) return;

    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIdx];
    newSlides[targetIdx] = temp;
    setSlides(newSlides);
  };

  // Image Upload handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImg(true);
    try {
      const res = await uploadApi.single(file);
      setSlideForm((prev) => ({ ...prev, image_url: res.url }));
    } catch (err: any) {
      showAlert({
        title: 'Error al subir imagen',
        message: err.message || 'No se pudo subir la imagen.',
        type: 'error',
      });
    } finally {
      setUploadingImg(false);
    }
  };

  // Product Selection helper for "Producto Nuevo"
  const handleSelectProductForSlide = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    setSlideForm((prev) => ({
      ...prev,
      product_id: prod.id,
      title: `¡Nuevo! ${prod.name}`,
      subtitle: prod.description || 'Descubrí este nuevo producto en nuestra tienda.',
      image_url: prod.image_url || prev.image_url,
      button_text: 'Comprar Producto',
      button_link: 'catalogo',
      badge: '✨ ¡NUEVO INGRESO ESTRELLA!',
    }));
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium flex items-center justify-center space-x-2">
        <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
        <span>Cargando carrusel de publicidades...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-purple-500/20 border border-purple-400/30 px-3 py-1 rounded-full text-xs font-bold text-purple-300 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Marketing & Banners Destacados</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-headline font-black text-white">
              Carrusel de Publicidades y Productos Nuevos
            </h1>
            <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl">
              Gestioná las promociones, banners publicitarios y novedades que se muestran en el carrusel de la página principal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenNewModal}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-transform hover:scale-105 inline-flex items-center space-x-2 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Publicidad</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Carousel Slides */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-bold text-base text-slate-900 flex items-center space-x-2">
            <span>Diapositivas Activas ({slides.length})</span>
          </h2>
          <button
            onClick={() => setSlides(DEFAULT_PROMO_SLIDES)}
            className="text-xs font-bold text-purple-600 hover:text-purple-800 underline cursor-pointer"
          >
            Restaurar Banners de Ejemplo
          </button>
        </div>

        {slides.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center space-y-3 border border-slate-200 shadow-xs">
            <Sparkles className="w-12 h-12 text-purple-400 mx-auto" />
            <h3 className="font-bold text-slate-800">No hay publicidades configuradas</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Hacé clic en el botón superior para agregar tu primer banner publicitario o destacar un nuevo producto.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-sm hover:shadow-md flex flex-col justify-between ${
                  slide.active ? 'border-slate-200' : 'border-slate-300 opacity-60 bg-slate-50'
                }`}
              >
                {/* Card Top Preview Gradient & Badge */}
                <div className={`p-4 bg-gradient-to-r ${slide.bg_gradient || 'from-purple-600 to-indigo-800'} text-white relative min-h-[140px] flex flex-col justify-between`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white truncate max-w-[180px]">
                      {slide.badge || (slide.type === 'new_product' ? 'NUEVO PRODUCTO' : 'PUBLICIDAD')}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      slide.active ? 'bg-emerald-400 text-slate-950' : 'bg-slate-900/80 text-white'
                    }`}>
                      {slide.active ? 'Visible' : 'Oculto'}
                    </span>
                  </div>

                  <div className="mt-2 flex gap-3 items-center">
                    <img
                      src={slide.image_url}
                      alt={slide.title}
                      className="w-14 h-14 rounded-xl object-cover border-2 border-white/50 bg-black/20 flex-shrink-0"
                    />
                    <div className="leading-tight overflow-hidden">
                      <h4 className="font-headline font-black text-sm text-white line-clamp-2">{slide.title}</h4>
                      {slide.subtitle && (
                        <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">{slide.subtitle}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Controls */}
                <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100 cursor-pointer"
                      title="Mover arriba"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === slides.length - 1}
                      className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100 cursor-pointer"
                      title="Mover abajo"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(slide.id)}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        slide.active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
                      }`}
                      title={slide.active ? 'Ocultar slide' : 'Mostrar slide'}
                    >
                      {slide.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(slide)}
                      className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteSlide(slide.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Save Bar */}
      <div className="sticky bottom-4 z-20 bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xs sm:text-sm block">¿Guardar cambios en el carrusel?</span>
            <span className="text-[11px] text-slate-400 hidden sm:block">Las publicidades actualizadas se mostrarán inmediatamente a los visitantes de la tienda.</span>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="inline-flex items-center space-x-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-500/20 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Guardando...' : 'Guardar Banners'}</span>
        </button>
      </div>

      {/* Modal Form for Add/Edit Slide */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </span>
                <h3 className="font-headline font-bold text-base text-slate-900">
                  {editingSlide ? 'Editar Publicidad / Banner' : 'Nueva Publicidad / Banner'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Type Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tipo de Diapositiva:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSlideForm({ ...slideForm, type: 'ad' })}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all ${
                      slideForm.type === 'ad'
                        ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Publicidad / Banner General</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSlideForm({ ...slideForm, type: 'new_product' })}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all ${
                      slideForm.type === 'new_product'
                        ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50'
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                    <span>Producto Nuevo / Novedad</span>
                  </button>
                </div>
              </div>

              {/* If "Producto Nuevo", dropdown to pick product */}
              {slideForm.type === 'new_product' && (
                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
                  <label className="font-bold text-purple-900 block">
                    Seleccionar Producto del Catálogo:
                  </label>
                  <select
                    value={slideForm.product_id || ''}
                    onChange={(e) => handleSelectProductForSlide(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-300 text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-purple-400 outline-none"
                  >
                    <option value="" disabled>Elegí un producto para vincular...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ${Number(p.base_price || 0).toFixed(2)} ({p.category})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-purple-700">
                    Al seleccionar un producto, se autocompletarán el título, la descripción y la imagen.
                  </p>
                </div>
              )}

              {/* Badge text */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Insignia / Badge Superior:</label>
                <input
                  type="text"
                  placeholder="Ej: 🔥 ¡PROMO DE LA SEMANA!, ✨ ¡NUEVO INGRESO!, 🚚 ¡ENVÍO GRATIS!"
                  value={slideForm.badge || ''}
                  onChange={(e) => setSlideForm({ ...slideForm, badge: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Title */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Título de la Publicidad:</label>
                <input
                  type="text"
                  placeholder="Ej: ¡20% OFF en Gomitas Dulces y Chocolates!"
                  value={slideForm.title || ''}
                  onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Descripción / Subtítulo:</label>
                <textarea
                  rows={2}
                  placeholder="Ej: Llevando más de 500g en gomitas por granel. ¡Aprovechá la mejor calidad de Chamical!"
                  value={slideForm.subtitle || ''}
                  onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Image URL & Upload */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Imagen del Banner:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="URL de la imagen (ej: https://...)"
                    value={slideForm.image_url || ''}
                    onChange={(e) => setSlideForm({ ...slideForm, image_url: e.target.value })}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1 cursor-pointer border border-slate-200">
                    <Image className="w-4 h-4 text-slate-500" />
                    <span>{uploadingImg ? 'Subiendo...' : 'Subir'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} disabled={uploadingImg} />
                  </label>
                </div>
                {slideForm.image_url && (
                  <div className="mt-2 w-24 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={slideForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Gradient Theme Picker */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Estilo / Color de Fondo:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GRADIENT_THEMES.map((gt) => (
                    <button
                      key={gt.id}
                      type="button"
                      onClick={() => setSlideForm({ ...slideForm, bg_gradient: gt.id })}
                      className={`p-2 rounded-xl border text-[11px] font-bold text-white transition-all cursor-pointer bg-gradient-to-r ${gt.id} ${
                        slideForm.bg_gradient === gt.id
                          ? 'ring-2 ring-purple-600 scale-105 shadow-md border-white'
                          : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                    >
                      {gt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Button CTA text & link */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Texto del Botón:</label>
                  <input
                    type="text"
                    placeholder="Ej: Ver Ofertas"
                    value={slideForm.button_text || ''}
                    onChange={(e) => setSlideForm({ ...slideForm, button_text: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Destino / Enlace:</label>
                  <select
                    value={slideForm.button_link || 'catalogo'}
                    onChange={(e) => setSlideForm({ ...slideForm, button_link: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="catalogo">Ir al Catálogo de Productos</option>
                    <option value="como-comprar">Ver Cómo Comprar</option>
                    <option value="nosotros">Conocer Sobre Nosotros</option>
                  </select>
                </div>
              </div>

              {/* Active Switch */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700">Mostrar Diapositiva en la Tienda:</span>
                <button
                  type="button"
                  onClick={() => setSlideForm({ ...slideForm, active: !slideForm.active })}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    slideForm.active ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                      slideForm.active ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveSlideModal}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow transition-colors cursor-pointer"
              >
                {editingSlide ? 'Guardar Cambios' : 'Agregar a Carrusel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
