import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, ArrowLeft, Sparkles, Award, Store, ShoppingBag, CheckCircle2, MessageCircle, ArrowRight, MapPin } from 'lucide-react';
import { ActiveScreen } from '../types';
import { WHATSAPP_NUMERO } from '../lib/whatsapp';

interface AboutUsScreenProps {
  setActiveScreen: (screen: ActiveScreen) => void;
}

export const AboutUsScreen: React.FC<AboutUsScreenProps> = ({ setActiveScreen }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/homepage/about')
      .then(r => (r.ok ? r.json() : null))
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-pink-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Cargando nuestra historia dulce...</p>
      </div>
    );
  }

  const content = data?.content || {};
  const sections = content.sections || [];
  const stats = content.stats || [];
  const title = data?.title || 'Sobre Nosotros';
  const subtitle = data?.subtitle || 'Conocé nuestra historia';

  const defaultStats = [
    { value: '+100', label: 'Variedades de Golosinas' },
    { value: '100%', label: 'Calidad Garantizada' },
    { value: 'Venta', label: 'Por Granel & Mayorista' },
    { value: 'Chamical', label: 'La Rioja, Argentina' },
  ];

  const displayStats = stats.length > 0 ? stats : defaultStats;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Bar with Navigation */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={() => setActiveScreen('inicio')}
          className="inline-flex items-center space-x-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md transition-all group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Volver al inicio</span>
        </button>
      </div>

      {/* Hero Header Section */}
      <section className="relative pt-8 pb-20 overflow-hidden">
        {/* Background Gradients & Glows */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,_rgba(236,72,153,0.22),transparent_50%),radial-gradient(circle_at_80%_80%,_rgba(168,85,247,0.22),transparent_50%)]" />
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-pink-500/10 border border-pink-500/20 text-pink-300 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span>{subtitle}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-headline font-black text-5xl sm:text-6xl lg:text-7xl tracking-tight text-white leading-tight"
          >
            <span className="candy-gradient-text">{title}</span>
          </motion.h1>

          {content.intro && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-xl text-slate-300/90 max-w-3xl mx-auto leading-relaxed font-light"
            >
              {content.intro}
            </motion.p>
          )}

          {/* Quick Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 pt-2"
          >
            {[
              { label: 'Golosinas por Granel', icon: ShoppingBag },
              { label: 'Atención Personalizada', icon: Heart },
              { label: 'Envíos & Entrega Rápida', icon: CheckCircle2 },
              { label: 'Ubicados en Chamical', icon: MapPin },
            ].map(({ label, icon: Icon }) => (
              <span key={label} className="inline-flex items-center space-x-1.5 bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold px-3.5 py-1.5 rounded-full">
                <Icon className="w-3.5 h-3.5 text-pink-400" />
                <span>{label}</span>
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="relative z-10 -mt-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-purple-900/80 via-pink-900/70 to-slate-900/90 border border-white/15 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 shadow-2xl shadow-purple-950/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
            {displayStats.map((stat: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="pt-4 md:pt-0 md:px-4"
              >
                <div className="font-headline font-black text-3xl sm:text-4xl lg:text-5xl candy-gradient-text tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-300 mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Sections (Story & Mission) */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {sections.map((sec: any, idx: number) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.15 }}
            className="group relative bg-slate-900/60 border border-white/10 hover:border-pink-500/40 rounded-3xl p-6 sm:p-10 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/10"
          >
            {/* Corner Decorative Accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-pink-500/10 to-transparent rounded-tr-3xl pointer-events-none" />

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform">
                {idx % 2 === 0 ? <Heart className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-pink-400">Paso 0{idx + 1}</span>
                <h2 className="font-headline font-extrabold text-2xl sm:text-3xl text-white">
                  {sec.heading}
                </h2>
              </div>
            </div>

            <div className="space-y-4 text-slate-300 leading-relaxed text-base sm:text-lg">
              {sec.paragraphs?.map((p: string, j: number) => (
                <p key={j} className="font-light">
                  {p}
                </p>
              ))}
            </div>
          </motion.div>
        ))}
      </section>

      {/* Featured Image Section */}
      {content.image_url && (
        <section className="pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl group"
          >
            <div className="aspect-[16/9] w-full overflow-hidden bg-slate-900">
              <img
                src={content.image_url}
                alt="Chamical Candy Shop"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-pink-400">Tienda Física & Online</p>
                <h3 className="text-xl sm:text-2xl font-bold text-white font-headline">Chamical Candy Shop</h3>
              </div>
              <span className="inline-flex items-center space-x-1.5 bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full">
                <Store className="w-4 h-4 text-pink-300" />
                <span>Chamical, La Rioja</span>
              </span>
            </div>
          </motion.div>
        </section>
      )}

      {/* Bottom Call-To-Action */}
      <section className="py-16 bg-gradient-to-br from-purple-950 via-slate-950 to-pink-950 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-8">
          <div className="inline-flex items-center space-x-2 bg-pink-500/20 text-pink-300 border border-pink-500/30 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
            <Award className="w-4 h-4" />
            <span>¡Tu rincón más dulce te espera!</span>
          </div>

          <h2 className="font-headline font-black text-3xl sm:text-4xl lg:text-5xl text-white">
            ¿Tentado con las mejores golosinas?
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto text-base sm:text-lg">
            Explorá nuestro catálogo online o comunicate directamente por WhatsApp para hacer tu pedido a medida.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={() => setActiveScreen('catalogo')}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 candy-gradient-bg text-white font-bold rounded-2xl shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Ver Catálogo Completo</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href={`https://wa.me/${WHATSAPP_NUMERO}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-900/40 hover:scale-105 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Consultar por WhatsApp</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};