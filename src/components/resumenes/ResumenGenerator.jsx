import { useState } from 'react'
import { Brain, Sparkles, ExternalLink, FileText, Link as LinkIcon } from 'lucide-react'

export default function ResumenGenerator({ materias = [], archivos = [], onGenerar, generating }) {
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState('resumen')
  const [materiaId, setMateriaId] = useState(materias.length === 1 ? materias[0].id : '')
  const [titulo, setTitulo] = useState('')
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null)

  const handleSelectArchivo = (archivo) => {
    setArchivoSeleccionado(archivo)
    setTitulo(archivo.nombre_original)
    if (archivo.tipo === 'link') {
      window.open(archivo.url_publica, '_blank')
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

  return (
    <div className="space-y-4">
      {/* Selector de archivos */}
      {archivos.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Selecciona un archivo para resumir</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {archivos.map((archivo) => (
              <button
                key={archivo.id}
                onClick={() => handleSelectArchivo(archivo)}
                className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors cursor-pointer ${
                  archivoSeleccionado?.id === archivo.id
                    ? 'bg-purple-50 border-2 border-purple-400'
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  archivo.tipo === 'link' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {archivo.tipo === 'link' ? (
                    <LinkIcon className="w-4 h-4 text-green-600" />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{archivo.nombre_original}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {archivo.tipo === 'link' ? 'Click para abrir y copiar contenido' : archivo.categoria}
                  </p>
                </div>
                {archivo.tipo === 'link' && (
                  <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
          {archivoSeleccionado?.tipo === 'link' && (
            <p className="mt-3 text-sm text-purple-600 bg-purple-50 p-3 rounded-lg">
              Se abrio el link en otra pestaña. Copia el contenido y pegalo abajo para generar el resumen.
            </p>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Contenido a resumir *</label>
          <textarea
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
