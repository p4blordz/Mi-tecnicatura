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
      // Deduplicate shared classes: when two users have the same class
      // (same numero_clase AND same or empty titulo), keep the main contributor's version.
      // Classes with different titles (e.g. "PARTE 1" vs "PARTE 2") are NOT duplicates.
      const all = data || []
      const countByUser = {}
      for (const c of all) {
        countByUser[c.user_id] = (countByUser[c.user_id] || 0) + 1
      }
      let mainUserId = user.id
      let maxCount = countByUser[user.id] || 0
      for (const [uid, count] of Object.entries(countByUser)) {
        if (count > maxCount) {
          maxCount = count
          mainUserId = uid
        }
      }
      // Dedup key = numero_clase + normalized titulo
      const dedupKey = (c) => `${c.numero_clase}::${(c.titulo || '').trim().toLowerCase()}`
      const byKey = new Map()
      for (const c of all) {
        const key = dedupKey(c)
        if (!byKey.has(key)) {
          byKey.set(key, c)
        } else if (c.user_id === mainUserId && byKey.get(key).user_id !== mainUserId) {
          byKey.set(key, c)
        }
      }
      setClases([...byKey.values()].sort((a, b) => a.numero_clase - b.numero_clase))
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
    setClases((prev) => [...prev, data].sort((a, b) => a.numero_clase - b.numero_clase))
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
    setClases((prev) => prev.map((c) => (c.id === id ? data : c)).sort((a, b) => a.numero_clase - b.numero_clase))
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
