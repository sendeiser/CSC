import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ShoppingBag, ArrowRight, HelpCircle, CheckCircle2, CreditCard, Truck, ShieldCheck, ChevronDown } from 'lucide-react';
import { ActiveScreen } from '../types';

interface HowToBuyScreenProps {
  setActiveScreen: (screen: ActiveScreen) => void;
}

export const HowToBuyScreen: React.FC<HowToBuyScreenProps> = ({ setActiveScreen }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const steps = [
    {
      num: 1,
      title: '1. Explorá el Catálogo',
      badge: 'Fácil & Rápido',
      subtitle: 'Buscá tus golosinas favoritas por nombre o filtrá por categorías (Gomitas, Chocolates, Acidulados, Caramelos).',
      image: '/guide/step1.png',
      detailText: 'Navegá libremente desde tu celular o computadora. Podés ver fotos en alta definición, precios actualizados por kilo o por unidad, y la información nutricional o dietaria de cada producto.',
      accent: 'from-purple-500 to-indigo-600',
      tagBg: 'bg-purple-100 text-purple-700',
      highlights: ['Buscador inteligente instantáneo', 'Filtros por tipo de dulce', 'Sin necesidad de instalar apps']
    },
    {
      num: 2,
      title: '2. Elegí Gramos o Cantidad',
      badge: 'Compra a Granel',
      subtitle: 'Comprá justo lo que necesitás: seleccioná gramos exactos (250g, 500g, 1kg) o cantidad por unidad.',
      image: '/guide/step2.png',
      detailText: '¡Sin mínimos de compra forzados! Elegí el pesaje o volumen ideal para tu antojo personal o para un evento especial. Tocá "Agregar al Carrito" y continuá agregando más golosinas si lo deseás.',
      accent: 'from-pink-500 to-rose-600',
      tagBg: 'bg-pink-100 text-pink-700',
      highlights: ['Transparencia total de precio por gramos', 'Modificación dinámica en el carrito', 'Descuentos automáticos aplicables']
    },
    {
      num: 3,
      title: '3. Elegí como Pagar o Retirar',
      badge: 'Mercado Pago o Efectivo',
      subtitle: 'Ingresá tu nombre y elegí pagar online con Mercado Pago (tarjetas/transferencia) o abonar en efectivo al retirar.',
      image: '/guide/step3.png',
      detailText: 'Al abrir tu carrito elegís la modalidad de entrega en Chamical (retiro por la tienda física o envío directo). Contamos con checkout seguro protegido por Mercado Pago y pagos directos.',
      accent: 'from-emerald-500 to-teal-600',
      tagBg: 'bg-emerald-100 text-emerald-700',
      highlights: ['Aceptamos Mercado Pago, QR y tarjetas', 'Pago en efectivo al retirar', 'Ingreso súper veloz de datos']
    },
    {
      num: 4,
      title: '4. ¡Listo! Recibí tu Pedido',
      badge: 'Disfrutá tus Dulces',
      subtitle: 'Recibirás la confirmación de tu pedido al instante y podrás retirarlo o recibirlo sin demoras en Chamical.',
      image: '/guide/step4.png',
      detailText: 'Tu pedido queda registrado automáticamente en nuestro sistema. Podés hacer clic en el botón flotante de WhatsApp para consultar cualquier duda o coordinar el horario de retiro.',
      accent: 'from-amber-500 to-orange-600',
      tagBg: 'bg-amber-100 text-amber-700',
      highlights: ['Código de pedido único de seguimiento', 'Contacto directo con la tienda por WhatsApp', 'Atención personalizada en Chamical']
    },
  ];

  const faqs = [
    {
      q: '¿Cómo funciona la compra a granel por gramos?',
      a: 'En las golosinas vendidas por peso podés seleccionar los gramos que quieras (ej: 250g, 500g, 750g, 1000g). El sistema calcula el valor exacto proporcional al precio por kilogramo en tiempo real.'
    },
    {
      q: '¿Tengo que crear una cuenta obligatoriamente para comprar?',
      a: '¡No! Podés hacer tu compra como cliente invitado sin necesidad de registrarte. Si te registrás o iniciás sesión, podrás guardar tus favoritos y ver tu historial de compras anteriores.'
    },
    {
      q: '¿Cuáles son los medios de pago aceptados?',
      a: 'Aceptamos pagos online con Mercado Pago (tarjetas de crédito, débito, transferencia bancaria, dinero en cuenta, saldo QR) y también opción de pago en efectivo al momento de retirar en el local.'
    },
    {
      q: '¿Cómo coordino el retiro o envío en Chamical?',
      a: 'Una vez finalizada tu compra online, el sistema genera tu comprobante con el número de pedido. Podés dirigirte directamente a nuestro local o presionar el botón de WhatsApp para acordar la entrega.'
    }
  ];

  const current = steps.find(s => s.num === activeStep) || steps[0];

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden pb-20">
      {/* Hero Banner Header */}
      <section className="relative bg-slate-950 text-white py-20 sm:py-24 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(236,72,153,0.25),transparent_50%),radial-gradient(circle_at_70%_70%,_rgba(168,85,247,0.25),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4 max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 text-pink-300 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
              <HelpCircle className="w-4 h-4 text-pink-400" />
              <span>Guía Oficial de Compra</span>
            </span>

            <h1 className="font-headline font-black text-4xl sm:text-6xl tracking-tight leading-tight">
              ¿Cómo comprar en <span className="candy-gradient-text">Chamical Candy Shop</span>?
            </h1>

            <p className="text-base sm:text-xl text-slate-300 font-medium leading-relaxed">
              Comprar tus golosinas favoritas nunca fue tan fácil. Descubrí el paso a paso detallado para hacer tu pedido online en menos de 2 minutos.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Interactive Guide Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        {/* Step Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 max-w-4xl mx-auto">
          {steps.map(s => {
            const isActive = activeStep === s.num;
            return (
              <button
                key={s.num}
                onClick={() => setActiveStep(s.num)}
                className={`p-4 rounded-2xl border text-left transition-all duration-300 flex items-center space-x-3 ${
                  isActive
                    ? 'bg-white border-purple-500 shadow-xl shadow-purple-100 ring-2 ring-purple-500/20 scale-[1.02]'
                    : 'bg-white/90 border-slate-200 hover:bg-white hover:border-purple-200 text-slate-500 shadow-sm'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0 bg-gradient-to-tr ${s.accent}`}>
                  {s.num}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold truncate ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>{s.badge}</p>
                  <p className="text-[10px] text-slate-400 truncate">Paso {s.num}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Step Detailed Showcase Box */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl shadow-purple-100/40 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Image Preview Box */}
            <div className="lg:col-span-7 relative group">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
                <img
                  src={current.image}
                  alt={current.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute top-4 left-4">
                <span className={`px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase shadow-md ${current.tagBg}`}>
                  {current.badge}
                </span>
              </div>
            </div>

            {/* Explanation & Action */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-extrabold text-purple-600 uppercase tracking-widest block">
                  Paso {current.num} de 4
                </span>
                <h2 className="font-headline font-black text-2xl sm:text-3xl text-slate-900">
                  {current.title}
                </h2>
                <p className="text-sm sm:text-base font-bold text-purple-900 leading-snug">
                  {current.subtitle}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {current.detailText}
                </p>
              </div>

              {/* Highlights */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {current.highlights.map((h, i) => (
                  <div key={i} className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              {/* Controls */}
              <div className="pt-3 flex flex-col sm:flex-row gap-3">
                {activeStep < 4 ? (
                  <button
                    onClick={() => setActiveStep(prev => prev + 1)}
                    className="px-6 py-3 bg-slate-900 hover:bg-purple-900 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2"
                  >
                    <span>Siguiente Paso</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : null}

                <button
                  onClick={() => setActiveScreen('catalogo')}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-pink-200 flex items-center justify-center space-x-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Ir al Catálogo de Dulces</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Cards Overview Grid */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h3 className="font-headline font-bold text-2xl text-slate-900">Resumen de los 4 Pasos</h3>
            <p className="text-sm text-slate-500 mt-1">Hacé clic en cualquier tarjeta para ver la demostración interactiva</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(s => (
              <div
                key={s.num}
                onClick={() => setActiveStep(s.num)}
                className={`cursor-pointer bg-white rounded-2xl border p-4 transition-all duration-300 group flex flex-col justify-between ${
                  activeStep === s.num
                    ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-lg'
                    : 'border-slate-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                <div className="space-y-3">
                  <div className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-50 border border-slate-100 relative">
                    <img src={s.image} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-slate-900/80 text-white text-[10px] font-black flex items-center justify-center">
                      {s.num}
                    </span>
                  </div>
                  <h4 className="font-headline font-bold text-base text-slate-900 group-hover:text-purple-700 transition-colors">
                    {s.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {s.subtitle}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs text-purple-600 font-bold">
                  <span>Ver detalle</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-start space-x-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Granel Personalizado</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Elegí la cantidad exacta en gramos sin estar atado a paquetes cerrados.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-start space-x-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Pago 100% Seguro</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Aboná con Mercado Pago online o directamente en efectivo al retirar.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-start space-x-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Retiro o Envío Rápido</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Preparación exprés de tu pedido para retirar en nuestro local de Chamical.</p>
            </div>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="max-w-3xl mx-auto mb-20 bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              Preguntas Frecuentes
            </span>
            <h3 className="font-headline font-black text-2xl sm:text-3xl text-slate-900 mt-2">
              ¿Tenés dudas antes de comprar?
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden transition-colors">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left font-bold text-sm text-slate-900 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-purple-600' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-5 py-4 text-xs sm:text-sm text-slate-600 leading-relaxed bg-white border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-pink-800 to-purple-950 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(236,72,153,0.3),transparent_60%)] pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h3 className="font-headline font-black text-3xl sm:text-4xl text-white">
              ¿Listo para probar las mejores golosinas?
            </h3>
            <p className="text-sm sm:text-base text-pink-100/90 leading-relaxed">
              Explorá nuestro catálogo completo con cientos de gomitas, chocolates y caramelos esperándote.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setActiveScreen('catalogo')}
                className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-purple-900 hover:bg-pink-50 rounded-2xl font-extrabold text-sm shadow-xl transition-all hover:scale-105"
              >
                <ShoppingBag className="w-5 h-5 text-pink-600" />
                <span>Ir al Catálogo de Productos</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
