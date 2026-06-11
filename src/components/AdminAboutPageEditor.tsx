import { useState, useEffect } from 'react'
import { Plus, X, Save, AlertCircle } from 'lucide-react'
import { admin as adminApi } from '../lib/api'

interface AboutSection {
  heading: string
  paragraphs: string[]
}

interface AboutContent {
  intro: string
  sections: AboutSection[]
  image_url: string
  stats: { value: string; label: string }[]
}

export default function AdminAboutPageEditor() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [content, setContent] = useState<AboutContent>({
    intro: '',
    sections: [],
    image_url: '',
    stats: [],
  })

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const d = await adminApi.getAbout()
      setData(d)
      setTitle(d.title || '')
      setSubtitle(d.subtitle || '')
      if (d.content) setContent(d.content)
    } catch (e: any) {
      setError(e.message || 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const d = await adminApi.updateAbout({ title, subtitle, content })
      setData(d)
    } catch (e: any) {
      setError(e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const updateSection = (i: number, field: keyof AboutSection, value: string | string[]) => {
    const s = [...content.sections]
    s[i] = { ...s[i], [field]: value }
    setContent({ ...content, sections: s })
  }

  const addSection = () => setContent({ ...content, sections: [...content.sections, { heading: '', paragraphs: [''] }] })
  const removeSection = (i: number) => setContent({ ...content, sections: content.sections.filter((_, idx) => idx !== i) })

  const addParagraph = (sectionIdx: number) => {
    const s = [...content.sections]
    s[sectionIdx] = { ...s[sectionIdx], paragraphs: [...s[sectionIdx].paragraphs, ''] }
    setContent({ ...content, sections: s })
  }

  const updateParagraph = (sectionIdx: number, pIdx: number, value: string) => {
    const s = [...content.sections]
    const p = [...s[sectionIdx].paragraphs]
    p[pIdx] = value
    s[sectionIdx] = { ...s[sectionIdx], paragraphs: p }
    setContent({ ...content, sections: s })
  }

  const removeParagraph = (sectionIdx: number, pIdx: number) => {
    const s = [...content.sections]
    s[sectionIdx] = { ...s[sectionIdx], paragraphs: s[sectionIdx].paragraphs.filter((_, idx) => idx !== pIdx) }
    setContent({ ...content, sections: s })
  }

  const updateStat = (i: number, field: 'value' | 'label', v: string) => {
    const st = [...content.stats]
    st[i] = { ...st[i], [field]: v }
    setContent({ ...content, stats: st })
  }

  const addStat = () => setContent({ ...content, stats: [...content.stats, { value: '', label: '' }] })
  const removeStat = (i: number) => setContent({ ...content, stats: content.stats.filter((_, idx) => idx !== i) })

  if (loading) return <div className="animate-pulse space-y-3">{Array.from({length: 3}).map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl" />)}</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="font-headline font-bold text-xl text-slate-800">Sobre Nosotros</h2>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50">
          <Save className="w-4 h-4" />{saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={load} className="ml-auto text-xs font-medium underline hover:no-underline">Reintentar</button>
        </div>
      )}

      {/* Title & Subtitle */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Título de página</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Subtítulo</label>
          <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
        </div>
      </div>

      {/* Intro */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-700">Introducción</h3>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Texto de introducción</label>
          <textarea value={content.intro} onChange={e => setContent({ ...content, intro: e.target.value })} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
        </div>
      </div>

      {/* Image */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-700">Imagen principal</h3>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">URL de imagen</label>
          <input type="text" value={content.image_url} onChange={e => setContent({ ...content, image_url: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
        </div>
        {content.image_url && (
          <img src={content.image_url} alt="preview" className="w-48 h-32 object-cover rounded-lg border border-slate-200" referrerPolicy="no-referrer" />
        )}
      </div>

      {/* Sections */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700">Secciones</h3>
          <button onClick={addSection} className="text-xs text-purple-600 font-medium flex items-center gap-1"><Plus className="w-3 h-3" />Agregar sección</button>
        </div>
        {content.sections.map((section, i) => (
          <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Sección {i + 1}</span>
              <button onClick={() => removeSection(i)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Título de sección</label>
              <input type="text" value={section.heading} onChange={e => updateSection(i, 'heading', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Párrafos</label>
              {section.paragraphs.map((p, j) => (
                <div key={j} className="flex gap-2 mb-2">
                  <textarea value={p} onChange={e => updateParagraph(i, j, e.target.value)} rows={2} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  <button onClick={() => removeParagraph(i, j)} className="p-2 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <button onClick={() => addParagraph(i)} className="text-xs text-purple-600 font-medium flex items-center gap-1"><Plus className="w-3 h-3" />Agregar párrafo</button>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700">Estadísticas / Highlights</h3>
          <button onClick={addStat} className="text-xs text-purple-600 font-medium flex items-center gap-1"><Plus className="w-3 h-3" />Agregar estadística</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {content.stats.map((stat, i) => (
            <div key={i} className="border border-slate-200 rounded-lg p-3 flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <input type="text" value={stat.value} onChange={e => updateStat(i, 'value', e.target.value)} placeholder="Valor (ej: 50+)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold" />
                <input type="text" value={stat.label} onChange={e => updateStat(i, 'label', e.target.value)} placeholder="Etiqueta" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <button onClick={() => removeStat(i)} className="p-1 text-red-400 hover:text-red-600 mt-1"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}