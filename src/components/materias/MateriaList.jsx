import MateriaCard from './MateriaCard'

export default function MateriaList({ materias }) {
  if (materias.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg">No hay materias cargadas</p>
        <p className="text-sm mt-1">Agrega tu primera materia para empezar</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {materias.map((materia) => (
        <MateriaCard key={materia.id} materia={materia} />
      ))}
    </div>
  )
}
