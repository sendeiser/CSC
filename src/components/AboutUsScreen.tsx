import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Heart, ArrowLeft } from 'lucide-react'
import { ActiveScreen } from '../types'

interface AboutUsScreenProps {
  setActiveScreen: (screen: ActiveScreen) => void
}

export const AboutUsScreen: React.FC<AboutUsScreenProps> = ({ setActiveScreen }) => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/homepage/about')
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-pulse space-y-4 w-full max-w-lg p-8">
        {Array.from({length: 6}).map((_, i) => <div key={i} className="h-4 bg-slate-100 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />)}
      </div>
    </div>
  )

  const content = data?.content || {}
  const sections = content.sections || []

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-pink-50 via-purple-50/40 to-white pt-6 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,_rgba(236,72,153,0.1),transparent_50%)]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative">
          {/* Back button */}
          <div className="mb-6">
            <button
              onClick={() => setActiveScreen('inicio')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-purple-700 bg-white/80 hover:bg-white border border-slate-200/80 px-3.5 py-1.5 rounded-full shadow-sm backdrop-blur-sm transition-all duration-200 cursor-pointer hover:shadow hover:-translate-x-0.5"
            >
              <ArrowLeft className="w-4 h-4 text-purple-600" />
              <span>Volver al inicio</span>
            </button>
          </div>

          <div className="text-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-bold tracking-widest text-pink-600 uppercase"
            >
              {data?.subtitle || 'Conocé nuestra historia'}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-3 font-headline font-extrabold text-4xl sm:text-5xl text-gray-900"
            >
              {data?.title || 'Sobre Nosotros'}
            </motion.h1>
            {content.intro && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
              >
                {content.intro}
              </motion.p>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      {content.stats?.length > 0 && (
        <section className="py-12 bg-gradient-to-r from-pink-500 to-purple-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
              {content.stats.map((stat: any, i: number) => (
                <div key={i}>
                  <div className="text-3xl sm:text-4xl font-black">{stat.value}</div>
                  <div className="text-sm text-pink-100 mt-1 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-16">
        {sections.map((section: any, idx: number) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-5 h-5 text-pink-600" />
              <h2 className="font-headline font-bold text-2xl sm:text-3xl text-gray-900">{section.heading}</h2>
            </div>
            <div className="space-y-3">
              {section.paragraphs?.map((p: string, j: number) => (
                <p key={j} className="text-base text-gray-600 leading-relaxed">{p}</p>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Image */}
      {content.image_url && (
        <section className="pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="aspect-video rounded-2xl overflow-hidden shadow-lg">
              <img src={content.image_url} alt="Chamical Candy Shop" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}