import { useState } from 'react'
import ArchivoCard from './ArchivoCard'

const CATEGORIAS = [
  { value: '', label: 'Todos' },
  { value: 'material', label: 'Material' },
  { value: 'apunte', label: 'Apuntes' },
  { value: 'tp', label: 'TPs' },
  { value: 'examen', label: 'Examenes' },
]

export default function ArchivoList({ archivos, onDownload, onDelete, onEdit }) {
  const [filtro, setFiltro] = useState('')

  const filtered = filtro
    ? archivos.filter((a) => a.categoria === filtro)
    : archivos

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFiltro(cat.value)}
            className={`px-3 py-1 text-sm rounded-full transition-colors cursor-pointer ${
              filtro === cat.value
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-8 text-gray-400 text-sm">No hay archivos</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((archivo) => (
            <ArchivoCard
              key={archivo.id}
              archivo={archivo}
              onDownload={onDownload}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}
