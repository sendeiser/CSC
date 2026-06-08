import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Star, MapPin, Clock, Phone, Instagram, Store, Heart, ChevronRight, Send } from 'lucide-react';
import { getCategoryIcon } from '../lib/categoryIcons';
import { ActiveScreen, Product } from '../types';
import { PRODUCTS } from '../data';

interface LandingScreenProps {
  setActiveScreen: (screen: ActiveScreen) => void;
  setSelectedProductById: (id: string) => void;
  heroProduct: Product;
}

const FALLBACK_CATEGORIES = [
  { name: 'Gomitas', slug: 'Gomitas', icon: 'CandyCane', color: 'from-pink-400 to-rose-400', bg_color: 'bg-pink-50', text_color: 'text-pink-700' },
  { name: 'Chocolates', slug: 'Chocolates', icon: 'Package', color: 'from-amber-500 to-orange-500', bg_color: 'bg-amber-50', text_color: 'text-amber-700' },
  { name: 'Acidulados', slug: 'Acidulados', icon: 'ShoppingBag', color: 'from-lime-400 to-green-400', bg_color: 'bg-lime-50', text_color: 'text-lime-700' },
  { name: 'Caramelos', slug: 'Caramelos', icon: 'CandyCane', color: 'from-sky-400 to-blue-400', bg_color: 'bg-sky-50', text_color: 'text-sky-700' },
  { name: 'Regalos', slug: 'Regalos', icon: 'Heart', color: 'from-purple-400 to-violet-400', bg_color: 'bg-purple-50', text_color: 'text-purple-700' },
]

