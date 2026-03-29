const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

// Limit ~4500 tokens input (~18000 chars) to stay under Groq free tier 6000 TPM
const MAX_CHARS = 18000

const prompts = {
  resumen: (texto) =>
    `Sos un asistente académico experto para un estudiante de Comercio Internacional.
Generá un resumen completo, bien estructurado y visualmente atractivo del siguiente contenido.

FORMATO OBLIGATORIO (usá markdown rico):
- Empezá con un título principal con ##
- Usá ### para cada sección o tema
- Usá **negrita** para términos clave y definiciones importantes
- Usá listas con viñetas (- ) para enumerar conceptos
- Usá > blockquotes para definiciones formales o citas importantes
- Separá las secciones con líneas horizontales (---)
- Si hay datos numéricos o comparaciones, usalos en tablas markdown
- Al final, incluí una sección "📌 Puntos clave para recordar" con los 3-5 conceptos más importantes en negrita

Contenido a resumir:
${texto}`,

  conceptos: (texto) =>
    `Sos un asistente académico experto para un estudiante de Comercio Internacional.
Extraé todos los conceptos y definiciones clave del siguiente texto.

FORMATO OBLIGATORIO (usá markdown rico):
- Título principal con ## "Conceptos y Definiciones Clave"
- Para cada concepto usá este formato:
  ### 📖 Nombre del concepto
  > **Definición:** descripción clara y concisa
  - Características o detalles adicionales relevantes
- Agrupá los conceptos por tema si es posible, usando --- como separador
- Al final, incluí una sección "🔗 Relaciones entre conceptos" explicando cómo se conectan

Texto:
${texto}`,

  preguntas: (texto) =>
    `Sos un asistente académico experto para un estudiante de Comercio Internacional.
Generá preguntas de repaso basadas en el siguiente contenido.

FORMATO OBLIGATORIO (usá markdown rico):
- Título principal con ## "Preguntas de Repaso"
- Generá 5-7 preguntas variadas (definiciones, comparaciones, aplicación práctica)
- Para cada pregunta usá este formato:
  ### ❓ Pregunta N
  **Pregunta en negrita**

  <details>
  <summary>Ver respuesta</summary>

  Respuesta completa y detallada con **términos clave en negrita**.
  </details>

- Al final, incluí una sección "💡 Tips para el examen" con consejos sobre qué temas estudiar más

Contenido:
${texto}`,

  guia: (texto) =>
    `Sos un asistente académico experto para un estudiante de Comercio Internacional.
Creá una guía de estudio completa y detallada basada en el siguiente contenido. NO resumas brevemente, desarrollá cada tema en profundidad para que el estudiante pueda estudiar directamente de esta guía.

FORMATO OBLIGATORIO (usá markdown rico):
- Título principal con ## "Guía de Estudio"
- Usá ### para cada tema o unidad temática
- Para cada tema:
  - Explicación completa y detallada (no resumida) del concepto
  - Usá **negrita** para términos clave
  - Usá > blockquotes para definiciones formales
  - Incluí ejemplos prácticos cuando sea posible
  - Si hay procedimientos o pasos, numeralos con 1. 2. 3.
- Si hay datos numéricos o comparaciones, usalos en tablas markdown
- Separá los temas con líneas horizontales (---)
- Al final incluí:
  - "📝 Temas que probablemente entren en el examen" con los puntos más importantes
  - "⚠️ Errores comunes" con conceptos que suelen confundirse
  - "🔗 Conexiones entre temas" explicando cómo se relacionan los conceptos

IMPORTANTE: Sé extenso y detallado. Esta guía reemplaza tener que leer el material original.

Contenido:
${texto}`,
}

function limpiarTranscripcion(texto) {
  // Remove timestamps like 0:03, 1:42, 12:05, etc.
  return texto
    .replace(/\b\d{1,2}:\d{2}\b/g, '')
    .replace(/\n\s*\n/g, '\n')
    .replace(/  +/g, ' ')
    .trim()
}

export async function generarResumen(texto, tipo = 'resumen') {
  if (!GROQ_API_KEY) {
    throw new Error('Falta configurar VITE_GROQ_API_KEY en el archivo .env')
  }

  // Clean timestamps and trim to fit API limits
  let textoLimpio = limpiarTranscripcion(texto)

  if (textoLimpio.length > MAX_CHARS) {
    textoLimpio = textoLimpio.slice(0, MAX_CHARS) + '\n\n[Texto cortado por limite de longitud]'
  }

  const prompt = prompts[tipo]?.(textoLimpio) || prompts.resumen(textoLimpio)

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.4,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Error al generar resumen')
  }

  return data.choices[0].message.content
}

export async function obtenerTranscripcion(videoUrl) {
  const response = await fetch(`/api/transcript?url=${encodeURIComponent(videoUrl)}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Error al obtener la transcripcion')
  }

  return data.text
}

export async function extraerTextoArchivo(url, tipo) {
  const response = await fetch(`/api/extract-text?url=${encodeURIComponent(url)}&type=${tipo}`)
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'Error al extraer texto del archivo')
  }
  return data.text
}

export async function obtenerTranscripcionDrive(driveUrl) {
  const response = await fetch(`/api/drive-transcript?url=${encodeURIComponent(driveUrl)}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Error al obtener la transcripcion del video')
  }

  return data.text
}
