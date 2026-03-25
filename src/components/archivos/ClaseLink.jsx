import { Video, ExternalLink, Trash2, CheckCircle, Circle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ClaseLink({ clase, onToggleVisto, onDelete }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
      <button
        onClick={() => onToggleVisto(clase.id, clase.visto)}
        className="flex-shrink-0 cursor-pointer"
        title={clase.visto ? 'Marcar como no vista' : 'Marcar como vista'}
      >
        {clase.visto ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5 text-gray-300" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${clase.visto ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
          Clase {clase.numero_clase || '?'}
          {clase.titulo && ` - ${clase.titulo}`}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
          {clase.fecha && (
            <span>{format(new Date(clase.fecha), 'dd MMM yyyy', { locale: es })}</span>
          )}
          {clase.descripcion && <span className="truncate">{clase.descripcion}</span>}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {clase.link_video && (
          <a
            href={clase.link_video}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="Ver video"
          >
            <Video className="w-4 h-4" />
          </a>
        )}
        <button
          onClick={() => onDelete(clase.id)}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
