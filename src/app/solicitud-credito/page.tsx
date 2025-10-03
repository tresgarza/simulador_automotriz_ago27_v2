'use client'

import React, { useState, useEffect, Suspense } from 'react'
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
  
  // NUEVOS PARÁMETROS desde el portal de autorizaciones
  const clientName = searchParams.get('client_name')
  const clientEmail = searchParams.get('client_email')
  const clientPhone = searchParams.get('client_phone')
  
  // NUEVOS PARÁMETROS financieros desde el portal de autorizaciones
  const vehicleBrand = searchParams.get('vehicle_brand')
  const vehicleModel = searchParams.get('vehicle_model')
  const vehicleYear = searchParams.get('vehicle_year')
  const vehicleValue = searchParams.get('vehicle_value')
  const requestedAmount = searchParams.get('requested_amount')
  const monthlyPayment = searchParams.get('monthly_payment')
  const termMonths = searchParams.get('term_months')
  const agencyName = searchParams.get('agency_name')
  
  // NUEVOS PARÁMETROS del enganche y seguro
  const downPaymentAmount = searchParams.get('down_payment_amount')
  const insuranceAmount = searchParams.get('insurance_amount')
  const insuranceMode = searchParams.get('insurance_mode')
  
  const [prefillData, setPrefillData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)
  const [submittedApplication, setSubmittedApplication] = useState<any>(null)
  const [existingApplication, setExistingApplication] = useState<any>(null)
  
  // Estados para registro obligatorio
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [needsRegistration, setNeedsRegistration] = useState(true)
  const prefillFetchedRef = React.useRef(false) // Prevenir fetch múltiple de prefill

  console.log('🔍 [DEBUG] SolicitudCreditoPage - Parámetros recibidos:', {
    quoteId,
    simulationId,
    applicationId,
    clientName,
    clientEmail,
    clientPhone,
    vehicleBrand,
    vehicleModel,
    vehicleYear,
    vehicleValue,
    requestedAmount,
    monthlyPayment,
    termMonths,
    agencyName,
    downPaymentAmount,
    insuranceAmount,
    insuranceMode
  })

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

  // Pre-llenar datos - PRIORIDAD: applicationId > quoteId+simulationId > parámetros directos
  useEffect(() => {
    console.log('🔍 [DEBUG] SolicitudCreditoPage useEffect - Evaluando pre-llenado:', {
      applicationId,
      quoteId,
      simulationId,
      hasDirectParams: !!(clientName || clientEmail || clientPhone || vehicleBrand || requestedAmount || downPaymentAmount || insuranceAmount),
      prefillFetchedRef: prefillFetchedRef.current
    })
    
    // Caso 1: Si hay applicationId, ya se maneja en otro useEffect
    if (applicationId) {
      console.log('📋 Usando applicationId existente, saltando pre-llenado')
      return
    }
    
    // Caso 2: Si hay quoteId, usar el servicio de pre-llenado existente
    if (quoteId && !prefillFetchedRef.current) {
      console.log('🔄 Pre-llenando desde quoteId:', quoteId, 'simulationId:', simulationId)
      
      prefillFetchedRef.current = true
      setIsLoading(true)
      
      CreditApplicationService.prefillFromQuote(quoteId, simulationId || undefined).then(({ data, error }) => {
        if (data && !error) {
          console.log('✅ Datos de pre-llenado obtenidos desde quote:', {
            vehicle_brand: data.vehicle_brand,
            vehicle_model: data.vehicle_model,
            vehicle_year: data.vehicle_year,
            vehicle_value: data.vehicle_value,
            requested_amount: data.requested_amount,
            term_months: data.term_months,
            monthly_payment: data.monthly_payment,
            down_payment_amount: data.down_payment_amount,
            insurance_amount: data.insurance_amount
          })
          
          // Sobrescribir con parámetros directos si están disponibles
          if (clientName || clientEmail || clientPhone || vehicleBrand || requestedAmount || downPaymentAmount || insuranceAmount) {
            console.log('🔄 Sobrescribiendo con parámetros directos del portal de autorizaciones')
            
            // Datos del cliente
            if (clientName) data.first_names = clientName
            if (clientEmail) data.personal_email = clientEmail
            if (clientPhone) data.mobile_phone = clientPhone
            
            // Datos del vehículo
            if (vehicleBrand) data.vehicle_brand = vehicleBrand
            if (vehicleModel) data.vehicle_model = vehicleModel
            if (vehicleYear) data.vehicle_year = parseInt(vehicleYear)
            if (vehicleValue) data.vehicle_value = parseFloat(vehicleValue)
            
            // Datos financieros
            if (requestedAmount) data.requested_amount = parseFloat(requestedAmount)
            if (monthlyPayment) data.monthly_payment = parseFloat(monthlyPayment)
            if (termMonths) data.term_months = parseInt(termMonths)
            
            // NUEVOS: Datos del enganche y seguro
            if (downPaymentAmount) data.down_payment_amount = parseFloat(downPaymentAmount)
            if (insuranceAmount) data.insurance_amount = parseFloat(insuranceAmount)
            if (insuranceMode) data.insurance_mode = insuranceMode as 'cash' | 'financed'
            
            // Datos de la agencia
            if (agencyName) {
              data.branch = agencyName
              data.branch_office = agencyName
            }
          }
          
          setPrefillData(data)
        } else if (error) {
          console.error('❌ Error obteniendo datos de pre-llenado desde quote:', error)
          
          // Si falla el pre-llenado desde quote, usar parámetros directos
          if (clientName || clientEmail || clientPhone || vehicleBrand || requestedAmount || downPaymentAmount || insuranceAmount) {
            console.log('🔄 Usando solo parámetros directos como fallback')
            setPrefillData(createDirectPrefillData())
          }
        }
        setIsLoading(false)
      })
    }
    // Caso 3: Solo parámetros directos (sin quoteId) - BUSCAR SOLICITUD EXISTENTE PRIMERO
    else if (!quoteId && (clientName || clientEmail || clientPhone || vehicleBrand || requestedAmount || downPaymentAmount || insuranceAmount) && !prefillFetchedRef.current) {
      console.log('🔍 Buscando solicitud existente antes de crear nueva:', {
        clientEmail,
        clientName,
        clientPhone
      })
      
      prefillFetchedRef.current = true
      setIsLoading(true)
      
      // Buscar solicitud existente por email
      if (clientEmail) {
        CreditApplicationService.getCurrentUserApplications(undefined, undefined, undefined, false).then(({ applications }) => {
          const existingApp = applications?.find((app: any) => 
            app.personal_email === clientEmail && 
            app.status === 'draft' &&
            (app.first_names?.toLowerCase().includes(clientName?.toLowerCase() || '') || 
             app.mobile_phone === clientPhone)
          )
          
          if (existingApp) {
            console.log('✅ Solicitud existente encontrada, cargando datos:', existingApp.folio_number)
            // En lugar de recargar, cargar los datos directamente
            CreditApplicationService.getCreditApplication(existingApp.id).then((appData) => {
              if (appData) {
                setPrefillData(appData)
                setIsLoading(false)
              } else {
                // Si no se puede cargar, usar parámetros directos
                console.log('📝 No se pudo cargar solicitud existente, usando parámetros directos')
                setPrefillData(createDirectPrefillData())
                setIsLoading(false)
              }
            }).catch(() => {
              console.log('📝 Error cargando solicitud existente, usando parámetros directos')
              setPrefillData(createDirectPrefillData())
              setIsLoading(false)
            })
          } else {
            console.log('📝 No se encontró solicitud existente, pre-llenando con parámetros directos')
            setPrefillData(createDirectPrefillData())
            setIsLoading(false)
          }
        }).catch(error => {
          console.error('Error buscando solicitudes existentes:', error)
          console.log('📝 Error en búsqueda, pre-llenando con parámetros directos')
          setPrefillData(createDirectPrefillData())
          setIsLoading(false)
        })
      } else {
        console.log('📝 Sin email para buscar, pre-llenando con parámetros directos')
        setPrefillData(createDirectPrefillData())
        setIsLoading(false)
      }
    }
  }, [quoteId, simulationId, applicationId, clientName, clientEmail, clientPhone, vehicleBrand, vehicleModel, vehicleYear, vehicleValue, requestedAmount, monthlyPayment, termMonths, agencyName, downPaymentAmount, insuranceAmount, insuranceMode])

  // Función helper para crear prefillData desde parámetros directos
  const createDirectPrefillData = () => {
    return {
      // Datos básicos
      product_type: 'Auto',
      payment_frequency: 'mensual',
      nationality: 'Mexicana',
      birth_country: 'México',
      
      // Datos del cliente
      first_names: clientName || '',
      personal_email: clientEmail || '',
      mobile_phone: clientPhone || '',
      
      // Datos del vehículo
      vehicle_brand: vehicleBrand || '',
      vehicle_model: vehicleModel || '',
      vehicle_year: vehicleYear ? parseInt(vehicleYear) : undefined,
      vehicle_value: vehicleValue ? parseFloat(vehicleValue) : undefined,
      
      // Datos financieros
      requested_amount: requestedAmount ? parseFloat(requestedAmount) : undefined,
      monthly_payment: monthlyPayment ? parseFloat(monthlyPayment) : undefined,
      term_months: termMonths ? parseInt(termMonths) : undefined,
      
      // NUEVOS: Datos del enganche y seguro
      down_payment_amount: downPaymentAmount ? parseFloat(downPaymentAmount) : undefined,
      insurance_amount: insuranceAmount ? parseFloat(insuranceAmount) : undefined,
      insurance_mode: insuranceMode as 'cash' | 'financed' || 'cash',
      
      // Datos de la agencia
      branch: agencyName || '',
      branch_office: agencyName || '',
      
      // Descripción del recurso
      resource_usage: vehicleBrand && vehicleModel && vehicleYear 
        ? `Compra de ${vehicleBrand} ${vehicleModel} ${vehicleYear}`
        : 'Compra de vehículo'
    }
  }

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
