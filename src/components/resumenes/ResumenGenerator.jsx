import { useState, useRef } from 'react'
import { Brain, Sparkles, ExternalLink, FileText, Link as LinkIcon, ClipboardPaste, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResumenGenerator({ materias = [], archivos = [], onGenerar, generating }) {
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState('resumen')
  const [materiaId, setMateriaId] = useState(materias.length === 1 ? materias[0].id : '')
  const [titulo, setTitulo] = useState('')
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null)
  const textareaRef = useRef()

  const handleSelectArchivo = (archivo) => {
    setArchivoSeleccionado(archivo)
    setTitulo(archivo.nombre_original)
    if (archivo.tipo === 'link') {
      window.open(archivo.url_publica, '_blank')
    }
    // Focus textarea after selecting
    setTimeout(() => textareaRef.current?.focus(), 300)
  }

  const handlePasteContent = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setTexto(text)
        toast.success('Contenido pegado desde el portapapeles')
      } else {
        toast.error('El portapapeles esta vacio')
      }
    } catch {
      toast.error('No se pudo acceder al portapapeles. Pega manualmente con Ctrl+V')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!texto.trim() || !materiaId) return
    await onGenerar(texto, tipo, materiaId, null, titulo)
    setTexto('')
    setTitulo('')
    setArchivoSeleccionado(null)
  }

  const linkArchivos = archivos.filter(a => a.tipo === 'link')

  return (
    <div className="space-y-4">
      {/* Selector de archivos con pasos */}
      {linkArchivos.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Importar desde tus archivos</h3>
          </div>

          {/* Steps guide */}
          <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
            <span className={`flex items-center gap-1 ${!archivoSeleccionado ? 'text-blue-600 font-medium' : 'text-green-600'}`}>
              <span className="w-5 h-5 rounded-full bg-current text-white flex items-center justify-center text-[10px]">
                {archivoSeleccionado ? '✓' : '1'}
              </span>
              <span className={!archivoSeleccionado ? 'text-blue-600' : 'text-green-600'}>Elegir archivo</span>
            </span>
            <ArrowRight className="w-3 h-3" />
            <span className={`flex items-center gap-1 ${archivoSeleccionado && !texto ? 'text-blue-600 font-medium' : texto ? 'text-green-600' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                texto ? 'bg-green-600 text-white' : archivoSeleccionado ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {texto ? '✓' : '2'}
              </span>
              <span className={archivoSeleccionado && !texto ? 'text-blue-600' : texto ? 'text-green-600' : ''}>Copiar contenido</span>
            </span>
            <ArrowRight className="w-3 h-3" />
            <span className={`flex items-center gap-1 ${texto ? 'text-blue-600 font-medium' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                texto ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>3</span>
              <span className={texto ? 'text-blue-600' : ''}>Generar resumen</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {linkArchivos.map((archivo) => (
              <button
                key={archivo.id}
                onClick={() => handleSelectArchivo(archivo)}
                className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors cursor-pointer ${
                  archivoSeleccionado?.id === archivo.id
                    ? 'bg-purple-50 border-2 border-purple-400'
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-100">
                  <LinkIcon className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{archivo.nombre_original}</p>
                  <p className="text-xs text-gray-400 truncate">{archivo.categoria}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
          {archivoSeleccionado?.tipo === 'link' && !texto && (
            <div className="mt-3 text-sm text-purple-700 bg-purple-50 p-3 rounded-lg flex items-start gap-2">
              <span className="text-lg leading-none">👆</span>
              <span>
                Se abrio el link en otra pestaña. <strong>Selecciona todo el contenido</strong> (Ctrl+A), <strong>copialo</strong> (Ctrl+C) y despues usa el boton <strong>"Pegar contenido"</strong> abajo.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Formulario de resumen */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-800">Generar resumen con IA</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Materia *</label>
            <select
              value={materiaId}
              onChange={(e) => setMateriaId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Seleccionar materia...</option>
              {materias.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de resumen</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="resumen">Resumen general</option>
              <option value="conceptos">Conceptos clave</option>
              <option value="preguntas">Preguntas de repaso</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titulo (opcional)</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Ej: Resumen Clase 3 - Incoterms"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Contenido a resumir *</label>
            <button
              type="button"
              onClick={handlePasteContent}
              className="flex items-center gap-1.5 px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors cursor-pointer font-medium"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              Pegar contenido
            </button>
          </div>
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            required
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            placeholder={archivoSeleccionado
              ? `Pega aqui el contenido de "${archivoSeleccionado.nombre_original}"...`
              : 'Pega aqui el contenido de la clase, apunte o texto que quieras resumir...'
            }
          />
          {texto && (
            <p className="text-xs text-gray-400 mt-1">{texto.length} caracteres</p>
          )}
        </div>

        <button
          type="submit"
          disabled={generating || !texto.trim() || !materiaId}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Generando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generar resumen
            </>
          )}
        </button>
      </form>
    </div>
  )
}
