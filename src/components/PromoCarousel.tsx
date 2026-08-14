import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, ShoppingBag, ArrowRight, Tag, Star, Gift, Flame } from 'lucide-react';
import { Product } from '../types';

export interface PromoSlide {
  id: string;
  type: 'ad' | 'new_product';
  badge?: string;
  title: string;
  subtitle?: string;
  image_url: string;
  bg_gradient?: string;
  product_id?: string;
  product_name?: string;
  product_price?: number;
  product_discount?: number;
  button_text?: string;
  button_link?: string;
  active: boolean;
  order_index: number;
}

export const DEFAULT_PROMO_SLIDES: PromoSlide[] = [
  {
    id: 'slide_1',
    type: 'ad',
    badge: '🔥 ¡PROMO DE LA SEMANA!',
    title: '¡20% OFF en Gomitas Dulces y Chocolates por Granel!',
    subtitle: 'Aprovechá la mejor variedad de golosinas de Chamical. Llevás la cantidad que quieras al mejor precio.',
    image_url: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=800&q=80',
    bg_gradient: 'from-purple-950 via-pink-950 to-slate-950',
    button_text: 'Ver Ofertas Exclusivas',
    button_link: 'catalogo',
    active: true,
    order_index: 1,
  },
  {
    id: 'slide_2',
    type: 'new_product',
    badge: '✨ ¡NUEVO INGRESO ESTRELLA!',
    title: 'Nuevos Chocolates Block y Gomitas Ácidas Fini',
    subtitle: 'Sabor intenso y la máxima frescura garantizada. ¡Recién llegados a nuestra tienda!',
    image_url: 'https://images.unsplash.com/photo-1575224300306-1b8da36134ec?auto=format&fit=crop&w=800&q=80',
    bg_gradient: 'from-slate-950 via-purple-900 to-rose-950',
    button_text: 'Explorar Novedades',
    button_link: 'catalogo',
    active: true,
    order_index: 2,
  },
  {
    id: 'slide_3',
    type: 'ad',
    badge: '🚚 ¡ENVÍOS RÁPIDOS Y RETIRO EN LOCAL!',
    title: 'Comprá Online y Retirá Sin Demoras',
    subtitle: 'Armá tu carrito desde el celular, pagá por transferencia o efectivo y recibilo o retiralo en el día.',
    image_url: 'https://images.unsplash.com/photo-1534432182912-6385491589b6?auto=format&fit=crop&w=800&q=80',
    bg_gradient: 'from-slate-950 via-teal-950 to-purple-950',
    button_text: 'Hacer Pedido Ahora',
    button_link: 'catalogo',
    active: true,
    order_index: 3,
  },
];

interface PromoCarouselProps {
  slides?: PromoSlide[];
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
  onNavigate?: (screen: string) => void;
}

