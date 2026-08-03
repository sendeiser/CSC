import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Star, MapPin, Clock, Phone, Instagram, Store, Heart, ChevronRight, Send, Sparkles, ShoppingBag, Facebook, Video, MessageCircle, ExternalLink, Mail } from 'lucide-react';
import { getCategoryIcon } from '../lib/categoryIcons';
import { ActiveScreen, Product } from '../types';
import { PRODUCTS } from '../data';
import { WHATSAPP_NUMERO } from '../lib/whatsapp';

interface LandingScreenProps {
  setActiveScreen: (screen: ActiveScreen) => void;
  setSelectedProductById: (id: string) => void;
  heroProduct: Product;
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
      {sections.map(section => {
        switch (section.section_type) {
          case 'hero':
            return (
              <section key={section.id} className="relative min-h-[85vh] flex items-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 overflow-hidden">
                {/* Lightweight radial gradient ambient background */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_30%,_rgba(236,72,153,0.18),transparent_50%),radial-gradient(circle_at_70%_70%,_rgba(168,85,247,0.18),transparent_50%)]" />

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
                  <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
                    {/* Text */}
                    <div className="lg:col-span-6 space-y-8">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 text-pink-300 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Tienda física y online</span>
                      </motion.div>

                      <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="font-headline font-extrabold text-5xl sm:text-6xl lg:text-7xl tracking-tight text-white leading-[1.05]"
                      >
                        <span className="candy-gradient-text">Chamical</span>
                        <br />
                        <span className="text-white/90">Candy Shop</span>
                      </motion.h1>

                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="text-base sm:text-lg text-white/60 leading-relaxed max-w-lg"
                      >
                        Gomitas, chocolates, caramelos y mucho más — todo por granel y al mejor precio.
                        Visitanos o pedí por WhatsApp.
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
                          Ver Catálogo
                          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <a
                          href={`https://wa.me/${WHATSAPP_NUMERO}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-semibold text-white border border-white/20 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
                        >
                          <Phone className="mr-2 w-4 h-4" />
                          Consultar por WhatsApp
                        </a>
                      </motion.div>

                      {/* Stats pills */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex flex-wrap gap-3"
                      >
                        {[
                          { emoji: '🍬', text: 'Gran variedad' },
                          { emoji: '⚖️', text: 'Venta por granel' },
                          { emoji: '✨', text: 'Calidad premium' },
                        ].map(({ emoji, text }) => (
                          <span key={text} className="inline-flex items-center space-x-2 bg-white/10 border border-white/10 text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full">
                            <span>{emoji}</span>
                            <span>{text}</span>
                          </span>
                        ))}
                      </motion.div>
                    </div>

                    {/* Hero image */}
                    <div className="mt-14 lg:mt-0 lg:col-span-6 flex justify-center items-center">
                      <motion.div
                        initial={{ scale: 0.85, opacity: 0, rotate: -3 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ duration: 0.9, type: 'spring', delay: 0.2 }}
                        className="relative max-w-sm sm:max-w-md w-full"
                      >
                        {/* Glow */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 to-purple-500/20 rounded-3xl blur-xl scale-105 pointer-events-none hidden sm:block" />

                        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                          <img
                            src={heroProduct.image_url}
                            alt={heroProduct.name}
                            referrerPolicy="no-referrer"
                            loading="eager"
                            decoding="async"
                            className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
                          />
                          {/* Gradient overlay at bottom */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4">
                            <p className="text-white text-xs font-semibold uppercase tracking-widest opacity-70">{heroProduct.category}</p>
                            <p className="text-white font-headline font-bold text-lg">{heroProduct.name}</p>
                          </div>
                        </div>

                        {/* Floating badges */}
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-3 shadow-xl border border-pink-100 flex items-center space-x-2"
                        >
                          <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs">
                            {heroProduct.category.slice(0, 3)}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-900">Por Granel</p>
                            <p className="text-[9px] text-gray-400">Elegí tu cantidad</p>
                          </div>
                        </motion.div>

                        <motion.div
                          animate={{ y: [0, 8, 0] }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                          className="absolute -top-4 -right-4 bg-white rounded-2xl p-3 shadow-xl border border-purple-100 flex items-center space-x-2"
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

                {/* Wave bottom */}
                <div className="absolute bottom-0 left-0 right-0">
                  <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16">
                    <path d="M0 80L1440 80L1440 30C1200 70 960 10 720 40C480 70 240 0 0 30L0 80Z" fill="white"/>
                  </svg>
                </div>
              </section>
            )

          case 'about': {
            const about = getSection('about')
            const paragraphs = about?.content?.paragraphs || []
            const tags = about?.content?.tags || []
            const imageUrl = about?.content?.image_url || ''
            return (
              <section key={section.id} className="py-20 sm:py-28 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6 }}
                      className="lg:col-span-5 space-y-6"
                    >
                      <span className="inline-block text-xs font-bold tracking-widest text-pink-500 uppercase bg-pink-50 border border-pink-100 px-3 py-1.5 rounded-full">
                        {about?.title || 'Sobre Nosotros'}
                      </span>
                      <h2 className="font-headline font-extrabold text-3xl sm:text-4xl text-gray-900 leading-tight">
                        {about?.subtitle || 'El dulce sabor de'}{' '}
                        {!about?.subtitle && <span className="candy-gradient-text">Chamical</span>}
                      </h2>
                      <div className="w-16 h-1.5 candy-gradient-bg rounded-full" />
                      {paragraphs.length > 0 ? paragraphs.map((p: string, i: number) => (
                        <p key={i} className="text-base text-gray-600 leading-relaxed">{p}</p>
                      )) : (
                        <>
                          <p className="text-base text-gray-600 leading-relaxed">
                            En <strong>Chamical Candy Shop</strong> nos apasiona endulzar tu día. Desde nuestra tienda en
                            el corazón de Chamical, ofrecemos una gran variedad de golosinas, gomitas, chocolates y
                            caramelos — todos disponibles por granel.
                          </p>
                          <p className="text-base text-gray-600 leading-relaxed">
                            Trabajamos con proveedores de confianza para garantizar la mejor calidad y frescura.
                          </p>
                        </>
                      )}
                      <div className="flex flex-wrap gap-2.5 pt-2">
                        {(tags.length > 0 ? tags : ['Atención personalizada', 'Venta por mayor y menor', 'Productos frescos']).map((item: string, i: number) => (
                          <span key={i} className="inline-flex items-center space-x-1.5 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-full">
                            <Heart className="w-3 h-3 text-pink-400" />
                            <span>{item}</span>
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => setActiveScreen('nosotros')}
                        className="inline-flex items-center space-x-2 text-purple-700 font-bold text-sm hover:text-pink-600 transition-colors group"
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
                      <div className="relative aspect-[4/3] w-full max-w-xl mx-auto overflow-hidden rounded-3xl shadow-2xl">
                        <img
                          src={imageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFnupY6X3OeWe0OGFu9RFhJShIgtvC_FkNPvWvsDQsEqMffRmytrJKsrR8MospRiGaPeWN7K3hfxXv6HatHiFZ0_wG2H_Xf7sWsZvFo_2ilbtQ5wuV1ETbk3t-y_1unWmzIIGkjZo8hiKVjZ28cx-jgKjYPdRIeqCp-229-FlxD82IPCvBVRhxQcqT5TQKiTdIpwcr6jZx9zh1EkT0m44G30LttcE1FzFxB475xHOk3HD4HIoRUXfpBW4kdmSfOMW9hal3MbRXNfQ'}
                          alt="Chamical Candy Shop"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
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
              <section key={section.id} className="py-20 bg-gradient-to-br from-pink-50/60 via-white to-purple-50/40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-2xl mx-auto text-center mb-14"
                  >
                    <span className="inline-block text-xs font-bold uppercase tracking-widest text-purple-500 bg-purple-50 border border-purple-100 px-3.5 py-1.5 rounded-full mb-4">
                      {catSection?.title || 'Nuestros Productos'}
                    </span>
                    <h2 className="font-headline font-extrabold text-3xl sm:text-4xl text-gray-900">
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
                          className={`flex-shrink-0 w-40 sm:w-auto ${cat.bg_color || 'bg-pink-50'} rounded-3xl p-6 sm:p-8 text-center group cursor-pointer border border-white/60 shadow-sm hover:shadow-lg transition-all duration-300`}
                        >
                          <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white mb-4 shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                            <Icon className="w-7 h-7" />
                          </div>
                          <h3 className={`font-headline font-bold text-base ${cat.text_color || 'text-pink-700'}`}>{cat.name}</h3>
                          <p className="text-xs text-gray-400 mt-1 group-hover:text-gray-600 transition-colors">Ver más →</p>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              </section>
            )
          }

          case 'store': {
            const store = getSection('store')
            const sContent = store?.content || {}
            const hours: { day: string; time: string }[] = sContent.hours || []
            return (
              <section key={section.id} className="py-20 sm:py-28 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-2xl mx-auto text-center mb-14"
                  >
                    <span className="inline-block text-xs font-bold tracking-widest text-pink-500 uppercase bg-pink-50 border border-pink-100 px-3.5 py-1.5 rounded-full mb-4">
                      {store?.title || 'Visitanos'}
                    </span>
                    <h2 className="font-headline font-extrabold text-3xl sm:text-4xl text-gray-900">
                      {store?.subtitle || 'Nuestra Tienda'}
                    </h2>
                    <div className="w-16 h-1.5 candy-gradient-bg rounded-full mx-auto mt-5" />
                  </motion.div>

                  <div className="max-w-4xl mx-auto">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="relative bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 rounded-3xl p-8 sm:p-12 border border-purple-100/60 shadow-xl shadow-purple-100/30 overflow-hidden"
                    >
                      {/* Decorative circle */}
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-200/30 rounded-full blur-2xl" />
                      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-200/30 rounded-full blur-2xl" />

                      <div className="relative grid sm:grid-cols-2 gap-8 sm:gap-12">
                        <div className="space-y-6">
                          <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 rounded-2xl bg-pink-100 flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-5 h-5 text-pink-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm mb-1">Dirección</h4>
                              <p className="text-sm text-gray-600 leading-relaxed">{sContent.address || 'Av. Principal 123, Chamical, La Rioja'}</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <Clock className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm mb-2">Horarios</h4>
                              <div className="space-y-1">
                                {hours.map((h) => (
                                  <div key={h.day} className="flex items-center justify-between text-sm gap-4">
                                    <span className="font-semibold text-gray-700">{h.day}</span>
                                    <span className="text-gray-500">{h.time}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-5">
                          {/* Contacto & WhatsApp */}
                          <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 rounded-2xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                              <Phone className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm mb-1">Contacto Directo</h4>
                              {sContent.whatsapp ? (
                                <a
                                  href={`https://wa.me/${sContent.whatsapp.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center space-x-1"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>WhatsApp: {sContent.whatsapp}</span>
                                </a>
                              ) : sContent.phone ? (
                                <a
                                  href={`tel:${sContent.phone.replace(/[^0-9+]/g, '')}`}
                                  className="text-sm font-semibold text-slate-700 hover:text-purple-600 hover:underline block"
                                >
                                  {sContent.phone}
                                </a>
                              ) : null}

                              {sContent.email && (
                                <a
                                  href={`mailto:${sContent.email}`}
                                  className="text-sm text-slate-500 hover:text-purple-600 hover:underline flex items-center space-x-1 mt-0.5"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>{sContent.email}</span>
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Redes Sociales (Iconos clickeables) */}
                          <div className="space-y-2 pt-1">
                            <h4 className="font-bold text-gray-900 text-sm">Nuestras Redes Sociales</h4>
                            <div className="flex items-center space-x-3 pt-1">
                              {sContent.instagram && (
                                <a
                                  href={sContent.instagram.startsWith('http') ? sContent.instagram : `https://instagram.com/${sContent.instagram.replace('@', '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Instagram"
                                  className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-sm hover:shadow-md hover:scale-110 transition-all duration-200"
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
                                  className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm hover:shadow-md hover:scale-110 transition-all duration-200"
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
                                  className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm hover:shadow-md hover:scale-110 transition-all duration-200"
                                >
                                  <Video className="w-5 h-5 text-pink-400" />
                                </a>
                              )}

                              {!sContent.instagram && !sContent.facebook && !sContent.tiktok && (
                                <a
                                  href="https://instagram.com/chamicalcandyshop"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Instagram @chamicalcandyshop"
                                  className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-sm hover:shadow-md hover:scale-110 transition-all duration-200"
                                >
                                  <Instagram className="w-5 h-5" />
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="pt-2">
                            <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-100">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
            const galleryProducts = PRODUCTS.slice(0, limit)
            return (
              <section key={section.id} className="py-20 bg-gradient-to-br from-purple-50/50 via-white to-pink-50/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-2xl mx-auto text-center mb-14"
                  >
                    <span className="inline-block text-xs font-bold uppercase tracking-widest text-purple-500 bg-purple-50 border border-purple-100 px-3.5 py-1.5 rounded-full mb-4">
                      {gallery?.title || 'Galería'}
                    </span>
                    <h2 className="font-headline font-extrabold text-3xl sm:text-4xl text-gray-900">
                      {gallery?.subtitle || 'Nuestros Dulces'}
                    </h2>
                    <p className="mt-3 text-sm text-gray-500">{gContent.subtitle || 'Algunos de nuestros productos destacados'}</p>
                  </motion.div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
                    {galleryProducts.map((product, idx) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: idx * 0.07 }}
                        onClick={() => { setSelectedProductById(product.id); setActiveScreen('detalle'); }}
                        className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300 hover:-translate-y-1 border border-pink-100/60"
                      >
                        <div className="aspect-square overflow-hidden bg-pink-50">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="p-3 sm:p-4">
                          <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">{product.category}</span>
                          <h3 className="font-headline font-bold text-sm sm:text-base text-gray-900 mt-0.5 truncate">{product.name}</h3>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-bold candy-gradient-text">${product.base_price.toFixed(2)}</span>
                            <span className="text-[10px] text-gray-400 group-hover:text-purple-500 transition-colors">Ver detalle →</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="text-center mt-12">
                    <button
                      onClick={() => setActiveScreen('catalogo')}
                      className="inline-flex items-center space-x-2 px-8 py-4 candy-gradient-bg text-white rounded-2xl font-bold shadow-lg shadow-purple-300/40 hover:shadow-purple-400/50 hover:opacity-95 transition-all duration-300 hover:-translate-y-0.5"
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
