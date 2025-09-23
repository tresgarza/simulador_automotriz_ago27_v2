import { useState, useEffect } from 'react'
import { supabase, User } from './supabase'

// Tipos para autenticación
export interface AuthUser extends User {
  permissions: string[]
}

export interface LoginCredentials {
  identifier: string // email para asesores, phone para agencias
  password?: string // opcional por ahora
  userType: 'asesor' | 'agency'
  agencyCode?: string // requerido para agencias
}

// Clase para manejar autenticación
export class AuthService {
  
  // Login para asesores (por código + email)
  static async loginAsesor(email: string, code?: string): Promise<{ user: AuthUser | null, error: string | null }> {
    try {
      // Validar código de acceso
      if (!code || code !== 'FINCENTIVA2025') {
        return { user: null, error: 'Código de acceso incorrecto' }
      }

      const { data, error } = await supabase
        .from('z_auto_users')
        .select('*')
        .eq('email', email)
        .eq('user_type', 'asesor')
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return { user: null, error: 'Asesor no encontrado o inactivo' }
      }

      const authUser: AuthUser = {
        ...data,
        permissions: ['view_all_rates', 'manage_users', 'view_all_quotes', 'manage_system']
      }

      // Guardar en localStorage
      localStorage.setItem('auth_user', JSON.stringify(authUser))
      
      return { user: authUser, error: null }
    } catch {
      return { user: null, error: 'Error al iniciar sesión' }
    }
  }

  // Login para agencias (por código de agencia + teléfono)
  static async loginAgency(agencyCode: string, phone: string): Promise<{ user: AuthUser | null, error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('z_auto_users')
        .select('*')
        .eq('agency_code', agencyCode)
        .eq('phone', phone)
        .eq('user_type', 'agency')
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return { user: null, error: 'Agencia no encontrada o credenciales incorrectas' }
      }

      const authUser: AuthUser = {
        ...data,
        permissions: ['view_rate_c', 'create_quotes', 'view_own_quotes']
      }

      // Guardar en localStorage
      localStorage.setItem('auth_user', JSON.stringify(authUser))
      
      return { user: authUser, error: null }
    } catch {
      return { user: null, error: 'Error al iniciar sesión' }
    }
  }

  // Obtener usuario actual
  static getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null
    
    const userStr = localStorage.getItem('auth_user')
    if (!userStr) return null
    
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }

  // Verificar sesión con el servidor
  static async verifySession(): Promise<{ valid: boolean; user?: AuthUser }> {
    const currentUser = AuthService.getCurrentUser()
    if (!currentUser) {
      return { valid: false }
    }

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          userType: currentUser.user_type,
          email: currentUser.email
        })
      })

      if (!response.ok) {
        // Si la verificación falla, limpiar la sesión local
        AuthService.logout()
        return { valid: false }
      }

      const result = await response.json()
      
      // Actualizar datos del usuario si han cambiado
      if (result.user && JSON.stringify(result.user) !== JSON.stringify(currentUser)) {
        localStorage.setItem('auth_user', JSON.stringify(result.user))
      }

      return { valid: true, user: result.user }
    } catch (error) {
      console.error('Error verifying session:', error)
      // En caso de error de red, mantener la sesión pero marcar como no verificada
      return { valid: false }
    }
  }

  // Logout - Clear all session data
  static logout(): void {
    if (typeof window !== 'undefined') {
      // Clear all auth-related localStorage items
      localStorage.removeItem('auth_user')
      localStorage.removeItem('user_session')
      localStorage.removeItem('user_preferences')
      localStorage.removeItem('cached_rates')
      localStorage.removeItem('cached_simulations')
      
      // Clear sessionStorage as well
      sessionStorage.clear()
      
      // Clear any cookies related to auth
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=")
        const name = eqPos > -1 ? c.substr(0, eqPos) : c
        if (name.trim().startsWith('auth_') || name.trim().startsWith('user_') || name.trim().startsWith('session_')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        }
      })
    }
  }

  // Verificar si el usuario tiene un permiso específico
  static hasPermission(permission: string): boolean {
    const user = AuthService.getCurrentUser()
    return user?.permissions.includes(permission) || false
  }

  // Verificar si es asesor
  static isAsesor(): boolean {
    const user = AuthService.getCurrentUser()
    return user?.user_type === 'asesor'
  }

  // Verificar si es agencia
  static isAgency(): boolean {
    const user = AuthService.getCurrentUser()
    return user?.user_type === 'agency'
  }

  // Verificar si es cliente (sin login)
  static isClient(): boolean {
    return AuthService.getCurrentUser() === null
  }

  // Obtener tasas disponibles según el tipo de usuario
  static getAvailableRates(): string[] {
    if (typeof window === 'undefined') {
      return ['C'] // Default para SSR
    }
    
    const user = AuthService.getCurrentUser()
    
    if (!user || user.user_type === 'client') {
      return ['C'] // Solo tasa C para clientes
    }
    
    if (user.user_type === 'agency') {
      return ['C'] // Solo tasa C para agencias
    }
    
    if (user.user_type === 'asesor') {
      return ['A', 'B', 'C'] // Todas las tasas para asesores
    }
    
    return ['C']
  }

  // Obtener términos disponibles según el tipo de usuario
  static getAvailableTerms(): number[] {
    if (typeof window === 'undefined') {
      return [24, 36, 48] // Default para SSR
    }
    
    const user = AuthService.getCurrentUser()
    
    if (!user || user.user_type === 'client') {
      return [24, 36, 48] // Sin 60 meses para clientes
    }
    
    if (user.user_type === 'agency') {
      return [24, 36, 48] // Sin 60 meses para agencias
    }
    
    if (user.user_type === 'asesor') {
      return [24, 36, 48, 60] // Todas las opciones para asesores
    }
    
    return [24, 36, 48]
  }
}

