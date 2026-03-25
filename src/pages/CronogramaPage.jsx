import { useMaterias } from '../hooks/useMaterias'
import Calendario from '../components/cronograma/Calendario'

export default function CronogramaPage() {
  const { materias, loading } = useMaterias()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Cronograma de Cursada</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <Calendario materias={materias.filter((m) => m.activa !== false)} />
      )}
    </div>
  )
}
