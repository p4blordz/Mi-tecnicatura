import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export function useArchivos(materiaId) {
  const { user } = useAuth()
  const [archivos, setArchivos] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchArchivos = useCallback(async () => {
    if (!user || !materiaId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('archivos')
      .select('*')
      .eq('materia_id', materiaId)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Error al cargar archivos')
    } else {
      setArchivos(data || [])
    }
    setLoading(false)
  }, [user, materiaId])

  useEffect(() => {
    fetchArchivos()
  }, [fetchArchivos])

  const uploadArchivo = async (file, categoria = 'material', claseId = null) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${file.name}`
    const storagePath = `${user.id}/${materiaId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('archivos-estudio')
      .upload(storagePath, file)

    if (uploadError) {
      toast.error('Error al subir archivo')
      return null
    }

    const tipo = getFileType(fileExt)
    const { data, error } = await supabase
      .from('archivos')
      .insert({
        user_id: user.id,
        materia_id: materiaId,
        clase_id: claseId,
        nombre_original: file.name,
        nombre_storage: storagePath,
        tipo,
        categoria,
        tamano_bytes: file.size,
      })
      .select()
      .single()

    if (error) {
      toast.error('Error al registrar archivo')
      return null
    }
    toast.success('Archivo subido')
    setArchivos((prev) => [data, ...prev])
    return data
  }

  const deleteArchivo = async (archivo) => {
    await supabase.storage
      .from('archivos-estudio')
      .remove([archivo.nombre_storage])

    const { error } = await supabase
      .from('archivos')
      .delete()
      .eq('id', archivo.id)

    if (error) {
      toast.error('Error al eliminar archivo')
      return false
    }
    toast.success('Archivo eliminado')
    setArchivos((prev) => prev.filter((a) => a.id !== archivo.id))
    return true
  }

  const getDownloadUrl = async (storagePath) => {
    const { data } = await supabase.storage
      .from('archivos-estudio')
      .createSignedUrl(storagePath, 3600)

    return data?.signedUrl
  }

  const addLink = async (url, nombre, categoria = 'material', claseId = null) => {
    const { data, error } = await supabase
      .from('archivos')
      .insert({
        user_id: user.id,
        materia_id: materiaId,
        clase_id: claseId,
        nombre_original: nombre,
        nombre_storage: '',
        tipo: 'link',
        categoria,
        url_publica: url,
      })
      .select()
      .single()

    if (error) {
      toast.error('Error al guardar link')
      return null
    }
    toast.success('Link guardado')
    setArchivos((prev) => [data, ...prev])
    return data
  }

  const editArchivo = async (id, updates) => {
    const { data, error } = await supabase
      .from('archivos')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      toast.error('Error al editar')
      return null
    }
    toast.success('Link actualizado')
    setArchivos((prev) => prev.map((a) => (a.id === id ? data : a)))
    return data
  }

  return { archivos, loading, uploadArchivo, addLink, editArchivo, deleteArchivo, getDownloadUrl, refetch: fetchArchivos }
}

function getFileType(ext) {
  const types = {
    pdf: 'pdf',
    doc: 'doc', docx: 'doc',
    ppt: 'ppt', pptx: 'ppt',
    xls: 'xls', xlsx: 'xls',
    jpg: 'imagen', jpeg: 'imagen', png: 'imagen', gif: 'imagen', webp: 'imagen',
  }
  return types[ext?.toLowerCase()] || 'otro'
}
