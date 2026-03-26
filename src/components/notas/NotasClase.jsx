import { useState, useRef, useEffect } from 'react'
import { useNotas } from '../../hooks/useNotas'
import { Send, Save, Trash2, StickyNote, FileText, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function NotasClase({ claseId, claseLabel, onClose }) {
  const { notas, material, loading, addNotaRapida, guardarMaterial, deleteNota } = useNotas(claseId)
  const [notaTexto, setNotaTexto] = useState('')
  const [materialTexto, setMaterialTexto] = useState('')
  const [materialInit, setMaterialInit] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [tab, setTab] = useState('rapidas')
  const inputRef = useRef()
  const notasEndRef = useRef()

  useEffect(() => {
    if (material && !materialInit) {
      setMaterialTexto(material.contenido)
      setMaterialInit(true)
    }
  }, [material, materialInit])

  useEffect(() => {
    notasEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [notas])

  const handleAddNota = async (e) => {
    e.preventDefault()
    if (!notaTexto.trim()) return
    await addNotaRapida(notaTexto.trim())
    setNotaTexto('')
    inputRef.current?.focus()
  }

  const handleGuardarMaterial = async () => {
    if (!materialTexto.trim()) return
    setGuardando(true)
    await guardarMaterial(materialTexto.trim())
    toast.success('Apuntes guardados')
    setGuardando(false)
  }

  if (loading) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 flex items-center justify-center gap-2 text-amber-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando notas...
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-amber-100 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-amber-700" />
          <span className="text-sm font-semibold text-amber-800">Apuntes - {claseLabel}</span>
        </div>
        <button onClick={onClose} className="p-1 text-amber-600 hover:text-amber-800 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-amber-200">
        <button
          onClick={() => setTab('rapidas')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
            tab === 'rapidas'
              ? 'bg-amber-100 text-amber-800 border-b-2 border-amber-500'
              : 'text-amber-600 hover:bg-amber-100/50'
          }`}
        >
          <StickyNote className="w-3.5 h-3.5" />
          Notas rapidas
          {notas.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-amber-200 text-amber-700 rounded-full text-[10px]">
              {notas.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('material')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
            tab === 'material'
              ? 'bg-amber-100 text-amber-800 border-b-2 border-amber-500'
              : 'text-amber-600 hover:bg-amber-100/50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Apuntes del material
          {material && <span className="ml-1 w-2 h-2 bg-green-500 rounded-full inline-block" />}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {tab === 'rapidas' && (
          <div className="space-y-3">
            {/* Notes list */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {notas.length === 0 && (
                <p className="text-xs text-amber-500 text-center py-3">
                  Todavia no hay notas. Escribi algo rapido mientras ves la clase.
                </p>
              )}
              {notas.map((nota) => (
                <div key={nota.id} className="flex items-start gap-2 group">
                  <div className="flex-1 bg-white rounded-lg px-3 py-2 text-sm text-gray-700 border border-amber-100">
                    <p>{nota.contenido}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {format(new Date(nota.created_at), 'HH:mm - dd MMM', { locale: es })}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteNota(nota.id)}
                    className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer mt-1"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div ref={notasEndRef} />
            </div>

            {/* Quick note input */}
            <form onSubmit={handleAddNota} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={notaTexto}
                onChange={(e) => setNotaTexto(e.target.value)}
                placeholder="Anota algo rapido..."
                className="flex-1 px-3 py-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
              <button
                type="submit"
                disabled={!notaTexto.trim()}
                className="px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {tab === 'material' && (
          <div className="space-y-3">
            <textarea
              value={materialTexto}
              onChange={(e) => setMaterialTexto(e.target.value)}
              rows={8}
              placeholder="Escribi tus apuntes sobre el material de la clase..."
              className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-amber-500">
                {material ? `Guardado: ${format(new Date(material.created_at), 'dd MMM HH:mm', { locale: es })}` : 'Sin guardar'}
              </p>
              <button
                onClick={handleGuardarMaterial}
                disabled={guardando || !materialTexto.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-40 transition-colors cursor-pointer"
              >
                {guardando ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Guardar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
