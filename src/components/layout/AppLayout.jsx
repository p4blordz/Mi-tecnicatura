import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useMaterias } from '../../hooks/useMaterias'
import { Menu, X } from 'lucide-react'

export default function AppLayout({ children }) {
  const { materias } = useMaterias()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        {/* Sidebar mobile toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg cursor-pointer"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Sidebar overlay mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed lg:static z-40 transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <Sidebar materias={materias.filter((m) => m.activa !== false)} />
        </div>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8 max-w-5xl">
          {children}
        </main>
      </div>
    </div>
  )
}
