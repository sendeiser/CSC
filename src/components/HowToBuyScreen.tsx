import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ShoppingBag, ArrowRight, HelpCircle, CheckCircle2, CreditCard, Truck, ShieldCheck, ChevronDown, Play, X, ArrowLeft, Store } from 'lucide-react';
import { ActiveScreen, StoreSettings } from '../types';
import { homepage as homepageApi } from '../lib/api';

interface HowToBuyScreenProps {
  setActiveScreen: (screen: ActiveScreen) => void;
}

export const HowToBuyScreen: React.FC<HowToBuyScreenProps> = ({ setActiveScreen }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [settings, setSettings] = useState<Partial<StoreSettings>>({
    fulfillment_type: 'both',
    delivery_cost: 0,
    free_delivery_over: 0,
    pickup_address: 'Local Chamical Candy Shop - Calle Principal #123, Chamical',
    pickup_schedule: 'Lunes a Sábado de 09:00 a 20:00 hs',
    delivery_notes: 'Envíos en el día dentro del radio urbano de Chamical.',
  });

  useEffect(() => {
    homepageApi.getSettings().then((st) => {
      if (st) setSettings(st);
    }).catch(() => {});
  }, []);

  const fulfillmentType = settings.fulfillment_type || 'both';
  const pickupAddress = settings.pickup_address || 'Local Chamical Candy Shop';
  const pickupSchedule = settings.pickup_schedule || 'Lunes a Sábado de 09:00 a 20:00 hs';
  const deliveryNotes = settings.delivery_notes || 'Envíos dentro de la ciudad.';
  const deliveryCost = Number(settings.delivery_cost || 0);
  const freeDeliveryOver = Number(settings.free_delivery_over || 0);

  const getStep3Data = () => {
    if (fulfillmentType === 'pickup_only') {
      return {
        title: '3. Pagá y Retirá en Local',
        badge: 'Solo Retiro en Tienda',
        subtitle: 'Ingresá tu nombre y elegí pagar online con Mercado Pago, Transferencia o abonar en efectivo al retirar.',
        detailText: `📍 Retiro exclusivo en tienda física (${pickupAddress}). Horarios de atención: ${pickupSchedule}.`,
        highlights: [
          'Retiro directo en tienda: ' + pickupAddress,
          'Aceptamos Mercado Pago, Transferencia y Efectivo',
          'Sin gastos de envío adicionales',
        ],
      };
    }
    if (fulfillmentType === 'delivery_only') {
      return {
        title: '3. Datos de Envío y Pago',
        badge: 'Envío a Domicilio',
        subtitle: 'Ingresá tu dirección de entrega y aboná con Mercado Pago o Transferencia Bancaria.',
        detailText: `🚚 Envío directo a tu casa. Costo de envío: ${deliveryCost > 0 ? `$${deliveryCost.toFixed(2)}` : 'GRATIS'}${freeDeliveryOver > 0 ? ` (Envío GRATIS en compras superiores a $${freeDeliveryOver.toFixed(2)})` : ''}. ${deliveryNotes}`,
        highlights: [
          'Despacho a tu domicilio en Chamical',
          'Aceptamos Mercado Pago, QR y Transferencia',
          deliveryCost === 0 ? 'Envío GRATIS incluido' : `Costo de envío: $${deliveryCost}`,
        ],
      };
    }
    return {
      title: '3. Elegí Retiro o Delivery',
      badge: 'Retiro o Delivery',
      subtitle: 'Al abrir tu carrito elegís la modalidad que prefieras: retirar gratis por el local o envío a domicilio.',
      detailText: `📍 Podés retirar gratis por nuestro local (${pickupAddress}) o solicitar envío directo a tu casa en Chamical.`,
      highlights: [
        'Opción 1: Retiro en tienda (' + pickupAddress + ')',
        'Opción 2: Envío a domicilio (' + (deliveryCost === 0 ? 'Envío GRATIS' : `$${deliveryCost}`) + ')',
        'Checkout rápido con Mercado Pago, QR o Transferencia',
      ],
    };
  };

  const step3Data = getStep3Data();

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
      title: step3Data.title,
      badge: step3Data.badge,
      subtitle: step3Data.subtitle,
      image: '/guide/step3.png',
      detailText: step3Data.detailText,
      accent: 'from-emerald-500 to-teal-600',
      tagBg: 'bg-emerald-100 text-emerald-700',
      highlights: step3Data.highlights
    },
    {
      num: 4,
      title: '4. ¡Listo! Recibí tu Pedido',
      badge: 'Disfrutá tus Dulces',
      subtitle: fulfillmentType === 'pickup_only'
        ? `Recibirás la confirmación de tu pedido al instante para pasar a retirarlo por ${pickupAddress}.`
        : fulfillmentType === 'delivery_only'
        ? 'Recibirás la confirmación de tu pedido al instante y lo despacharemos directo a tu domicilio.'
        : 'Recibirás la confirmación al instante y podrás retirarlo en la tienda o recibirlo en tu domicilio.',
      image: '/guide/step4.png',
      detailText: 'Tu pedido queda registrado automáticamente en nuestro sistema. Podés hacer clic en el botón flotante de WhatsApp para consultar cualquier duda.',
      accent: 'from-amber-500 to-orange-600',
      tagBg: 'bg-amber-100 text-amber-700',
      highlights: [
        'Código de pedido único de seguimiento',
        'Contacto directo con la tienda por WhatsApp',
        fulfillmentType === 'pickup_only' ? 'Retiro exprés en local' : 'Atención y despacho personalizado'
      ]
    },
  ];

  const getFaqs = () => {
    const deliveryFaq = fulfillmentType === 'pickup_only'
      ? {
          q: '¿Tienen servicio de envío a domicilio o delivery?',
          a: `Actualmente nuestra tienda opera únicamente bajo la modalidad de Solo Retiro en Local. Podés hacer tu compra online y pasar a retirarla por nuestra tienda en ${pickupAddress}. Horarios de atención: ${pickupSchedule}.`
        }
      : fulfillmentType === 'delivery_only'
      ? {
          q: '¿Cómo funciona el envío a domicilio / delivery?',
          a: `Todos los pedidos se despachan a la dirección que ingreses al comprar. ${deliveryCost === 0 ? '¡El envío es GRATIS!' : `El costo de envío es de $${deliveryCost.toFixed(2)}.`} ${freeDeliveryOver > 0 ? `Comprando más de $${freeDeliveryOver.toFixed(2)} tenés envío GRATIS.` : ''} ${deliveryNotes}`
        }
      : {
          q: '¿Cómo coordino el retiro o envío en Chamical?',
          a: `Al momento de hacer tu pedido podés elegir entre retirar gratis por nuestro local (${pickupAddress}) o recibirlo por delivery en tu casa. ${deliveryCost === 0 ? '¡El envío a domicilio es gratis!' : `El envío a domicilio tiene un costo fijo de $${deliveryCost.toFixed(2)}.`}`
        };

    return [
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
        a: 'Aceptamos pagos online con Mercado Pago (tarjetas de crédito, débito, transferencia bancaria, dinero en cuenta, saldo QR) y también opción de pago en efectivo' + (fulfillmentType !== 'delivery_only' ? ' al retirar en el local.' : '.')
      },
      deliveryFaq
    ];
  };

  const faqs = getFaqs();

  const current = steps.find(s => s.num === activeStep) || steps[0];

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden pb-20">
      {/* Hero Banner Header */}
      <section className="relative bg-slate-950 text-white pt-10 pb-20 sm:pb-24 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(236,72,153,0.25),transparent_50%),radial-gradient(circle_at_70%_70%,_rgba(168,85,247,0.25),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button (solo mobile) */}
          <div className="mb-6 sm:hidden">
            <button
              onClick={() => setActiveScreen('inicio')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-1.5 rounded-full shadow-sm backdrop-blur-sm transition-all duration-200 cursor-pointer hover:shadow hover:-translate-x-0.5"
            >
              <ArrowLeft className="w-4 h-4 text-pink-300" />
              <span>Volver al inicio</span>
            </button>
          </div>

          <div className="text-center">
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

            <div className="pt-4 flex justify-center">
              <button
                onClick={() => setShowVideoModal(true)}
                className="inline-flex items-center space-x-2.5 px-6 py-3.5 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-pink-500/25 border border-white/20 transition-all transform hover:scale-105 active:scale-95"
              >
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="w-4 h-4 fill-white translate-x-0.5" />
                </div>
                <span>Ver Video Demostrativo</span>
              </button>
            </div>
          </motion.div>
          </div>
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
              {fulfillmentType === 'pickup_only' ? <Store className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                {fulfillmentType === 'pickup_only' ? 'Retiro en Tienda' : fulfillmentType === 'delivery_only' ? 'Envío a Domicilio' : 'Retiro o Envío Rápido'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {fulfillmentType === 'pickup_only'
                  ? `Retirá tu compra personalmente en ${pickupAddress}. Horarios: ${pickupSchedule}.`
                  : fulfillmentType === 'delivery_only'
                  ? `Despacho directo a tu puerta en Chamical. ${deliveryNotes}`
                  : 'Elegí retirar en nuestra tienda física o recibir por delivery directo a tu casa.'}
              </p>
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

      {/* Modal del Video Demostrativo */}
      <AnimatePresence>
        {showVideoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            onClick={() => setShowVideoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full bg-slate-900 border border-white/20 rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-slate-950">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-pink-500 animate-pulse" />
                  <h3 className="font-headline font-bold text-white text-base sm:text-lg">
                    Video Demostrativo: ¿Cómo Comprar en la Web?
                  </h3>
                </div>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Player */}
              <div className="aspect-video relative bg-black flex items-center justify-center">
                <video
                  src="/uploads/Un_video_comercial_publicitari.mp4"
                  controls
                  autoPlay
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Footer Modal */}
              <div className="p-4 sm:p-6 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
                <p className="text-xs text-slate-400 text-center sm:text-left">
                  Mirá en 15 segundos cómo elegir tus productos a granel y realizar tu pedido.
                </p>
                <button
                  onClick={() => {
                    setShowVideoModal(false);
                    setActiveScreen('catalogo');
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Ir al Catálogo</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
