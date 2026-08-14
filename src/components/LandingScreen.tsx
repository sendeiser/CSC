import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Star, MapPin, Clock, Phone, Instagram, Store, Heart, ChevronRight, Send, Sparkles, ShoppingBag, Facebook, Video, MessageCircle, ExternalLink, Mail, Scale } from 'lucide-react';
import { getCategoryIcon } from '../lib/categoryIcons';
import { ActiveScreen, Product } from '../types';
import { PRODUCTS } from '../data';
import { WHATSAPP_NUMERO } from '../lib/whatsapp';
import { PromoCarousel, PromoSlide } from './PromoCarousel';

interface LandingScreenProps {
  setActiveScreen: (screen: ActiveScreen) => void;
  setSelectedProductById: (id: string) => void;
  heroProduct: Product;
  allProducts?: Product[];
}

const FALLBACK_CATEGORIES = [
  { name: 'Gomitas', slug: 'Gomitas', icon: 'CandyCane', color: 'from-pink-400 to-rose-500', bg_color: 'bg-pink-50', text_color: 'text-pink-700' },
  { name: 'Chocolates', slug: 'Chocolates', icon: 'Package', color: 'from-amber-500 to-orange-500', bg_color: 'bg-amber-50', text_color: 'text-amber-700' },
  { name: 'Acidulados', slug: 'Acidulados', icon: 'ShoppingBag', color: 'from-lime-400 to-green-500', bg_color: 'bg-lime-50', text_color: 'text-lime-700' },
  { name: 'Caramelos', slug: 'Caramelos', icon: 'CandyCane', color: 'from-sky-400 to-blue-500', bg_color: 'bg-sky-50', text_color: 'text-sky-700' },
  { name: 'Regalos', slug: 'Regalos', icon: 'Heart', color: 'from-purple-400 to-violet-500', bg_color: 'bg-purple-50', text_color: 'text-purple-700' },
]

