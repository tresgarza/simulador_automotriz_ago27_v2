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

  // Logout
  static logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_user')
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
}

// Hook para usar en componentes React
export function useAuth() {
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
      logout: () => {}
    }
  }
  
  const user = AuthService.getCurrentUser()
  
  return {
    user,
    isLoggedIn: !!user,
    isAsesor: AuthService.isAsesor(),
    isAgency: AuthService.isAgency(),
    isClient: AuthService.isClient(),
    hasPermission: AuthService.hasPermission,
    getAvailableRates: AuthService.getAvailableRates,
    logout: AuthService.logout
  }
}
