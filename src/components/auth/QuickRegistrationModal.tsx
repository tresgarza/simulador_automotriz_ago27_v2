'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { X, Phone, User, Mail } from 'lucide-react'

interface QuickRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (userData: { phone: string; name: string; email?: string }) => void
  prefillData?: {
    name?: string
    email?: string
    phone?: string
  }
}

export function QuickRegistrationModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  prefillData 
}: QuickRegistrationModalProps) {
  const [formData, setFormData] = useState({
    phone: prefillData?.phone || '',
    name: prefillData?.name || '',
    email: prefillData?.email || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validar teléfono (10 dígitos)
    if (!formData.phone) {
      newErrors.phone = 'El teléfono es requerido'
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Ingresa un teléfono válido de 10 dígitos'
    }

    // Validar nombre (al menos 2 palabras)
    if (!formData.name) {
      newErrors.name = 'El nombre completo es requerido'
    } else if (formData.name.trim().split(' ').length < 2) {
      newErrors.name = 'Ingresa tu nombre y apellido'
    }

    // Email ahora es REQUERIDO para poder iniciar sesión después
    if (!formData.email) {
      newErrors.email = 'El email es requerido para iniciar sesión'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresa un email válido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      // Simular delay de registro
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSuccess({
        phone: formData.phone,
        name: formData.name,
        email: formData.email || undefined
      })
    } catch (error) {
      console.error('Error in registration:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    }
    return numbers.substring(0, 10).replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setFormData(prev => ({ ...prev, phone: formatted }))
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }))
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, name: e.target.value }))
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }))
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, email: e.target.value }))
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Crear Cuenta</h2>
            <p className="text-sm text-gray-600 mt-1">
              Para continuar con tu solicitud de crédito
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
          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Teléfono *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="555-123-4567"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              maxLength={12}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Nombre Completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Nombre Completo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Juan Pérez García"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email (Requerido) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email (requerido para iniciar sesión)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={handleEmailChange}
              placeholder="juan@ejemplo.com"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Te enviaremos actualizaciones sobre tu solicitud
            </p>
          </div>

          {/* Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">¿Por qué necesitamos esto?</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• <strong>Email:</strong> Para iniciar sesión y acceder a tus solicitudes</li>
              <li>• <strong>Teléfono:</strong> Para contactarte sobre tu crédito</li>
              <li>• Para guardar tu solicitud de forma segura</li>
              <li>• Para que puedas continuar después si necesitas</li>
              <li>• Para enviarte actualizaciones del proceso</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </div>
              ) : (
                'Crear Cuenta'
              )}
            </Button>
          </div>

          {/* Privacy */}
          <p className="text-xs text-gray-500 text-center pt-2">
            Al crear tu cuenta, aceptas nuestros términos de servicio y política de privacidad.
            Tus datos están protegidos y no los compartimos con terceros.
          </p>
        </form>
      </div>
    </div>
  )
}


