import { useState, useRef } from 'react'
import { Brain, Sparkles, ExternalLink, FileText, Link as LinkIcon, ClipboardPaste, ArrowRight, Video, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { obtenerTranscripcion } from '../../lib/aiService'

export default function ResumenGenerator({ materias = [], archivos = [], clases = [], onGenerar, generating }) {
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState('resumen')
  const [materiaId, setMateriaId] = useState(materias.length === 1 ? materias[0].id : '')
  const [titulo, setTitulo] = useState('')
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null)
  const [extrayendo, setExtrayendo] = useState(false)
  const textareaRef = useRef()

  const handleSelectArchivo = (archivo) => {
    setArchivoSeleccionado(archivo)
    setTitulo(archivo.nombre_original)
    if (archivo.tipo === 'link') {
      window.open(archivo.url_publica, '_blank')
    }
    setTimeout(() => textareaRef.current?.focus(), 300)
  }

  const handleSelectClase = async (clase) => {
    setArchivoSeleccionado({ id: `clase-${clase.id}`, tipo: 'video', nombre_original: clase.titulo || `Clase ${clase.numero_clase}` })
    setTitulo(clase.titulo ? `Clase ${clase.numero_clase} - ${clase.titulo}` : `Clase ${clase.numero_clase}`)

    setExtrayendo(true)
    try {
      const transcripcion = await obtenerTranscripcion(clase.link_video)
      setTexto(transcripcion)
      toast.success('Transcripcion extraida del video')
    } catch (err) {
      toast.error(err.message)
      // Open video so user can try manually
      window.open(clase.link_video, '_blank')
    }
    setExtrayendo(false)
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
  const clasesConVideo = clases.filter(c => c.link_video)
  const hayFuentes = linkArchivos.length > 0 || clasesConVideo.length > 0

  return (
    <div className="space-y-4">
      {/* Selector de fuentes */}
      {hayFuentes && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Selecciona una fuente para resumir</h3>
          </div>

          {/* Steps guide */}
          <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
            <span className={`flex items-center gap-1 ${!archivoSeleccionado ? 'text-blue-600 font-medium' : 'text-green-600'}`}>
              <span className="w-5 h-5 rounded-full bg-current text-white flex items-center justify-center text-[10px]">
                {archivoSeleccionado ? '✓' : '1'}
              </span>
              <span className={!archivoSeleccionado ? 'text-blue-600' : 'text-green-600'}>Elegir fuente</span>
            </span>
            <ArrowRight className="w-3 h-3" />
            <span className={`flex items-center gap-1 ${archivoSeleccionado && !texto ? 'text-blue-600 font-medium' : texto ? 'text-green-600' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                texto ? 'bg-green-600 text-white' : archivoSeleccionado ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {texto ? '✓' : '2'}
              </span>
              <span className={archivoSeleccionado && !texto ? 'text-blue-600' : texto ? 'text-green-600' : ''}>Obtener contenido</span>
            </span>
            <ArrowRight className="w-3 h-3" />
            <span className={`flex items-center gap-1 ${texto ? 'text-blue-600 font-medium' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                texto ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>3</span>
              <span className={texto ? 'text-blue-600' : ''}>Generar resumen</span>
            </span>
          </div>

          {/* Videos de clases */}
          {clasesConVideo.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Videos de clases</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {clasesConVideo.map((clase) => (
                  <button
                    key={clase.id}
                    onClick={() => handleSelectClase(clase)}
                    disabled={extrayendo}
                    className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors cursor-pointer ${
                      archivoSeleccionado?.id === `clase-${clase.id}`
                        ? 'bg-purple-50 border-2 border-purple-400'
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    } ${extrayendo ? 'opacity-60' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-100">
                      <Video className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        Clase {clase.numero_clase}{clase.titulo && ` - ${clase.titulo}`}
                      </p>
                      <p className="text-xs text-gray-400">Extrae transcripcion automaticamente</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Links / archivos */}
          {linkArchivos.length > 0 && (
            <div>
              {clasesConVideo.length > 0 && (
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Archivos y links</p>
              )}
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
            </div>
          )}

          {/* Status messages */}
          {extrayendo && (
            <div className="mt-3 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Extrayendo transcripcion del video... esto puede tardar unos segundos.
            </div>
          )}
          {archivoSeleccionado?.tipo === 'link' && !texto && !extrayendo && (
            <div className="mt-3 text-sm text-purple-700 bg-purple-50 p-3 rounded-lg flex items-start gap-2">
              <span className="text-lg leading-none">👆</span>
              <span>
                Se abrio el link en otra pestaña. <strong>Selecciona todo el contenido</strong> (Ctrl+A), <strong>copialo</strong> (Ctrl+C) y despues usa el boton <strong>"Pegar contenido"</strong> abajo.
              </span>
            </div>
          )}
          {archivoSeleccionado?.tipo === 'video' && !texto && !extrayendo && (
            <div className="mt-3 text-sm text-orange-700 bg-orange-50 p-3 rounded-lg flex items-start gap-2">
              <span className="text-lg leading-none">⚠️</span>
              <span>
                No se pudo extraer la transcripcion automaticamente. Se abrio el video para que copies el contenido manualmente.
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
          disabled={generating || extrayendo || !texto.trim() || !materiaId}
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
