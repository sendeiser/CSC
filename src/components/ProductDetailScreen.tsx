import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Heart, ShoppingBag, ArrowLeft, ShieldCheck, Truck, Sparkles, MessageSquare, Plus, Minus, Tag, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ActiveScreen, Product } from '../types';

interface ProductDetailScreenProps {
  product: Product;
  setActiveScreen: (screen: ActiveScreen) => void;
  setSelectedProductById: (id: string) => void;
  addToCart: (product: Product, size: string, quantity: number, weight_grams?: number) => void;
  favorites: Record<string, boolean>;
  toggleFavorite: (id: string) => void;
}

// Subimages for Gomitas de Explosión Galáctica
const GALACTIC_GALLERY = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCpiDU1FUsKrUy77WDq6JPCy2kU9uvvnAJaJB_HyQW6SFHSnAiGg4-XadyKR84IP_DOgm4j03h32ZL8T-w3KdxVPPebxMSWvLYbApoy12uPtJO_oCxG9fyXZK_g4qdU0cksgx1E2pWA1RT1RAyvc52ad6l9g0ytPcprx-NV262CI5FU-iUEm4iZ83BDlvcIylfZ57Nb__5-AsVdqhSDmtsgwfDM1znhM1PxdZfzhyPpmfV0qbU9wFxkfRcPZ6LrZMNVznHA15cuX8E',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBvuBZZ05BQ600Y1MJJ3siTUCIMayKi3H7Q2aXDGm9gL_yZJJvVg-sd1JXRp4OeHkei0LY682Ql6OTrNTXyzRSPr-K4CZMtD7XPZyAKqYJLTNHfLeMpcnVq84DEnuNkvcJX8yhMSIBntH7beFb3eFzC1zkm1XgeBA0L3iW4VJk2WePKVTEeQC--nDkyULYijxvaAp3pbxW8u5nR5Mn4LrWzN-4kj7GNA23LQu5VQIXXFpSAO3tHWCogCyG2aK3jMRtFU8ixYtFmoDg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBusnJiDJLT8-CTbAdyblUwuMfebV-G2Hf1m_jssfTejnUv7hjaz0NA2TpNBEyye8AJT9lpKcqNN86FZXkf80RGwXDFnXUG_UBF0kQ5ZRZ18LFd135bzJK7PV9HEUyi69SyD3XOCpw53vLkYLCjJeK2H-TUTdGzOQyRNhdTeABsFmSy8JVQivNOZkWaDUwBOdlGWzXRxMcgFLEUsGqNBGXQEgiFD71UuBfe-8hg-TAfoZLMx4Kl9Rbz-Zo5YcBJ6MtuyFLimD5e0xE',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBl5r7qkUBVMtCSoTFu88NjAcdvzTUyOjnEB1S--Ghgo4nP9yGTbzG_NZitDKi24kW8eHpyntX2pnwZT1GcU_qvEwAMlbVymeIpjV37uPQ1HfyZKZMk0ht1KQIgNuVzKE7DNk98YQg0AqaHrNiB4u8wd7r25C68KlljJ7zTOZe8sQSaXcvakwn5P-1IUzbcxMjDfuL0C3PGuvj9k4wOi6NsU8RI44-EB81EcYTM4WMW4zIjfK50Fibk0zTx4siNdRhYRyOpX6-ojgg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCnw8MeSq_M_9W3_9Ena8i60qfdWhMO-bJqTpo2gcKrIT-M_ugfBlI-pTBTR0FBjthPB0AzAyTBUZt2KVyTzr62qWCuQxZXxT2zz2p_Tugy0WEoTo4F0SF71NcYUyM5qGx-XgAgDpKBqbTWquPpyq6neQJjcZfo74rVPYQhyfNPXChJcvsHhOrkp2QXzYmvhkI9LOgdm8kHjwejbAx3qrWHhKPm8lIsJX3Rvc_R8AZ17dgBglyQHgSfQntzDorzULTfshbk_4QmVcM'
];

