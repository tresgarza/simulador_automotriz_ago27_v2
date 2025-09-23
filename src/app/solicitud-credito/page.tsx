'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CreditApplicationForm } from '../../components/credit-application/CreditApplicationForm'
import { CreditApplicationService } from '../../lib/credit-application-service'
import { UserRegistrationService, QuickRegistrationData } from '../../lib/user-registration-service'
import { QuickRegistrationModal } from '../../components/auth/QuickRegistrationModal'
import { generateCreditApplicationPDF } from '../../lib/credit-application-pdf-generator'
import { ArrowLeft, FileText, CheckCircle, User, Phone } from 'lucide-react'
import { Button } from '../../components/ui/button'
import Link from 'next/link'

function SolicitudCreditoContent() {
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('quote_id')
  const simulationId = searchParams.get('simulation_id')
  const applicationId = searchParams.get('application_id') // Para continuar solicitudes
  
  const [prefillData, setPrefillData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)
  const [submittedApplication, setSubmittedApplication] = useState<any>(null)
  const [existingApplication, setExistingApplication] = useState<any>(null)
  
  // Estados para registro obligatorio
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [needsRegistration, setNeedsRegistration] = useState(true)

  // Cargar solicitud existente si hay applicationId
  useEffect(() => {
    if (applicationId) {
      setIsLoading(true)
      CreditApplicationService.getCreditApplication(applicationId).then(({ application, error }) => {
        if (application && !error) {
          setExistingApplication(application)
          setPrefillData(application) // Usar la solicitud existente como prefill
        } else {
          console.error('Error loading existing application:', error)
        }
        setIsLoading(false)
      })
    }
  }, [applicationId])

  // Pre-llenar datos si hay quoteId (solo si no hay applicationId)
  useEffect(() => {
    console.log('🔍 [DEBUG] SolicitudCreditoPage useEffect - quoteId:', quoteId, 'applicationId:', applicationId)
    
    if (quoteId && !applicationId) {
      console.log('🔄 Obteniendo datos de pre-llenado para quoteId:', quoteId)
      setIsLoading(true)
      CreditApplicationService.prefillFromQuote(quoteId, simulationId || undefined).then(({ data, error }) => {
        if (data && !error) {
          console.log('✅ Datos de pre-llenado obtenidos en página:', data)
          setPrefillData(data)
        } else if (error) {
          console.error('❌ Error obteniendo datos de pre-llenado:', error)
        }
        setIsLoading(false)
      })
    }
  }, [quoteId, simulationId, applicationId])

  // Verificar si necesita registro al cargar la página
  useEffect(() => {
    const checkUserRegistration = () => {
      // Verificar si hay usuario en localStorage (simulando auth)
      const savedUser = localStorage.getItem('current_user')
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser)
          setCurrentUser(user)
          setNeedsRegistration(false)
        } catch (error) {
          console.error('Error parsing saved user:', error)
          localStorage.removeItem('current_user')
        }
      }

      // Si no hay usuario y no hay applicationId, mostrar modal de registro
      if (!savedUser && !applicationId) {
        setShowRegistrationModal(true)
      }
    }

    checkUserRegistration()
  }, [applicationId])

  const handleApplicationSuccess = async (application: any) => {
    console.log('🔍 [DEBUG] handleApplicationSuccess - received application:', application)
    
    // Si tenemos un ID pero datos incompletos, obtener los datos completos
    if (application?.id && !application.folio_number) {
      console.log('🔄 Obteniendo datos completos de la aplicación...')
      try {
        const { application: fullApplication, error } = await CreditApplicationService.getCreditApplication(application.id)
        if (fullApplication && !error) {
          console.log('✅ Datos completos obtenidos:', fullApplication.folio_number)
          setSubmittedApplication(fullApplication)
        } else {
          console.warn('⚠️ No se pudieron obtener datos completos, usando datos parciales')
          setSubmittedApplication(application)
        }
      } catch (error) {
        console.error('❌ Error obteniendo datos completos:', error)
        setSubmittedApplication(application)
      }
    } else {
      setSubmittedApplication(application)
    }
    
    setApplicationSubmitted(true)
  }

  const handleRegistrationSuccess = async (userData: QuickRegistrationData) => {
    try {
      setIsLoading(true)
      
      // Registrar usuario
      const { user, error } = await UserRegistrationService.quickRegister(userData)
      
      if (error || !user) {
        alert('Error al crear cuenta: ' + error)
        return
      }

      // Guardar usuario en localStorage
      localStorage.setItem('current_user', JSON.stringify(user))
      setCurrentUser(user)
      setNeedsRegistration(false)
      setShowRegistrationModal(false)

      // Preparar datos de prefill con información del usuario y cotización
      const newPrefillData = {
        ...prefillData,
        created_by_user_id: user.id,
        personal_email: user.email,
        mobile_phone: user.phone,
        ...UserRegistrationService.parseFullName(user.name)
      }

      setPrefillData(newPrefillData)
      
      console.log('✅ Usuario registrado exitosamente:', user.name)
    } catch (error) {
      console.error('Error in registration:', error)
      alert('Error al crear cuenta')
    } finally {
      setIsLoading(false)
    }
  }

  if (applicationSubmitted && submittedApplication) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ¡Solicitud Enviada Exitosamente!
              </h1>
              <p className="text-gray-600">
                Tu solicitud de crédito ha sido recibida y está siendo procesada.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-green-800 mb-2">
                Detalles de tu Solicitud
              </h2>
              <div className="space-y-2 text-sm text-green-700">
                <p><strong>Folio:</strong> {submittedApplication.folio_number}</p>
                <p><strong>Fecha:</strong> {new Date(submittedApplication.created_at).toLocaleDateString('es-MX')}</p>
                <p><strong>Monto Solicitado:</strong> {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(submittedApplication.requested_amount)}</p>
                <p><strong>Plazo:</strong> {submittedApplication.term_months} meses</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Recibirás una confirmación por email y un asesor se pondrá en contacto contigo 
                en las próximas 24 horas para continuar con el proceso.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={async () => {
                    try {
                      console.log('🔍 [DEBUG] submittedApplication:', submittedApplication)
                      console.log('🔍 [DEBUG] folio_number:', submittedApplication?.folio_number)
                      await generateCreditApplicationPDF(submittedApplication)
                    } catch (error) {
                      console.error('Error generating PDF:', error)
                      alert('Error al generar el PDF. Por favor, intenta nuevamente.')
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Descargar Solicitud PDF
                </Button>

                <Link href="/">
                  <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver al Simulador
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Solicitud de Crédito Automotriz</h1>
                <p className="text-gray-600">Financiera Incentiva - Tu aliado financiero</p>
              </div>
            </div>
            
            {/* Logo placeholder */}
            <div className="hidden md:block">
              <div className="w-32 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FINCENTIVA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        {isLoading ? (
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando información...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-4">
            {/* User Info */}
            {currentUser && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-green-800">
                      Cuenta: {currentUser.name}
                    </p>
                    <p className="text-sm text-green-600">
                      <Phone className="w-4 h-4 inline mr-1" />
                      {UserRegistrationService.formatPhone(currentUser.phone)}
                      {currentUser.email && ` • ${currentUser.email}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info Banner */}
            {quoteId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-blue-900">Solicitud vinculada a cotización</h3>
                    <p className="text-blue-700 text-sm">
                      Algunos campos se han pre-llenado automáticamente. Puedes modificarlos según sea necesario.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!quoteId && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-green-900">Solicitud independiente</h3>
                    <p className="text-green-700 text-sm">
                      Completa todos los campos para procesar tu solicitud de crédito automotriz.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form - Solo mostrar si no necesita registro */}
            {!needsRegistration && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <CreditApplicationForm
                  quoteId={quoteId || undefined}
                  simulationId={simulationId || undefined}
                  applicationId={applicationId || undefined}
                  prefillData={prefillData || undefined}
                  onSuccess={handleApplicationSuccess}
                  onCancel={() => window.history.back()}
                />
              </div>
            )}

            {/* Mensaje si necesita registro */}
            {needsRegistration && !showRegistrationModal && (
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Crear Cuenta Requerida
                </h3>
                <p className="text-gray-600 mb-6">
                  Para continuar con tu solicitud de crédito, necesitamos crear tu cuenta.
                  Solo te tomará un minuto.
                </p>
                <Button 
                  onClick={() => setShowRegistrationModal(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Crear Mi Cuenta
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Modal de Registro */}
        <QuickRegistrationModal
          isOpen={showRegistrationModal}
          onClose={() => setShowRegistrationModal(false)}
          onSuccess={handleRegistrationSuccess}
          prefillData={{
            name: prefillData?.client_name,
            email: prefillData?.client_email,
            phone: prefillData?.client_phone
          }}
        />
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Financiera Incentiva</h3>
              <p className="text-gray-300 text-sm">
                Tu aliado financiero para hacer realidad tus proyectos automotrices.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Contacto</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <p>📞 01 800 123 4567</p>
                <p>✉️ contacto@fincentiva.com</p>
                <p>🌐 www.fincentiva.com</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Información</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <p>• Proceso 100% digital</p>
                <p>• Respuesta en 24 horas</p>
                <p>• Tasas competitivas</p>
                <p>• Sin comisiones ocultas</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
            <p>&copy; 2025 Financiera Incentiva. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function SolicitudCreditoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando solicitud de crédito...</p>
        </div>
      </div>
    }>
      <SolicitudCreditoContent />
    </Suspense>
  )
}
