'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, Users, Calculator, FolderOpen, LogIn, User, LogOut } from 'lucide-react'
import { EmailLoginModal } from '../auth/EmailLoginModal'
import { QuickRegistrationModal } from '../auth/QuickRegistrationModal'
import { UserRegistrationService } from '../../lib/user-registration-service'
import { useAuth } from '../../lib/auth'

export default function MainNavigation() {
  const pathname = usePathname()
  const { user: authUser, isLoggedIn, logout: authLogout } = useAuth()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)

  // Verificar usuario al cargar
  useEffect(() => {
    const savedUser = localStorage.getItem('current_user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        setCurrentUser(user)
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('current_user')
      }
    }
  }, [])

  const handleLoginSuccess = (userData: any) => {
    localStorage.setItem('current_user', JSON.stringify(userData))
    setCurrentUser(userData)
    setShowLoginModal(false)
  }

  const handleRegistrationSuccess = async (userData: any) => {
    try {
      const { user, error } = await UserRegistrationService.quickRegister(userData)
      
      if (error || !user) {
        alert('Error al crear cuenta: ' + error)
        return
      }

      localStorage.setItem('current_user', JSON.stringify(user))
      setCurrentUser(user)
      setShowRegistrationModal(false)
    } catch (error) {
      console.error('Error in registration:', error)
      alert('Error al crear cuenta')
    }
  }

  const handleLogout = () => {
    authLogout() // Usar el logout mejorado del hook
  }

  // Filtrar navegación según tipo de usuario
  const getNavItems = () => {
    const baseItems = [
      {
        href: '/',
        label: 'Simulador',
        icon: Calculator,
        description: 'Cotizar créditos automotrices'
      },
      {
        href: '/solicitud-credito',
        label: 'Solicitud',
        icon: FileText,
        description: 'Llenar solicitud de crédito'
      }
    ]

    // Solo mostrar "Mis Solicitudes" si hay usuario autenticado
    if (currentUser) {
      baseItems.push({
        href: '/mis-solicitudes',
        label: 'Mis Solicitudes',
        icon: FolderOpen,
        description: 'Ver mis solicitudes guardadas'
      })
    }

    // Solo mostrar Dashboard a asesores y agencias
    if (currentUser && (currentUser.user_type === 'asesor' || currentUser.user_type === 'agency')) {
      baseItems.push({
        href: '/dashboard-asesores',
        label: 'Dashboard',
        icon: Users,
        description: 'Gestionar solicitudes'
      })
    }

    return baseItems
  }

  const navItems = getNavItems()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Fincentiva</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                  title={item.description}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* User Section */}
          <div className="hidden md:flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                {/* User Info */}
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg">
                  <User className="h-4 w-4 text-green-600" />
                  <div className="text-sm">
                    <p className="font-medium text-green-800">{currentUser.name}</p>
                    <p className="text-green-600 text-xs">{UserRegistrationService.formatPhone(currentUser.phone)}</p>
                  </div>
                </div>
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Salir</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {/* Login Button */}
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Iniciar Sesión</span>
                </button>
                
                {/* Register Button */}
                <button
                  onClick={() => setShowRegistrationModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Crear Cuenta</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-gray-900 p-2">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium
                  ${isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <div>
                  <div>{item.label}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Modals */}
      <EmailLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />

      <QuickRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onSuccess={handleRegistrationSuccess}
      />
    </nav>
  )
}



