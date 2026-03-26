import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { LogOut, GraduationCap, KeyRound } from 'lucide-react'
import CambiarPassword from '../auth/CambiarPassword'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  return (
    <>
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-blue-600" />
          <span className="text-xl font-semibold text-gray-800">Mi Tecnicatura</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.email}</span>
          <button
            onClick={() => setShowPassword(true)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
            title="Cambiar contraseña"
          >
            <KeyRound className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </nav>
      {showPassword && <CambiarPassword onClose={() => setShowPassword(false)} />}
    </>
  )
}
