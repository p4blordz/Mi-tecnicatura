import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export function useClases(materiaId, materiaTemplateId = null) {
  const { user } = useAuth()
  const [clases, setClases] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchClases = useCallback(async () => {
    if (!user || !materiaId) return
    setLoading(true)

    let data, error
    if (materiaTemplateId) {
      const result = await supabase.rpc('get_shared_clases', { p_template_id: materiaTemplateId })
      data = result.data
      error = result.error
    } else {
      const result = await supabase
        .from('clases')
        .select('*')
        .eq('materia_id', materiaId)
        .order('numero_clase', { ascending: true })
      data = result.data
      error = result.error
    }

    if (error) {
      toast.error('Error al cargar clases')
    } else {
      // Shared classes logic:
      // 1. Always show all YOUR classes
      // 2. Only show shared classes from others for numero_clase values
      //    where you have NO classes of your own
      const all = data || []
      const myNums = new Set(all.filter(c => c.user_id === user.id).map(c => c.numero_clase))
      const filtered = all.filter(c => c.user_id === user.id || !myNums.has(c.numero_clase))
      setClases(filtered.sort((a, b) => a.numero_clase - b.numero_clase || (a.titulo || '').localeCompare(b.titulo || '')))
    }
    setLoading(false)
  }, [user, materiaId, materiaTemplateId])

  useEffect(() => {
    fetchClases()
  }, [fetchClases])

  const createClase = async (clase) => {
    const { data, error } = await supabase
      .from('clases')
      .insert({ ...clase, user_id: user.id, materia_id: materiaId })
      .select()
      .single()

    if (error) {
      toast.error('Error al crear clase')
      return null
    }
    toast.success('Clase agregada')
    setClases((prev) => [...prev, data].sort((a, b) => a.numero_clase - b.numero_clase || (a.titulo || '').localeCompare(b.titulo || '')))
    return data
  }

  const updateClase = async (id, updates) => {
    const { data, error } = await supabase
      .from('clases')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      toast.error('Error al actualizar clase')
      return null
    }
    setClases((prev) => prev.map((c) => (c.id === id ? data : c)).sort((a, b) => a.numero_clase - b.numero_clase || (a.titulo || '').localeCompare(b.titulo || '')))
    return data
  }

  const toggleVisto = async (id, visto) => {
    return updateClase(id, { visto: !visto })
  }

  const deleteClase = async (id) => {
    const { error } = await supabase
      .from('clases')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Error al eliminar clase')
      return false
    }
    toast.success('Clase eliminada')
    setClases((prev) => prev.filter((c) => c.id !== id))
    return true
  }

  return { clases, loading, createClase, updateClase, toggleVisto, deleteClase, refetch: fetchClases }
}
