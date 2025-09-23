import { supabaseClient } from './supabase'

export interface QuickRegistrationData {
  phone: string
  name: string
  email?: string
}

export interface RegisteredUser {
  id: string
  phone: string
  name: string
  email?: string
  user_type: string
  created_at: string
}

export class UserRegistrationService {
  
  /**
   * Registro rápido de usuario con teléfono y nombre
   */
  static async quickRegister(data: QuickRegistrationData): Promise<{
    user: RegisteredUser | null
    error: string | null
  }> {
    try {
      console.log('🔧 UserRegistrationService.quickRegister:', data)

      // Validar datos antes de enviar
      if (!this.validatePhone(data.phone)) {
        return { user: null, error: 'Teléfono inválido. Debe tener 10 dígitos.' }
      }

      if (!this.validateName(data.name)) {
        return { user: null, error: 'Nombre inválido. Debe incluir nombre y apellido.' }
      }

      // Usar SOLO la función SQL segura (evitar consultas directas)
      const { data: userData, error } = await supabaseClient
        .rpc('quick_register_user', {
          user_phone: data.phone,
          user_name: data.name,
          user_email: data.email || null
        })

      if (error) {
        console.error('❌ Error in quick_register_user:', error)
        return { user: null, error: 'Error al registrar usuario: ' + error.message }
      }

      if (!userData || userData.length === 0) {
        console.error('❌ No user data returned from registration')
        return { user: null, error: 'Error al crear usuario' }
      }

      const user = userData[0]
      console.log('✅ User registered successfully:', user.id)
      
      return { user, error: null }
    } catch (error) {
      console.error('💥 Exception in quickRegister:', error)
      return { user: null, error: 'Error interno del servidor' }
    }
  }

  /**
   * Obtener usuario por teléfono
   */
  static async getUserByPhone(phone: string): Promise<{
    user: RegisteredUser | null
    error: string | null
  }> {
    try {
      // Usar función SQL segura
      const { data: userData, error } = await supabaseClient
        .rpc('get_user_by_phone', {
          phone_number: phone
        })

      if (error) {
        console.error('❌ Error getting user by phone:', error)
        return { user: null, error: 'Error al obtener usuario' }
      }

      if (!userData || userData.length === 0) {
        return { user: null, error: 'Usuario no encontrado' }
      }

      const user = userData[0]
      return { user, error: null }
    } catch (error) {
      console.error('💥 Exception getting user by phone:', error)
      return { user: null, error: 'Error interno del servidor' }
    }
  }

  /**
   * Actualizar información del usuario
   */
  static async updateUser(userId: string, updates: Partial<QuickRegistrationData>): Promise<{
    user: RegisteredUser | null
    error: string | null
  }> {
    try {
      const { data: user, error } = await supabaseClient
        .from('z_auto_users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating user:', error)
        return { user: null, error: 'Error al actualizar usuario' }
      }

      return { user, error: null }
    } catch (error) {
      console.error('💥 Exception updating user:', error)
      return { user: null, error: 'Error interno del servidor' }
    }
  }

  /**
   * Validar formato de teléfono mexicano
   */
  static validatePhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '')
    return cleanPhone.length === 10
  }

  /**
   * Validar nombre completo (al menos 2 palabras)
   */
  static validateName(name: string): boolean {
    const words = name.trim().split(' ').filter(word => word.length > 0)
    return words.length >= 2
  }

  /**
   * Formatear teléfono para mostrar
   */
  static formatPhone(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length === 10) {
      return cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    }
    return phone
  }

  /**
   * Extraer nombre y apellidos del nombre completo
   */
  static parseFullName(fullName: string): {
    firstName: string
    lastName: string
    maternalSurname?: string
  } {
    const words = fullName.trim().split(' ').filter(word => word.length > 0)
    
    if (words.length >= 3) {
      return {
        firstName: words[0],
        lastName: words[1],
        maternalSurname: words.slice(2).join(' ')
      }
    } else if (words.length === 2) {
      return {
        firstName: words[0],
        lastName: words[1]
      }
    } else {
      return {
        firstName: words[0] || '',
        lastName: ''
      }
    }
  }

  /**
   * Generar email temporal si no se proporciona
   */
  static generateTempEmail(phone: string): string {
    return `user_${phone.replace(/\D/g, '')}@temp.fincentiva.com`
  }
}
