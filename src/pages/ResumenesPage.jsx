import { useMaterias } from '../hooks/useMaterias'
import { useResumenes } from '../hooks/useResumenes'
import ResumenGenerator from '../components/resumenes/ResumenGenerator'
import ResumenList from '../components/resumenes/ResumenList'

export default function ResumenesPage() {
  const { materias } = useMaterias()
  const { resumenes, loading, generating, generarYGuardar, deleteResumen } = useResumenes()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Resumenes con IA</h1>

      <div className="space-y-6">
        <ResumenGenerator
          materias={materias}
          onGenerar={generarYGuardar}
          generating={generating}
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <ResumenList resumenes={resumenes} onDelete={deleteResumen} />
        )}
      </div>
    </div>
  )
}
