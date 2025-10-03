'use client'

import { useState, useEffect, useCallback } from 'react'
import { GuestSessionService } from './guest-session-service'

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  user_type: 'client' | 'asesor' | 'agency' | 'admin'
  created_at?: string
}

interface AuthState {
  user: User | null
  isLoggedIn: boolean
  isAsesor: boolean
  isAgency: boolean
  isClient: boolean
  isAdmin: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoggedIn: false,
    isAsesor: false,
    isAgency: false,
    isClient: false,
    isAdmin: false
  })

  // Función para actualizar el estado de autenticación
  const updateAuthState = useCallback((user: User | null) => {
    setAuthState({
      user,
      isLoggedIn: !!user,
      isAsesor: user?.user_type === 'asesor',
      isAgency: user?.user_type === 'agency',
      isClient: user?.user_type === 'client',
      isAdmin: user?.user_type === 'admin'
    })
  }, [])

  // Cargar usuario desde localStorage al inicializar y escuchar cambios
  useEffect(() => {
    const loadUserFromStorage = () => {
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('current_user')
        if (savedUser) {
          try {
            const user = JSON.parse(savedUser)
            console.log('🔍 [DEBUG] useAuth - Cargando usuario desde localStorage:', user.name);
            updateAuthState(user)
          } catch (error) {
            console.error('Error parsing saved user:', error)
            localStorage.removeItem('current_user')
            updateAuthState(null)
          }
        } else {
          updateAuthState(null)
        }
      }
    }

    // Cargar usuario inicial
    loadUserFromStorage()

    // Escuchar cambios de autenticación
    const handleAuthChange = () => {
      console.log('🔄 [DEBUG] useAuth - Evento auth-changed recibido, recargando usuario...')
      loadUserFromStorage()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('auth-changed', handleAuthChange)
      
      return () => {
        window.removeEventListener('auth-changed', handleAuthChange)
      }
    }
  }, [updateAuthState])

  // Función de login
  const login = useCallback((userData: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('current_user', JSON.stringify(userData))
      updateAuthState(userData)
    }
  }, [updateAuthState])

  // Función de logout mejorada
  const logout = useCallback(async () => {
    console.log('🚪 Iniciando logout completo...')
    
    try {
      // 1. Limpiar sesión de invitado si existe
      const guestToken = GuestSessionService.getCurrentSessionToken()
      if (guestToken) {
        console.log('🧹 Limpiando sesión de invitado...')
        await GuestSessionService.deleteGuestSession(guestToken)
      }

      // 2. Limpiar localStorage completamente
      if (typeof window !== 'undefined') {
        console.log('🧹 Limpiando localStorage...')
        
        // Elementos específicos a limpiar
        const itemsToRemove = [
          'current_user',
          'guest_session_token', 
          'session_id',
          'temp_email_codes',
          // Agregar otros elementos que puedan causar cache
        ]
        
        itemsToRemove.forEach(item => {
          localStorage.removeItem(item)
        })
      }

      // 3. Actualizar estado de autenticación
      updateAuthState(null)

      // 4. Forzar recarga de la página para limpiar completamente el estado
      if (typeof window !== 'undefined') {
        console.log('🔄 Recargando página para limpiar estado...')
        window.location.reload()
      }

    } catch (error) {
      console.error('❌ Error durante logout:', error)
      
      // Fallback: limpiar lo básico y recargar
      if (typeof window !== 'undefined') {
        localStorage.clear() // Limpiar todo el localStorage como último recurso
        window.location.reload()
      }
    }
  }, [updateAuthState])

  // Función para obtener tasas disponibles (placeholder)
  const getAvailableRates = useCallback(() => {
    // Esta función puede implementarse según las necesidades específicas
    return {
      A: 0.36,
      B: 0.40,
      C: 0.45
    }
  }, [])

  return {
    ...authState,
    login,
    logout,
    getAvailableRates
  }
}
