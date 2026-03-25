import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export function useClases(materiaId) {
  const { user } = useAuth()
  const [clases, setClases] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchClases = useCallback(async () => {
    if (!user || !materiaId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('clases')
      .select('*')
      .eq('materia_id', materiaId)
      .order('numero_clase', { ascending: true })

    if (error) {
      toast.error('Error al cargar clases')
    } else {
      setClases(data || [])
    }
    setLoading(false)
  }, [user, materiaId])

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
    setClases((prev) => [...prev, data])
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
    setClases((prev) => prev.map((c) => (c.id === id ? data : c)))
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
