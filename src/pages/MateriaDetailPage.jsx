import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useClases } from '../hooks/useClases'
import { useArchivos } from '../hooks/useArchivos'
import { useResumenes } from '../hooks/useResumenes'
import ClaseLink from '../components/archivos/ClaseLink'
import ArchivoUploader from '../components/archivos/ArchivoUploader'
import ArchivoList from '../components/archivos/ArchivoList'
import ResumenGenerator from '../components/resumenes/ResumenGenerator'
import ResumenList from '../components/resumenes/ResumenList'
import { ArrowLeft, Video, FileText, Brain, Plus, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'clases', label: 'Clases', icon: Video },
  { id: 'archivos', label: 'Archivos', icon: FileText },
  { id: 'resumenes', label: 'Resumenes', icon: Brain },
]

export default function MateriaDetailPage() {
  const { id } = useParams()
  const [materia, setMateria] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('clases')
  const [showClaseForm, setShowClaseForm] = useState(false)

  const { clases, createClase, toggleVisto, deleteClase } = useClases(id)
  const { archivos, uploadArchivo, addLink, editArchivo, deleteArchivo, getDownloadUrl } = useArchivos(id)
  const { resumenes, generating, generarYGuardar, deleteResumen } = useResumenes(id)

  useEffect(() => {
    async function fetchMateria() {
      const { data, error } = await supabase
        .from('materias')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        toast.error('Error al cargar materia')
      } else {
        setMateria(data)
      }
      setLoading(false)
    }
    fetchMateria()
  }, [id])

  const handleDownload = async (archivo) => {
    const url = await getDownloadUrl(archivo.nombre_storage)
    if (url) window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!materia) {
    return <p className="text-center py-12 text-gray-400">Materia no encontrada</p>
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: materia.color || '#3B82F6' }}
          />
          <h1 className="text-2xl font-bold text-gray-800">{materia.nombre}</h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
          {materia.profesor && <span>Prof. {materia.profesor}</span>}
          {materia.dia_cursada && (
            <span>
              {materia.dia_cursada} {materia.horario_inicio?.slice(0, 5)} - {materia.horario_fin?.slice(0, 5)}
            </span>
          )}
          {materia.link_classroom && (
            <a
              href={materia.link_classroom}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Classroom
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              tab === tabId
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'clases' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowClaseForm(!showClaseForm)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Agregar clase
            </button>
          </div>

          {showClaseForm && (
            <ClaseForm
              onSubmit={async (data) => {
                await createClase(data)
                setShowClaseForm(false)
              }}
              nextNumero={clases.length + 1}
            />
          )}

          {clases.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">No hay clases cargadas</p>
          ) : (
            <div className="space-y-2">
              {clases.map((clase) => (
                <ClaseLink
                  key={clase.id}
                  clase={clase}
                  onToggleVisto={toggleVisto}
                  onDelete={deleteClase}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'archivos' && (
        <div className="space-y-6">
          <ArchivoUploader onUpload={uploadArchivo} onAddLink={addLink} />
          <ArchivoList
            archivos={archivos}
            onDownload={handleDownload}
            onDelete={deleteArchivo}
            onEdit={editArchivo}
          />
        </div>
      )}

      {tab === 'resumenes' && (
        <div className="space-y-6">
          <ResumenGenerator
            materias={[materia]}
            archivos={archivos}
            onGenerar={generarYGuardar}
            generating={generating}
          />
          <ResumenList resumenes={resumenes} onDelete={deleteResumen} />
        </div>
      )}
    </div>
  )
}

function ClaseForm({ onSubmit, nextNumero }) {
  const [form, setForm] = useState({
    titulo: '',
    numero_clase: nextNumero,
    fecha: '',
    link_video: '',
    descripcion: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Numero</label>
          <input
            type="number"
            value={form.numero_clase}
            onChange={(e) => update('numero_clase', Number(e.target.value))}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Titulo *</label>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => update('titulo', e.target.value)}
            required
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Incoterms 2020"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
          <input
            type="date"
            value={form.fecha}
            onChange={(e) => update('fecha', e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Link al video</label>
          <input
            type="url"
            value={form.link_video}
            onChange={(e) => update('link_video', e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://..."
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Descripcion</label>
        <input
          type="text"
          value={form.descripcion}
          onChange={(e) => update('descripcion', e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Temas tratados..."
        />
      </div>
      <button
        type="submit"
        className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
      >
        Agregar
      </button>
    </form>
  )
}
