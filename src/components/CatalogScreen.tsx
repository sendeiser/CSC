import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, Star, Heart, ShoppingBag, Eye, Percent, RefreshCw, Scale, X, ChevronDown } from 'lucide-react';
import { ActiveScreen, Product } from '../types';
import { products as productsApi } from '../lib/api';

interface CatalogScreenProps {
  setActiveScreen: (screen: ActiveScreen) => void;
  setSelectedProductById: (id: string) => void;
  addToCart: (product: Product, selectedSize?: string, quantity?: number) => void;
  favorites: Record<string, boolean>;
  toggleFavorite: (id: string) => void;
}

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden shadow-sm">
      <div className="aspect-square skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-3 skeleton rounded-full w-1/3" />
        <div className="h-4 skeleton rounded-full w-4/5" />
        <div className="h-3 skeleton rounded-full w-2/3" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-5 skeleton rounded-full w-1/4" />
          <div className="flex space-x-2">
            <div className="w-9 h-9 skeleton rounded-full" />
            <div className="w-9 h-9 skeleton rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export const CatalogScreen: React.FC<CatalogScreenProps> = ({
  setActiveScreen,
  setSelectedProductById,
  addToCart,
  favorites,
  toggleFavorite
}) => {
  const [categoriesList, setCategoriesList] = useState<any[]>([])
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('Todos');

  const [onlyVegan, setOnlyVegan] = React.useState(false);
  const [onlyOrganic, setOnlyOrganic] = React.useState(false);
  const [onlyNoSugar, setOnlyNoSugar] = React.useState(false);
  const [onlySale, setOnlySale] = React.useState(false);

  const [sortBy, setSortBy] = React.useState<'none' | 'priceAsc' | 'priceDesc' | 'stars'>('none');
  const [showFilters, setShowFilters] = React.useState(false);

  const hasActiveFilters = onlyVegan || onlyOrganic || onlyNoSugar || onlySale || sortBy !== 'none';

  const clearFilters = () => {
    setOnlyVegan(false); setOnlyOrganic(false); setOnlyNoSugar(false);
    setOnlySale(false); setSortBy('none');
  };

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.ok ? r.json() : [])
      .then(setCategoriesList)
      .catch(() => {})
  }, [])

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
    <div className="bg-white min-h-screen">
      {/* Hero banner */}
      <div className="relative bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #ec4899 0%, transparent 50%), radial-gradient(circle at 80% 20%, #a855f7 0%, transparent 50%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <span className="inline-block bg-white/10 border border-white/20 text-pink-200 text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-4">
              Todo nuestro catálogo
            </span>
            <h1 className="font-headline font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight">
              Dulces para
              <span className="block candy-gradient-text">todos los antojos</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-white/70 max-w-lg">
              Gomitas, chocolates, caramelos y más — todo por granel al mejor precio.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* Search + Filter Bar */}
        <div className="flex gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar dulces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-10 py-3 border border-pink-200 rounded-2xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition-all bg-pink-50/20 placeholder:text-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3 text-gray-500" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative flex items-center space-x-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all border ${
              showFilters || hasActiveFilters
                ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                : 'bg-white text-gray-600 border-pink-200 hover:bg-pink-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
            {hasActiveFilters && (
              <span className="w-4 h-4 rounded-full bg-pink-400 text-white text-[9px] font-bold flex items-center justify-center absolute -top-1.5 -right-1.5">
                !
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
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
              <div className="bg-gradient-to-br from-purple-50/80 to-pink-50/80 border border-purple-100 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filtros avanzados</span>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center space-x-1"
                    >
                      <X className="w-3 h-3" />
                      <span>Limpiar</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider w-full sm:w-auto">Dieta:</span>
                  {[
                    { label: '🌱 Vegano', active: onlyVegan, toggle: () => setOnlyVegan(!onlyVegan) },
                    { label: '🌿 Orgánico', active: onlyOrganic, toggle: () => setOnlyOrganic(!onlyOrganic) },
                    { label: '🚫 Sin Azúcar', active: onlyNoSugar, toggle: () => setOnlyNoSugar(!onlyNoSugar) },
                    { label: '🔥 En Oferta', active: onlySale, toggle: () => setOnlySale(!onlySale) },
                  ].map(({ label, active, toggle }) => (
                    <button
                      key={label}
                      onClick={toggle}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        active ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-white text-gray-600 border-pink-200 hover:bg-pink-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider w-full sm:w-auto">Ordenar:</span>
                  {(['none', 'priceAsc', 'priceDesc', 'stars'] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSortBy(opt)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        sortBy === opt ? 'bg-pink-600 text-white border-pink-600 shadow-sm' : 'bg-white text-gray-600 border-pink-200 hover:bg-pink-50'
                      }`}
                    >
                      {opt === 'none' ? 'Por defecto' : opt === 'priceAsc' ? '↑ Menor precio' : opt === 'priceDesc' ? '↓ Mayor precio' : '⭐ Mejor valorados'}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Granel banner */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-4 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
            <Scale className="w-4.5 h-4.5" />
          </div>
          <p className="text-xs sm:text-sm text-purple-800 font-medium">
            Vendemos <strong>por gramos</strong> — elegí el peso exacto y <strong>combiná</strong> distintos sabores en un pedido.
          </p>
        </div>

        {/* Category pills — scroll horizontal en mobile */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {['Todos', ...categoriesList.map((c: any) => c.slug)].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all border whitespace-nowrap ${
                selectedCategory === cat
                  ? 'candy-gradient-bg text-white border-transparent shadow-md shadow-purple-200/50'
                  : 'bg-white text-gray-600 border-pink-200 hover:bg-pink-50'
              }`}
            >
              {cat === 'Todos' ? '✨ Todos' : cat}
            </button>
          ))}
        </div>

        {/* Counter */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="font-bold text-gray-800">{products.length}</span> dulces encontrados
            {selectedCategory !== 'Todos' && (
              <span className="text-purple-600 font-semibold"> en {selectedCategory}</span>
            )}
          </p>
          {loading && <RefreshCw className="w-4 h-4 text-purple-500 animate-spin" />}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-16">
            {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 space-y-4"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-pink-50 flex items-center justify-center text-4xl">🍬</div>
            <p className="text-lg font-bold text-gray-700">Sin resultados</p>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">No encontramos dulces con esos filtros. Probá con otros.</p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('Todos'); clearFilters(); }}
              className="inline-flex items-center space-x-2 px-5 py-2.5 candy-gradient-bg text-white rounded-xl text-sm font-bold shadow-md"
            >
              <X className="w-4 h-4" />
              <span>Limpiar todo</span>
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 pb-16">
            {products.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-2xl border border-pink-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-200 flex flex-col"
              >
                {/* Image */}
                <div className="relative overflow-hidden aspect-square bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
                  <button
                    onClick={() => { setSelectedProductById(product.id); setActiveScreen('detalle'); }}
                    className="w-full h-full block"
                  >
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                      loading="lazy"
                      decoding="async"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
                      <span className="bg-white/90 backdrop-blur-sm text-purple-700 text-[10px] font-bold px-3 py-1 rounded-full flex items-center space-x-1 shadow">
                        <Eye className="w-3 h-3" />
                        <span>Ver detalle</span>
                      </span>
                    </div>
                  </button>

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.stock === 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full shadow">AGOTADO</span>
                    )}
                    {product.onSale && product.discountPercentage && (
                      <span className="px-2 py-0.5 bg-pink-500 text-white text-[9px] font-bold rounded-full shadow flex items-center space-x-0.5">
                        <Percent className="w-2.5 h-2.5" />
                        <span>-{product.discountPercentage}%</span>
                      </span>
                    )}
                    {product.tags?.slice(0, 1).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-white/85 backdrop-blur-sm text-[9px] font-bold text-purple-700 rounded-full shadow uppercase">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Favorite */}
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center shadow hover:bg-white hover:scale-110 transition-all"
                  >
                    <Heart className={`w-4 h-4 transition-colors ${favorites[product.id] ? 'text-pink-500 fill-pink-500' : 'text-gray-400'}`} />
                  </button>
                </div>

                {/* Info */}
                <div className="p-3 sm:p-4 flex flex-col flex-1 space-y-2">
                  <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">{product.category}</span>
                  <h3 className="font-headline font-bold text-sm sm:text-base text-gray-900 leading-tight line-clamp-2">{product.name}</h3>
                  <p className="text-[11px] text-gray-400 line-clamp-2 flex-1 hidden sm:block">{product.description}</p>

                  {/* Stars */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < product.stars ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                    ))}
                    <span className="text-[10px] text-gray-400 ml-1">({product.reviews})</span>
                  </div>

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between pt-2 border-t border-pink-50 mt-auto">
                    <div className="flex flex-col leading-tight">
                      {product.unit_type === 'weight' ? (
                        <>
                          <span className="text-sm sm:text-base font-bold text-gray-900">
                            ${Number(((product.min_weight || 50) / 1000) * (product.price_per_kg || 0)).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-purple-500 font-semibold">/ {(product.min_weight || 50)}g · Granel</span>
                        </>
                      ) : product.onSale && product.discountPercentage ? (
                        <>
                          <span className="text-sm sm:text-base font-bold text-pink-600">
                            ${Number(Number(product.base_price || 0) * (1 - (product.discountPercentage || 0) / 100)).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-gray-400 line-through">${Number(product.base_price || 0).toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="text-sm sm:text-base font-bold text-gray-900">${Number(product.base_price || 0).toFixed(2)}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => { setSelectedProductById(product.id); setActiveScreen('detalle'); }}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-purple-200 text-purple-600 hover:bg-purple-50 flex items-center justify-center transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (product.is_combo) {
                            setSelectedProductById(product.id);
                            setActiveScreen('detalle');
                            return;
                          }
                          if (product.unit_type === 'weight') {
                            addToCart(product, 'Granel', 1, product.min_weight || 50);
                          } else {
                            addToCart(product, Object.keys(product.sizes || {})[0] || '1 pieza', 1);
                          }
                        }}
                        disabled={product.stock === 0}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow transition-all ${
                          product.stock === 0
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'candy-gradient-bg text-white hover:opacity-90 hover:scale-110 active:scale-95 cursor-pointer'
                        }`}
                        title={product.stock === 0 ? 'Agotado' : product.is_combo ? 'Elegir sabores' : 'Añadir al carrito'}
                      >
                        <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