export const LandingScreen: React.FC<LandingScreenProps> = ({
  setActiveScreen,
  setSelectedProductById,
  heroProduct,
  allProducts = [],
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
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMERO}`;

  return (
    <div className="bg-slate-950 overflow-hidden text-slate-100 min-h-screen">
      {sections.map(section => {
        switch (section.section_type) {
          case 'hero': {
            if (section.visible === false) return null
            const heroContent = section.content || {}
            const title = section.title || 'Chamical'
            const subtitle = section.subtitle || 'Candy Shop'
            const badge = heroContent.badge || 'Tienda física y online'
            const description = heroContent.description || 'Gomitas, chocolates, caramelos y mucho más — todo por granel y al mejor precio. Visitanos o pedí por WhatsApp.'
            const btnPrimaryText = heroContent.btn_primary_text || 'Ver Catálogo'
            const btnSecondaryText = heroContent.btn_secondary_text || 'Consultar por WhatsApp'
            const displayImage = heroContent.image_url || heroProduct.image_url

            return (
              <section key={section.id} className="relative min-h-[85vh] flex items-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_30%,_rgba(236,72,153,0.18),transparent_50%),radial-gradient(circle_at_70%_70%,_rgba(168,85,247,0.18),transparent_50%)]" />
                  <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

                  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
                    <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
                      <div className="lg:col-span-6 space-y-8">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6 }}
                          className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 text-pink-300 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
                        >
                          <Store className="w-3.5 h-3.5" />
                          <span>{badge}</span>
                        </motion.div>

                        <motion.h1
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.15 }}
                          className="font-headline font-extrabold text-5xl sm:text-6xl lg:text-7xl tracking-tight text-white leading-[1.05]"
                        >
                          <span className="candy-gradient-text">{title}</span>
                          <br />
                          <span className="text-white/90">{subtitle}</span>
                        </motion.h1>

                        <motion.p
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.3 }}
                          className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-lg"
                        >
                          {description}
                        </motion.p>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.45 }}
                          className="flex flex-col sm:flex-row gap-4"
                        >
                          <button
                            onClick={() => setActiveScreen('catalogo')}
                            className="group inline-flex items-center justify-center px-8 py-4 rounded-2xl font-bold text-white candy-gradient-bg shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:opacity-95 transition-all duration-300 transform hover:-translate-y-0.5"
                          >
                            {btnPrimaryText}
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </button>
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-bold text-white bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-sm transition-all duration-300"
                          >
                            <Phone className="mr-2 w-5 h-5 text-pink-400" />
                            {btnSecondaryText}
                          </a>
                        </motion.div>

                        <div className="flex flex-wrap gap-2 pt-4">
                          {[
                            { icon: Sparkles, text: 'Gran variedad' },
                            { icon: Scale, text: 'Venta por granel' },
                            { icon: Star, text: 'Calidad premium' },
                          ].map((item, i) => (
                            <span key={i} className="inline-flex items-center space-x-1.5 bg-white/5 border border-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full font-medium">
                              <item.icon className="w-3.5 h-3.5 text-pink-400" />
                              <span>{item.text}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-12 lg:mt-0 lg:col-span-6 flex justify-center">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className="relative"
                        >
                          <div className="relative w-72 sm:w-96 aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-purple-950/80 border border-white/15">
                            <img
                              src={displayImage}
                              alt="Chamical Candy Shop"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4 text-white">
                              <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">{heroProduct.category || 'Golosinas'}</span>
                              <h3 className="font-headline font-bold text-lg leading-tight">{heroProduct.name || `${title} ${subtitle}`}</h3>
                            </div>
                          </div>

                          <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute -top-4 -left-4 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl flex items-center space-x-3 border border-white/40"
                          >
                            <div className="w-8 h-8 rounded-xl candy-gradient-bg flex items-center justify-center text-white text-xs font-bold">
                              {heroProduct.category?.slice(0, 3) || 'Dul'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-900 leading-tight">Por Granel</p>
                              <p className="text-[10px] text-gray-700">Elegí tu cantidad</p>
                            </div>
                          </motion.div>

                          <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                            className="absolute -bottom-4 -right-4 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl flex items-center space-x-2 border border-white/40"
                          >
                            <div className="flex space-x-0.5">
                              {[1,2,3,4,5].map((s) => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                            </div>
                            <span className="text-xs font-bold text-gray-800">5.0</span>
                          </motion.div>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-10">
                    <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-10 sm:h-14 text-slate-950">
                      <path
                        d="M0 80L1440 80L1440 30C1200 70 960 10 720 40C480 70 240 0 0 30L0 80Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
              </section>
            )
          }

          case 'about': {
            const about = getSection('about')
            const paragraphs = about?.content?.paragraphs || []
            const tags = about?.content?.tags || []
            const imageUrl = about?.content?.image_url || ''
            return (
              <section key={section.id} className="py-20 sm:py-28 bg-gradient-to-b from-slate-950 via-purple-950/70 to-slate-900 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6 }}
                      className="lg:col-span-5 space-y-6"
                    >
                      <span className="inline-block text-xs font-bold tracking-widest text-pink-400 uppercase bg-pink-950/60 border border-pink-500/30 px-3.5 py-1.5 rounded-full">
                        {about?.title || 'Sobre Nosotros'}
                      </span>
                      <h2 className="font-headline font-extrabold text-3xl sm:text-4xl text-white leading-tight">
                        {about?.subtitle || 'El dulce sabor de'}{' '}
                        {!about?.subtitle && <span className="candy-gradient-text">Chamical</span>}
                      </h2>
                      <div className="w-16 h-1.5 candy-gradient-bg rounded-full" />
                      {paragraphs.length > 0 ? paragraphs.map((p: string, i: number) => (
                        <p key={i} className="text-base text-slate-300 leading-relaxed">{p}</p>
                      )) : (
                        <>
                          <p className="text-base text-slate-300 leading-relaxed">
                            En <strong>Chamical Candy Shop</strong> nos apasiona endulzar tu día. Desde nuestra tienda en
                            el corazón de Chamical, ofrecemos una gran variedad de golosinas, gomitas, chocolates y
                            caramelos — todos disponibles por granel.
                          </p>
                          <p className="text-base text-slate-300 leading-relaxed">
                            Trabajamos con proveedores de confianza para garantizar la mejor calidad y frescura.
                          </p>
                        </>
                      )}
                      <div className="flex flex-wrap gap-2.5 pt-2">
                        {(tags.length > 0 ? tags : ['Atención personalizada', 'Venta por mayor y menor', 'Productos frescos']).map((item: string, i: number) => (
                          <span key={i} className="inline-flex items-center space-x-1.5 text-xs font-bold text-purple-300 bg-purple-900/40 border border-purple-500/30 px-3 py-1.5 rounded-full">
                            <Heart className="w-3 h-3 text-pink-400" />
                            <span>{item}</span>
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => setActiveScreen('nosotros')}
                        className="inline-flex items-center space-x-2 text-pink-400 font-bold text-sm hover:text-pink-300 transition-colors group"
                      >
                        <span>Conocé más sobre nosotros</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="mt-12 lg:mt-0 lg:col-span-7"
                    >
                      <div className="relative aspect-[4/3] w-full max-w-xl mx-auto overflow-hidden rounded-3xl shadow-2xl border border-white/20">
                        <img
                          src={imageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFnupY6X3OeWe0OGFu9RFhJShIgtvC_FkNPvWvsDQsEqMffRmytrJKsrR8MospRiGaPeWN7K3hfxXv6HatHiFZ0_wG2H_Xf7sWsZvFo_2ilbtQ5wuV1ETbk3t-y_1unWmzIIGkjZo8hiKVjZ28cx-jgKjYPdRIeqCp-229-FlxD82IPCvBVRhxQcqT5TQKiTdIpwcr6jZx9zh1EkT0m44G30LttcE1FzFxB475xHOk3HD4HIoRUXfpBW4kdmSfOMW9hal3MbRXNfQ'}
                          alt="Chamical Candy Shop"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </section>
            )
          }

          case 'categories': {
            const catSection = getSection('categories')
            const cats = categoriesList.length > 0 ? categoriesList : FALLBACK_CATEGORIES
            return (
              <section key={section.id} className="py-20 bg-gradient-to-b from-slate-900 via-purple-950/60 to-slate-950 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-2xl mx-auto text-center mb-14"
                  >
                    <span className="inline-block text-xs font-bold uppercase tracking-widest text-pink-400 bg-pink-950/60 border border-pink-500/30 px-3.5 py-1.5 rounded-full mb-4">
                      {catSection?.title || 'Nuestros Productos'}
                    </span>
                    <h2 className="font-headline font-extrabold text-3xl sm:text-4xl text-white">
                      {catSection?.subtitle || '¿Qué antojo tenés hoy?'}
                    </h2>
                  </motion.div>

                  {/* Scroll horizontal en mobile, grid en desktop */}
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:overflow-visible">
                    {cats.map((cat: any, idx: number) => {
                      const Icon = getCategoryIcon(cat.icon)
                      return (
                        <motion.button
                          key={cat.slug}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: idx * 0.07 }}
                          whileHover={{ y: -6, scale: 1.02 }}
                          onClick={() => setActiveScreen('catalogo')}
                          className="flex-shrink-0 w-40 sm:w-auto bg-white/5 hover:bg-white/10 rounded-3xl p-6 sm:p-8 text-center group cursor-pointer border border-white/10 hover:border-pink-500/40 shadow-xl backdrop-blur-md transition-all duration-300"
                        >
                          <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${cat.color || 'from-pink-500 to-purple-600'} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                            <Icon className="w-7 h-7" />
                          </div>
                          <h3 className="font-headline font-bold text-base text-white">{cat.name}</h3>
                          <p className="text-xs text-purple-300/70 mt-1 group-hover:text-pink-300 transition-colors">Ver más →</p>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Promo Carousel as featured section below categories */}
                {!sections.some((s) => s.section_type === 'banners') && (
                  <div className="py-0 my-0 w-full">
                    <PromoCarousel
                      products={allProducts.length > 0 ? allProducts : PRODUCTS}
                      onSelectProduct={(prod) => {
                        setSelectedProductById(prod.id);
                        setActiveScreen('detalle');
                      }}
                      onNavigate={(screen) => setActiveScreen(screen as any)}
                    />
                  </div>
                )}
              </section>
            )
          }

          case 'banners': {
            if (section.visible === false) return null;
            const customSlides: PromoSlide[] = section?.content?.slides || undefined;
            return (
              <section key={section.id} className="py-0 my-0 w-full">
                <PromoCarousel
                  slides={customSlides}
                  products={allProducts.length > 0 ? allProducts : PRODUCTS}
                  onSelectProduct={(prod) => {
                    setSelectedProductById(prod.id);
                    setActiveScreen('detalle');
                  }}
                  onNavigate={(screen) => setActiveScreen(screen as any)}
                />
              </section>
            );
          }

          case 'store': {
            const store = getSection('store')
            const sContent = store?.content || {}
            const hours: { day: string; time: string }[] = sContent.hours || []
            return (
              <section key={section.id} className="py-20 sm:py-28 bg-gradient-to-b from-slate-950 via-purple-950/70 to-slate-900 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-2xl mx-auto text-center mb-14"
                  >
                    <span className="inline-block text-xs font-bold tracking-widest text-pink-400 uppercase bg-pink-950/60 border border-pink-500/30 px-3.5 py-1.5 rounded-full mb-4">
                      {store?.title || 'Visitanos'}
                    </span>
                    <h2 className="font-headline font-extrabold text-3xl sm:text-4xl text-white">
                      {store?.subtitle || 'Nuestra Tienda'}
                    </h2>
                    <div className="w-16 h-1.5 candy-gradient-bg rounded-full mx-auto mt-5" />
                  </motion.div>

                  <div className="max-w-4xl mx-auto">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="relative bg-slate-900/90 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-white/15 shadow-2xl shadow-purple-950/80 overflow-hidden text-white"
                    >
                      {/* Decorative glow */}
                      <div className="absolute -top-10 -right-10 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

                      <div className="relative grid sm:grid-cols-2 gap-8 sm:gap-12">
                        <div className="space-y-6">
                          <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 rounded-2xl bg-pink-950/80 border border-pink-500/30 flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-5 h-5 text-pink-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-sm mb-1">Dirección</h4>
                              <p className="text-sm text-slate-300 leading-relaxed">{sContent.address || 'Av. Principal 123, Chamical, La Rioja'}</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                              <Clock className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-sm mb-2">Horarios</h4>
                              <div className="space-y-1">
                                {hours.map((h) => (
                                  <div key={h.day} className="flex items-center justify-between text-sm gap-4">
                                    <span className="font-semibold text-slate-300">{h.day}</span>
                                    <span className="text-slate-400">{h.time}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-5">
                          {/* Contacto & WhatsApp */}
                          <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 rounded-2xl bg-teal-950/80 border border-teal-500/30 flex items-center justify-center flex-shrink-0">
                              <Phone className="w-5 h-5 text-teal-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-sm mb-1">Contacto Directo</h4>
                              {sContent.whatsapp ? (
                                <a
                                  href={`https://wa.me/${sContent.whatsapp.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center space-x-1"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>WhatsApp: {sContent.whatsapp}</span>
                                </a>
                              ) : sContent.phone ? (
                                <a
                                  href={`tel:${sContent.phone.replace(/[^0-9+]/g, '')}`}
                                  className="text-sm font-semibold text-purple-300 hover:text-pink-300 hover:underline block"
                                >
                                  {sContent.phone}
                                </a>
                              ) : null}

                              {sContent.email && (
                                <a
                                  href={`mailto:${sContent.email}`}
                                  className="text-sm text-slate-400 hover:text-pink-300 hover:underline flex items-center space-x-1 mt-0.5"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>{sContent.email}</span>
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Redes Sociales */}
                          <div className="space-y-2 pt-1">
                            <h4 className="font-bold text-white text-sm">Nuestras Redes Sociales</h4>
                            <div className="flex items-center space-x-3 pt-1">
                              {sContent.instagram && (
                                <a
                                  href={sContent.instagram.startsWith('http') ? sContent.instagram : `https://instagram.com/${sContent.instagram.replace('@', '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Instagram"
                                  className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200"
                                >
                                  <Instagram className="w-5 h-5" />
                                </a>
                              )}

                              {sContent.facebook && (
                                <a
                                  href={sContent.facebook.startsWith('http') ? sContent.facebook : `https://facebook.com/${sContent.facebook}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Facebook"
                                  className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200"
                                >
                                  <Facebook className="w-5 h-5" />
                                </a>
                              )}

                              {sContent.tiktok && (
                                <a
                                  href={sContent.tiktok.startsWith('http') ? sContent.tiktok : `https://tiktok.com/@${sContent.tiktok.replace('@', '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="TikTok"
                                  className="w-10 h-10 rounded-2xl bg-black border border-white/20 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200"
                                >
                                  <Video className="w-5 h-5 text-pink-400" />
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="pt-2">
                            <span className="inline-flex items-center space-x-1.5 bg-emerald-950/80 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/30">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span>Abiertos — Tienda Física y Online</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </section>
            )
          }

          case 'gallery': {
            const gallery = getSection('gallery')
            const gContent = gallery?.content || {}
            const limit = gContent.limit || 6
            const sourceProducts = (allProducts && allProducts.length > 0) ? allProducts : PRODUCTS
            const galleryProducts = sourceProducts.slice(0, limit)
            return (
              <section key={section.id} className="py-20 bg-gradient-to-b from-slate-900 via-purple-950/70 to-slate-950 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-2xl mx-auto text-center mb-14"
                  >
                    <span className="inline-block text-xs font-bold uppercase tracking-widest text-pink-400 bg-pink-950/60 border border-pink-500/30 px-3.5 py-1.5 rounded-full mb-4">
                      {gallery?.title || 'Galería'}
                    </span>
                    <h2 className="font-headline font-extrabold text-3xl sm:text-4xl text-white">
                      {gallery?.subtitle || 'Nuestros Dulces'}
                    </h2>
                    <p className="mt-3 text-sm text-slate-300">{gContent.subtitle || 'Algunos de nuestros productos destacados'}</p>
                  </motion.div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
                    {galleryProducts.map((product, idx) => {
                      const displayPrice = product.unit_type === 'weight'
                        ? `$${Number(product.price_per_kg || product.base_price || 0).toFixed(2)}/kg`
                        : `$${Number(product.base_price || 0).toFixed(2)}`;

                      return (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: idx * 0.07 }}
                          onClick={() => { setSelectedProductById(product.id); setActiveScreen('detalle'); }}
                          className="group cursor-pointer bg-slate-900/90 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-purple-900/50 transition-all duration-300 hover:-translate-y-1 border border-white/10 hover:border-pink-500/40 flex flex-col justify-between"
                        >
                          <div className="aspect-square overflow-hidden bg-black/40 relative">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {product.unit_type === 'weight' && (
                              <span className="absolute top-2 left-2 bg-purple-950/90 border border-purple-500/30 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                                Granel
                              </span>
                            )}
                          </div>
                          <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">{product.category}</span>
                              <h3 className="font-headline font-bold text-sm sm:text-base text-white mt-0.5 truncate">{product.name}</h3>
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                              <span className="text-xs sm:text-sm font-bold candy-gradient-text">{displayPrice}</span>
                              <span className="text-[10px] text-purple-300/80 group-hover:text-pink-300 transition-colors font-medium">Ver detalle →</span>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                  <div className="text-center mt-12">
                    <button
                      onClick={() => setActiveScreen('catalogo')}
                      className="inline-flex items-center space-x-2 px-8 py-4 candy-gradient-bg text-white rounded-2xl font-bold shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:opacity-95 transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Ver Catálogo Completo</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>
            )
          }

          case 'contact': {
            const contact = getSection('contact')
            const cContent = contact?.content || {}
            return (
              <section key={section.id} className="relative py-20 sm:py-24 overflow-hidden">
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-pink-800 to-rose-900" />
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, #ec4899 0%, transparent 50%), radial-gradient(circle at 70% 70%, #a855f7 0%, transparent 50%)' }} />

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-4"
                  >
                    <div className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 text-pink-200 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>¿Listo para pedir?</span>
                    </div>
                    <h2 className="font-headline font-black text-4xl sm:text-5xl text-white leading-tight">
                      {contact?.title || '¿Tenés antojo?'}
                    </h2>
                    <p className="text-base sm:text-lg text-pink-100/80 max-w-xl mx-auto leading-relaxed">
                      Hacé tu pedido online o escribinos por WhatsApp. También podés visitarnos en persona.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 }}
                    className="flex flex-col sm:flex-row justify-center items-center gap-4"
                  >
                    {cContent.show_whatsapp !== false && (
                      <a
                        href={`https://wa.me/${WHATSAPP_NUMERO}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center space-x-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold shadow-xl shadow-emerald-900/40 transition-all hover:-translate-y-0.5"
                      >
                        <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        <span>Pedí por WhatsApp</span>
                      </a>
                    )}
                    {cContent.show_catalog !== false && (
                      <button
                        onClick={() => setActiveScreen('catalogo')}
                        className="inline-flex items-center space-x-2 px-8 py-4 border-2 border-white/30 text-white hover:bg-white/15 rounded-2xl font-semibold transition-all"
                      >
                        <span>Explorar Catálogo</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                </div>
              </section>
            )
          }

          default:
            return null
        }
      })}
    </div>
  );
};