export const LandingScreen: React.FC<LandingScreenProps> = ({
  setActiveScreen,
  setSelectedProductById,
  heroProduct
}) => {
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState<any[]>([])
  const [categoriesList, setCategoriesList] = useState<any[]>([])
  useEffect(() => {
    const origin = window.location.origin
    Promise.all([
      fetch(`${origin}/api/homepage`).then(r => r.ok ? r.json() : []),
      fetch(`${origin}/api/categories`).then(r => r.ok ? r.json() : []),
    ])
      .then(([sectionsData, categoriesData]) => {
        setSections(sectionsData)
        setCategoriesList(categoriesData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getSection = (type: string) => sections.find(s => s.section_type === type)

  return (
    <div className="bg-white overflow-hidden">

      {/* 1. Hero */}
      <section className="relative bg-gradient-to-b from-pink-50 via-purple-50/40 to-white pt-12 pb-16 sm:pb-24 lg:pt-16 overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-pink-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center space-x-2 bg-pink-100/70 text-pink-700 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase border border-pink-200"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Tienda física y online</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="font-headline font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-gray-900 leading-[1.1]"
              >
                <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Chamical
                </span>
                <br />
                Candy Shop
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-base sm:text-lg text-gray-600 leading-relaxed"
              >
                Gomitas, chocolates, caramelos y mucho más — todo por granel y al mejor precio.
                Visitamos o pedí por WhatsApp, te esperamos en Chamical.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-2"
              >
                <button
                  onClick={() => setActiveScreen('catalogo')}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:opacity-95 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  Ver Catálogo
                  <ArrowRight className="ml-2 w-5 h-5" />
                </button>
                <a
                  href={`https://wa.me/${getSection('store')?.content?.whatsapp || '5493854000000'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border border-pink-200 text-base font-semibold rounded-xl text-purple-700 bg-white hover:bg-pink-50/50 transition-colors"
                >
                  <Phone className="mr-2 w-4 h-4" />
                  Consultar por WhatsApp
                </a>
              </motion.div>
            </div>

            <div className="mt-12 sm:mt-16 lg:mt-0 lg:col-span-6 relative flex justify-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, type: 'spring' }}
                className="relative max-w-md md:max-w-xl lg:max-w-none"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-200 to-purple-200 rounded-full blur-3xl opacity-40 animate-pulse -z-10" />
                <img
                  src={heroProduct.image_url}
                  alt={heroProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto drop-shadow-2xl rounded-3xl object-cover hover:scale-[1.02] transition-transform duration-500"
                />
                <div className="absolute -bottom-6 -left-6 bg-white/95 rounded-2xl p-4 shadow-xl border border-pink-100 flex items-center space-x-3 max-w-[200px]">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs">
                    {heroProduct.category.slice(0, 3)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Por Granel</h4>
                    <p className="text-[10px] text-gray-500">Elegí tu cantidad</p>
                  </div>
                </div>
                <div className="absolute -top-6 -right-6 bg-white/95 rounded-2xl p-4 shadow-xl border border-purple-100 flex items-center space-x-2.5 max-w-[220px]">
                  <div className="flex space-x-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-purple-950">
                    Calidad Premium
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Sobre Nosotros */}
      {(() => {
        const about = getSection('about')
        const paragraphs = about?.content?.paragraphs || []
        const tags = about?.content?.tags || []
        const imageUrl = about?.content?.image_url || ''
        return (
          <section className="py-20 sm:py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
                <div className="lg:col-span-5 space-y-5">
                  <span className="text-xs font-bold tracking-widest text-pink-600 uppercase">{about?.title || 'Sobre Nosotros'}</span>
                  <h2 className="font-headline font-extrabold text-3xl sm:text-4xl text-gray-900 tracking-tight">
                    {about?.subtitle || 'El dulce sabor de'}{' '}
                    {!about?.subtitle && <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">Chamical</span>}
                  </h2>
                  <div className="w-12 h-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full" />
                  {paragraphs.length > 0 ? paragraphs.map((p: string, i: number) => (
                    <p key={i} className="text-base text-gray-600 leading-relaxed">{p}</p>
                  )) : (
                    <>
                      <p className="text-base text-gray-600 leading-relaxed">
                        En <strong>Chamical Candy Shop</strong> nos apasiona endulzar tu día. Desde nuestra tienda en 
                        el corazón de Chamical, ofrecemos una gran variedad de golosinas, gomitas, chocolates y 
                        caramelos — todos disponibles por granel para que compres exactamente lo que necesitas.
                      </p>
                      <p className="text-base text-gray-600 leading-relaxed">
                        Trabajamos con proveedores de confianza para garantizar la mejor calidad y frescura. 
                        Ya sea para un cumpleaños, un evento especial o simplemente para darte un gusto, 
                        en CSC encontrás todo lo que buscas.
                      </p>
                    </>
                  )}
                  <div className="flex flex-wrap gap-3 pt-2">
                    {(tags.length > 0 ? tags : ['Atención personalizada', 'Venta por mayor y menor', 'Productos frescos']).map((item: string, i: number) => (
                      <span key={i} className="inline-flex items-center space-x-1.5 text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full">
                        <Heart className="w-3 h-3" />
                        <span>{item}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-10 lg:mt-0 lg:col-span-7 flex justify-center">
                  <div className="relative aspect-[4/3] w-full max-w-xl overflow-hidden rounded-2xl shadow-xl group">
                    <img
                      src={imageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFnupY6X3OeWe0OGFu9RFhJShIgtvC_FkNPvWvsDQsEqMffRmytrJKsrR8MospRiGaPeWN7K3hfxXv6HatHiFZ0_wG2H_Xf7sWsZvFo_2ilbtQ5wuV1ETbk3t-y_1unWmzIIGkjZo8hiKVjZ28cx-jgKjYPdRIeqCp-229-FlxD82IPCvBVRhxQcqT5TQKiTdIpwcr6jZx9zh1EkT0m44G30LttcE1FzFxB475xHOk3HD4HIoRUXfpBW4kdmSfOMW9hal3MbRXNfQ'}
                      alt="Chamical Candy Shop"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )
      })()}

      {/* 3. Nuestros Productos - Categorías */}
      {(() => {
        const catSection = getSection('categories')
        const subtitle = catSection?.content?.subtitle || ''
        return (
          <section className="py-20 bg-gradient-to-tr from-pink-50/50 via-white to-purple-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mx-auto text-center mb-14">
                <span className="text-xs font-bold uppercase tracking-widest text-purple-600">{catSection?.title || 'Nuestros Productos'}</span>
                <h2 className="mt-2 font-headline font-bold text-3xl sm:text-4xl text-gray-900">
                  {catSection?.subtitle || '¿Qué antojo tenés hoy?'}
                </h2>
                {subtitle && <p className="mt-3 text-sm sm:text-base text-gray-500">{subtitle}</p>}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
                {(categoriesList.length > 0 ? categoriesList : FALLBACK_CATEGORIES).map((cat: any) => {
                  const Icon = getCategoryIcon(cat.icon)
                  return (
                    <motion.button
                      key={cat.slug}
                      whileHover={{ y: -4 }}
                      onClick={() => setActiveScreen('catalogo')}
                      className={`${cat.bg_color || 'bg-pink-50'} rounded-2xl p-6 sm:p-8 text-center transition-all shadow-sm hover:shadow-md group cursor-pointer`}
                    >
                      <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <h3 className={`font-headline font-bold text-base ${cat.text_color || 'text-pink-700'}`}>{cat.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">Ver más</p>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </section>
        )
      })()}

      {/* 4. Nuestra Tienda */}
      {(() => {
        const store = getSection('store')
        const sContent = store?.content || {}
        const hours: { day: string; time: string }[] = sContent.hours || []
        return (
          <section className="py-20 sm:py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mx-auto text-center mb-14">
                <span className="text-xs font-bold tracking-widest text-pink-600 uppercase">{store?.title || 'Visitanos'}</span>
                <h2 className="mt-2 font-headline font-extrabold text-3xl sm:text-4xl text-gray-900">
                  {store?.subtitle || 'Nuestra Tienda'}
                </h2>
                <div className="w-12 h-1 bg-gradient-to-r from-pink-500 to-purple-600 mx-auto mt-4 rounded-full" />
              </div>

              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-8 sm:p-10 border border-pink-100 shadow-sm">
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-start space-x-4">
                        <MapPin className="w-6 h-6 text-pink-600 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">Dirección</h4>
                          <p className="text-sm text-gray-600">{sContent.address || 'Av. Principal 123, Chamical, La Rioja'}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                        <Clock className="w-6 h-6 text-purple-600 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">Horarios</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            {(hours.length > 0 ? hours : []).map((h) => (
                              <p key={h.day}><span className="font-medium">{h.day}:</span> {h.time}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-start space-x-4">
                        <Phone className="w-6 h-6 text-teal-600 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">Contacto</h4>
                          <p className="text-sm text-gray-600">{sContent.phone || ''}</p>
                          <p className="text-sm text-gray-600">{sContent.email || ''}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                        <Instagram className="w-6 h-6 text-pink-600 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">Redes</h4>
                          <p className="text-sm text-gray-600">{sContent.instagram || ''}</p>
                        </div>
                      </div>
                      <div className="pt-2">
                        <span className="inline-flex items-center space-x-1.5 bg-pink-100 text-pink-700 text-xs font-bold px-3 py-1.5 rounded-full">
                          <Store className="w-3.5 h-3.5" />
                          <span>Física y Online</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )
      })()}

      {/* 5. Galería */}
      {(() => {
        const gallery = getSection('gallery')
        const gContent = gallery?.content || {}
        const limit = gContent.limit || 6
        const galleryProducts = PRODUCTS.slice(0, limit)
        return (
          <section className="py-20 bg-gradient-to-tr from-pink-50/50 via-white to-purple-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mx-auto text-center mb-14">
                <span className="text-xs font-bold uppercase tracking-widest text-purple-600">{gallery?.title || 'Galería'}</span>
                <h2 className="mt-2 font-headline font-bold text-3xl sm:text-4xl text-gray-900">
                  {gallery?.subtitle || 'Nuestros Dulces'}
                </h2>
                <p className="mt-3 text-sm sm:text-base text-gray-500">
                  {gContent.subtitle || 'Algunos de nuestros productos destacados'}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {galleryProducts.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    onClick={() => {
                      setSelectedProductById(product.id)
                      setActiveScreen('detalle')
                    }}
                    className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-pink-100 hover:shadow-lg transition-all hover:-translate-y-1"
                  >
                    <div className="aspect-square overflow-hidden bg-pink-50">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3 sm:p-4">
                      <span className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider">{product.category}</span>
                      <h3 className="font-headline font-bold text-sm sm:text-base text-gray-900 mt-0.5 truncate">{product.name}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-pink-700">${product.base_price.toFixed(2)}</span>
                        <span className="text-[10px] text-gray-400">Ver detalle</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="text-center mt-10">
                <button
                  onClick={() => setActiveScreen('catalogo')}
                  className="inline-flex items-center space-x-2 px-8 py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold hover:opacity-95 transition-all shadow-md hover:shadow-lg"
                >
                  <span>Ver Catálogo Completo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>
        )
      })()}

      {/* 6. Contacto / CTA */}
      {(() => {
        const contact = getSection('contact')
        const cContent = contact?.content || {}
        const whatsappNumber = cContent.whatsapp_number || '5493854000000'
        return (
          <section className="relative py-16 bg-gradient-to-br from-purple-800 to-pink-700 text-white overflow-hidden text-center">
            <div className="absolute inset-0 bg-grid-white opacity-10" />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 relative space-y-6">
              <h2 className="font-headline font-black text-3xl sm:text-4xl">
                {contact?.title || '¿Tenés antojo?'}
              </h2>
              <p className="text-base text-pink-100 max-w-xl mx-auto">
                Hacé tu pedido online o escribinos por WhatsApp y lo tenemos listo para retirar en el local.
                También podés visitarnos en persona y elegir lo que más te guste.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
                {cContent.show_whatsapp !== false && (
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg transition-transform transform hover:-translate-y-0.5"
                  >
                    <Send className="w-5 h-5" />
                    <span>Pedí por WhatsApp</span>
                  </a>
                )}
                {cContent.show_catalog !== false && (
                  <button
                    onClick={() => setActiveScreen('catalogo')}
                    className="px-8 py-4 border border-white/40 text-white hover:bg-white/10 rounded-xl font-semibold transition-colors"
                  >
                    Explorar Catálogo
                  </button>
                )}
              </div>
            </div>
          </section>
        )
      })()}

    </div>
  );
};
