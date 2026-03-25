import { useState } from 'react'
import { useMaterias } from '../hooks/useMaterias'
import MateriaList from '../components/materias/MateriaList'
import MateriaForm from '../components/materias/MateriaForm'
import { Plus } from 'lucide-react'

export default function DashboardPage() {
  const { materias, loading, createMateria } = useMaterias()
  const [showForm, setShowForm] = useState(false)

  const materiasActivas = materias.filter((m) => m.activa !== false)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Materias</h1>
          <p className="text-gray-500 text-sm mt-1">
            {materiasActivas.length} materia{materiasActivas.length !== 1 ? 's' : ''} activa{materiasActivas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nueva materia
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <MateriaList materias={materiasActivas} />
      )}

      {showForm && (
        <MateriaForm
          onSubmit={createMateria}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
