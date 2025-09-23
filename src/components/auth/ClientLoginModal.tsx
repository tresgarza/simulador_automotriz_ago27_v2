'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { X, Phone, User, LogIn, MessageSquare, Shield } from 'lucide-react'
import { SMSVerificationService } from '../../lib/sms-verification-service'

interface ClientLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (userData: any) => void
}

export function ClientLoginModal({ 
  isOpen, 
  onClose, 
  onSuccess
}: ClientLoginModalProps) {
  const [phone, setPhone] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    }
    return numbers.substring(0, 10).replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
    if (error) {
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (step === 'phone') {
      // Paso 1: Solicitar código SMS
      if (!phone || phone.replace(/\D/g, '').length !== 10) {
        setError('Ingresa un teléfono válido de 10 dígitos')
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const result = await SMSVerificationService.requestVerificationCode(phone, 'login')
        
        if (!result.success) {
          setError(result.message)
          return
        }

        // SMS enviado exitosamente
        setExpiresAt(result.expiresAt || null)
        setStep('code')
      } catch (error) {
        console.error('Error requesting SMS code:', error)
        setError('Error al enviar código SMS. Intenta de nuevo.')
      } finally {
        setIsLoading(false)
      }
    } else {
      // Paso 2: Verificar código SMS
      if (!verificationCode || verificationCode.length !== 6) {
        setError('Ingresa el código de 6 dígitos')
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const result = await SMSVerificationService.verifyCode(phone, verificationCode, 'login')
        
        if (!result.success) {
          setError(result.message)
          return
        }

        // Verificación exitosa
        onSuccess(result.userData)
      } catch (error) {
        console.error('Error verifying SMS code:', error)
        setError('Error al verificar código. Intenta de nuevo.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleBackToPhone = () => {
    setStep('phone')
    setVerificationCode('')
    setError(null)
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await SMSVerificationService.requestVerificationCode(phone, 'login')
      
      if (result.success) {
        setExpiresAt(result.expiresAt || null)
        setError(null)
      } else {
        setError(result.message)
      }
    } catch (error) {
      setError('Error al reenviar código')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 'phone' ? 'Iniciar Sesión' : 'Verificar Código'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {step === 'phone' 
                ? 'Te enviaremos un código por SMS' 
                : `Código enviado a ${SMSVerificationService.formatPhone(phone)}`
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {step === 'phone' ? (
            /* Paso 1: Teléfono */
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Número de Teléfono
              </label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="555-123-4567"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={12}
                disabled={isLoading}
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
              )}
            </div>
          ) : (
            /* Paso 2: Código de verificación */
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Código de Verificación
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').substring(0, 6)
                  setVerificationCode(value)
                  if (error) setError(null)
                }}
                placeholder="123456"
                className={`w-full px-4 py-3 border rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={6}
                disabled={isLoading}
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
              )}
              
              {/* Botones de código */}
              <div className="flex justify-between items-center mt-3">
                <button
                  type="button"
                  onClick={handleBackToPhone}
                  className="text-sm text-gray-600 hover:text-gray-800"
                  disabled={isLoading}
                >
                  ← Cambiar teléfono
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-sm text-green-600 hover:text-green-700"
                  disabled={isLoading}
                >
                  Reenviar código
                </button>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Shield className="w-4 h-4 text-green-600 mr-2" />
              <h4 className="font-medium text-green-800">
                {step === 'phone' ? 'Autenticación Segura' : 'Verificación SMS'}
              </h4>
            </div>
            <ul className="text-sm text-green-700 space-y-1">
              {step === 'phone' ? (
                <>
                  <li>• Te enviaremos un código de 6 dígitos por SMS</li>
                  <li>• El código es válido por 5 minutos</li>
                  <li>• Solo tú puedes acceder con tu teléfono</li>
                  <li>• Tus datos están completamente seguros</li>
                </>
              ) : (
                <>
                  <li>• Revisa tu teléfono para el código SMS</li>
                  <li>• El código expira en 5 minutos</li>
                  <li>• Puedes solicitar un nuevo código si es necesario</li>
                  <li>• No compartas este código con nadie</li>
                </>
              )}
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {step === 'phone' ? 'Enviando...' : 'Verificando...'}
                </div>
              ) : (
                <div className="flex items-center">
                  {step === 'phone' ? (
                    <>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Enviar Código SMS
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Verificar Código
                    </>
                  )}
                </div>
              )}
            </Button>
          </div>

          {/* Help */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              ¿No tienes cuenta? 
              <button
                type="button"
                onClick={onClose}
                className="text-green-600 hover:text-green-700 font-medium ml-1"
              >
                Crear una nueva
              </button>
            </p>
          </div>

          {/* Privacy */}
          <p className="text-xs text-gray-500 text-center pt-2">
            Solo necesitamos tu teléfono para verificar tu identidad.
            Tus datos están protegidos y no los compartimos con terceros.
          </p>
        </form>
      </div>
    </div>
  )
}
