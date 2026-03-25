import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export function useMaterias() {
  const { user } = useAuth()
  const [materias, setMaterias] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMaterias = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('materias')
      .select('*')
      .order('nombre')

    if (error) {
      toast.error('Error al cargar materias')
    } else {
      setMaterias(data || [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchMaterias()
  }, [fetchMaterias])

  const createMateria = async (materia) => {
    const { data, error } = await supabase
      .from('materias')
      .insert({ ...materia, user_id: user.id })
      .select()
      .single()

    if (error) {
      toast.error('Error al crear materia')
      return null
    }
    toast.success('Materia creada')
    setMaterias((prev) => [...prev, data])
    return data
  }

  const updateMateria = async (id, updates) => {
    const { data, error } = await supabase
      .from('materias')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      toast.error('Error al actualizar materia')
      return null
    }
    toast.success('Materia actualizada')
    setMaterias((prev) => prev.map((m) => (m.id === id ? data : m)))
    return data
  }

  const deleteMateria = async (id) => {
    const { error } = await supabase
      .from('materias')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Error al eliminar materia')
      return false
    }
    toast.success('Materia eliminada')
    setMaterias((prev) => prev.filter((m) => m.id !== id))
    return true
  }

  return { materias, loading, createMateria, updateMateria, deleteMateria, refetch: fetchMaterias }
}
