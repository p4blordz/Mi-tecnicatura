import { useState, useRef } from 'react'
import { Brain, Sparkles, ExternalLink, FileText, Link as LinkIcon, ClipboardPaste, ArrowRight, Video, Loader2, Presentation, FileSpreadsheet, Image } from 'lucide-react'
import toast from 'react-hot-toast'
import { obtenerTranscripcion, obtenerTranscripcionDrive, extraerTextoArchivo } from '../../lib/aiService'

const docIconMap = {
  pdf: FileText,
  doc: FileText,
  ppt: Presentation,
  xls: FileSpreadsheet,
  imagen: Image,
  otro: FileText,
}

export default function ResumenGenerator({ materias = [], archivos = [], clases = [], onGenerar, generating, onGetDownloadUrl }) {
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState('resumen')
  const [materiaId, setMateriaId] = useState(materias.length === 1 ? materias[0].id : '')
  const [titulo, setTitulo] = useState('')
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null)
  const [extrayendo, setExtrayendo] = useState(false)
  const [extractionFailed, setExtractionFailed] = useState(false)
  const textareaRef = useRef()

  const esGoogleDoc = (url) => {
    return url && (
      url.includes('docs.google.com/presentation') ||
      url.includes('docs.google.com/document') ||
      url.includes('docs.google.com/spreadsheets')
    )
  }

  const handleSelectArchivo = async (archivo) => {
    setArchivoSeleccionado(archivo)
    setTitulo(archivo.nombre_original)

    setExtractionFailed(false)

    if (archivo.tipo === 'link' && esGoogleDoc(archivo.url_publica)) {
      // Auto-extract text from Google Slides/Docs/Sheets
      setExtrayendo(true)
      try {
        const text = await extraerTextoArchivo(archivo.url_publica, 'google')
        setTexto(text)
        toast.success(`Texto extraido de "${archivo.nombre_original}"`)
      } catch (err) {
        // Extraction failed - open link and show manual paste instructions
        setExtractionFailed(true)
        window.open(archivo.url_publica, '_blank')
        toast('No se pudo extraer automaticamente. Copia el texto manualmente.', { icon: '📋' })
        setTimeout(() => textareaRef.current?.focus(), 300)
      }
      setExtrayendo(false)
    } else if (archivo.tipo === 'link') {
      window.open(archivo.url_publica, '_blank')
      setTimeout(() => textareaRef.current?.focus(), 300)
    }
  }

  const handleSelectDocArchivo = async (archivo) => {
    setArchivoSeleccionado(archivo)
    setTitulo(archivo.nombre_original)
    if (!onGetDownloadUrl) return

    setExtrayendo(true)
    try {
      const url = await onGetDownloadUrl(archivo.nombre_storage)
      if (!url) throw new Error('No se pudo obtener la URL del archivo')
      const text = await extraerTextoArchivo(url, archivo.tipo)
      setTexto(text)
      toast.success(`Texto extraido de "${archivo.nombre_original}"`)
    } catch (err) {
      toast.error(err.message)
    }
    setExtrayendo(false)
  }

  const handleSelectClase = async (clase) => {
    setArchivoSeleccionado({ id: `clase-${clase.id}`, tipo: 'video', nombre_original: clase.titulo || `Clase ${clase.numero_clase}` })
    setTitulo(clase.titulo ? `Clase ${clase.numero_clase} - ${clase.titulo}` : `Clase ${clase.numero_clase}`)

    const esDrive = clase.link_video.includes('drive.google.com')
    const esYoutube = clase.link_video.includes('youtube.com') || clase.link_video.includes('youtu.be')

    if (esYoutube) {
      setExtrayendo(true)
      try {
        const transcripcion = await obtenerTranscripcion(clase.link_video)
        setTexto(transcripcion)
        toast.success('Transcripcion extraida del video')
      } catch (err) {
        toast.error(err.message)
        window.open(clase.link_video, '_blank')
      }
      setExtrayendo(false)
    } else if (esDrive) {
      setExtrayendo(true)
      try {
        const transcripcion = await obtenerTranscripcionDrive(clase.link_video)
        setTexto(transcripcion)
        toast.success('Transcripcion extraida del video')
      } catch (err) {
        toast.error(err.message)
        window.open(clase.link_video, '_blank')
      }
      setExtrayendo(false)
    } else {
      window.open(clase.link_video, '_blank')
    }
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
  const docArchivos = archivos.filter(a => ['pdf', 'doc', 'ppt', 'xls'].includes(a.tipo))
  const clasesConVideo = clases.filter(c => c.link_video)
  const hayFuentes = linkArchivos.length > 0 || clasesConVideo.length > 0 || docArchivos.length > 0

  return (
    <div className="space-y-4">
      {/* Selector de fuentes */}
      {hayFuentes && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-800">Selecciona una fuente para resumir</h3>
          </div>

          {/* Steps guide */}
          <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
            <span className={`flex items-center gap-1 ${!archivoSeleccionado ? 'text-indigo-600 font-medium' : 'text-green-600'}`}>
              <span className="w-5 h-5 rounded-full bg-current text-white flex items-center justify-center text-[10px]">
                {archivoSeleccionado ? '✓' : '1'}
              </span>
              <span className={!archivoSeleccionado ? 'text-indigo-600' : 'text-green-600'}>Elegir fuente</span>
            </span>
            <ArrowRight className="w-3 h-3" />
            <span className={`flex items-center gap-1 ${archivoSeleccionado && !texto ? 'text-indigo-600 font-medium' : texto ? 'text-green-600' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                texto ? 'bg-green-600 text-white' : archivoSeleccionado ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {texto ? '✓' : '2'}
              </span>
              <span className={archivoSeleccionado && !texto ? 'text-indigo-600' : texto ? 'text-green-600' : ''}>Obtener contenido</span>
            </span>
            <ArrowRight className="w-3 h-3" />
            <span className={`flex items-center gap-1 ${texto ? 'text-indigo-600 font-medium' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                texto ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>3</span>
              <span className={texto ? 'text-indigo-600' : ''}>Generar resumen</span>
            </span>
          </div>

          {/* Videos de clases */}
          {clasesConVideo.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Videos de clases</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {clasesConVideo.map((clase) => (
                  <button
                    key={clase.id}
                    onClick={() => handleSelectClase(clase)}
                    disabled={extrayendo}
                    className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors cursor-pointer ${
                      archivoSeleccionado?.id === `clase-${clase.id}`
                        ? 'bg-purple-50 border-2 border-purple-400'
                        : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                    } ${extrayendo ? 'opacity-60' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-100">
                      <Video className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        Clase {clase.numero_clase}{clase.titulo && ` - ${clase.titulo}`}
                      </p>
                      <p className="text-xs text-slate-400">Click para abrir y copiar transcripcion</p>
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
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Archivos y links</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {linkArchivos.map((archivo) => {
                  const isGoogle = esGoogleDoc(archivo.url_publica)
                  return (
                    <button
                      key={archivo.id}
                      onClick={() => handleSelectArchivo(archivo)}
                      disabled={extrayendo}
                      className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors cursor-pointer ${
                        archivoSeleccionado?.id === archivo.id
                          ? 'bg-purple-50 border-2 border-purple-400'
                          : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                      } ${extrayendo ? 'opacity-60' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isGoogle ? 'bg-indigo-100' : 'bg-green-100'}`}>
                        {isGoogle
                          ? <Presentation className="w-4 h-4 text-indigo-600" />
                          : <LinkIcon className="w-4 h-4 text-green-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{archivo.nombre_original}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {isGoogle ? 'Click para extraer texto automaticamente' : archivo.categoria}
                        </p>
                      </div>
                      {!isGoogle && <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Archivos subidos (PDF, PPT, DOC) */}
          {docArchivos.length > 0 && (
            <div className={clasesConVideo.length > 0 || linkArchivos.length > 0 ? 'mt-3' : ''}>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Archivos subidos</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {docArchivos.map((archivo) => {
                  const DocIcon = docIconMap[archivo.tipo] || FileText
                  return (
                    <button
                      key={archivo.id}
                      onClick={() => handleSelectDocArchivo(archivo)}
                      disabled={extrayendo}
                      className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors cursor-pointer ${
                        archivoSeleccionado?.id === archivo.id
                          ? 'bg-purple-50 border-2 border-purple-400'
                          : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                      } ${extrayendo ? 'opacity-60' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-100">
                        <DocIcon className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{archivo.nombre_original}</p>
                        <p className="text-xs text-slate-400">Click para extraer texto automaticamente</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Status messages */}
          {extrayendo && (
            <div className="mt-3 text-sm text-indigo-700 bg-indigo-50 p-3 rounded-lg flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {archivoSeleccionado?.tipo === 'video'
                ? 'Descargando y transcribiendo el video con IA... esto puede tardar hasta 1 minuto.'
                : 'Extrayendo texto del archivo...'}
            </div>
          )}
          {archivoSeleccionado?.tipo === 'link' && (!esGoogleDoc(archivoSeleccionado?.url_publica) || extractionFailed) && !texto && !extrayendo && (
            <div className="mt-3 text-sm text-purple-700 bg-purple-50 p-3 rounded-lg flex items-start gap-2">
              <span className="text-lg leading-none">👆</span>
              <span>
                Se abrio el link en otra pestaña. <strong>Selecciona todo el contenido</strong> (Ctrl+A), <strong>copialo</strong> (Ctrl+C) y despues usa el boton <strong>"Pegar contenido"</strong> abajo.
              </span>
            </div>
          )}
          {archivoSeleccionado?.tipo === 'video' && !texto && !extrayendo && (
            <div className="mt-3 text-sm text-indigo-700 bg-indigo-50 p-4 rounded-lg">
              <p className="font-medium mb-2">Se abrio el video en otra pestaña. Segui estos pasos:</p>
              <ol className="list-decimal list-inside space-y-1 text-indigo-600">
                <li>Abrí la <strong>transcripcion</strong> del video (icono de 3 lineas o "Transcripcion")</li>
                <li>Seleccioná todo el texto (<strong>Ctrl+A</strong>) y copialo (<strong>Ctrl+C</strong>)</li>
                <li>Volvé acá y usá el botón <strong>"Pegar contenido"</strong> abajo</li>
              </ol>
              <p className="text-xs text-indigo-400 mt-2">Las marcas de tiempo se ignoran automaticamente.</p>
            </div>
          )}
        </div>
      )}

      {/* Formulario de resumen */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-slate-800">Generar resumen con IA</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Materia *</label>
            <select
              value={materiaId}
              onChange={(e) => setMateriaId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Seleccionar materia...</option>
              {materias.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de resumen</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="resumen">Resumen general</option>
              <option value="conceptos">Conceptos clave</option>
              <option value="preguntas">Preguntas de repaso</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Titulo (opcional)</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Ej: Resumen Clase 3 - Incoterms"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">Contenido a resumir *</label>
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
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            placeholder={archivoSeleccionado
              ? `Pega aqui el contenido de "${archivoSeleccionado.nombre_original}"...`
              : 'Pega aqui el contenido de la clase, apunte o texto que quieras resumir...'
            }
          />
          {texto && (
            <p className="text-xs text-slate-400 mt-1">{texto.length} caracteres</p>
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
