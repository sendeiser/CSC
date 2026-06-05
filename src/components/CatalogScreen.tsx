import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, Star, Heart, ShoppingBag, Eye, Percent, CheckCircle2, RefreshCw } from 'lucide-react';
import { ActiveScreen, Product } from '../types';
import { PRODUCTS } from '../data';

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
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<typeof CATEGORIES[number]>('Todos');
  
  // Advanced filters
  const [onlyVegan, setOnlyVegan] = React.useState(false);
  const [onlyOrganic, setOnlyOrganic] = React.useState(false);
  const [onlyNoSugar, setOnlyNoSugar] = React.useState(false);
  const [onlySale, setOnlySale] = React.useState(false);
  
  // Sort
  const [sortBy, setSortBy] = React.useState<'none' | 'priceAsc' | 'priceDesc' | 'stars'>('none');
  const [showFilters, setShowFilters] = React.useState(false);

  // Filter and Sort Logic
  const filteredProducts = React.useMemo(() => {
    let result = [...PRODUCTS];

    // 1. Category
    if (selectedCategory !== 'Todos') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // 2. Search query
    if (searchTerm.trim() !== '') {
      const query = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
    }

    // 3. Diets
    if (onlyVegan) {
      result = result.filter(p => p.diet?.includes('Vegan'));
    }
    if (onlyOrganic) {
      result = result.filter(p => p.diet?.includes('Orgánico'));
    }
    if (onlyNoSugar) {
      result = result.filter(p => p.diet?.includes('Sin Azúcar'));
    }

    // 4. In Offers
    if (onlySale) {
      result = result.filter(p => p.onSale || p.bestseller);
    }

    // 5. Sorting
    if (sortBy === 'priceAsc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceDesc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'stars') {
      result.sort((a, b) => b.stars - a.stars);
    }

    return result;
  }, [selectedCategory, searchTerm, onlyVegan, onlyOrganic, onlyNoSugar, onlySale, sortBy]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('Todos');
    setOnlyVegan(false);
    setOnlyOrganic(false);
    setOnlyNoSugar(false);
    setOnlySale(false);
    setSortBy('none');
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title structure */}
        <div className="mb-8 text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-widest text-pink-600">Nuestros Sabores</span>
          <h1 className="font-headline font-black text-3xl sm:text-4xl text-slate-900 mt-1">
            Explora la Galaxia Dulce
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Cada gominola y chocolate es cortado de manera individual, libre de sintéticos y empacado al vacío.
          </p>
        </div>

        {/* 1. Filtering & search control room */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            
            {/* Search Input */}
            <div className="relative w-full lg:flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Busca por nombre o ingrediente (por ejemplo: 'nubes', 'fresa')..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:border-purple-500 focus:bg-white rounded-xl text-sm transition-all shadow-inner"
              />
            </div>

            {/* Collapsible toggle / sort choice */}
            <div className="flex w-full lg:w-auto items-center justify-between gap-3">
              <button
                id="toggle-filters-btn"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors w-full lg:w-auto justify-center cursor-pointer ${
                  showFilters 
                    ? 'border-purple-200 bg-purple-55 text-purple-700' 
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filtros</span>
                {(onlyNoSugar || onlyOrganic || onlyVegan || onlySale) && (
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                )}
              </button>

              <select
                id="catalog-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:border-purple-500 w-full lg:w-auto text-center"
              >
                <option value="none">Ordenar: Destacados</option>
                <option value="priceAsc">Precio: Menor a Mayor</option>
                <option value="priceDesc">Precio: Mayor a Menor</option>
                <option value="stars">Calificación: Más Populares</option>
              </select>
            </div>

          </div>

          {/* Categoría Pills Row */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 mt-2">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Collapsible Advanced Filters Section */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden border-t border-slate-100 pt-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pb-2">
                  
                  {/* Vegan Filter */}
                  <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={onlyVegan}
                      onChange={(e) => setOnlyVegan(e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                    />
                    <div className="text-sm">
                      <p className="font-bold text-slate-800">Vegano</p>
                      <p className="text-[10px] text-slate-500">100% orgánico vegetal</p>
                    </div>
                  </label>

                  {/* Organic Filter */}
                  <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={onlyOrganic}
                      onChange={(e) => setOnlyOrganic(e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                    />
                    <div className="text-sm">
                      <p className="font-bold text-slate-800">Orgánico</p>
                      <p className="text-[10px] text-slate-500">Ingredientes biológicos</p>
                    </div>
                  </label>

                  {/* Sugar Free Filter */}
                  <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={onlyNoSugar}
                      onChange={(e) => setOnlyNoSugar(e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                    />
                    <div className="text-sm">
                      <p className="font-bold text-slate-800">Sin Azúcar</p>
                      <p className="text-[10px] text-slate-500">Endulzado estelar</p>
                    </div>
                  </label>

                  {/* On Sale Filter */}
                  <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={onlySale}
                      onChange={(e) => setOnlySale(e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                    />
                    <div className="text-sm">
                      <p className="font-bold text-slate-800">Promociones</p>
                      <p className="text-[10px] text-slate-500">Ofertas y bestsellers</p>
                    </div>
                  </label>

                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    onClick={resetFilters}
                    className="flex items-center space-x-1.5 text-xs font-bold text-pink-600 hover:text-pink-700 px-3 py-1.5 rounded-lg hover:bg-pink-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Restaurar todos los filtros</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* 2. Grid list of products */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 max-w-xl mx-auto px-6 shadow-sm space-y-4">
            <Search className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-headline font-bold text-xl text-slate-900">
              No encontramos planetas dulces
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Intenta reduciendo el espectro de búsqueda o desactivando filtros como "Sin Azúcar" u "Orgánico".
            </p>
            <button
              onClick={resetFilters}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl text-xs font-bold shadow hover:opacity-95"
            >
              Reiniciar Búsqueda
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => {
                const isFav = !!favorites[product.id];
                const originalPrice = product.onSale && product.discountPercentage 
                  ? product.price / (1 - product.discountPercentage / 100) 
                  : product.price;

                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:border-pink-200/50 transition-all flex flex-col justify-between group h-full"
                  >
                    
                    {/* Upper cover area */}
                    <div className="relative aspect-square bg-slate-50/50 border-b border-slate-50 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onClick={() => {
                          setSelectedProductById(product.id);
                          setActiveScreen('detalle');
                        }}
                      />
                      
                      {/* Floating tags */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        {product.bestseller && (
                          <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase shadow-sm">
                            Bestseller
                          </span>
                        )}
                        {product.onSale && (
                          <span className="bg-pink-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase shadow-sm flex items-center gap-0.5">
                            <Percent className="w-3 h-3" />
                            <span>-{product.discountPercentage}%</span>
                          </span>
                        )}
                        {!product.bestseller && !product.onSale && product.tags.slice(0, 1).map((t, i) => (
                          <span key={i} className="bg-purple-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase shadow-sm">
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Floating Favorite Heart Toggle */}
                      <button
                        onClick={() => toggleFavorite(product.id)}
                        className={`absolute top-3 right-3 p-2 rounded-full border shadow-sm transition-colors cursor-pointer ${
                          isFav
                            ? 'bg-pink-50 border-pink-100 text-pink-500'
                            : 'bg-white/90 border-slate-100 text-slate-400 hover:text-pink-500'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Middle descriptive fields */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold tracking-widest text-slate-450 uppercase">
                            {product.category}
                          </span>
                          <div className="flex items-center text-amber-400 space-x-0.5">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="text-xs font-bold text-slate-650">{product.stars}.0</span>
                          </div>
                        </div>

                        <h3 
                          onClick={() => {
                            setSelectedProductById(product.id);
                            setActiveScreen('detalle');
                          }}
                          className="font-headline font-bold text-base text-slate-900 mt-1 hover:text-purple-700 transition-colors cursor-pointer line-clamp-1"
                        >
                          {product.name}
                        </h3>
                        
                        <p className="text-slate-500 text-xs mt-1.5 leading-relaxed line-clamp-2">
                          {product.description}
                        </p>
                      </div>

                      {/* Extra attributes */}
                      {product.diet && product.diet.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.diet.map((dk, id) => (
                            <span key={id} className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {dk}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Cost metrics / details & cart button controls */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex flex-col">
                          {product.onSale && (
                            <span className="text-[10px] text-slate-400 line-through">
                              ${originalPrice.toFixed(2)}
                            </span>
                          )}
                          <span className="text-base font-black text-slate-900">
                            ${product.price.toFixed(2)}
                          </span>
                        </div>

                        {/* Control buttons */}
                        <div className="flex items-center space-x-1">
                          <button
                            title="Ver Detalle"
                            onClick={() => {
                              setSelectedProductById(product.id);
                              setActiveScreen('detalle');
                            }}
                            className="p-2 text-slate-500 hover:text-purple-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => {
                              // By default use the first key of sizes if available, otherwise just default
                              const defaultSize = product.sizes ? Object.keys(product.sizes)[0] : 'Estándar';
                              addToCart(product, defaultSize, 1);
                            }}
                            className="flex items-center space-x-1 bg-purple-100 hover:bg-purple-600 text-purple-700 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Agregar</span>
                          </button>
                        </div>
                      </div>

                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
};
