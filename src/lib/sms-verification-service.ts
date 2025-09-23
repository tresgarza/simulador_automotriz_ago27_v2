import { supabaseClient } from './supabase'

export interface SMSVerificationCode {
  verification_code: string
  expires_at: string
  phone: string
}

export interface VerificationResult {
  is_valid: boolean
  message: string
  user_data?: any
}

export class SMSVerificationService {
  // URL del webhook de Zapier para envío de SMS
  private static ZAPIER_WEBHOOK_URL = process.env.NEXT_PUBLIC_ZAPIER_SMS_WEBHOOK_URL || 'https://hooks.zapier.com/hooks/catch/20143097/u1hgdbq/'

  /**
   * Solicitar código de verificación por SMS
   */
  static async requestVerificationCode(
    phone: string,
    purpose: 'login' | 'registration' = 'login'
  ): Promise<{
    success: boolean
    message: string
    expiresAt?: string
  }> {
    try {
      console.log('🔧 SMSVerificationService.requestVerificationCode:', { phone, purpose })

      // Validar teléfono
      if (!this.validatePhone(phone)) {
        return { success: false, message: 'Teléfono inválido. Debe tener 10 dígitos.' }
      }

      // Si es para login, verificar que el usuario existe
      if (purpose === 'login') {
        const { data: user } = await supabaseClient
          .rpc('get_user_by_phone', { phone_number: phone })

        if (!user || user.length === 0) {
          return { 
            success: false, 
            message: 'No encontramos una cuenta con este teléfono. ¿Quieres crear una cuenta nueva?' 
          }
        }
      }

      // Obtener código predefinido disponible
      const { data: codeData, error } = await supabaseClient
        .rpc('get_available_verification_code', {
          user_phone: phone,
          code_purpose: purpose
        })

      if (error) {
        console.error('❌ Error creating verification code:', error)
        return { success: false, message: error.message || 'Error al generar código' }
      }

      if (!codeData || codeData.length === 0) {
        return { success: false, message: 'Error al generar código de verificación' }
      }

      const verificationData = codeData[0]

      // Enviar SMS a través de Zapier
      const smsResult = await this.sendSMSViaZapier(
        phone,
        verificationData.verification_code,
        purpose
      )

      if (!smsResult.success) {
        return { success: false, message: 'Error al enviar SMS: ' + smsResult.message }
      }

      console.log('✅ Verification code sent successfully')
      return {
        success: true,
        message: 'Código enviado por SMS. Válido por 5 minutos.',
        expiresAt: verificationData.expires_at
      }
    } catch (error) {
      console.error('💥 Exception in requestVerificationCode:', error)
      return { success: false, message: 'Error interno del servidor' }
    }
  }

  /**
   * Verificar código SMS
   */
  static async verifyCode(
    phone: string,
    code: string,
    purpose: 'login' | 'registration' = 'login'
  ): Promise<{
    success: boolean
    message: string
    userData?: any
  }> {
    try {
      console.log('🔧 SMSVerificationService.verifyCode:', { phone, code: '***', purpose })

      // Validaciones básicas
      if (!this.validatePhone(phone)) {
        return { success: false, message: 'Teléfono inválido' }
      }

      if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
        return { success: false, message: 'Código debe tener 6 dígitos' }
      }

      // Verificar código en BD
      const { data: verificationResult, error } = await supabaseClient
        .rpc('verify_sms_code', {
          user_phone: phone,
          input_code: code,
          code_purpose: purpose
        })

      if (error) {
        console.error('❌ Error verifying code:', error)
        return { success: false, message: 'Error al verificar código' }
      }

      if (!verificationResult || verificationResult.length === 0) {
        return { success: false, message: 'Error en la verificación' }
      }

      const result = verificationResult[0]

      if (!result.is_valid) {
        // Incrementar contador de intentos fallidos
        await supabaseClient.rpc('increment_verification_attempts', {
          user_phone: phone,
          input_code: code,
          code_purpose: purpose
        })

        return { success: false, message: result.message }
      }

      console.log('✅ Code verified successfully')
      return {
        success: true,
        message: result.message,
        userData: result.user_data
      }
    } catch (error) {
      console.error('💥 Exception in verifyCode:', error)
      return { success: false, message: 'Error interno del servidor' }
    }
  }

  /**
   * Enviar SMS a través de Zapier webhook
   */
  private static async sendSMSViaZapier(
    phone: string,
    code: string,
    purpose: string
  ): Promise<{
    success: boolean
    message: string
  }> {
    try {
      console.log('📱 Enviando SMS via Zapier:', { phone, code, purpose })

      const message = this.generateSMSMessage(code, purpose)

      const response = await fetch(this.ZAPIER_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          message: message,
          code: code,
          purpose: purpose,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ SMS sent via Zapier:', result)

      return { success: true, message: 'SMS enviado correctamente' }
    } catch (error) {
      console.error('❌ Error sending SMS via Zapier:', error)
      return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' }
    }
  }

  /**
   * Generar mensaje SMS
   */
  private static generateSMSMessage(code: string, purpose: string): string {
    const baseMessage = `Tu código de verificación de Fincentiva es: ${code}`
    const expiryMessage = 'Válido por 5 minutos.'
    const securityMessage = 'No compartas este código con nadie.'

    switch (purpose) {
      case 'login':
        return `${baseMessage}\n\nPara iniciar sesión en tu cuenta.\n${expiryMessage}\n${securityMessage}`
      case 'registration':
        return `${baseMessage}\n\nPara completar tu registro.\n${expiryMessage}\n${securityMessage}`
      default:
        return `${baseMessage}\n\n${expiryMessage}\n${securityMessage}`
    }
  }

  /**
   * Validar formato de teléfono
   */
  private static validatePhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '')
    return cleanPhone.length === 10
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
   * Limpiar códigos expirados (función de mantenimiento)
   */
  static async cleanupExpiredCodes(): Promise<number> {
    try {
      const { data, error } = await supabaseClient
        .rpc('release_expired_codes')

      if (error) {
        console.error('❌ Error releasing expired codes:', error)
        return 0
      }

      console.log(`♻️ Released ${data || 0} expired codes for reuse`)
      return data || 0
    } catch (error) {
      console.error('💥 Exception in cleanupExpiredCodes:', error)
      return 0
    }
  }

  /**
   * Regenerar códigos predefinidos (función de mantenimiento)
   */
  static async regeneratePredefinedCodes(): Promise<number> {
    try {
      const { data, error } = await supabaseClient
        .rpc('generate_predefined_codes')

      if (error) {
        console.error('❌ Error regenerating predefined codes:', error)
        return 0
      }

      console.log(`🔄 Generated ${data || 0} new predefined codes`)
      return data || 0
    } catch (error) {
      console.error('💥 Exception in regeneratePredefinedCodes:', error)
      return 0
    }
  }

  /**
   * Ver estadísticas de códigos
   */
  static async getCodeStats(): Promise<{
    total: number
    used: number
    available: number
  }> {
    try {
      const { data, error } = await supabaseClient
        .from('z_auto_predefined_verification_codes')
        .select('is_used')

      if (error) {
        console.error('❌ Error getting code stats:', error)
        return { total: 0, used: 0, available: 0 }
      }

      const total = data.length
      const used = data.filter(code => code.is_used).length
      const available = total - used

      return { total, used, available }
    } catch (error) {
      console.error('💥 Exception in getCodeStats:', error)
      return { total: 0, used: 0, available: 0 }
    }
  }
}
