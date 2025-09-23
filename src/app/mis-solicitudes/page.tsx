'use client'

import { useState, useEffect } from 'react'
import { CreditApplicationService, CreditApplication } from '../../lib/credit-application-service'
import { GuestSessionService } from '../../lib/guest-session-service'
import { useAuth } from '../../../lib/auth'
import { Button } from '../../components/ui/button'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Edit3, 
  Download,
  Trash2,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { generateCreditApplicationPDF } from '../../lib/credit-application-pdf-generator'

export default function MisSolicitudesPage() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<CreditApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasGuestSession, setHasGuestSession] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Verificar autenticación
    const checkAuthentication = async () => {
      console.log('🔐 Verificando autenticación...')
      
      // Verificar si hay usuario en localStorage
      const savedUser = localStorage.getItem('current_user')
      if (savedUser) {
        try {
          const localUser = JSON.parse(savedUser)
          console.log('👤 Usuario encontrado en localStorage:', localUser.name)
          setCurrentUser(localUser)
          setIsAuthenticated(true)
          setHasGuestSession(true) // Para compatibilidad
        } catch (error) {
          console.error('❌ Error parsing saved user:', error)
          localStorage.removeItem('current_user')
          setIsAuthenticated(false)
          // Limpiar estado cuando hay error
          setApplications([])
          setCurrentUser(null)
        }
      } else {
        console.log('❌ No hay usuario en localStorage')
        setIsAuthenticated(false)
        
        // Limpiar estado inmediatamente cuando no hay usuario
        setApplications([])
        setCurrentUser(null)
        
        // Para "Mis Solicitudes" NO permitir sesiones de invitado
        // Solo usuarios registrados pueden ver sus solicitudes
        console.log('❌ No hay usuario registrado - acceso denegado')
        setIsAuthenticated(false)
        setHasGuestSession(false)
      }
    }
    
    checkAuthentication().finally(() => {
      setIsInitialized(true)
    })
  }, [user])

  // Efecto separado para cargar aplicaciones solo cuando esté autenticado
  useEffect(() => {
    if (isAuthenticated && (currentUser || user)) {
      console.log('🔄 Cargando solicitudes para usuario autenticado')
      loadApplications()
    } else if (!isAuthenticated) {
      console.log('❌ Usuario no autenticado - limpiando solicitudes')
      setApplications([])
      setError(null)
    }
  }, [isAuthenticated, currentUser, user])

  // Efecto para escuchar cambios en localStorage (logout desde otra pestaña)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'current_user' && e.newValue === null) {
        console.log('🚪 Logout detectado desde otra pestaña')
        setIsAuthenticated(false)
        setCurrentUser(null)
        setApplications([])
        setHasGuestSession(false)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const loadApplications = async () => {
    try {
      setIsLoading(true)
      
      // Validación estricta: debe haber usuario autenticado
      const userId = currentUser?.id || user?.id
      const userEmail = currentUser?.email || user?.email
      const userName = currentUser?.name || (user as any)?.user_metadata?.full_name
      
      if (!userId) {
        console.log('❌ No hay usuario autenticado - no se cargarán solicitudes')
        setApplications([])
        setError(null)
        return
      }
      
      console.log('📋 Cargando solicitudes para usuario:', userName || userId)
      
      const { applications: apps, error, claimed_count } = await CreditApplicationService.getCurrentUserApplications(
        userId, 
        userEmail, 
        userName
      )
      
      if (error) {
        console.error('❌ Error cargando solicitudes:', error)
        setError(error)
      } else {
        console.log('✅ Solicitudes cargadas:', apps.length)
        if (claimed_count && claimed_count > 0) {
          console.log('🎉 Solicitudes reclamadas automáticamente:', claimed_count)
        }
        setApplications(apps)
      }
    } catch (err) {
      setError('Error al cargar solicitudes')
      console.error('💥 Exception loading applications:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta solicitud?')) {
      return
    }

    try {
      await CreditApplicationService.cancelCreditApplication(id)
      await loadApplications() // Recargar lista
    } catch (error) {
      alert('Error al eliminar solicitud')
      console.error('Error deleting application:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'submitted':
        return <CheckCircle className="w-5 h-5 text-blue-500" />
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <FileText className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Borrador'
      case 'submitted':
        return 'Enviada'
      case 'reviewed':
        return 'En Revisión'
      case 'approved':
        return 'Aprobada'
      case 'rejected':
        return 'Rechazada'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'submitted':
        return 'bg-blue-100 text-blue-800'
      case 'reviewed':
        return 'bg-purple-100 text-purple-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateCompleteness = (app: CreditApplication) => {
    const requiredFields = [
      'first_names', 'paternal_surname', 'personal_email', 'mobile_phone',
      'curp', 'rfc_with_homoclave', 'company_name', 'monthly_income',
      'reference_1_name', 'sic_authorization', 'privacy_notice_accepted'
    ]
    
    const completedFields = requiredFields.filter(field => {
      const value = app[field as keyof CreditApplication]
      return value !== null && value !== undefined && value !== ''
    })
    
    return Math.round((completedFields.length / requiredFields.length) * 100)
  }

  // Mostrar loading mientras se inicializa
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Verificar autenticación - NO permitir acceso sin sesión activa
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Restringido</h1>
            <p className="text-gray-600 mb-6">
              Necesitas iniciar sesión para ver tus solicitudes de crédito.
            </p>
            <div className="space-y-3">
              <Link href="/" className="block">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  Volver al Inicio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mis Solicitudes de Crédito</h1>
              <p className="text-gray-600 mt-2">Gestiona tus solicitudes de crédito automotriz</p>
            </div>
            <Link href="/solicitud-credito">
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Solicitud
              </Button>
            </Link>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Cargando solicitudes...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Applications List */}
        {!isLoading && !error && (
          <>
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes solicitudes</h3>
                <p className="text-gray-600 mb-6">Crea tu primera solicitud de crédito automotriz</p>
                <Link href="/solicitud-credito">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Solicitud
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {applications.map((app) => {
                  const completeness = calculateCompleteness(app)
                  
                  return (
                    <div key={app.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          {getStatusIcon(app.status)}
                          <div className="ml-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {app.folio_number}
                            </h3>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                              {getStatusText(app.status)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Nombre:</span>
                          <span className="font-medium">
                            {app.first_names} {app.paternal_surname}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Monto:</span>
                          <span className="font-medium">
                            ${app.requested_amount?.toLocaleString('es-MX') || 'No especificado'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Creada:</span>
                          <span className="font-medium">
                            {new Date(app.created_at).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar (solo para borradores) */}
                      {app.status === 'draft' && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Completitud</span>
                            <span>{completeness}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${completeness}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {app.status === 'draft' ? (
                          <>
                            <Link href={`/solicitud-credito?application_id=${app.id}`} className="flex-1">
                              <Button variant="outline" className="w-full">
                                <Edit3 className="w-4 h-4 mr-2" />
                                Continuar
                              </Button>
                            </Link>
                            
                            {/* Botón de descarga para borradores */}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={async () => {
                                try {
                                  console.log('🔍 [DEBUG] Generando PDF para borrador:', app.folio_number, app.id)
                                  await generateCreditApplicationPDF(app)
                                } catch (error) {
                                  alert('Error al generar PDF: ' + (error as Error).message)
                                  console.error('Error generating PDF:', error)
                                }
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Descargar PDF"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDelete(app.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={async () => {
                              try {
                                console.log('🔍 [DEBUG] Generando PDF para aplicación:', app.folio_number, app.id)
                                await generateCreditApplicationPDF(app)
                              } catch (error) {
                                alert('Error al generar PDF: ' + (error as Error).message)
                                console.error('Error generating PDF:', error)
                              }
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Descargar PDF
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline">
              Volver al Simulador
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
