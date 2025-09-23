import { supabaseClient } from './supabase'

export interface EmailVerificationCode {
  verification_code: string
  expires_at: string
  email: string
}

export interface VerificationResult {
  is_valid: boolean
  message: string
  user_data?: any
}

export class EmailVerificationService {
  // URL del webhook de Zapier para envío de emails
  private static ZAPIER_WEBHOOK_URL = process.env.NEXT_PUBLIC_ZAPIER_EMAIL_WEBHOOK_URL || 'https://hooks.zapier.com/hooks/catch/20143097/u1hgdbq/'

  /**
   * Solicitar código de verificación por email
   */
  static async requestVerificationCode(
    email: string,
    purpose: 'login' | 'registration' = 'login'
  ): Promise<{
    success: boolean
    message: string
    expiresAt?: string
  }> {
    try {
      console.log('🔧 EmailVerificationService.requestVerificationCode:', { email, purpose })

      // Validar email
      if (!EmailVerificationService.validateEmail(email)) {
        return { success: false, message: 'Email inválido' }
      }

      // Si es para login, verificar que el usuario existe
      if (purpose === 'login') {
        const { data: user } = await supabaseClient
          .from('z_auto_users')
          .select('*')
          .eq('email', email)
          .eq('is_active', true)
          .single()

        if (!user) {
          return { 
            success: false, 
            message: 'No encontramos una cuenta con este email. ¿Quieres crear una cuenta nueva?' 
          }
        }
      }

      // SOLUCIÓN TEMPORAL: Generar código sin usar base de datos
      // Esto evita el error del campo phone varchar(20) hasta que se ejecute el SQL
      const selectedCode = Math.floor(100000 + Math.random() * 900000).toString()
      const expiryTime = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

      console.log('🔧 MODO TEMPORAL: Generando código sin BD para evitar error varchar(20)')
      console.log('📧 Email:', email, '(', email.length, 'caracteres)')
      console.log('🔢 Código generado:', selectedCode)

      // Guardar en localStorage para verificación temporal
      const tempVerification = {
        email: email,
        code: selectedCode,
        purpose: purpose,
        expiresAt: expiryTime.toISOString(),
        createdAt: new Date().toISOString()
      }

      // Usar localStorage como almacén temporal
      if (typeof window !== 'undefined') {
        const existingCodes = JSON.parse(localStorage.getItem('temp_email_codes') || '[]')
        existingCodes.push(tempVerification)
        // Mantener solo los últimos 10 códigos
        if (existingCodes.length > 10) {
          existingCodes.splice(0, existingCodes.length - 10)
        }
        localStorage.setItem('temp_email_codes', JSON.stringify(existingCodes))
        console.log('💾 Código guardado temporalmente en localStorage')
      }

      const verificationData = {
        verification_code: selectedCode,
        expires_at: expiryTime.toISOString()
      }

      // Enviar email a través de Zapier
      const emailResult = await this.sendEmailViaZapier(
        email,
        verificationData.verification_code,
        purpose
      )

      if (!emailResult.success) {
        return { success: false, message: 'Error al enviar email: ' + emailResult.message }
      }

      console.log('✅ Verification code sent successfully via email')
      return {
        success: true,
        message: 'Código enviado por email. Válido por 10 minutos.',
        expiresAt: verificationData.expires_at
      }
    } catch (error) {
      console.error('💥 Exception in requestVerificationCode:', error)
      return { success: false, message: 'Error interno del servidor' }
    }
  }

