import { Link } from 'react-router-dom'
import { BookOpen, Clock, User } from 'lucide-react'

export default function MateriaCard({ materia }) {
  return (
    <Link
      to={`/materia/${materia.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
          style={{ backgroundColor: materia.color || '#3B82F6' }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 truncate">{materia.nombre}</h3>
          {materia.profesor && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <User className="w-3.5 h-3.5" />
              {materia.profesor}
            </p>
          )}
          {materia.dia_cursada && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Clock className="w-3.5 h-3.5" />
              {materia.dia_cursada}
              {materia.horario_inicio && ` ${materia.horario_inicio.slice(0, 5)}`}
              {materia.horario_fin && ` - ${materia.horario_fin.slice(0, 5)}`}
            </p>
          )}
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
            <BookOpen className="w-3.5 h-3.5" />
            Año {materia.anio} - Cuatrimestre {materia.cuatrimestre}
          </div>
        </div>
      </div>
    </Link>
  )
}
