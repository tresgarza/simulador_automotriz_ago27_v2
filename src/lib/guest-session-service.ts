import { supabaseClient } from './supabase'

export interface GuestSession {
  id: string
  session_token: string
  email?: string
  phone?: string
  name?: string
  expires_at: string
  created_at: string
  temp_data?: any
}

export interface CreateGuestSessionData {
  email?: string
  phone?: string
  name?: string
  temp_data?: any
}

export class GuestSessionService {
  private static readonly SESSION_DURATION_HOURS = 24
  private static readonly STORAGE_KEY = 'guest_session_token'

  /**
   * Genera un token único para la sesión
   */
  private static generateSessionToken(): string {
    const timestamp = Date.now().toString(36)
    const randomStr = Math.random().toString(36).substring(2, 15)
    return `guest_${timestamp}_${randomStr}`
  }

  /**
   * Crea una nueva sesión de invitado
   */
  static async createGuestSession(data: CreateGuestSessionData = {}): Promise<{
    session: GuestSession | null
    error: string | null
  }> {
    try {
      const sessionToken = this.generateSessionToken()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + this.SESSION_DURATION_HOURS)

      const { data: session, error } = await supabaseClient
        .from('z_auto_guest_sessions')
        .insert({
          session_token: sessionToken,
          email: data.email,
          phone: data.phone,
          name: data.name,
          temp_data: data.temp_data || {},
          expires_at: expiresAt.toISOString(),
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating guest session:', error)
        return { session: null, error: 'Error al crear sesión de invitado' }
      }

      // Guardar token en localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, sessionToken)
      }

      console.log('✅ Guest session created:', session.id)
      return { session, error: null }
    } catch (error) {
      console.error('Exception creating guest session:', error)
      return { session: null, error: 'Error interno del servidor' }
    }
  }

  /**
   * Obtiene la sesión actual del localStorage
   */
  static getCurrentSessionToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.STORAGE_KEY)
  }

  /**
   * Obtiene información de la sesión por token
   */
  static async getGuestSession(sessionToken: string): Promise<{
    session: GuestSession | null
    error: string | null
  }> {
    try {
      const { data: session, error } = await supabaseClient
        .from('z_auto_guest_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { session: null, error: 'Sesión no encontrada o expirada' }
        }
        console.error('Error getting guest session:', error)
        return { session: null, error: 'Error al obtener sesión' }
      }

      return { session, error: null }
    } catch (error) {
      console.error('Exception getting guest session:', error)
      return { session: null, error: 'Error interno del servidor' }
    }
  }

  /**
   * Actualiza datos de la sesión de invitado
   */
  static async updateGuestSession(
    sessionToken: string, 
    updates: Partial<CreateGuestSessionData>
  ): Promise<{
    session: GuestSession | null
    error: string | null
  }> {
    try {
      const { data: session, error } = await supabaseClient
        .from('z_auto_guest_sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .select()
        .single()

      if (error) {
        console.error('Error updating guest session:', error)
        return { session: null, error: 'Error al actualizar sesión' }
      }

      return { session, error: null }
    } catch (error) {
      console.error('Exception updating guest session:', error)
      return { session: null, error: 'Error interno del servidor' }
    }
  }

  /**
   * Convierte sesión de invitado a usuario registrado
   */
  static async convertToRegisteredUser(
    sessionToken: string,
    userData: {
      email: string
      phone: string
      name: string
      password?: string
    }
  ): Promise<{
    userId: string | null
    error: string | null
  }> {
    try {
      const { data, error } = await supabaseClient
        .rpc('convert_guest_to_user', {
          p_session_token: sessionToken,
          p_email: userData.email,
          p_phone: userData.phone,
          p_name: userData.name,
          p_password_hash: userData.password ? await this.hashPassword(userData.password) : null
        })

      if (error) {
        console.error('Error converting guest to user:', error)
        return { userId: null, error: 'Error al crear cuenta de usuario' }
      }

      // Limpiar token de localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.STORAGE_KEY)
      }

      console.log('✅ Guest converted to user:', data)
      return { userId: data, error: null }
    } catch (error) {
      console.error('Exception converting guest to user:', error)
      return { userId: null, error: 'Error interno del servidor' }
    }
  }

  /**
   * Extiende la sesión de invitado
   */
  static async extendGuestSession(sessionToken: string): Promise<{
    session: GuestSession | null
    error: string | null
  }> {
    try {
      const newExpiresAt = new Date()
      newExpiresAt.setHours(newExpiresAt.getHours() + this.SESSION_DURATION_HOURS)

      const { data: session, error } = await supabaseClient
        .from('z_auto_guest_sessions')
        .update({
          expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('session_token', sessionToken)
        .select()
        .single()

      if (error) {
        console.error('Error extending guest session:', error)
        return { session: null, error: 'Error al extender sesión' }
      }

      return { session, error: null }
    } catch (error) {
      console.error('Exception extending guest session:', error)
      return { session: null, error: 'Error interno del servidor' }
    }
  }

  /**
   * Elimina la sesión de invitado
   */
  static async deleteGuestSession(sessionToken: string): Promise<{
    success: boolean
    error: string | null
  }> {
    try {
      const { error } = await supabaseClient
        .from('z_auto_guest_sessions')
        .delete()
        .eq('session_token', sessionToken)

      if (error) {
        console.error('Error deleting guest session:', error)
        return { success: false, error: 'Error al eliminar sesión' }
      }

      // Limpiar localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.STORAGE_KEY)
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Exception deleting guest session:', error)
      return { success: false, error: 'Error interno del servidor' }
    }
  }

  /**
   * Obtiene solicitudes de crédito para la sesión actual
   */
  static async getGuestCreditApplications(sessionToken: string): Promise<{
    applications: any[]
    error: string | null
  }> {
    try {
      const { data, error } = await supabaseClient
        .rpc('get_user_credit_applications', {
          p_user_id: null,
          p_session_token: sessionToken,
          p_limit: 50
        })

      if (error) {
        console.error('Error getting guest applications:', error)
        return { applications: [], error: 'Error al obtener solicitudes' }
      }

      return { applications: data || [], error: null }
    } catch (error) {
      console.error('Exception getting guest applications:', error)
      return { applications: [], error: 'Error interno del servidor' }
    }
  }

  /**
   * Verifica si hay una sesión activa
   */
  static async hasActiveSession(): Promise<boolean> {
    const token = this.getCurrentSessionToken()
    if (!token) return false

    const { session } = await this.getGuestSession(token)
    return session !== null
  }

  /**
   * Obtiene IP del cliente (helper)
   */
  private static async getClientIP(): Promise<string> {
    try {
      // En producción, esto vendría del header del request
      return '127.0.0.1'
    } catch {
      return '127.0.0.1'
    }
  }

  /**
   * Hash de contraseña (placeholder - implementar con bcrypt en producción)
   */
  private static async hashPassword(password: string): Promise<string> {
    // TODO: Implementar hash real con bcrypt
    return `hashed_${password}`
  }

  /**
   * Limpia sesiones expiradas (para uso administrativo)
   */
  static async cleanExpiredSessions(): Promise<{
    deletedCount: number
    error: string | null
  }> {
    try {
      const { data, error } = await supabaseClient
        .rpc('clean_expired_guest_sessions')

      if (error) {
        console.error('Error cleaning expired sessions:', error)
        return { deletedCount: 0, error: 'Error al limpiar sesiones' }
      }

      return { deletedCount: data || 0, error: null }
    } catch (error) {
      console.error('Exception cleaning expired sessions:', error)
      return { deletedCount: 0, error: 'Error interno del servidor' }
    }
  }
}
