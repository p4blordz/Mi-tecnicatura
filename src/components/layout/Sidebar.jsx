import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Calendar, BookOpen, Brain } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cronograma', icon: Calendar, label: 'Cronograma' },
  { to: '/resumenes', icon: Brain, label: 'Resumenes' },
]

export default function Sidebar({ materias = [] }) {
  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 min-h-[calc(100vh-57px)] p-4 flex flex-col">
      <nav className="space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {materias.length > 0 && (
        <div className="mt-6">
          <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Materias
          </h3>
          <nav className="space-y-1">
            {materias.map((materia) => (
              <NavLink
                key={materia.id}
                to={`/materia/${materia.id}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: materia.color || '#3B82F6' }}
                />
                <span className="truncate">{materia.nombre}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </aside>
  )
}