// Hook para usar en componentes React
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Obtener usuario inicial
    const currentUser = AuthService.getCurrentUser()
    setUser(currentUser)

    // Verificar sesión con el servidor al cargar
    if (currentUser) {
      AuthService.verifySession().then(({ valid, user: verifiedUser }) => {
        setIsVerified(valid)
        if (valid && verifiedUser) {
          setUser(verifiedUser)
        } else if (!valid) {
          setUser(null)
        }
      })
    }

    // Verificar sesión periódicamente (cada 5 minutos)
    const verificationInterval = setInterval(() => {
      const currentUser = AuthService.getCurrentUser()
      if (currentUser) {
        AuthService.verifySession().then(({ valid, user: verifiedUser }) => {
          setIsVerified(valid)
          if (valid && verifiedUser) {
            setUser(verifiedUser)
          } else if (!valid) {
            setUser(null)
            // Recargar la página para limpiar el estado
            window.location.reload()
          }
        })
      }
    }, 5 * 60 * 1000) // 5 minutos

    return () => clearInterval(verificationInterval)
  }, [])

  const logout = () => {
    AuthService.logout()
    setUser(null)
    setIsVerified(false)
    // Recargar la página para limpiar completamente el estado
    window.location.reload()
  }

  if (typeof window === 'undefined') {
    // SSR defaults
    return {
      user: null,
      isLoggedIn: false,
      isAsesor: false,
      isAgency: false,
      isClient: true,
      hasPermission: () => false,
      getAvailableRates: () => ['C'],
      logout: () => {},
      isVerified: false
    }
  }
  
  return {
    user,
    isLoggedIn: !!user,
    isAsesor: user?.user_type === 'asesor',
    isAgency: user?.user_type === 'agency',
    isClient: !user,
    hasPermission: (permission: string) => user?.permissions?.includes(permission) || false,
    getAvailableRates: AuthService.getAvailableRates,
    logout,
    isVerified
  }
}
