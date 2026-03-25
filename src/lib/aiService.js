const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

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
}

export async function generarResumen(texto, tipo = 'resumen') {
  if (!GROQ_API_KEY) {
    throw new Error('Falta configurar VITE_GROQ_API_KEY en el archivo .env')
  }

  const prompt = prompts[tipo]?.(texto) || prompts.resumen(texto)

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000,
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
