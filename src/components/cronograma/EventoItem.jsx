import { Link } from 'react-router-dom'

export default function EventoItem({ materia, style }) {
  return (
    <Link
      to={`/materia/${materia.id}`}
      className="rounded-md m-0.5 p-2 text-white text-xs font-medium flex flex-col justify-center overflow-hidden hover:opacity-90 transition-opacity z-10"
      style={{
        ...style,
        backgroundColor: materia.color || '#3B82F6',
      }}
    >
      <span className="truncate font-semibold">{materia.nombre}</span>
      {materia.horario_inicio && (
        <span className="opacity-80 text-[10px]">
          {materia.horario_inicio.slice(0, 5)} - {materia.horario_fin?.slice(0, 5)}
        </span>
      )}
    </Link>
  )
}
