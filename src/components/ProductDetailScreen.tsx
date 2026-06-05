import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Heart, ShoppingBag, ArrowLeft, ShieldCheck, Truck, Sparkles, MessageSquare, Plus, Minus, Tag } from 'lucide-react';
import { ActiveScreen, Product } from '../types';
import { PRODUCTS } from '../data';

interface ProductDetailScreenProps {
  product: Product;
  setActiveScreen: (screen: ActiveScreen) => void;
  setSelectedProductById: (id: string) => void;
  addToCart: (product: Product, size: string, quantity: number) => void;
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
    id: 'nubes-de-mango',
    name: 'Nubes de Mango',
    price: 38.00,
    category: 'Gomitas',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBS7No9FsP6m-i1Z859w-B05BE2fQPrJ_5D6cFO_-Mj-avK6XgjHV9ALFtd4Q_pNRaspRewE4p3LLFZT3gy-SOxPk_AQfLwcnLdH7p6lAgsvuWUyeXiRspTy8AhEqEim05k7BuxOsiAstd1JFh7OjhELKsJrXjC9k41z_6ZfAd2zk3jK9d0PZhJs7epYKG_ZVApMcaT7XqYj4JVnL5ixiNAsu6_nQ1_0zb3IDLVraj4OTruvbsjlsW_oW3rBcooB2W3rkUz0xYxNSk'
  },
  {
    id: 'crunch-de-chocolate',
    name: 'Crunch de Chocolate',
    price: 45.00,
    category: 'Chocolates',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPOz-Fogyy5begyn-XTC0kfsvJe2Q1lWMkwFfqIH0Y45egKu-Gv_7T-wmTGmU04yHWX8dTqIEnS1Vv2iCVe9obQaPnXvPT3U6djkdqZYY9D1NuOw_up4SUTkBZm_ize1uJHT1Qa3RBnL_LUKTrVDHS7Vm5Ds2GXGNIooKZJj0_09rlulAZt58PHdwI3CkvpBXfCe4U5cm4oK9MDsfKVV0PSwYYq6Jjw2YdHXrmYoL8dXk8uWNSR_tmi1LcLur6jlV6XVpJd8IGzqM'
  },
  {
    id: 'ositos-acidos',
    name: 'Ositos Ácidos',
    price: 15.00,
    category: 'Acidulados',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrengP_OE5zkCpV35zptHGX8HgDU2myQC0eSG-hqM63JkzhBcGucrPFSuO5BnBQiyjNbgVLfnctKm2nGsyoywoVSHjMugfaHvjrz0ybDXKnwDTcvoxQ993_5Ma6tZ21uWMGQwmVCjdKbnQdyQ3w7ZJOmf1pN-wVGp-mhuPgMTPAb2x17BWtYIUERE6dstRQKm6BGvUIYD-K0LyNCkVE33A6l7WJbQCiTtl3K7dLuFRPNLDs-AkQOBAshwsJGs2GV4x54QuFYChqyE'
  },
  {
    id: 'remolinos-de-seda',
    name: 'Remolinos de Seda',
    price: 65.05,
    category: 'Caramelos',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsq6dQ9MHg6ou9SOMIS2WUwYJ9n0Lmdgmsrwk3mMYKJtgEhwmJAIpsKF7Wyy90J0XJiWjafUhL0TfPac4h4nPr5FQLOoH02tX1eWA5imfnlAxHAaSjwucTV2_IqWY3t3-xOaQhBtz6AzA5GX_Iholz_sPSC8-k7czFX_gNQk7syY7gRlJhormnguOjrbaCYof02dRIbnyxUZiJTFTEDhAzTi6Nygi757HrnqwkreJUZg4RQjYFGH_AHrxLCKEDWiADDzsQ0m2zwR4'
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
  
  // Choose images based on whether it is Explosion Galactica or another item
  const galleryImages = isExplosionGalactica ? GALACTIC_GALLERY : [product.image];
  const [activeImage, setActiveImage] = React.useState(galleryImages[0]);
  
  // Set first size key as active
  const sizeKeys = product.sizes ? Object.keys(product.sizes) : ['Estándar'];
  const [selectedSize, setSelectedSize] = React.useState(sizeKeys[0]);
  const [quantity, setQuantity] = React.useState(1);
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
    setActiveImage(galleryImages[0]);
    const keys = product.sizes ? Object.keys(product.sizes) : ['Estándar'];
    setSelectedSize(keys[0]);
    setQuantity(1);
    setSuccessMsg(false);
  }, [product]);

  // Read weight price
  const activePrice = product.sizes && product.sizes[selectedSize] 
    ? product.sizes[selectedSize] 
    : product.price;

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
    <div className="bg-slate-50 min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link Button */}
        <button
          onClick={() => setActiveScreen('catalogo')}
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-purple-700 transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo</span>
        </button>

        {/* 1. Primary Grid Structure details */}
        <div className="bg-white rounded-3xl p-4 sm:p-8 lg:p-12 shadow-sm border border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          
          {/* Left Gallery Panel */}
          <div className="lg:col-span-6 flex flex-col space-y-4">
            
            {/* Visual canvas */}
            <div className="relative aspect-square rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center">
              <img
                src={activeImage}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => toggleFavorite(product.id)}
                className={`absolute top-4 right-4 p-3 rounded-full border shadow-md transition-colors cursor-pointer ${
                  isFav 
                    ? 'bg-pink-50 border-pink-100 text-pink-500 animate-pulse' 
                    : 'bg-white/90 border-slate-100 text-slate-400 hover:text-pink-500'
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
                      className={`relative aspect-square rounded-xl overflow-hidden bg-slate-100 border-2 transition-all cursor-pointer ${
                        isCurrent ? 'border-purple-600 ring-2 ring-purple-100' : 'border-transparent hover:border-slate-300'
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
                <span className="bg-purple-150 text-purple-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {product.category}
                </span>
                {product.diet?.map((di, index) => (
                  <span key={index} className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded">
                    {di}
                  </span>
                ))}
              </div>

              <h1 className="font-headline font-black text-2xl sm:text-3xl lg:text-4xl text-slate-950 leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((st) => (
                    <Star key={st} className={`w-4 h-4 ${st <= product.stars ? 'fill-current' : 'text-slate-200'}`} />
                  ))}
                </div>
                <span className="text-xs text-slate-500 font-bold">
                  ({product.reviews + localFeedback.length - 3} valoraciones certificadas)
                </span>
              </div>
            </div>

            {/* Main description description */}
            <p className="text-slate-650 text-sm leading-relaxed font-sans">
              {product.description}
            </p>

            {/* Dynamic Weights choices (Renders if sizes exist) */}
            {product.sizes && (
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

            {/* Cost and quantity selector */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
              
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-medium">Subtotal Estimado:</span>
                <span className="text-2xl font-black text-slate-950">
                  ${(activePrice * quantity).toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  Precios con IVA incluido
                </span>
              </div>

              {/* Counter quantity */}
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

            </div>

            {/* Main CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                id="addToCartDetail"
                onClick={() => {
                  addToCart(product, selectedSize, quantity);
                }}
                className="flex-1 flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:opacity-95 text-white font-bold rounded-xl shadow-md cursor-pointer transition-transform duration-100 active:scale-95"
              >
                <ShoppingBag className="w-5 h-5 animate-pulse" />
                <span>Agregar a la Bolsa</span>
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
                    <div key={idx} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                            {opinion.name[0]}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{opinion.name}</p>
                            <p className="text-[10px] text-slate-400">{opinion.date}</p>
                          </div>
                        </div>

                        <div className="flex items-center text-amber-400 space-x-0.5">
                          {[1, 2, 3, 4, 5].map((st) => (
                            <Star key={st} className={`w-3.5 h-3.5 ${st <= opinion.stars ? 'fill-current' : 'text-slate-100'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-sans pl-1">
                        {opinion.msg}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Feedback Submission form */}
                <div className="border-t border-slate-100 pt-8 max-w-xl">
                  <h3 className="font-headline font-bold text-lg text-slate-900 mb-1">
                    ¿Probaste este dulce celestial?
                  </h3>
                  <p className="text-xs text-slate-550 mb-4">
                    Deja tu opinión sincera para guiar en su viaje a otros exploradores de Candyverse.
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
            {RELATED_PRODUCTS.map((relItem) => {
              // Find matching full product from database if possible, otherwise map it
              const originalProd = PRODUCTS.find(p => p.id === relItem.id) || {
                id: relItem.id,
                name: relItem.name,
                description: 'Sabores celestiales elaborados en lotes limitados.',
                category: relItem.category as any,
                price: relItem.price,
                image: relItem.image,
                tags: ['ESTRELLAS'],
                stars: 5,
                reviews: 45
              };

              return (
                <div 
                  key={relItem.id}
                  onClick={() => {
                    setSelectedProductById(originalProd.id);
                    // scroll parent window back to top smoothly
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
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
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
