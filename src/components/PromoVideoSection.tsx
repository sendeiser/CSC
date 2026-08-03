import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Sparkles, ArrowRight, Phone, Film, X, CheckCircle2 } from 'lucide-react';
import { ActiveScreen } from '../types';
import { WHATSAPP_NUMERO } from '../lib/whatsapp';

interface PromoVideoSectionProps {
  setActiveScreen: (screen: ActiveScreen) => void;
  videoUrl?: string;
  title?: string;
  subtitle?: string;
  description?: string;
}

export const PromoVideoSection: React.FC<PromoVideoSectionProps> = ({
  setActiveScreen,
  videoUrl,
  title = "Descubrí la Experiencia Chamical Candy Shop",
  subtitle = "VIDEO PROMOCIONAL EXCLUSIVO",
  description = "Un recorrido vibrante por nuestras dulcerías, gomitas por granel, chocolates de alta calidad y la magia de armar tu combinación perfecta."
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(35);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  // Video comercial promocional oficial para Chamical Candy Shop
  const defaultVideoSrc = "/uploads/Video_comercial_promocional_c.mp4";
  const activeVideoSrc = videoUrl && videoUrl.trim() ? videoUrl : defaultVideoSrc;

  return (
    <section className="py-20 sm:py-28 bg-slate-950 relative overflow-hidden text-white">
      {/* Glows de fondo */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-pink-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Trama de cuadrícula sutil */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-14 space-y-4"
        >
          <span className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
            <Film className="w-3.5 h-3.5 text-pink-400" />
            <span>{subtitle}</span>
          </span>

          <h2 className="font-headline font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
            {title}
          </h2>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            {description}
          </p>
        </motion.div>

        {/* Reproductor de Video Promocional */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
          {/* Contenedor del Video */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-8 relative group"
          >
            {/* Marco con sombra resplandeciente */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-white/15 shadow-2xl shadow-purple-900/40 aspect-video flex items-center justify-center">
              {/* Video Element */}
              <video
                ref={videoRef}
                src={activeVideoSrc}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover"
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
                    setProgress(pct || 0);
                  }
                }}
              />

              {/* Overlay de gradiente superior e inferior */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 opacity-80 group-hover:opacity-100 transition-opacity" />

              {/* Marca de agua HD */}
              <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
                <span className="bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  4K ULTRA HD
                </span>
                <span className="bg-pink-600/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  <span>PROMO</span>
                </span>
              </div>

              {/* Botón de Play Central en Pausa */}
              {!isPlaying && (
                <button
                  onClick={togglePlay}
                  className="absolute z-20 w-20 h-20 rounded-full candy-gradient-bg text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300 group/btn"
                >
                  <Play className="w-8 h-8 fill-white translate-x-0.5" />
                </button>
              )}

              {/* Barra de Controles Inferior */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-10 flex flex-col space-y-3 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent">
                {/* Progress bar */}
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden cursor-pointer">
                  <div
                    className="h-full candy-gradient-bg transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={togglePlay}
                      className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors"
                      title={isPlaying ? "Pausar" : "Reproducir"}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                    </button>

                    <button
                      onClick={toggleMute}
                      className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors"
                      title={isMuted ? "Activar Sonido" : "Silenciar"}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-pink-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                    </button>

                    <span className="font-semibold tracking-wider text-[11px] text-slate-400">
                      CHAMICAL CANDY SHOP • SHOWCASE
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsFullscreen(true)}
                      className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors"
                      title="Pantalla Completa"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Columna Derecha: Características & CTAs */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-4 mt-10 lg:mt-0 space-y-6"
          >
            <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-md shadow-xl">
              <h3 className="font-headline font-bold text-xl text-white">
                ¿Por qué elegir Chamical Candy Shop?
              </h3>

              <ul className="space-y-4">
                {[
                  { title: "Venta por Granel", desc: "Comprás exactamente la cantidad en gramos que querés." },
                  { title: "Golosinas e Importados", desc: "Amplio catálogo con las mejores marcas nacionales e internacionales." },
                  { title: "Atención por WhatsApp", desc: "Hacés tu pedido online y coordinás la entrega en minutos." },
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-semibold">{item.title}</strong>
                      <span className="text-slate-400 text-xs leading-relaxed">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <button
                  onClick={() => setActiveScreen('catalogo')}
                  className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white candy-gradient-bg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:opacity-95 transition-all flex items-center justify-center space-x-2 group"
                >
                  <span>Explorar Catálogo</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMERO}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm text-slate-300 border border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center space-x-2"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Consultar por WhatsApp</span>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal Fullscreen del Video */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 sm:p-8"
          >
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative max-w-5xl w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/20">
              <video
                src={activeVideoSrc}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
