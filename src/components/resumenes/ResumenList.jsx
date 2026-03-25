import ResumenView from './ResumenView'

export default function ResumenList({ resumenes, onDelete }) {
  if (resumenes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg">No hay resumenes todavia</p>
        <p className="text-sm mt-1">Genera tu primer resumen con IA</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {resumenes.map((resumen) => (
        <ResumenView key={resumen.id} resumen={resumen} onDelete={onDelete} />
      ))}
    </div>
  )
}
