import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, Trash2, Plus, X, Save, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react'
import { admin as adminApi } from '../lib/api'
import { useModal } from '../context/ModalContext'

type SectionType = 'hero' | 'about' | 'categories' | 'store' | 'gallery' | 'contact'

function HeroContentEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Insignia Superior (Badge)</label>
        <input
          type="text"
          value={content.badge || ''}
          onChange={e => onChange({ ...content, badge: e.target.value })}
          placeholder="Ej: Tienda física y online"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Descripción / Texto de Bienvenida</label>
        <textarea
          value={content.description || ''}
          onChange={e => onChange({ ...content, description: e.target.value })}
          rows={3}
          placeholder="Ej: Gomitas, chocolates, caramelos y mucho más — todo por granel y al mejor precio..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Texto Botón Principal</label>
          <input
            type="text"
            value={content.btn_primary_text || ''}
            onChange={e => onChange({ ...content, btn_primary_text: e.target.value })}
            placeholder="Ej: Ver Catálogo"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Texto Botón Secundario</label>
          <input
            type="text"
            value={content.btn_secondary_text || ''}
            onChange={e => onChange({ ...content, btn_secondary_text: e.target.value })}
            placeholder="Ej: Consultar por WhatsApp"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
        </div>
      </div>
    </div>
  )
}

function AboutContentEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const paragraphs: string[] = content.paragraphs || []
  const tags: string[] = content.tags || []
  const [newTag, setNewTag] = useState('')

  const updParagraph = (i: number, v: string) => { const p = [...paragraphs]; p[i] = v; onChange({ ...content, paragraphs: p }) }
  const addParagraph = () => onChange({ ...content, paragraphs: [...paragraphs, ''] })
  const delParagraph = (i: number) => onChange({ ...content, paragraphs: paragraphs.filter((_, idx) => idx !== i) })
  const updTag = (i: number, v: string) => { const t = [...tags]; t[i] = v; onChange({ ...content, tags: t }) }
  const addTag = (v: string) => { if (!v.trim()) return; onChange({ ...content, tags: [...tags, v.trim()] }) }
  const delTag = (i: number) => onChange({ ...content, tags: tags.filter((_, idx) => idx !== i) })

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(e.currentTarget.value)
      setNewTag('')
    }
  }

  return (
    <div className="space-y-4">
      <div><label className="block text-xs font-medium text-slate-500 mb-1">URL de imagen</label><input type="text" value={content.image_url || ''} onChange={e => onChange({ ...content, image_url: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Párrafos</label>
        {paragraphs.map((p, i) => (
          <div key={i} className="flex gap-2 mb-2"><textarea value={p} onChange={e => updParagraph(i, e.target.value)} rows={2} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" /><button onClick={() => delParagraph(i)} className="p-2 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button></div>
        ))}
        <button onClick={addParagraph} className="text-xs text-purple-600 font-medium flex items-center gap-1"><Plus className="w-3 h-3" />Agregar párrafo</button>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Tags / Características</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-medium px-2.5 py-1 rounded-full">
              <input value={t} onChange={e => updTag(i, e.target.value)} className="bg-transparent border border-transparent focus:border-purple-300 focus:ring-1 focus:ring-purple-300 rounded px-1 outline-none w-auto min-w-[2ch] cursor-text" />
              <button onClick={() => delTag(i)} className="hover:text-red-600"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={handleKeyDown} placeholder="Escribí un tag y presioná Enter" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          <button onClick={() => { if (newTag.trim()) { addTag(newTag); setNewTag('') } }} className="px-3 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700">+</button>
        </div>
      </div>
    </div>
  )
}

function CategoriesContentEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return <div><label className="block text-xs font-medium text-slate-500 mb-1">Subtítulo</label><input type="text" value={content.subtitle || ''} onChange={e => onChange({ ...content, subtitle: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
}

function StoreContentEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  const hours: { day: string; time: string }[] = content.hours || []
  const updHour = (i: number, f: 'day' | 'time', v: string) => { const h = [...hours]; h[i] = { ...h[i], [f]: v }; onChange({ ...content, hours: h }) }
  const addHour = () => onChange({ ...content, hours: [...hours, { day: '', time: '' }] })
  const delHour = (i: number) => onChange({ ...content, hours: hours.filter((_, idx) => idx !== i) })

  return (
    <div className="space-y-5">
      {/* Contacto & Dirección */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Contacto & Dirección</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-slate-500 mb-1">Dirección</label><input type="text" value={content.address || ''} onChange={e => onChange({ ...content, address: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
          <div><label className="block text-xs font-medium text-slate-500 mb-1">Teléfono</label><input type="text" value={content.phone || ''} onChange={e => onChange({ ...content, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
          <div className="col-span-2"><label className="block text-xs font-medium text-slate-500 mb-1">WhatsApp (solo números, con código de país)</label><input type="text" value={content.whatsapp || ''} onChange={e => onChange({ ...content, whatsapp: e.target.value })} placeholder="Ej: 5493804123456" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
        </div>
      </div>

      {/* Redes Sociales */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Redes Sociales</p>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-black">IG</span>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Instagram (URL completa)</label>
              <input
                type="url"
                value={content.instagram || ''}
                onChange={e => onChange({ ...content, instagram: e.target.value })}
                placeholder="https://instagram.com/tucuenta"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-black">FB</span>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Facebook (URL completa)</label>
              <input
                type="url"
                value={content.facebook || ''}
                onChange={e => onChange({ ...content, facebook: e.target.value })}
                placeholder="https://facebook.com/tupagina"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-black">TK</span>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">TikTok (URL completa)</label>
              <input
                type="url"
                value={content.tiktok || ''}
                onChange={e => onChange({ ...content, tiktok: e.target.value })}
                placeholder="https://tiktok.com/@tucuenta"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Horarios */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Horarios de Atención</p>
        {hours.map((h, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input type="text" value={h.day} onChange={e => updHour(i, 'day', e.target.value)} placeholder="Ej: Lun - Vie" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input type="text" value={h.time} onChange={e => updHour(i, 'time', e.target.value)} placeholder="Ej: 09:00 - 18:00" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <button onClick={() => delHour(i)} className="p-2 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
          </div>
        ))}
        <button onClick={addHour} className="text-xs text-purple-600 font-medium flex items-center gap-1"><Plus className="w-3 h-3" />Agregar horario</button>
      </div>
    </div>
  )
}

function GalleryContentEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-4">
      <div><label className="block text-xs font-medium text-slate-500 mb-1">Subtítulo</label><input type="text" value={content.subtitle || ''} onChange={e => onChange({ ...content, subtitle: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
      <div><label className="block text-xs font-medium text-slate-500 mb-1">Límite de productos</label><input type="number" value={content.limit || 6} onChange={e => onChange({ ...content, limit: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" min={1} max={20} /></div>
    </div>
  )
}

function ContactContentEditor({ content, onChange }: { content: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-4">
      <div><label className="block text-xs font-medium text-slate-500 mb-1">WhatsApp (código país + número, sin +)</label><input type="text" value={content.whatsapp_number || ''} onChange={e => onChange({ ...content, whatsapp_number: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={content.show_whatsapp} onChange={e => onChange({ ...content, show_whatsapp: e.target.checked })} className="rounded" /> Mostrar WhatsApp</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={content.show_catalog} onChange={e => onChange({ ...content, show_catalog: e.target.checked })} className="rounded" /> Mostrar Catálogo</label>
      </div>
    </div>
  )
}

const SECTION_EDITORS: Record<string, React.FC<{ content: any; onChange: (c: any) => void }>> = {
  hero: HeroContentEditor,
  about: AboutContentEditor,
  categories: CategoriesContentEditor,
  store: StoreContentEditor,
  gallery: GalleryContentEditor,
  contact: ContactContentEditor,
}

const SECTION_LABELS: Record<string, string> = {
  hero: 'Bienvenida / Hero',
  about: 'Sobre Nosotros',
  categories: 'Categorías',
  store: 'Tienda',
  gallery: 'Galería',
  contact: 'Contacto',
}

// ── per-section card ────────────────────────────────────────

function SectionCard({
  section,
  index,
  totalSections,
  onRefresh,
  onMoveUp,
  onMoveDown,
  onMoveToPosition,
}: {
  key?: any
  section: any
  index: number
  totalSections: number
  onRefresh: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onMoveToPosition: (pos: number) => void
}) {
  const { showConfirm } = useModal()
  const [title, setTitle] = useState(section.title || '')
  const [subtitle, setSubtitle] = useState(section.subtitle || '')
  const [content, setContent] = useState(section.content || {})
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const Editor = SECTION_EDITORS[section.section_type]

  useEffect(() => {
    setTitle(section.title || '')
    setSubtitle(section.subtitle || '')
    setContent(section.content || {})
  }, [section.id])

  const save = async () => {
    setSaving(true)
    try {
      await adminApi.updateHomepageSection(section.id, { title, subtitle, content })
      onRefresh()
    } catch (e: any) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const toggleVisibility = async () => {
    setToggling(true)
    try {
      await adminApi.updateHomepageSection(section.id, { visible: !section.visible })
      onRefresh()
    } catch (e: any) {
      console.error(e)
    } finally {
      setToggling(false)
    }
  }

  const remove = async () => {
    const confirmed = await showConfirm({
      title: '¿Eliminar sección?',
      message: 'Se eliminará esta sección de la homepage.',
      confirmText: 'Eliminar',
      type: 'danger',
    })
    if (!confirmed) return
    setDeleting(true)
    try {
      await adminApi.deleteHomepageSection(section.id)
      onRefresh()
    } catch (e: any) {
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {/* Position Selector Dropdown */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs">
            <span className="text-slate-400 font-semibold">Pos:</span>
            <select
              value={index}
              onChange={(e) => onMoveToPosition(Number(e.target.value))}
              className="font-bold text-purple-700 bg-transparent outline-none cursor-pointer"
            >
              {Array.from({ length: totalSections }).map((_, i) => (
                <option key={i} value={i}>
                  #{i + 1}
                </option>
              ))}
            </select>
          </div>

          {/* Up & Down Arrow Buttons */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg bg-white p-0.5">
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              className="p-1 hover:bg-purple-50 text-slate-600 hover:text-purple-700 rounded disabled:opacity-30 disabled:hover:bg-transparent"
              title="Subir posición"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={index === totalSections - 1}
              className="p-1 hover:bg-purple-50 text-slate-600 hover:text-purple-700 rounded disabled:opacity-30 disabled:hover:bg-transparent"
              title="Bajar posición"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-mono font-bold text-purple-600 uppercase">
            {SECTION_LABELS[section.section_type] || section.section_type}
          </span>
          <h3 className="text-sm font-bold text-slate-800 truncate">
            {title || 'Sin título'}
            {!section.visible && <span className="ml-2 text-xs text-slate-400 font-normal">(oculta)</span>}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleVisibility}
            disabled={toggling}
            className="p-1.5 hover:bg-slate-200 rounded-lg disabled:opacity-50"
            title={section.visible ? 'Ocultar' : 'Mostrar'}
          >
            {toggling ? (
              <span className="w-4 h-4 block border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : section.visible ? (
              <Eye className="w-4 h-4 text-emerald-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-slate-400" />
            )}
          </button>
          <button
            onClick={remove}
            disabled={deleting}
            className="p-1.5 hover:bg-red-100 rounded-lg text-red-500 disabled:opacity-50"
            title="Eliminar"
          >
            {deleting ? (
              <span className="w-4 h-4 block border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Subtítulo</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-400 outline-none"
            />
          </div>
        </div>

        {Editor ? (
          <Editor content={content} onChange={setContent} />
        ) : (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Contenido (JSON)</label>
            <textarea
              value={JSON.stringify(content, null, 2)}
              onChange={(e) => {
                try {
                  setContent(JSON.parse(e.target.value))
                } catch {}
              }}
              rows={6}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
            />
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── main component ─────────────────────────────────────────

export default function AdminHomepageEditor() {
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.getHomepageSections()
      setSections(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e.message || 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const reorderAndSave = async (newList: any[]) => {
    setSections(newList)
    try {
      await adminApi.reorderHomepageSections(
        newList.map((s, idx) => ({ id: s.id, order_index: idx + 1, visible: s.visible }))
      )
    } catch (e: any) {
      console.error('Error reordering:', e)
    }
  }

  const moveUp = (index: number) => {
    if (index <= 0) return
    const updated = [...sections]
    const temp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = temp
    reorderAndSave(updated)
  }

  const moveDown = (index: number) => {
    if (index >= sections.length - 1) return
    const updated = [...sections]
    const temp = updated[index + 1]
    updated[index + 1] = updated[index]
    updated[index] = temp
    reorderAndSave(updated)
  }

  const moveToPosition = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= sections.length) return
    const updated = [...sections]
    const [movedItem] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, movedItem)
    reorderAndSave(updated)
  }

  const addSection = async (type: SectionType) => {
    try {
      let defaultTitle = 'Sección'
      let defaultSubtitle = ''
      let defaultContent = {}

      if (type === 'hero') {
        defaultTitle = 'Chamical'
        defaultSubtitle = 'Candy Shop'
        defaultContent = {
          badge: 'Tienda física y online',
          description: 'Gomitas, chocolates, caramelos y mucho más — todo por granel y al mejor precio. Visitanos o pedí por WhatsApp.',
          btn_primary_text: 'Ver Catálogo',
          btn_secondary_text: 'Consultar por WhatsApp'
        }
      } else if (type === 'about') {
        defaultTitle = 'Sobre Nosotros'
        defaultSubtitle = 'El dulce sabor de Chamical'
        defaultContent = { paragraphs: ['En Chamical Candy Shop nos apasiona endulzar tu día.'], tags: ['Atención personalizada'] }
      } else if (type === 'categories') {
        defaultTitle = 'Nuestros Productos'
        defaultSubtitle = '¿Qué antojo tenés hoy?'
      } else if (type === 'store') {
        defaultTitle = 'Visitanos'
        defaultSubtitle = 'Nuestra Tienda'
      } else if (type === 'gallery') {
        defaultTitle = 'Galería'
        defaultSubtitle = 'Nuestros Dulces'
        defaultContent = { limit: 6 }
      } else if (type === 'contact') {
        defaultTitle = '¿Tenés antojo?'
        defaultSubtitle = '¿Listo para pedir?'
      }

      await adminApi.createHomepageSection({
        section_type: type,
        title: defaultTitle,
        subtitle: defaultSubtitle,
        content: defaultContent,
        order_index: sections.length + 1,
        visible: true
      })
      await load()
    } catch (e: any) {
      console.error(e)
    }
  }

  if (loading)
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl" />
        ))}
      </div>
    )

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-headline font-bold text-xl text-slate-800">Editor de Homepage</h2>
          <p className="text-xs text-slate-400">Usá los botones ⬆️ / ⬇️ o el selector para reordenar y personalizar secciones</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            onChange={(e) => {
              if (e.target.value) {
                addSection(e.target.value as SectionType)
                e.target.value = ''
              }
            }}
            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 outline-none cursor-pointer"
            defaultValue=""
          >
            <option value="" disabled>+ Agregar sección...</option>
            {Object.entries(SECTION_LABELS).map(([type, label]) => (
              <option key={type} value={type} className="bg-white text-slate-800">
                {label}
              </option>
            ))}
          </select>
          <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
            {sections.length} secciones
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={load} className="ml-auto text-xs font-medium underline hover:no-underline">
            Reintentar
          </button>
        </div>
      )}

      <div className="space-y-4">
        {sections.map((section, i) => (
          <SectionCard
            key={section.id}
            section={section}
            index={i}
            totalSections={sections.length}
            onRefresh={load}
            onMoveUp={() => moveUp(i)}
            onMoveDown={() => moveDown(i)}
            onMoveToPosition={(pos) => moveToPosition(i, pos)}
          />
        ))}
      </div>
    </div>
  )
}

