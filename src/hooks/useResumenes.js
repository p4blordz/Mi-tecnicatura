import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { generarResumen } from '../lib/aiService'
import toast from 'react-hot-toast'

export function useResumenes(materiaId = null) {
  const { user } = useAuth()
  const [resumenes, setResumenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const fetchResumenes = useCallback(async () => {
    if (!user) return
    setLoading(true)
    let query = supabase
      .from('resumenes')
      .select('*, materias(nombre)')
      .order('created_at', { ascending: false })

    if (materiaId) {
      query = query.eq('materia_id', materiaId)
    }

    const { data, error } = await query

    if (error) {
      toast.error('Error al cargar resumenes')
    } else {
      setResumenes(data || [])
    }
    setLoading(false)
  }, [user, materiaId])

  useEffect(() => {
    fetchResumenes()
  }, [fetchResumenes])

  const generarYGuardar = async (texto, tipo, matId, claseId = null, titulo = '') => {
    setGenerating(true)
    try {
      const resumen = await generarResumen(texto, tipo)

      const { data, error } = await supabase
        .from('resumenes')
        .insert({
          user_id: user.id,
          materia_id: matId,
          clase_id: claseId,
          titulo: titulo || `Resumen - ${new Date().toLocaleDateString('es-AR')}`,
          contenido_original: texto,
          resumen,
          modelo_ia: 'llama-3.1-8b-instant',
        })
        .select('*, materias(nombre)')
        .single()

      if (error) {
        toast.error('Error al guardar resumen')
        setGenerating(false)
        return null
      }
      toast.success('Resumen generado y guardado')
      setResumenes((prev) => [data, ...prev])
      setGenerating(false)
      return data
    } catch (err) {
      toast.error(err.message || 'Error al generar resumen')
      setGenerating(false)
      return null
    }
  }

  const deleteResumen = async (id) => {
    const { error } = await supabase
      .from('resumenes')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Error al eliminar resumen')
      return false
    }
    toast.success('Resumen eliminado')
    setResumenes((prev) => prev.filter((r) => r.id !== id))
    return true
  }

  return { resumenes, loading, generating, generarYGuardar, deleteResumen, refetch: fetchResumenes }
}
