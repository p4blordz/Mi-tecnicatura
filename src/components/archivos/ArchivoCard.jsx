import { useState } from 'react'
import { FileText, Download, Trash2, Image, FileSpreadsheet, Presentation, ExternalLink, Link, Pencil, Check, X } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const iconMap = {
  pdf: FileText,
  doc: FileText,
  ppt: Presentation,
  xls: FileSpreadsheet,
  imagen: Image,
  link: Link,
  otro: FileText,
}

const categoriaLabel = {
  material: 'Material',
  apunte: 'Apunte',
  tp: 'TP',
  examen: 'Examen',
}

export default function ArchivoCard({ archivo, onDownload, onDelete, onEdit }) {
  const esLink = archivo.tipo === 'link'
  const Icon = iconMap[archivo.tipo] || FileText
  const [editing, setEditing] = useState(false)
  const [editUrl, setEditUrl] = useState(archivo.url_publica || '')
  const [editNombre, setEditNombre] = useState(archivo.nombre_original || '')

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleSave = async () => {
    if (!editUrl.trim()) return
    await onEdit(archivo.id, { url_publica: editUrl.trim(), nombre_original: editNombre.trim() || editUrl.trim() })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="p-3 bg-white border border-blue-300 rounded-lg space-y-2">
        <input
          type="text"
          value={editNombre}
          onChange={(e) => setEditNombre(e.target.value)}
          placeholder="Nombre"
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="url"
          value={editUrl}
          onChange={(e) => setEditUrl(e.target.value)}
          placeholder="URL"
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" /> Guardar
          </button>
          <button
            onClick={() => { setEditing(false); setEditUrl(archivo.url_publica || ''); setEditNombre(archivo.nombre_original || '') }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
        esLink ? 'bg-green-50' : 'bg-blue-50'
      }`}>
        <Icon className={`w-5 h-5 ${esLink ? 'text-green-600' : 'text-blue-600'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{archivo.nombre_original}</p>
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
          <span className="bg-gray-100 px-1.5 py-0.5 rounded">
            {categoriaLabel[archivo.categoria] || archivo.categoria}
          </span>
          {esLink && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Link</span>}
          {archivo.tamano_bytes && <span>{formatSize(archivo.tamano_bytes)}</span>}
          <span>{format(new Date(archivo.created_at), 'dd MMM yyyy', { locale: es })}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {esLink && (
          <button
            onClick={() => setEditing(true)}
            className="p-2 text-gray-400 hover:text-amber-500 transition-colors cursor-pointer"
            title="Editar link"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => esLink ? window.open(archivo.url_publica, '_blank') : onDownload(archivo)}
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
          title={esLink ? 'Abrir link' : 'Descargar'}
        >
          {esLink ? <ExternalLink className="w-4 h-4" /> : <Download className="w-4 h-4" />}
        </button>
        <button
          onClick={() => onDelete(archivo)}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
