import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export function useNotas(claseId) {
  const { user } = useAuth()
  const [notas, setNotas] = useState([])
  const [material, setMaterial] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchNotas = useCallback(async () => {
    if (!user || !claseId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('notas_clase')
      .select('*')
      .eq('clase_id', claseId)
      .order('created_at', { ascending: true })

    if (error) {
      toast.error('Error al cargar notas')
    } else {
      setNotas((data || []).filter((n) => n.tipo === 'rapida'))
      setMaterial((data || []).find((n) => n.tipo === 'material') || null)
    }
    setLoading(false)
  }, [user, claseId])

  useEffect(() => {
    fetchNotas()
  }, [fetchNotas])

  const addNotaRapida = async (contenido) => {
    const { data, error } = await supabase
      .from('notas_clase')
      .insert({ user_id: user.id, clase_id: claseId, tipo: 'rapida', contenido })
      .select()
      .single()

    if (error) {
      toast.error('Error al guardar nota')
      return null
    }
    setNotas((prev) => [...prev, data])
    return data
  }

  const guardarMaterial = async (contenido) => {
    if (material) {
      const { data, error } = await supabase
        .from('notas_clase')
        .update({ contenido })
        .eq('id', material.id)
        .select()
        .single()

      if (error) {
        toast.error('Error al guardar apuntes')
        return null
      }
      setMaterial(data)
      return data
    } else {
      const { data, error } = await supabase
        .from('notas_clase')
        .insert({ user_id: user.id, clase_id: claseId, tipo: 'material', contenido })
        .select()
        .single()

      if (error) {
        toast.error('Error al guardar apuntes')
        return null
      }
      setMaterial(data)
      return data
    }
  }

  const deleteNota = async (id) => {
    const { error } = await supabase
      .from('notas_clase')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Error al eliminar nota')
      return false
    }
    setNotas((prev) => prev.filter((n) => n.id !== id))
    return true
  }

  return { notas, material, loading, addNotaRapida, guardarMaterial, deleteNota }
}