  /**
   * Verificar código de email
   */
  static async verifyCode(
    email: string,
    code: string,
    purpose: 'login' | 'registration' = 'login'
  ): Promise<{
    success: boolean
    message: string
    userData?: any
  }> {
    try {
      console.log('🔧 EmailVerificationService.verifyCode:', { email, code: '***', purpose })

      // Validaciones básicas
      if (!EmailVerificationService.validateEmail(email)) {
        return { success: false, message: 'Email inválido' }
      }

      if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
        return { success: false, message: 'Código debe tener 6 dígitos' }
      }

      // SOLUCIÓN TEMPORAL: Verificar código desde localStorage
      console.log('🔧 MODO TEMPORAL: Verificando código desde localStorage')
      console.log('📧 Email:', email, 'Código:', code)

      if (typeof window === 'undefined') {
        return { success: false, message: 'Error: verificación no disponible en servidor' }
      }

      const existingCodes = JSON.parse(localStorage.getItem('temp_email_codes') || '[]')
      const now = new Date()

      // Buscar código válido
      const validCode = existingCodes.find((item: any) => 
        item.email === email &&
        item.code === code &&
        item.purpose === purpose &&
        new Date(item.expiresAt) > now
      )

      if (!validCode) {
        console.log('❌ Código no encontrado o expirado')
        console.log('📋 Códigos disponibles:', existingCodes.map((c: any) => ({
          email: c.email,
          code: c.code,
          expired: new Date(c.expiresAt) <= now
        })))
        return { success: false, message: 'Código inválido o expirado' }
      }

      // Marcar código como usado (remover de localStorage)
      const updatedCodes = existingCodes.filter((item: any) => 
        !(item.email === email && item.code === code)
      )
      localStorage.setItem('temp_email_codes', JSON.stringify(updatedCodes))
      console.log('✅ Código verificado y removido de localStorage')

      // Si es para login, buscar datos del usuario por email
      if (purpose === 'login') {
        const { data: user, error: userError } = await supabaseClient
          .from('z_auto_users')
          .select('*')
          .eq('email', email)
          .eq('is_active', true)
          .single()

        if (userError || !user) {
          console.error('❌ User not found:', userError)
          return { success: false, message: 'Usuario no encontrado' }
        }

        console.log('✅ Code verified successfully')
        return {
          success: true,
          message: 'Código verificado correctamente',
          userData: user
        }
      } else {
        // Para otros propósitos, solo confirmar verificación
        console.log('✅ Code verified successfully')
        return {
          success: true,
          message: 'Código verificado correctamente',
          userData: null
        }
      }
    } catch (error) {
      console.error('💥 Exception in verifyCode:', error)
      return { success: false, message: 'Error interno del servidor' }
    }
  }

  /**
   * Enviar email a través de Zapier webhook
   */
  private static async sendEmailViaZapier(
    email: string,
    code: string,
    purpose: string
  ): Promise<{
    success: boolean
    message: string
  }> {
    try {
      console.log('📧 Enviando email via Zapier:', { email, code, purpose })

      const emailData = this.generateEmailData(email, code, purpose)

      const response = await fetch(this.ZAPIER_WEBHOOK_URL, {
        method: 'POST',
        // Remover Content-Type header para evitar CORS preflight
        // Zapier acepta datos sin este header
        body: JSON.stringify(emailData)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Email sent via Zapier:', result)

      return { success: true, message: 'Email enviado correctamente' }
    } catch (error) {
      console.error('❌ Error sending email via Zapier:', error)
      return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' }
    }
  }

  /**
   * Generar datos para el email
   */
  private static generateEmailData(email: string, code: string, purpose: string) {
    const subject = this.generateEmailSubject(purpose)
    const htmlBody = this.generateEmailHTML(code, purpose)
    const textBody = this.generateEmailText(code, purpose)

    return {
      to: email,
      subject: subject,
      html_body: htmlBody,
      text_body: textBody,
      code: code,
      purpose: purpose,
      timestamp: new Date().toISOString(),
      from_name: 'Fincentiva',
      from_email: 'noreply@fincentiva.com'
    }
  }

  /**
   * Generar asunto del email
   */
  private static generateEmailSubject(purpose: string): string {
    switch (purpose) {
      case 'login':
        return '🔐 Tu código de verificación - Fincentiva'
      case 'registration':
        return '✅ Confirma tu registro - Fincentiva'
      default:
        return '🔐 Código de verificación - Fincentiva'
    }
  }

  /**
   * Generar HTML del email
   */
  private static generateEmailHTML(code: string, purpose: string): string {
    const actionText = purpose === 'login' ? 'iniciar sesión' : 'completar tu registro'
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Código de Verificación - Fincentiva</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏦 Fincentiva</h1>
            <p style="color: #d1fae5; margin: 10px 0 0 0;">Tu aliado financiero</p>
        </div>
        
        <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">🔐 Código de Verificación</h2>
            
            <p>Hola,</p>
            
            <p>Has solicitado ${actionText} en tu cuenta de Fincentiva. Tu código de verificación es:</p>
            
            <div style="background: #f3f4f6; border: 2px solid #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 8px; font-family: monospace;">${code}</span>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;"><strong>⏰ Importante:</strong></p>
                <ul style="margin: 10px 0 0 0; color: #92400e;">
                    <li>Este código es válido por <strong>10 minutos</strong></li>
                    <li>Solo puedes usarlo una vez</li>
                    <li>No compartas este código con nadie</li>
                </ul>
            </div>
            
            <p>Si no solicitaste este código, puedes ignorar este email de forma segura.</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <div style="text-align: center; color: #6b7280; font-size: 14px;">
                <p><strong>Fincentiva</strong><br>
                Tu aliado en créditos automotrices</p>
                <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            </div>
        </div>
    </body>
    </html>
    `
  }

  /**
   * Generar texto plano del email
   */
  private static generateEmailText(code: string, purpose: string): string {
    const actionText = purpose === 'login' ? 'iniciar sesión' : 'completar tu registro'
    
    return `
🏦 FINCENTIVA - Código de Verificación

Hola,

Has solicitado ${actionText} en tu cuenta de Fincentiva.

Tu código de verificación es: ${code}

IMPORTANTE:
- Este código es válido por 10 minutos
- Solo puedes usarlo una vez  
- No compartas este código con nadie

Si no solicitaste este código, puedes ignorar este email.

---
Fincentiva - Tu aliado financiero
Este es un email automático, no respondas a este mensaje.
    `.trim()
  }

  /**
   * Validar formato de email
   */
  private static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Formatear email para mostrar (ocultar parte del email)
   */
  static formatEmail(email: string): string {
    const [username, domain] = email.split('@')
    if (username.length <= 3) {
      return `${username[0]}***@${domain}`
    }
    return `${username.substring(0, 3)}***@${domain}`
  }

  /**
   * Limpiar códigos expirados
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
}
