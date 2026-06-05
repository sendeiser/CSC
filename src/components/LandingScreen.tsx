import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Star, Heart, Flame, Shield, Award, HelpCircle, Activity } from 'lucide-react';
import { ActiveScreen, Product } from '../types';
import { PILLARS, TEAM_MEMBERS } from '../data';

interface LandingScreenProps {
  setActiveScreen: (screen: ActiveScreen) => void;
  setSelectedProductById: (id: string) => void;
  heroProduct: Product;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  setActiveScreen,
  setSelectedProductById,
  heroProduct
}) => {
  return (
    <div className="bg-white overflow-hidden">
      
      {/* 1. Hero Spotlight Banner */}
      <section className="relative bg-gradient-to-b from-pink-50/70 via-purple-50/40 to-white pt-8 pb-16 sm:pb-24 lg:pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            
            {/* Text description */}
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center space-x-2 bg-pink-100/70 text-pink-700 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase border border-pink-200"
              >
                <span>✨ Bienvenido a la Dulce Galaxia</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="font-headline font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-gray-900 leading-[1.1]"
              >
                La dulce <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  revolución
                </span> ha llegado
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-base sm:text-lg text-gray-600 leading-relaxed font-sans"
              >
                Explora universos de sabor inexplorados. Con gomitas gourmet, chocolates cósmicos y sours vibrantes fabricados con materias primas de la más alta fidelidad y un corazón artesano.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-2"
              >
                <button
                  id="hero-explore-btn"
                  onClick={() => setActiveScreen('catalogo')}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:opacity-95 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  Explora el Menú
                  <ArrowRight className="ml-2 w-5 h-5" />
                </button>
                <button
                  id="hero-discover-btn"
                  onClick={() => {
                    setSelectedProductById(heroProduct.id);
                    setActiveScreen('detalle');
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border border-pink-200 text-base font-semibold rounded-xl text-purple-700 bg-white hover:bg-pink-50/50 transition-colors"
                >
                  Ver Novedad Cósmica
                </button>
              </motion.div>
            </div>

            {/* Hero candy stack visual */}
            <div className="mt-12 sm:mt-16 lg:mt-0 lg:col-span-6 relative flex justify-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, type: 'spring' }}
                className="relative max-w-md md:max-w-xl lg:max-w-none"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-200 to-indigo-200 rounded-full blur-3xl opacity-40 animate-pulse -z-10" />
                
                {/* Image element with JSX referrerPolicy */}
                <img
                  id="hero-candy-img"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7e-6bboZtPBm8BALBfx0WCk3mIsYxCEeTIgzMprfA1JWPAfedSNrNF57reJeQACINztZEtTKE084M5_U-mPXcC-ggKRb8CuCvcJKSRk8_tbHddot9R7V719-YX2wV9TsXEtYkGbR4aGZW8FAy4PFh6oyUDZ_qh4rLVRQfxd5KjOUT95esfBjS9vObyCSyvaFsRjgd_a8agD_IFMBdMU1IqXmoA6pCH8-INBv5sR2eeq74prcsulJ6vzWQqDewdVUbrEypFIIBsE0"
                  alt="Candyverse Stack Colección Dulce"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto drop-shadow-2xl rounded-3xl object-cover hover:scale-[1.02] transition-transform duration-500"
                />

                <div className="absolute -bottom-6 -left-6 bg-white/95 rounded-2xl p-4 shadow-xl border border-pink-100 flex items-center space-x-3 max-w-[200px] animate-bounce">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
                    100%
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Artesano</h4>
                    <p className="text-[10px] text-gray-500">Hecho con amor real</p>
                  </div>
                </div>

                <div className="absolute -top-6 -right-6 bg-white/95 rounded-2xl p-4 shadow-xl border border-indigo-100 flex items-center space-x-2.5 max-w-[220px]">
                  <div className="flex space-x-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-indigo-950">
                    4.9/5 Estrellas
                  </span>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Outstanding Product Promo / Quick Purchase Target */}
      <section className="py-16 sm:py-20 bg-pink-50/30 border-y border-pink-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="font-headline font-bold text-3xl text-gray-900">
              Nuestro Producto Estrella de la Semana
            </h2>
            <p className="mt-3 text-base text-gray-600">
              Prueba la sensación galáctica que está rompiendo todos los récords de la bolsa dulce.
            </p>
          </div>

          <div 
            onClick={() => {
              setSelectedProductById(heroProduct.id);
              setActiveScreen('detalle');
            }}
            className="group bg-white rounded-3xl p-6 sm:p-10 shadow-lg hover:shadow-xl transition-all duration-300 border border-pink-100 max-w-4xl mx-auto cursor-pointer flex flex-col md:flex-row items-center gap-8 lg:gap-12"
          >
            <div className="w-full md:w-1/2 aspect-square relative overflow-hidden rounded-2xl bg-pink-50">
              {/* Product spot main image */}
              <img
                src={heroProduct.image}
                alt={heroProduct.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-4 left-4 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                Favorito Galáctico
              </span>
            </div>

            <div className="w-full md:w-1/2 space-y-4">
              <div className="flex items-center space-x-2.5">
                <span className="bg-pink-100 text-pink-800 text-xs font-semibold px-2.5 py-1 rounded">
                  {heroProduct.category}
                </span>
                <div className="flex items-center space-x-1 text-amber-400">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-xs font-bold text-gray-700">5.0 (124 opiniones)</span>
                </div>
              </div>

              <h3 className="font-headline font-bold text-2xl lg:text-3xl text-gray-900">
                {heroProduct.name}
              </h3>
              
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                {heroProduct.description}
              </p>

              <div className="flex items-center space-x-4 pt-2">
                <div className="text-2xl font-black text-purple-700">
                  ${heroProduct.price.toFixed(2)} <span className="text-xs font-medium text-gray-500">/ 250g</span>
                </div>
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full">
                  Disponible para envío express
                </span>
              </div>

              <div className="pt-4">
                <span className="inline-flex items-center text-sm font-bold text-pink-600 group-hover:text-pink-700 transition-colors">
                  Ver especificaciones de sabores e ingredientes
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Artisan Process Section */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
            <span className="text-xs font-bold tracking-widest text-pink-600 uppercase">La receta de la felicidad</span>
            <h2 className="mt-2 font-headline font-extrabold text-3xl sm:text-4xl text-gray-900 tracking-tight">
              Creado por nosotros, amado por todos
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-pink-500 to-purple-600 mx-auto mt-4 rounded-full" />
            <p className="mt-4 text-base sm:text-lg text-gray-500">
              Fórmula única elaborada meticulosamente en lotes limitados para asegurar una experiencia sensorial inigualable.
            </p>
          </div>

          <div className="space-y-16 lg:space-y-24">
            
            {/* Step 1: Left column layout */}
            <div className="lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
              <div className="lg:col-span-5 space-y-4">
                <div className="w-9 h-9 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-headline font-black text-lg">
                  1
                </div>
                <h3 className="font-headline font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight">
                  Matriculación de sabores exóticos
                </h3>
                <p className="text-base text-gray-600 leading-relaxed font-sans">
                  Sometemos todas nuestras pulpas de fruta y azúcarez orgánicos a un control de infusión constante. Diseñamos las combinaciones en función de notas cítricas, ácidas y ricas que reviven la infancia y despiertan el placer dulce de forma balanceada.
                </p>
                <ul className="space-y-2 pt-2">
                  {['Extractos de fruta 100% natural', 'Sin saborizantes sintéticos agresivos', 'Azúcar espolvoreado a mano'].map((item, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 mr-2.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10 lg:mt-0 lg:col-span-7 flex justify-center">
                <div className="relative aspect-[4/3] w-full max-w-xl overflow-hidden rounded-2xl shadow-xl group">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFnupY6X3OeWe0OGFu9RFhJShIgtvC_FkNPvWvsDQsEqMffRmytrJKsrR8MospRiGaPeWN7K3hfxXv6HatHiFZ0_wG2H_Xf7sWsZvFo_2ilbtQ5wuV1ETbk3t-y_1unWmzIIGkjZo8hiKVjZ28cx-jgKjYPdRIeqCp-229-FlxD82IPCvBVRhxQcqT5TQKiTdIpwcr6jZx9zh1EkT0m44G30LttcE1FzFxB475xHOk3HD4HIoRUXfpBW4kdmSfOMW9hal3MbRXNfQ"
                    alt="Proceso de amasar gomitas y confite artesanal"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>
              </div>
            </div>

            {/* Step 2: Right column layout */}
            <div className="lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
              <div className="lg:col-span-5 lg:order-2 space-y-4">
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-headline font-black text-lg">
                  2
                </div>
                <h3 className="font-headline font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight">
                  Moldeo templado criogénico
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Para lograr esa consistencia mítica suave en el interior pero con cobertura compacta, templamos nuestras gominolas en enfriamiento de aire lento y luego cortamos artesanalmente los lotes. Las cintas y ositos toman su figura galáctica exacta en este proceso.
                </p>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100/50 mt-2">
                  <p className="text-xs text-purple-900 font-medium italic">
                    "Templar el dulce exige paciencia estelar. El resultado es esa textura inigualable por la que nuestros clientes vuelven mes a mes." — Mateo R., Confitero Jefe.
                  </p>
                </div>
              </div>

              <div className="mt-10 lg:mt-0 lg:col-span-7 lg:order-1 flex justify-center">
                <div className="relative aspect-[4/3] w-full max-w-xl overflow-hidden rounded-2xl shadow-xl group">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYJDELrOqbsdJb50I8YkVdKKkbALISn6QmMLe97c2dvo4MtiOZTC3uU_IKeIhgo2ZtN9_Hoj5xTQ5s-XoAmlEi4xfQPOknou1cqqvoBG-REcR3PvvJDY1NOG5Vk30aaOAo52W-TCylpFheBuDFERbnxrii2sPzzQyw1_VGFhDG5t-JnBQikgOhXwyT2SMFtSM6Z8_i1XWfRni8sLPSy6yRBF9ENzNGExnLAbeCtXsIm2CrPuMS9dkNkGX8mbsqVvekdMOrEaLgG5o"
                    alt="Cocina y corte de caramelos y gomitas artesanales"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Core Pillars Group */}
      <section className="py-20 bg-gradient-to-tr from-pink-50/50 via-white to-purple-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Nuestros pilares</span>
            <h2 className="mt-1 font-headline font-bold text-3xl sm:text-4xl text-gray-900">
              Magia pura en cada porción
            </h2>
            <p className="mt-3 text-sm sm:text-base text-gray-500">
              Nos esforzamos para que cada visita a Candyverse sea inolvidable tanto para tu paladar como para tu bienestar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PILLARS.map((pillar, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-2xl p-8 shadow-sm border border-pink-100 hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className={`w-12 h-12 rounded-xl ${pillar.bg} ${pillar.text} flex items-center justify-center mb-6`}>
                  {idx === 0 && <Award className="w-6 h-6" />}
                  {idx === 1 && <Flame className="w-6 h-6" />}
                  {idx === 2 && <Heart className="w-6 h-6" />}
                </div>
                <h3 className="font-headline font-bold text-lg text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed font-sans">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Team Section */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-pink-600 uppercase">Conoce el origen</span>
            <h2 className="mt-2 font-headline font-extrabold text-3xl sm:text-4xl text-gray-900">
              Las mentes dulces detrás de la magia
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-pink-500 to-purple-600 mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {TEAM_MEMBERS.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="relative mx-auto w-24 h-24 sm:w-32 sm:h-32 overflow-hidden rounded-full border-4 border-pink-100 shadow-md group-hover:border-purple-300 transition-all duration-300">
                  <img
                    src={member.image}
                    alt={member.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="mt-4 text-base sm:text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                  {member.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 font-sans">
                  {member.role}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Footer / Dynamic Action CTA */}
      <section className="relative py-16 bg-gradient-to-tr from-purple-800 to-pink-700 text-white overflow-hidden text-center">
        <div className="absolute inset-0 bg-grid-white opacity-10" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative space-y-6">
          <h2 className="font-headline font-black text-3xl sm:text-4xl">
            ¿Listo para abordar la galaxia del dulce?
          </h2>
          <p className="text-base text-pink-100 max-w-xl mx-auto">
            Únete de forma gratuita, compra tus bolsas y recibe un 15% de regalo utilizando el código especial <span className="font-bold underline text-white">DULCE2024</span> en tu primera transacción.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
            <button
              onClick={() => setActiveScreen('catalogo')}
              className="px-8 py-4 bg-white text-purple-800 hover:bg-pink-50 rounded-xl font-bold shadow-lg transition-transform transform hover:-translate-y-0.5"
            >
              Comprar en Catálogo
            </button>
            <button
              onClick={() => setActiveScreen('registro')}
              className="px-8 py-4 border border-white/40 text-white hover:bg-white/10 rounded-xl font-semibold transition-colors"
            >
              Crear Cuenta Gratis
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
