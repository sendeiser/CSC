import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, Star, Heart, ShoppingBag, Eye, Percent, CheckCircle2, RefreshCw } from 'lucide-react';
import { ActiveScreen, Product } from '../types';
import { products as productsApi } from '../lib/api';

interface CatalogScreenProps {
  setActiveScreen: (screen: ActiveScreen) => void;
  setSelectedProductById: (id: string) => void;
  addToCart: (product: Product, selectedSize?: string, quantity?: number) => void;
  favorites: Record<string, boolean>;
  toggleFavorite: (id: string) => void;
}

const CATEGORIES = ['Todos', 'Gomitas', 'Chocolates', 'Acidulados', 'Caramelos', 'Regalos'] as const;

export const CatalogScreen: React.FC<CatalogScreenProps> = ({
  setActiveScreen,
  setSelectedProductById,
  addToCart,
  favorites,
  toggleFavorite
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<typeof CATEGORIES[number]>('Todos');

  const [onlyVegan, setOnlyVegan] = React.useState(false);
  const [onlyOrganic, setOnlyOrganic] = React.useState(false);
  const [onlyNoSugar, setOnlyNoSugar] = React.useState(false);
  const [onlySale, setOnlySale] = React.useState(false);

  const [sortBy, setSortBy] = React.useState<'none' | 'priceAsc' | 'priceDesc' | 'stars'>('none');
  const [showFilters, setShowFilters] = React.useState(false);

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (selectedCategory !== 'Todos') params.category = selectedCategory
    if (searchTerm.trim()) params.search = searchTerm
    if (onlyVegan) params.vegan = 'true'
    if (onlyOrganic) params.organic = 'true'
    if (onlyNoSugar) params.noSugar = 'true'
    if (onlySale) params.onSale = 'true'
    if (sortBy !== 'none') params.sort = sortBy

    productsApi.list(params)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedCategory, searchTerm, onlyVegan, onlyOrganic, onlyNoSugar, onlySale, sortBy])

  return (
    <div className="bg-white min-h-screen pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-headline font-extrabold text-gray-900">Catálogo</h1>
            <p className="text-gray-500 mt-1.5 text-sm">{products.length} dulces encontrados</p>
          </div>
        </div>

        {/* Search + Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar dulces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-pink-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all bg-pink-50/30"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-5 py-3 border rounded-xl text-sm font-semibold transition-all ${
              showFilters ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-pink-200 hover:bg-pink-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtros</span>
          </button>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-pink-50/60 border border-pink-100 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dieta:</span>
                  <button onClick={() => setOnlyVegan(!onlyVegan)} className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${onlyVegan ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-pink-200 hover:bg-pink-50'}`}>
                    🌱 Vegano
                  </button>
                  <button onClick={() => setOnlyOrganic(!onlyOrganic)} className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${onlyOrganic ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-pink-200 hover:bg-pink-50'}`}>
                    🌿 Orgánico
                  </button>
                  <button onClick={() => setOnlyNoSugar(!onlyNoSugar)} className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${onlyNoSugar ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-pink-200 hover:bg-pink-50'}`}>
                    🚫 Sin Azúcar
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estado:</span>
                  <button onClick={() => setOnlySale(!onlySale)} className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${onlySale ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-gray-600 border-pink-200 hover:bg-pink-50'}`}>
                    🔥 En Oferta
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ordenar:</span>
                  {(['none', 'priceAsc', 'priceDesc', 'stars'] as const).map((opt) => (
                    <button key={opt} onClick={() => setSortBy(opt)} className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${sortBy === opt ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-pink-200 hover:bg-pink-50'}`}>
                      {opt === 'none' ? 'Por defecto' : opt === 'priceAsc' ? 'Menor precio' : opt === 'priceDesc' ? 'Mayor precio' : 'Mejor valorados'}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-600 border-pink-200 hover:bg-pink-50'
              }`}
            >
              {cat === 'Todos' ? '✨ Todos' : cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-semibold">No se encontraron productos</p>
            <p className="text-sm mt-1">Intenta con otros filtros o búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-16">
            {products.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                layout
                className="group bg-white rounded-2xl border border-pink-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
              >
                {/* Image Container */}
                <div className="relative overflow-hidden aspect-square bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Tags */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {product.tags?.slice(0, 2).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-white/85 backdrop-blur-sm text-[10px] font-bold text-purple-700 rounded-full shadow-sm uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                    {product.onSale && product.discountPercentage && (
                      <span className="px-2 py-0.5 bg-pink-500 text-white text-[10px] font-bold rounded-full shadow-sm flex items-center space-x-0.5">
                        <Percent className="w-2.5 h-2.5" />
                        <span>-{product.discountPercentage}%</span>
                      </span>
                    )}
                  </div>
                  {/* Favorites */}
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${favorites[product.id] ? 'text-pink-500 fill-pink-500' : 'text-gray-400'}`} />
                  </button>
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1 space-y-2">
                  <h3 className="font-headline font-bold text-base text-gray-900 leading-tight">{product.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 flex-1">{product.description}</p>

                  {/* Stars */}
                  <div className="flex items-center space-x-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < product.stars ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                    ))}
                    <span className="text-[10px] text-gray-400 ml-1">({product.reviews})</span>
                  </div>

                  {/* Price + Add to Cart */}
                  <div className="flex items-center justify-between pt-2 border-t border-pink-50">
                    <div className="flex flex-col">
                      {product.onSale && product.discountPercentage ? (
                        <span className="text-lg font-bold text-pink-600">
                          ${(product.base_price * (1 - product.discountPercentage / 100)).toFixed(2)}
                          <span className="text-xs text-gray-400 line-through ml-1.5 font-normal">${product.base_price.toFixed(2)}</span>
                        </span>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">${product.base_price.toFixed(2)}</span>
                      )}
                      {product.diet?.length ? (
                        <span className="text-[10px] text-gray-400">{product.diet.join(' • ')}</span>
                      ) : null}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => { setSelectedProductById(product.id); setActiveScreen('detalle'); }}
                        className="w-9 h-9 rounded-full border border-pink-200 text-purple-600 hover:bg-purple-50 transition-colors flex items-center justify-center"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => addToCart(product, Object.keys(product.sizes || {})[0] || '1 pieza', 1)}
                        className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 transition-opacity flex items-center justify-center shadow-sm"
                        title="Añadir al carrito"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
