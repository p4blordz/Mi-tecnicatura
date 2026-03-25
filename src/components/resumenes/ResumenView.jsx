import ReactMarkdown from 'react-markdown'
import { Trash2, Copy, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function ResumenView({ resumen, onDelete }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(resumen.resumen)
    toast.success('Copiado al portapapeles')
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div>
          <h4 className="font-medium text-gray-800">{resumen.titulo}</h4>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
            {resumen.materias?.nombre && (
              <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                {resumen.materias.nombre}
              </span>
            )}
            <span>{format(new Date(resumen.created_at), 'dd MMM yyyy HH:mm', { locale: es })}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={copyToClipboard}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
            title="Copiar"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(resumen.id)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="p-5 resumen-content">
        <ReactMarkdown
          components={{
            h2: ({ children }) => (
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-200">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-semibold text-gray-700 mt-5 mb-2">{children}</h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-base font-semibold text-gray-600 mt-4 mb-2">{children}</h4>
            ),
            p: ({ children }) => (
              <p className="text-gray-600 leading-relaxed mb-3">{children}</p>
            ),
            strong: ({ children }) => (
              <strong className="text-gray-800 font-semibold">{children}</strong>
            ),
            ul: ({ children }) => (
              <ul className="space-y-1.5 mb-4 ml-1">{children}</ul>
            ),
            li: ({ children }) => (
              <li className="text-gray-600 flex gap-2">
                <span className="text-blue-500 mt-1.5 flex-shrink-0">•</span>
                <span>{children}</span>
              </li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-purple-400 bg-purple-50 pl-4 py-2 pr-3 my-3 rounded-r-lg text-gray-700 italic">
                {children}
              </blockquote>
            ),
            hr: () => (
              <hr className="my-5 border-gray-200" />
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-4">
                <table className="w-full border-collapse border border-gray-200 rounded-lg text-sm">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-blue-50">{children}</thead>
            ),
            th: ({ children }) => (
              <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">{children}</th>
            ),
            td: ({ children }) => (
              <td className="border border-gray-200 px-3 py-2 text-gray-600">{children}</td>
            ),
            details: ({ children }) => (
              <details className="my-3 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                {children}
              </details>
            ),
            summary: ({ children }) => (
              <summary className="px-4 py-2 cursor-pointer font-medium text-blue-600 hover:bg-gray-100">
                {children}
              </summary>
            ),
          }}
        >
          {resumen.resumen}
        </ReactMarkdown>
      </div>
    </div>
  )
}
