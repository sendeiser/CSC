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
    bg_gradient: 'from-pink-600 via-purple-600 to-indigo-800',
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
    bg_gradient: 'from-amber-500 via-rose-600 to-purple-800',
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
    bg_gradient: 'from-emerald-600 via-teal-600 to-indigo-900',
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
      className="relative w-full my-0 py-0 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className={`relative w-full overflow-hidden bg-gradient-to-r ${bgGradient} transition-all duration-700 shadow-md`}>
        {/* Background Ambient Glow */}
        <div className="absolute -right-16 -top-16 w-48 h-48 sm:w-72 sm:h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-48 h-48 sm:w-72 sm:h-72 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 min-h-[140px] sm:min-h-[220px] lg:min-h-[250px] items-center py-4 sm:py-6">
          
          {/* Slide Text Content */}
          <div className="lg:col-span-8 space-y-2 sm:space-y-3 text-white flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.id + '_content'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-1.5 sm:space-y-2.5"
              >
                {/* Badge Tag */}
                <div className="inline-flex items-center space-x-1.5 bg-white/20 backdrop-blur-md border border-white/30 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-black tracking-wide text-white shadow-xs">
                  {currentSlide.type === 'new_product' ? (
                    <Flame className="w-3 h-3 text-amber-300 fill-amber-300" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-amber-300" />
                  )}
                  <span className="truncate max-w-[220px] sm:max-w-none">{currentSlide.badge || (currentSlide.type === 'new_product' ? '¡NUEVO PRODUCTO!' : '¡PROMO ESPECIAL!')}</span>
                </div>

                {/* Title */}
                <h2 className="font-headline font-black text-base sm:text-2xl lg:text-3xl leading-snug text-white drop-shadow-xs line-clamp-2">
                  {currentSlide.title}
                </h2>

                {/* Subtitle */}
                {currentSlide.subtitle && (
                  <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium max-w-xl line-clamp-1 sm:line-clamp-2">
                    {currentSlide.subtitle}
                  </p>
                )}

                {/* Action Row: CTA Button + Linked Product Badge */}
                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleButtonClick}
                    className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 sm:px-5 sm:py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs rounded-xl sm:rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer group"
                  >
                    <span>{currentSlide.button_text || 'Ver Más'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-700 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {matchedProduct && (
                    <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-xl px-3 py-1.5 inline-flex items-center space-x-2">
                      <span className="font-bold text-xs text-white truncate max-w-[140px]">{matchedProduct.name}</span>
                      <span className="font-black text-xs text-amber-300">${matchedProduct.base_price.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Slide Image Showcase Container (Compact Banner Image) */}
          <div className="hidden sm:flex lg:col-span-4 justify-end items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.id + '_img'}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="relative w-full max-w-[220px] lg:max-w-[260px] aspect-[16/10] rounded-2xl overflow-hidden shadow-lg border-2 border-white/30 bg-black/20 group"
              >
                <img
                  src={matchedProduct?.image_url || currentSlide.image_url}
                  alt={currentSlide.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                {(matchedProduct?.on_sale || currentSlide.product_discount) && (
                  <div className="absolute top-2 right-2 bg-rose-500 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-md border border-white/30 animate-pulse">
                    ¡{matchedProduct?.discount_percentage || currentSlide.product_discount}% OFF!
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Arrows */}
        {displaySlides.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/25 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer border border-white/20 z-20"
              aria-label="Anterior slide"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/25 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer border border-white/20 z-20"
              aria-label="Siguiente slide"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {displaySlides.length > 1 && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 z-20">
            {displaySlides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx
                    ? 'w-5 bg-white shadow-xs'
                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Ir a slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
