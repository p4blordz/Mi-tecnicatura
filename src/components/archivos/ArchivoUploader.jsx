import { useState, useRef } from 'react'
import { Upload, Link } from 'lucide-react'

export default function ArchivoUploader({ onUpload, onAddLink }) {
  const [dragging, setDragging] = useState(false)
  const [categoria, setCategoria] = useState('material')
  const [uploading, setUploading] = useState(false)
  const [modo, setModo] = useState('link')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkNombre, setLinkNombre] = useState('')
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

  const handleAddLink = async () => {
    if (!linkUrl.trim()) return
    setUploading(true)
    const nombre = linkNombre.trim() || extraerNombreDeUrl(linkUrl)
    await onAddLink(linkUrl.trim(), nombre, categoria)
    setLinkUrl('')
    setLinkNombre('')
    setUploading(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
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
          <input
            type="url"
            placeholder="Pega el link de Classroom, Drive, etc."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
