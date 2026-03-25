import EventoItem from './EventoItem'

const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
const HORAS = Array.from({ length: 15 }, (_, i) => i + 8) // 8:00 a 22:00

function timeToRow(time) {
  if (!time) return null
  const [h, m] = time.split(':').map(Number)
  return (h - 8) * 2 + Math.floor(m / 30) + 2 // +2 por el header
}

export default function Calendario({ materias = [] }) {
  const eventos = materias
    .filter((m) => m.dia_cursada && m.horario_inicio)
    .map((m) => ({
      ...m,
      colIndex: DIAS.indexOf(m.dia_cursada),
      rowStart: timeToRow(m.horario_inicio),
      rowEnd: timeToRow(m.horario_fin) || timeToRow(m.horario_inicio) + 4,
    }))
    .filter((e) => e.colIndex >= 0 && e.rowStart !== null)

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div
        className="grid"
        style={{
          gridTemplateColumns: '80px repeat(6, 1fr)',
          gridTemplateRows: `40px repeat(${HORAS.length * 2}, 24px)`,
        }}
      >
        {/* Header con dias */}
        <div className="bg-gray-50 border-b border-r border-gray-200" />
        {DIAS.map((dia) => (
          <div
            key={dia}
            className="bg-gray-50 border-b border-r border-gray-200 flex items-center justify-center text-sm font-medium text-gray-600"
          >
            {dia}
          </div>
        ))}

        {/* Filas de horas */}
        {HORAS.map((hora) => (
          <div
            key={hora}
            className="border-r border-b border-gray-100 flex items-start justify-end pr-2 pt-1 text-xs text-gray-400"
            style={{ gridColumn: 1, gridRow: `${(hora - 8) * 2 + 2} / span 2` }}
          >
            {`${hora}:00`}
          </div>
        ))}

        {/* Lineas de grilla */}
        {HORAS.map((hora) =>
          DIAS.map((_, colIdx) => (
            <div
              key={`${hora}-${colIdx}`}
              className="border-r border-b border-gray-100"
              style={{
                gridColumn: colIdx + 2,
                gridRow: `${(hora - 8) * 2 + 2} / span 2`,
              }}
            />
          ))
        )}

        {/* Eventos */}
        {eventos.map((evento) => (
          <EventoItem
            key={evento.id}
            materia={evento}
            style={{
              gridColumn: evento.colIndex + 2,
              gridRow: `${evento.rowStart} / ${evento.rowEnd}`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
