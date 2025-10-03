'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '../ui/button'
import { CreditApplicationService, CreateCreditApplicationData } from '../../lib/credit-application-service'
import { useAuth } from '../../../lib/auth'
import { 
  CreditSection, 
  PersonalSection, 
  EmploymentSection, 
  ReferencesSection 
} from './FormSectionsReorganized'
import { DeclarationsSection } from './AdditionalSections'
import { 
  User, 
  Briefcase, 
  Users, 
  CreditCard, 
  Shield,
  AlertCircle,
  Save,
  Download,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'

interface CreditApplicationFormProps {
  quoteId?: string
  simulationId?: string
  applicationId?: string // Para continuar solicitudes existentes
  onSuccess?: (application: any) => void
  onCancel?: () => void
  prefillData?: Partial<CreateCreditApplicationData>
}

interface FormSection {
  id: string
  title: string
  icon: React.ReactNode
  description: string
}

const FORM_SECTIONS: FormSection[] = [
  {
    id: 'credit',
    title: 'A) Datos del Crédito',
    icon: <CreditCard className="w-5 h-5" />,
    description: 'Información del producto y condiciones'
  },
  {
    id: 'identity',
    title: 'B) Información Personal',
    icon: <User className="w-5 h-5" />,
    description: 'Identidad, contacto y domicilio'
  },
  {
    id: 'employment',
    title: 'C) Información del Empleo',
    icon: <Briefcase className="w-5 h-5" />,
    description: 'Información laboral y financiera'
  },
  {
    id: 'references',
    title: 'D) Referencias Personales',
    icon: <Users className="w-5 h-5" />,
    description: 'Contactos de referencia (mínimo 3)'
  },
  {
    id: 'declarations',
    title: 'E) Declaraciones PEP',
    icon: <Shield className="w-5 h-5" />,
    description: 'Declaraciones requeridas por ley'
  }
]

export function CreditApplicationForm({
  quoteId,
  simulationId,
  applicationId: existingApplicationId,
  onSuccess,
  onCancel,
  prefillData
}: CreditApplicationFormProps) {
  const { user } = useAuth()
  
  // Obtener usuario de localStorage si useAuth no funciona - MEMOIZADO
  const getCurrentUserId = React.useCallback((): string | undefined => {
    if (user?.id) return user.id
    
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('current_user')
      if (savedUser) {
        try {
          const localUser = JSON.parse(savedUser)
          return localUser.id
        } catch (error) {
          console.error('❌ Error parsing saved user:', error)
        }
      }
    }
    return undefined
  }, [user?.id])
  
  const [currentSection, setCurrentSection] = useState(0)
  const [formData, setFormData] = useState<CreateCreditApplicationData>({
    quote_id: quoteId,
    simulation_id: simulationId,
    product_type: 'Auto',
    payment_frequency: 'mensual',
    nationality: 'Mexicana',
    birth_country: 'México',
    acts_for_self: true,
    resources_are_legal: true,
    privacy_notice_accepted: false,
    sic_authorization: false,
    marketing_consent: false,
    created_by_user_id: getCurrentUserId(),
    // Campos PEP inicializados
    is_pep: false,
    pep_position: '',
    pep_period: '',
    has_pep_relative: false,
    pep_relative_name: '',
    pep_relative_position: '',
    pep_relative_relationship: '',
    ...prefillData
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [applicationId, setApplicationId] = useState<string | null>(existingApplicationId || null)
  const [isCreatingApplication, setIsCreatingApplication] = useState(false)
  const creationInProgressRef = React.useRef(false)
  const isInitializingRef = React.useRef(true) // Prevenir auto-save durante inicialización
  const prefillAppliedRef = React.useRef(false) // Prevenir aplicación múltiple de prefill
  
  // Protección contra React Strict Mode - evitar ejecuciones múltiples
  const prefillExecutedRef = useRef(false)
  const existingAppLoadedRef = useRef(false)

  // Auto-llenar nombre del asesor si el usuario es asesor
  useEffect(() => {
    if (user && (user.user_type === 'asesor' || user.user_type === 'agency') && user.name) {
      setFormData(prev => ({
        ...prev,
        collecting_advisor_name: user.name
      }))
    }
  }, [user])

  // Pre-llenar desde cotización si se proporciona quoteId (solo si NO hay prefillData desde página)
  useEffect(() => {
    // PROTECCIÓN: Solo ejecutar una vez, incluso en React Strict Mode
    if (prefillExecutedRef.current) {
      console.log('🚫 Prefill desde quote ya ejecutado - saltando')
      return
    }
    
    if (quoteId && !prefillData) {
      prefillExecutedRef.current = true
      console.log('🔄 Obteniendo datos de pre-llenado desde cotización:', quoteId)
      CreditApplicationService.prefillFromQuote(quoteId, simulationId).then(({ data, error }) => {
        if (data && !error) {
          console.log('✅ Datos de pre-llenado obtenidos desde servicio:', data)
          setFormData(prev => {
            const updated = { ...prev, ...data }
            console.log('📝 FormData actualizado:', updated)
            return updated
          })
        } else if (error) {
          console.warn('⚠️ No se pudo pre-llenar desde cotización:', error)
        }
        
        // Desactivar bandera después de intentar prefill
        setTimeout(() => {
          isInitializingRef.current = false
          console.log('✅ Inicialización completa (desde quote) - auto-save ahora habilitado')
        }, 2000) // Aumentado a 2 segundos
      })
    } else if (!quoteId && !prefillData) {
      // Si no hay quoteId ni prefillData, desactivar bandera inmediatamente
      setTimeout(() => {
        isInitializingRef.current = false
        console.log('✅ Inicialización completa (sin prefill) - auto-save ahora habilitado')
      }, 2000) // Aumentado a 2 segundos
    }
  }, [quoteId, simulationId])

  // Aplicar prefillData cuando llegue desde la página - SOLO UNA VEZ
  useEffect(() => {
    if (prefillData && Object.keys(prefillData).length > 0 && !prefillAppliedRef.current) {
      console.log('========================================')
      console.log('📥 PREFILL DATA RECIBIDO EN FORMULARIO (PRIMERA VEZ)')
      console.log('========================================')
      console.log('🔍 Datos completos del prefill:', prefillData)
      console.log('✅ Aplicando prefillData proporcionado desde página')
      
      // Marcar como aplicado INMEDIATAMENTE para evitar duplicados
      prefillAppliedRef.current = true
      
      setFormData(prev => {
        const updated = { ...prev, ...prefillData }
        console.log('📝 FormData DESPUÉS de aplicar prefill:')
        console.log('  🚗 Vehículo:')
        console.log('    - vehicle_brand:', updated.vehicle_brand)
        console.log('    - vehicle_model:', updated.vehicle_model)
        console.log('    - vehicle_year:', updated.vehicle_year)
        console.log('    - vehicle_value:', updated.vehicle_value)
        console.log('  💰 Crédito:')
        console.log('    - requested_amount:', updated.requested_amount)
        console.log('    - term_months:', updated.term_months)
        console.log('    - monthly_payment:', updated.monthly_payment)
        console.log('    - down_payment_amount:', updated.down_payment_amount)
        console.log('    - insurance_amount:', updated.insurance_amount)
        console.log('  👤 Cliente:')
        console.log('    - first_names:', updated.first_names)
        console.log('    - personal_email:', updated.personal_email)
        console.log('    - mobile_phone:', updated.mobile_phone)
        console.log('========================================')
        return updated
      })
      
      // Desactivar bandera de inicialización después de aplicar prefill
      setTimeout(() => {
        isInitializingRef.current = false
        console.log('✅ Inicialización completa - auto-save ahora habilitado')
      }, 2000) // Aumentado a 2 segundos para evitar guardados prematuros
    }
  }, [prefillData])

  // Cargar datos de aplicación existente si se proporciona applicationId
  useEffect(() => {
    // PROTECCIÓN: Solo ejecutar una vez, incluso en React Strict Mode
    if (existingAppLoadedRef.current) {
      console.log('🚫 Carga de aplicación existente ya ejecutada - saltando')
      return
    }
    
    if (existingApplicationId) {
      existingAppLoadedRef.current = true
      console.log('🔄 Cargando aplicación existente:', existingApplicationId)
      CreditApplicationService.getCreditApplication(existingApplicationId).then(({ application, error }) => {
        if (application && !error) {
          console.log('✅ Aplicación cargada exitosamente:', application.folio_number)
          setFormData(prev => ({ ...prev, ...application }))
        } else if (error) {
          console.error('❌ Error cargando aplicación existente:', error)
        }
        
        // Desactivar bandera de inicialización
        setTimeout(() => {
          isInitializingRef.current = false
          console.log('✅ Inicialización completa (aplicación existente) - auto-save ahora habilitado')
        }, 2000)
      })
    }
  }, [existingApplicationId])

  // Limpiar timeout y referencias al desmontar componente
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      creationInProgressRef.current = false
    }
  }, [])

  // Validar completitud
  const { completionPercentage, missingFields } = CreditApplicationService.validateCompleteness(formData)

  const handleInputChange = (field: keyof CreateCreditApplicationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error de validación si existe
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    // Guardado automático después de 5 segundos de inactividad (más tiempo para evitar spam y duplicados)
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    // Solo programar guardado si no está ya guardando o creando (triple protección)
    if (!isAutoSaving && !isCreatingApplication && !creationInProgressRef.current) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave()
      }, 5000) // Aumentado a 5 segundos
    }
  }

  const autoSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  
  const handleAutoSave = async () => {
    // Prevenir auto-save durante inicialización
    if (isInitializingRef.current) {
      console.log('⏭️ Saltando guardado automático: todavía inicializando')
      return
    }
    
    // Validaciones más estrictas para evitar guardados innecesarios
    if (!formData.first_names || !formData.paternal_surname) {
      console.log('⏭️ Saltando guardado automático: datos mínimos faltantes')
      return
    }

    // Evitar guardado si ya está guardando o creando (doble protección)
    if (isAutoSaving || isCreatingApplication || creationInProgressRef.current) {
      console.log('⏭️ Saltando guardado automático: ya está guardando o creando')
      return
    }

    setIsAutoSaving(true)
    try {
      if (applicationId) {
        // Ya existe una aplicación, solo actualizarla
        console.log('🔄 Actualizando aplicación existente:', applicationId)
        
        // IMPORTANTE: Asegurar que siempre tenga el created_by_user_id correcto
        const userId = getCurrentUserId()
        console.log('👤 created_by_user_id en actualización:', userId)
        
        const result = await CreditApplicationService.updateCreditApplication(applicationId, {
          ...formData,
          created_by_user_id: userId,
          status: 'draft'
        })
        if (!result.error) {
          setLastSaved(new Date())
          console.log('💾 Guardado automático exitoso (actualización)')
        } else {
          console.error('❌ Error en guardado automático (actualización):', result.error)
        }
      } else {
        // No existe aplicación, crear una nueva SOLO si no se está creando ya
        // Protección triple: estado + ref + verificación final
        if (creationInProgressRef.current) {
          console.log('🚫 Creación ya en progreso (ref), saltando...')
          return
        }
        
        console.log('🆕 Creando nueva aplicación...')
        setIsCreatingApplication(true)
        creationInProgressRef.current = true
        
        // IMPORTANTE: Asegurar que siempre tenga el created_by_user_id correcto
        const userId = getCurrentUserId()
        console.log('👤 created_by_user_id que se enviará:', userId)
        
        try {
          const result = await CreditApplicationService.createCreditApplication({
            ...formData,
            created_by_user_id: userId,
            status: 'draft'
          })
          if (result.application?.id && !result.error) {
            setApplicationId(result.application.id)
            setLastSaved(new Date())
            console.log('💾 Guardado automático exitoso (creación):', result.application.id)
            
            // IMPORTANTE: Actualizar URL para evitar crear otra aplicación
            if (typeof window !== 'undefined') {
              const newUrl = `${window.location.pathname}?applicationId=${result.application.id}`
              window.history.replaceState({}, '', newUrl)
            }
          } else {
            console.error('❌ Error en guardado automático (creación):', result.error)
          }
        } finally {
          setIsCreatingApplication(false)
          creationInProgressRef.current = false
        }
      }
    } catch (error) {
      console.error('💥 Excepción en guardado automático:', error)
    } finally {
      setIsAutoSaving(false)
    }
  }

  const validateCurrentSection = (): boolean => {
    const errors: Record<string, string> = {}
    const section = FORM_SECTIONS[currentSection]

    switch (section.id) {
      case 'credit':
        if (!formData.requested_amount) errors.requested_amount = 'Monto solicitado requerido'
        if (!formData.term_months) errors.term_months = 'Plazo requerido'
        if (!formData.resource_usage) errors.resource_usage = 'Uso de recursos requerido'
        break
      
      case 'identity':
        if (!formData.first_names) errors.first_names = 'Nombre(s) requerido'
        if (!formData.paternal_surname) errors.paternal_surname = 'Apellido paterno requerido'
        if (!formData.personal_email) errors.personal_email = 'Email personal requerido'
        if (!formData.mobile_phone) errors.mobile_phone = 'Teléfono móvil requerido'
        if (!formData.curp) errors.curp = 'CURP requerido'
        if (!formData.birth_date) errors.birth_date = 'Fecha de nacimiento requerida'
        break
      
      case 'employment':
        if (!formData.company_name) errors.company_name = 'Nombre de empresa requerido'
        if (!formData.job_position) errors.job_position = 'Puesto requerido'
        if (!formData.monthly_income) errors.monthly_income = 'Ingreso mensual requerido'
        break
      
      case 'references':
        if (!formData.reference_1_name) errors.reference_1_name = 'Primera referencia requerida'
        if (!formData.reference_1_relationship) errors.reference_1_relationship = 'Parentesco requerido'
        if (!formData.reference_1_phone1) errors.reference_1_phone1 = 'Teléfono requerido'
        break
      
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateCurrentSection()) {
      if (currentSection < FORM_SECTIONS.length - 1) {
        setCurrentSection(currentSection + 1)
      }
    }
  }

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
    }
  }

  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      console.log('🔍 [DEBUG] Guardando borrador - formData actual:', {
        vehicle_brand: formData.vehicle_brand,
        vehicle_model: formData.vehicle_model,
        vehicle_year: formData.vehicle_year,
        vehicle_value: formData.vehicle_value,
        monthly_payment: formData.monthly_payment,
        down_payment_amount: formData.down_payment_amount,
        insurance_amount: formData.insurance_amount,
        insurance_mode: formData.insurance_mode,
        requested_amount: formData.requested_amount,
        term_months: formData.term_months,
        first_names: formData.first_names
      })

      if (applicationId) {
        // Actualizar existente
        const updateData = { ...formData, status: 'draft' }
        console.log('🔄 [DEBUG] Actualizando solicitud existente:', applicationId)
        console.log('🔄 [DEBUG] Datos a enviar:', updateData)
        
        const { application, error } = await CreditApplicationService.updateCreditApplication(
          applicationId, 
          updateData
        )
        if (error) {
          console.error('❌ Error actualizando borrador:', error)
          alert('Error al guardar borrador: ' + error)
        } else {
          console.log('✅ Borrador actualizado exitosamente:', application?.folio_number)
          setLastSaved(new Date())
          alert('Borrador guardado exitosamente')
        }
      } else {
        // Crear nuevo
        const createData = { ...formData, status: 'draft' }
        console.log('📝 [DEBUG] Creando nueva solicitud')
        console.log('📝 [DEBUG] Datos a enviar:', createData)
        
        const { application, error } = await CreditApplicationService.createCreditApplication(createData)
        if (error) {
          console.error('❌ Error creando borrador:', error)
          alert('Error al guardar borrador: ' + error)
        } else {
          console.log('✅ Borrador creado exitosamente:', application?.folio_number)
          setApplicationId(application?.id || null)
          setLastSaved(new Date())
          alert('Borrador guardado exitosamente')
        }
      }
    } catch (error) {
      console.error('💥 Error saving draft:', error)
      alert('Error al guardar borrador')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    // Validar todas las secciones
    let allValid = true
    for (let i = 0; i < FORM_SECTIONS.length; i++) {
      setCurrentSection(i)
      if (!validateCurrentSection()) {
        allValid = false
        break
      }
    }

    if (!allValid) {
      alert('Por favor complete todos los campos requeridos')
      return
    }

    setIsSubmitting(true)
    try {
      const submissionData = {
        ...formData,
        status: 'submitted',
        client_signature_date: new Date().toISOString()
      }

      let result
      if (applicationId) {
        result = await CreditApplicationService.updateCreditApplication(applicationId, submissionData)
      } else {
        result = await CreditApplicationService.createCreditApplication(submissionData)
      }

      if (result.error) {
        alert('Error al enviar solicitud: ' + result.error)
      } else {
        alert('Solicitud enviada exitosamente. Folio: ' + result.application?.folio_number)
        onSuccess?.(result.application)
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('Error al enviar solicitud')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderCurrentSection = () => {
    const section = FORM_SECTIONS[currentSection]
    
    switch (section.id) {
      case 'credit':
        return <CreditSection formData={formData} onChange={handleInputChange} errors={validationErrors} />
      case 'identity':
        return <PersonalSection formData={formData} onChange={handleInputChange} errors={validationErrors} />
      case 'employment':
        return <EmploymentSection formData={formData} onChange={handleInputChange} errors={validationErrors} />
      case 'references':
        return <ReferencesSection formData={formData} onChange={handleInputChange} errors={validationErrors} />
      case 'declarations':
        return <DeclarationsSection formData={formData} onChange={handleInputChange} errors={validationErrors} />
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Solicitud de Crédito Automotriz
          </h1>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progreso del formulario</span>
            <div className="flex items-center gap-2">
              <span>{completionPercentage}% completado</span>
              {isAutoSaving && (
                <div className="flex items-center text-blue-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                  <span className="text-xs">Guardando...</span>
                </div>
              )}
              {lastSaved && !isAutoSaving && (
                <span className="text-xs text-green-600">
                  Guardado {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Section Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
          {FORM_SECTIONS.map((section, index) => (
            <button
              key={section.id}
              onClick={() => setCurrentSection(index)}
              className={`p-3 text-xs rounded-lg border transition-all ${
                index === currentSection
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : index < currentSection
                  ? 'bg-green-100 border-green-300 text-green-600'
                  : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                {section.icon}
              </div>
              <div className="font-medium">{section.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Section */}
      <div className="mb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            {FORM_SECTIONS[currentSection].icon}
            <h2 className="text-xl font-semibold text-green-800 ml-2">
              {FORM_SECTIONS[currentSection].title}
            </h2>
          </div>
          <p className="text-green-700">
            {FORM_SECTIONS[currentSection].description}
          </p>
        </div>

        {renderCurrentSection()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar Borrador'}
          </Button>
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSection === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          {currentSection < FORM_SECTIONS.length - 1 ? (
            <Button onClick={handleNext} className="bg-green-600 hover:bg-green-700">
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || completionPercentage < 80}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          )}
        </div>
      </div>

      {/* Missing Fields Alert */}
      {missingFields.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <h3 className="font-medium text-yellow-800">Campos pendientes</h3>
          </div>
          <p className="text-yellow-700 text-sm">
            Faltan {missingFields.length} campos requeridos para completar la solicitud.
          </p>
        </div>
      )}
    </div>
  )
}

