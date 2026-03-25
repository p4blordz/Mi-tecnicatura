import { useState, useRef } from 'react'
import { Upload, Link, ClipboardPaste, Plus, Layers } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ArchivoUploader({ onUpload, onAddLink }) {
  const [dragging, setDragging] = useState(false)
  const [categoria, setCategoria] = useState('material')
  const [uploading, setUploading] = useState(false)
  const [modo, setModo] = useState('link')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkNombre, setLinkNombre] = useState('')
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkLinks, setBulkLinks] = useState('')
  const fileRef = useRef()

  const handleFiles = async (files) => {
    setUploading(true)
    for (const file of files) {
      await onUpload(file, categoria)
    }
    setUploading(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handlePasteLink = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        setLinkUrl(text.trim())
        setLinkNombre(extraerNombreDeUrl(text.trim()))
        toast.success('Link pegado desde el portapapeles')
      } else if (text) {
        setLinkUrl(text.trim())
        toast.success('Texto pegado desde el portapapeles')
      } else {
        toast.error('El portapapeles esta vacio')
      }
    } catch {
      toast.error('No se pudo acceder al portapapeles. Pega manualmente con Ctrl+V')
    }
  }

  const handleAddLink = async () => {
    if (!linkUrl.trim()) return
    setUploading(true)
    const nombre = linkNombre.trim() || extraerNombreDeUrl(linkUrl)
    await onAddLink(linkUrl.trim(), nombre, categoria)
    setLinkUrl('')
    setLinkNombre('')
    setUploading(false)
  }

  const handleBulkImport = async () => {
    const lines = bulkLinks.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    if (lines.length === 0) return

    setUploading(true)
    let count = 0
    for (const line of lines) {
      const url = line.startsWith('http') ? line : null
      if (url) {
        const nombre = extraerNombreDeUrl(url)
        await onAddLink(url, nombre, categoria)
        count++
      }
    }
    setBulkLinks('')
    setUploading(false)
    if (count > 0) {
      toast.success(`${count} link${count > 1 ? 's' : ''} importado${count > 1 ? 's' : ''}`)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setModo('link')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
              modo === 'link' ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-500'
            }`}
          >
            <Link className="w-4 h-4 inline mr-1" />
            Link
          </button>
          <button
            onClick={() => setModo('archivo')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
              modo === 'archivo' ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-500'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-1" />
            Archivo
          </button>
        </div>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="material">Material</option>
          <option value="apunte">Apunte</option>
          <option value="tp">Trabajo Practico</option>
          <option value="examen">Examen</option>
        </select>
      </div>

      {modo === 'link' ? (
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          {/* Toggle individual / bulk */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBulkMode(false)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                !bulkMode ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <Plus className="w-3 h-3 inline mr-0.5" />
              Un link
            </button>
            <button
              onClick={() => setBulkMode(true)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                bulkMode ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <Layers className="w-3 h-3 inline mr-0.5" />
              Varios links
            </button>
          </div>

          {!bulkMode ? (
            <>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Pega el link de Classroom, Drive, etc."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handlePasteLink}
                  className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors cursor-pointer flex items-center gap-1"
                  title="Pegar desde portapapeles"
                >
                  <ClipboardPaste className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Nombre descriptivo (opcional)"
                value={linkNombre}
                onChange={(e) => setLinkNombre(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddLink}
                disabled={!linkUrl.trim() || uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {uploading ? 'Guardando...' : 'Guardar link'}
              </button>
            </>
          ) : (
            <>
              <textarea
                value={bulkLinks}
                onChange={(e) => setBulkLinks(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder={"Pega varios links, uno por linea:\nhttps://classroom.google.com/...\nhttps://drive.google.com/...\nhttps://docs.google.com/..."}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {bulkLinks.split('\n').filter(l => l.trim().startsWith('http')).length} links detectados
                </span>
                <button
                  onClick={handleBulkImport}
                  disabled={!bulkLinks.trim() || uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Importando...
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4" />
                      Importar todos
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-500">Subiendo...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-sm text-gray-500">
                Arrastra archivos aqui o <span className="text-blue-600">hace click para seleccionar</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function extraerNombreDeUrl(url) {
  if (url.includes('classroom.google.com')) return 'Material de Classroom'
  if (url.includes('drive.google.com')) return 'Archivo de Drive'
  if (url.includes('docs.google.com')) return 'Documento de Google'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'Video de YouTube'
  return 'Enlace externo'
}