export const PromoCarousel: React.FC<PromoCarouselProps> = ({
  slides = DEFAULT_PROMO_SLIDES,
  products = [],
  onSelectProduct,
  onNavigate,
}) => {
  const activeSlides = slides.filter((s) => s.active !== false);
  const displaySlides = activeSlides.length > 0 ? activeSlides : DEFAULT_PROMO_SLIDES;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance timer (5 seconds)
  useEffect(() => {
    if (isPaused || displaySlides.length <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displaySlides.length);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [displaySlides.length, isPaused]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % displaySlides.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + displaySlides.length) % displaySlides.length);
  };

  const currentSlide = displaySlides[currentIndex] || displaySlides[0];

  // Try finding linked product if slide links to a product_id
  const matchedProduct = currentSlide.product_id
    ? products.find((p) => p.id === currentSlide.product_id)
    : null;

  const bgGradient = currentSlide.bg_gradient || 'from-purple-700 via-pink-600 to-indigo-800';

  const handleButtonClick = () => {
    if (matchedProduct && onSelectProduct) {
      onSelectProduct(matchedProduct);
      return;
    }

    if (currentSlide.button_link && onNavigate) {
      onNavigate(currentSlide.button_link);
      return;
    }

    if (onNavigate) {
      onNavigate('catalogo');
    }
  };

  return (
    <div
      className={`relative w-full my-0 py-0 overflow-hidden bg-gradient-to-r ${bgGradient} transition-all duration-700 shadow-xl`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Background Ambient Glow & Puzzle Pattern */}
      <div className="absolute -right-16 -top-16 w-56 h-56 sm:w-80 sm:h-80 bg-white/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-56 h-56 sm:w-80 sm:h-80 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        
        {/* Puzzle Interlocking Watermark Grid Pattern */}
        <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 12px 12px, rgba(255,255,255,0.6) 2.5px, transparent 0)', backgroundSize: '28px 28px' }} />

        {/* Centered Axis Slide Layout */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 py-5 sm:py-8 flex flex-col items-center justify-center text-center text-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id + '_slide'}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="w-full space-y-3 sm:space-y-4 flex flex-col items-center"
            >
              {/* Top Badge Tag */}
              <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md border border-white/30 px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-black tracking-wide text-white shadow-sm">
                {currentSlide.type === 'new_product' ? (
                  <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>{currentSlide.badge || (currentSlide.type === 'new_product' ? '¡NUEVO PRODUCTO!' : '¡PROMO ESPECIAL!')}</span>
              </div>

              {/* Title */}
              <h2 className="font-headline font-black text-lg sm:text-3xl lg:text-4xl leading-tight text-white drop-shadow-md max-w-2xl mx-auto">
                {currentSlide.title}
              </h2>

              {/* Subtitle */}
              {currentSlide.subtitle && (
                <p className="text-xs sm:text-base text-white/90 leading-relaxed font-medium max-w-xl mx-auto line-clamp-2">
                  {currentSlide.subtitle}
                </p>
              )}

              {/* Central Axis Image Showcase */}
              <div className="relative w-full max-w-sm sm:max-w-md aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/40 bg-black/30 group mx-auto my-2">
                <img
                  src={matchedProduct?.image_url || currentSlide.image_url}
                  alt={currentSlide.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                {(matchedProduct?.on_sale || currentSlide.product_discount) && (
                  <div className="absolute top-3 right-3 bg-rose-500 text-white font-black text-xs px-3 py-1 rounded-full shadow-lg border border-white/40 animate-pulse">
                    ¡{matchedProduct?.discount_percentage || currentSlide.product_discount}% OFF!
                  </div>
                )}
              </div>

              {/* Action Buttons & Product Info Centered */}
              <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleButtonClick}
                  className="inline-flex items-center justify-center space-x-2 px-6 py-2.5 sm:px-7 sm:py-3 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer group border border-white/40"
                >
                  <span>{currentSlide.button_text || 'Ver Más'}</span>
                  <ArrowRight className="w-4 h-4 text-purple-700 group-hover:translate-x-1 transition-transform" />
                </button>

                {matchedProduct && (
                  <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-2 inline-flex items-center space-x-2 shadow-md">
                    <span className="font-bold text-xs sm:text-sm text-white">{matchedProduct.name}</span>
                    <span className="font-black text-xs sm:text-sm text-amber-300">${matchedProduct.base_price.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Arrows */}
        {displaySlides.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/30 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer border border-white/30 z-20 shadow-lg"
              aria-label="Anterior slide"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/30 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer border border-white/30 z-20 shadow-lg"
              aria-label="Siguiente slide"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {displaySlides.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center space-x-2 z-20">
            {displaySlides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx
                    ? 'w-7 bg-white shadow-md'
                    : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Ir a slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Bottom puzzle interlocking wave - Smooth curve to next section */}
        <div className="w-full overflow-hidden leading-none pointer-events-none -mb-1 mt-4 relative z-20">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-8 sm:h-14 text-white">
            <path d="M0 80L1440 80L1440 30C1200 70 960 10 720 40C480 70 240 0 0 30L0 80Z" fill="currentColor"/>
          </svg>
        </div>
      </div>
    );
  };