// Related items with beautiful assets
const RELATED_PRODUCTS = [
  {
    id: 'ositos-cosmicos',
    name: 'Ositos Cósmicos',
    price: 36.00,
    category: 'Gomitas',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnTn-8eN_rgTy-4OoAKqTOyvmfJe77NZsy_yb5Rw1nconCv-rVZbv-sdRLjJkpIPEplZUYOA6LGKSVyzhMBztoYcSD1Sxsq2gZYRsZHto5J9oSWf-3lrop4Dh6X5ijmDL40Hl4erLX62j92n2qaOoPrktp6E2Mgf7EkTCBVj_zuE10WKqPYkqzUSMz2LA04nVGz04htPOJc8lE4Avun7SHMafBQiiw3eyjQ3Ovh2J45F4l0m6rMmUDSexmQ1_6rriHL9vATX-SYkQ'
  },
  {
    id: 'cintas-neon',
    name: 'Cintas Neón',
    price: 25.00,
    category: 'Acidulados',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKcX9ouLcbBZed9-5IMR9dZRT8qVFnD_9hxpyZ_pA213DQ8Bmnyxj7b0Zjjq0JnZwzee2Ym7kok6AhuuvoC-cVDO_-1KtDNzvY-YE6jQqu89oT_GffZ5Jm1GZRXqOib6aR0oeVgD_MM0uhle88ragzvYi0U6oxPMfxC-bC9gUkeMj8BRXXUz3rw3BhSArN7Amaualolqjz4rtqh14usosAeBWR-qomc0TXEZgPTYiNtWl0r1wFrErPenSxEJ5hhmwHEwbLgT7PETE'
  },
  {
    id: 'trufas-galacticas',
    name: 'Trufas Galácticas',
    price: 89.00,
    category: 'Chocolates',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6PG13q1F54FjFcTqlALl73SWWjXh9dkTtBhWkdbaHptLs529Fxi1giKbBCIPUEL-iUV-nC1YC_Ps2G-rxI-0WKJC0XXBWR0WZXD31xtnDZbvKTEGaIpeM871GYMmL37-9tTzfmpQ8bLWc_OsXCUiVJAZWadhdOzPIbgISCO53AQcZmvnQPKbMlh6FRjmNG84G0LGWw8kqOomb5ZoH7G5FVdEw7Q-DGDFrL2ol9ggf8o3Mm_4GRlJc2OrVUxzu8mGpSWOee5PtpUA'
  },
  {
    id: 'nubes-algodon',
    name: 'Nubes de Algodón',
    price: 55.00,
    category: 'Caramelos',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD40m9zbl6ELzkkdCNfNeOQ1pZR2u75kMN7FNNp6a_Q2Ou-W7TtEMw2DQ-iT-fhihLw4uRyAJEwp99jm1WjpevuKN7TUwqkgQgXdFqZhs1TJ0OFYx6JSMgwYRPnsnEe_GV5_kgnEJwzPiaTZtWCOIHtImVYoK1LgnJaNaUlaGJchgOzz5EehtdD42YFy4tlhqxViag1NZqLiYvAPU1KTDLzmCXMMHuoh_5LvaW1AniJL_MhNlvF4DFOnRBKwBtrWDqTCGYS16BUAU0'
  }
];

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  product,
  setActiveScreen,
  setSelectedProductById,
  addToCart,
  favorites,
  toggleFavorite
}) => {
  const isExplosionGalactica = product.id === 'gomitas-explosion-galactica';
  
  // Choose images based on product.images array or fallback to product.image_url
  const galleryImages = (product.images && product.images.length > 0)
    ? product.images
    : (isExplosionGalactica ? GALACTIC_GALLERY : [product.image_url].filter(Boolean));

  const [activeImage, setActiveImage] = React.useState(galleryImages[0] || product.image_url);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };
  
  // Set first size key as active
  const sizeKeys = product.sizes ? Object.keys(product.sizes) : ['Estándar'];
  const [selectedSize, setSelectedSize] = React.useState(sizeKeys[0]);
  const [quantity, setQuantity] = React.useState(1);
  const [weightGrams, setWeightGrams] = React.useState(product.min_weight || 50);
  const [activeTab, setActiveTab] = React.useState<'info' | 'ingredientes' | 'comentarios'>('info');
  
  // Track live client side reviews to give mock inputs
  const [localFeedback, setLocalFeedback] = React.useState<Array<{name: string, stars: number, msg: string, date: string}>>([
    { name: 'Sofía M.', stars: 5, msg: '¡La textura me fascinó! No es dura y el sabor ácidulado no se siente grasoso ni sintético.', date: 'Ayer' },
    { name: 'Daniel K.', stars: 5, msg: 'Excelente presentación. Llegó súper rápido a Coyoacán en un envoltorio térmico impecable.', date: 'Hace 3 días' },
    { name: 'Mariana F.', stars: 4, msg: 'Riquísimo el de pitaya con frambuesa azul, mis favoritos absolutos. Compraré la bolsa de 1KG la próxima.', date: 'Hace 1 semana' }
  ]);
  
  const [newFeedbackName, setNewFeedbackName] = React.useState('');
  const [newFeedbackMsg, setNewFeedbackMsg] = React.useState('');
  const [newFeedbackStars, setNewFeedbackStars] = React.useState(5);
  const [successMsg, setSuccessMsg] = React.useState(false);

  // Re-evaluate image if selected product changes
  React.useEffect(() => {
    const imgs = (product.images && product.images.length > 0)
      ? product.images
      : (isExplosionGalactica ? GALACTIC_GALLERY : [product.image_url].filter(Boolean));
    setActiveImage(imgs[0] || product.image_url);
    const keys = product.sizes ? Object.keys(product.sizes) : ['Estándar'];
    setSelectedSize(keys[0]);
    setQuantity(1);
    setWeightGrams(product.min_weight || 50);
    setSuccessMsg(false);
    window.scrollTo(0, 0);
  }, [product]);

  const activePrice = product.unit_type === 'weight'
    ? (weightGrams / 1000) * (product.price_per_kg || 0)
    : product.sizes && product.sizes[selectedSize]
      ? product.sizes[selectedSize]
      : product.base_price;

  const handleCreateFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackName.trim() || !newFeedbackMsg.trim()) return;

    setLocalFeedback(prev => [
      {
        name: newFeedbackName,
        stars: newFeedbackStars,
        msg: newFeedbackMsg,
        date: 'Reciente'
      },
      ...prev
    ]);

    setNewFeedbackName('');
    setNewFeedbackMsg('');
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 2500);
  };

  const isFav = !!favorites[product.id];

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb strip */}
      <div className="bg-gradient-to-r from-purple-900 to-pink-900 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setActiveScreen('catalogo')}
            className="inline-flex items-center space-x-2 text-sm font-semibold text-purple-200 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Volver al Catálogo</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* 1. Primary Grid Structure details */}
        <div className="bg-white rounded-3xl p-4 sm:p-8 lg:p-12 shadow-sm border border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          
          {/* Left Gallery Panel */}
          <div className="lg:col-span-6 flex flex-col space-y-4">
            
            {/* Visual canvas with zoom trigger */}
            <div
              onClick={() => {
                const currentIdx = galleryImages.indexOf(activeImage);
                openLightbox(currentIdx >= 0 ? currentIdx : 0);
              }}
              className="relative aspect-square rounded-3xl bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 overflow-hidden flex items-center justify-center border border-purple-100/50 shadow-lg shadow-purple-100/30 cursor-zoom-in group"
            >
              <motion.img
                key={activeImage}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                src={activeImage}
                alt={product.name}
                referrerPolicy="no-referrer"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />

              {/* Zoom overlay badge */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                  <Maximize2 className="w-4 h-4 text-pink-400" />
                  <span>Tocar para ampliar imagen</span>
                </span>
              </div>

              {/* Stock badge */}
              {product.stock === 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                  Agotado
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(product.id);
                }}
                className={`absolute top-4 right-4 p-3 rounded-2xl shadow-xl transition-all ${
                  isFav 
                    ? 'bg-pink-500 text-white shadow-pink-300/60' 
                    : 'bg-white/90 text-slate-400 hover:text-pink-500 hover:bg-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Thumbnail collection if more than 1 image exists */}
            {galleryImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5">
                {galleryImages.map((imgUrl, index) => {
                  const isCurrent = activeImage === imgUrl;
                  return (
                    <button
                      key={index}
                      onClick={() => setActiveImage(imgUrl)}
                      className={`relative aspect-square rounded-xl overflow-hidden bg-slate-100 border-2 transition-all cursor-pointer group ${
                        isCurrent ? 'border-purple-600 ring-2 ring-purple-100 scale-105' : 'border-transparent hover:border-purple-300 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Guarantees bar */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 mt-2">
              <div className="flex items-center space-x-2.5">
                <Truck className="w-5 h-5 text-purple-600 shrink-0" />
                <div className="text-xs leading-none">
                  <p className="font-bold text-slate-800">Envío Climatizado</p>
                  <p className="text-slate-500 mt-0.5">Control de derretido</p>
                </div>
              </div>
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs leading-none">
                  <p className="font-bold text-slate-800">Materias Primas</p>
                  <p className="text-slate-500 mt-0.5">Orgánico vegetal</p>
                </div>
              </div>
            </div>

          </div>
          {/* Right Description and controls */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            
            {/* Header Product details */}
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-purple-50 border border-purple-100 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                  {product.category}
                </span>
                {product.diet?.map((di, index) => (
                  <span key={index} className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    {di}
                  </span>
                ))}
              </div>

              <h1 className="font-headline font-black text-2xl sm:text-3xl lg:text-4xl text-slate-950 leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-0.5">
                  {[1, 2, 3, 4, 5].map((st) => (
                    <Star key={st} className={`w-4 h-4 ${st <= product.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                  ))}
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  ({product.reviews + localFeedback.length - 3} valoraciones)
                </span>
              </div>
            </div>

            {/* Main description description */}
            <p className="text-slate-650 text-sm leading-relaxed font-sans">
              {product.description}
            </p>

            {/* Weight selector for granel products */}
            {product.unit_type === 'weight' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-headline font-extrabold text-slate-700 uppercase tracking-widest flex items-center space-x-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Seleccionar Peso:</span>
                  </h3>
                  <span className="text-[10px] text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-full">Combinable con otros</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setWeightGrams(g => Math.max(product.min_weight || 50, g - (product.weight_step || 50)))}
                    className="w-12 h-12 rounded-xl border-2 border-slate-200 flex items-center justify-center hover:border-purple-300 transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-3xl font-black text-slate-900">{weightGrams}g</span>
                    <p className="text-sm text-slate-500 font-semibold">${((weightGrams / 1000) * (product.price_per_kg || 0)).toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => setWeightGrams(g => Math.min(product.max_weight || 1000, g + (product.weight_step || 50)))}
                    className="w-12 h-12 rounded-xl border-2 border-slate-200 flex items-center justify-center hover:border-purple-300 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Dynamic Weights choices for piece products */}
            {product.unit_type !== 'weight' && product.sizes && (
              <div className="space-y-2">
                <h3 className="text-xs font-headline font-extrabold text-slate-700 uppercase tracking-widest flex items-center space-x-1">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Seleccionar Presentación / Peso:</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(product.sizes).map((weightKey) => {
                    const priceVal = product.sizes![weightKey];
                    const isSelected = selectedSize === weightKey;
                    return (
                      <button
                        key={weightKey}
                        onClick={() => setSelectedSize(weightKey)}
                        className={`px-4 py-2.5 rounded-xl border-2 text-xs font-bold transition-all flex flex-col items-center justify-center min-w-[90px] cursor-pointer ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/50 text-purple-800'
                            : 'border-slate-200 hover:border-slate-350 bg-white text-slate-700'
                        }`}
                      >
                        <span className="text-xs">{weightKey}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">${priceVal.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cost display */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
              
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-medium">{product.unit_type === 'weight' ? 'Precio:' : 'Subtotal Estimado:'}</span>
                <span className="text-2xl font-black text-slate-950">
                  ${activePrice.toFixed(2)}
                </span>
                {product.unit_type === 'weight' ? (
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    ${(product.price_per_kg || 0).toFixed(2)} / kg
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    Precios con IVA incluido
                  </span>
                )}
              </div>

              {/* Quantity selector — only for piece products */}
              {product.unit_type !== 'weight' && (
                <div className="flex items-center space-x-3.5">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Cantidad:
                  </div>
                  <div className="flex items-center space-x-1 border border-slate-200 rounded-xl bg-white p-1">
                    <button
                      disabled={quantity <= 1}
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-650 disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-slate-900 leading-none">
                      {quantity}
                    </span>
                    <button
                      disabled={quantity >= 10}
                      onClick={() => setQuantity(prev => Math.min(10, prev + 1))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-650 disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Main CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                id="addToCartDetail"
                onClick={() => {
                  if (product.unit_type === 'weight') {
                    addToCart(product, 'Granel', 1, weightGrams);
                  } else {
                    addToCart(product, selectedSize, quantity);
                  }
                }}
                disabled={product.stock === 0 || (product.unit_type === 'weight' && product.stock < weightGrams)}
                className={`flex-1 flex items-center justify-center space-x-2.5 px-8 py-4 font-bold rounded-2xl shadow-lg transition-all duration-150 text-base ${
                  product.stock === 0 || (product.unit_type === 'weight' && product.stock < weightGrams)
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'candy-gradient-bg text-white shadow-purple-300/50 hover:shadow-purple-400/60 hover:opacity-95 cursor-pointer active:scale-98 hover:-translate-y-0.5'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{product.stock === 0 ? 'Agotado' : product.unit_type === 'weight' ? `Agregar ${weightGrams}g a la Bolsa` : 'Agregar a la Bolsa'}</span>
              </button>
            </div>

          </div>

        </div>

        {/* 2. Advanced specifications & comments dynamic tabs group */}
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden mt-10">
          
          {/* Navigation Tab titles */}
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            {[
              { id: 'info', label: 'Descripción' },
              { id: 'ingredientes', label: 'Ingredientes' },
              { id: 'comentarios', label: `Opiniones (${localFeedback.length})` }
            ].map((tb) => (
              <button
                key={tb.id}
                onClick={() => setActiveTab(tb.id as any)}
                className={`px-6 py-4 text-xs sm:text-sm font-bold transition-all relative cursor-pointer ${
                  activeTab === tb.id ? 'text-purple-700 bg-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {activeTab === tb.id && (
                  <motion.div
                    layoutId="tabLineIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"
                  />
                )}
                {tb.label}
              </button>
            ))}
          </div>

          <div className="p-6 sm:p-10">
            {activeTab === 'info' && (
              <div className="space-y-4 max-w-3xl">
                <h3 className="font-headline font-bold text-lg text-slate-900">
                  La experiencia sensorial de {product.name}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed font-sans">
                  Elaborado con jarabes de agave naturales, pulpa condensada y colorantes de extractos vegetales directos (remolacha, espirulina, zanahoria negra). La cocción lenta en ollas de cobre previene que el sabor se deteriore y garantiza gominolas suaves con elasticidad excelente.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-800">Presentación</p>
                    <p className="text-xs text-slate-500 mt-1">Bolsa termosellada con zip reutilizable libre de polipropilenos nocivos.</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-800">Conservación</p>
                    <p className="text-xs text-slate-500 mt-1">Mantener en un lugar fresco y seco alejado del sol (idealmente entre 15°C y 22°C).</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ingredientes' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="font-headline font-bold text-lg text-slate-900 mb-2">
                    Fórmula de origen transparente:
                  </h3>
                  <p className="text-xs text-slate-500 bg-yellow-50 text-yellow-800 p-3 rounded border border-yellow-100 flex items-center space-x-2 font-semibold">
                    <span>⚠️ AVISO ALERGENOS: Fabricado en instalaciones que procesan frutos de cáscara y trazas de lactosa.</span>
                  </p>
                </div>
                
                <div className="prose prose-pink text-slate-650 text-sm font-sans space-y-3 leading-relaxed">
                  <p>
                    <span className="font-bold text-slate-850">Gomitas / Caramelos:</span> Jugo de fruta reconstituido (32%), fructosa orgánica de agave, espesante (pectina de manzana cítrica 100% vegetal), corrector de acidez (ácido cítrico natural, ácido málico), aromas naturales de frambuesa silvestre y pitaya fresca, agentes de recubrimiento (cera de carnauba ecológica).
                  </p>
                  <p>
                    <span className="font-bold text-slate-850">Chocolates:</span> Licor de cacao, azúcar de caña orgánica, manteca de cacao pura desodorizada, emulsionante (lecitina de girasol no transgénica), flor de sal marina de colima en trufas de caramelo.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'comentarios' && (
              <div className="space-y-8">
                
                {/* Review listings */}
                <div className="space-y-4 max-w-3xl">
                  {localFeedback.map((opinion, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full candy-gradient-bg text-white flex items-center justify-center font-bold text-sm shadow">
                            {opinion.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{opinion.name}</p>
                            <p className="text-[10px] text-slate-400">{opinion.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-0.5">
                          {[1, 2, 3, 4, 5].map((st) => (
                            <Star key={st} className={`w-3.5 h-3.5 ${st <= opinion.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">{opinion.msg}</p>
                    </div>
                  ))}
                </div>

                {/* Feedback Submission form */}
                <div className="border-t border-slate-100 pt-8 max-w-xl">
                  <h3 className="font-headline font-bold text-lg text-slate-900 mb-1">
                    ¿Probaste este dulce celestial?
                  </h3>
                  <p className="text-xs text-slate-550 mb-4">
                    Deja tu opinión sincera para ayudar a otros clientes de Chamical Candy Shop.
                  </p>

                  <form onSubmit={handleCreateFeedback} className="space-y-4">
                    
                    {/* Stars slider selector */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-600">Calificación:</span>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((starNum) => (
                          <button
                            key={starNum}
                            type="button"
                            onClick={() => setNewFeedbackStars(starNum)}
                            className="p-1 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star className={`w-5 h-5 ${starNum <= newFeedbackStars ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          required
                          value={newFeedbackName}
                          onChange={(e) => setNewFeedbackName(e.target.value)}
                          placeholder="Tu Nombre (Ej: Sofía G.)"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-purple-500 focus:bg-white rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <textarea
                        required
                        rows={3}
                        value={newFeedbackMsg}
                        onChange={(e) => setNewFeedbackMsg(e.target.value)}
                        placeholder="Describe las texturas, acidez, dulzura o empaque de tu gominola..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-purple-500 focus:bg-white rounded-lg text-xs"
                      />
                    </div>

                    {successMsg && (
                      <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 bg-emerald-50 p-2.5 rounded border border-emerald-150">
                        <Sparkles className="w-4 h-4 text-emerald-500 animate-bounce" />
                        <span>¡Tu opinión ha sido indexada con éxito en la galaxia!</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow transition-colors cursor-pointer"
                    >
                      Publicar Opinión
                    </button>

                  </form>
                </div>

              </div>
            )}
          </div>

        </div>

        {/* 3. Related Items Section */}
        <div className="mt-14 space-y-6">
          <h2 className="font-headline font-bold text-xl sm:text-2xl text-slate-900 text-center sm:text-left">
            Otros exploradores compraron también:
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {RELATED_PRODUCTS.map((relItem) => (
                <div 
                  key={relItem.id}
                  onClick={() => setSelectedProductById(relItem.id)}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all group p-3 space-y-3"
                >
                  <div className="aspect-square rounded-xl bg-slate-50 overflow-hidden">
                    <img
                      src={relItem.image}
                      alt={relItem.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase leading-none">
                      {relItem.category}
                    </span>
                    <h4 className="font-headline font-bold text-xs sm:text-sm text-slate-900 leading-tight mt-0.5 group-hover:text-pink-650 transition-colors line-clamp-1">
                      {relItem.name}
                    </h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs sm:text-sm font-black text-slate-900">
                        ${relItem.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-pink-500 font-bold group-hover:underline">
                        Detalles
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

      </div>

      {/* Fullscreen Image Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between z-10" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center space-x-3">
                <span className="text-white font-bold text-sm sm:text-base">{product.name}</span>
                <span className="bg-white/10 text-pink-300 text-xs px-3 py-1 rounded-full font-mono font-bold border border-white/10">
                  {lightboxIndex + 1} / {galleryImages.length}
                </span>
              </div>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Main Lightbox Image View */}
            <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {galleryImages.length > 1 && (
                <button
                  onClick={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
                  className="absolute left-2 sm:left-4 z-10 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
                  title="Anterior"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
              )}

              <motion.img
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                src={galleryImages[lightboxIndex]}
                alt={`${product.name} amplia ${lightboxIndex + 1}`}
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/10 select-none"
              />

              {galleryImages.length > 1 && (
                <button
                  onClick={() => setLightboxIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
                  className="absolute right-2 sm:right-4 z-10 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
                  title="Siguiente"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              )}
            </div>

            {/* Bottom Thumbnail Strip inside Lightbox */}
            {galleryImages.length > 1 && (
              <div className="flex items-center justify-center space-x-2.5 overflow-x-auto py-2 z-10" onClick={(e) => e.stopPropagation()}>
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLightboxIndex(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 ${
                      idx === lightboxIndex ? 'border-pink-500 ring-2 ring-pink-500/50 scale-110' : 'border-white/20 opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
