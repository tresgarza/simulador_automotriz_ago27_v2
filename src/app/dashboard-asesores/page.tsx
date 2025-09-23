'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { CreditApplicationService, CreditApplication } from '../../lib/credit-application-service'
import { generateCreditApplicationPDF } from '../../lib/credit-application-pdf-generator'
import { Download, Eye, Search, Filter, Calendar, User, FileText } from 'lucide-react'

export default function AdvisorDashboard() {
  const [applications, setApplications] = useState<CreditApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [selectedApplication, setSelectedApplication] = useState<CreditApplication | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      setLoading(true)
      const data = await CreditApplicationService.getAllCreditApplications()
      setApplications(data)
    } catch (error) {
      console.error('Error loading applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async (application: CreditApplication) => {
    try {
      console.log('🔍 [DEBUG] Dashboard - application:', application)
      console.log('🔍 [DEBUG] Dashboard - folio_number:', application?.folio_number)
      await generateCreditApplicationPDF(application)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error al generar el PDF')
    }
  }

  const handleViewDetails = (application: CreditApplication) => {
    setSelectedApplication(application)
    setShowDetails(true)
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.folio_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${app.first_names} ${app.paternal_surname} ${app.maternal_surname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.personal_email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    
    const matchesDate = !dateFilter || app.created_at.startsWith(dateFilter)
    
    return matchesSearch && matchesStatus && matchesDate
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'submitted': { label: 'Enviada', color: 'bg-blue-100 text-blue-800' },
      'under_review': { label: 'En Revisión', color: 'bg-yellow-100 text-yellow-800' },
      'approved': { label: 'Aprobada', color: 'bg-green-100 text-green-800' },
      'rejected': { label: 'Rechazada', color: 'bg-red-100 text-red-800' },
      'draft': { label: 'Borrador', color: 'bg-gray-100 text-gray-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando solicitudes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard de Asesores</h1>
                <p className="text-gray-600">Gestiona todas las solicitudes de crédito</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 px-4 py-2 rounded-lg">
                  <span className="text-green-800 font-medium">
                    {applications.length} Solicitudes Total
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por folio, nombre o email..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <select
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos los estados</option>
                <option value="submitted">Enviadas</option>
                <option value="under_review">En Revisión</option>
                <option value="approved">Aprobadas</option>
                <option value="rejected">Rechazadas</option>
                <option value="draft">Borradores</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="date"
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            {/* Refresh Button */}
            <Button
              onClick={loadApplications}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Actualizar
            </Button>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Folio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {application.folio_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {application.first_names} {application.paternal_surname} {application.maternal_surname}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.personal_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {application.product_type}
                      </span>
                      <div className="text-sm text-gray-500">
                        {application.term_months} meses
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(application.requested_amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(application.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(application.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(application)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDownloadPDF(application)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredApplications.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron solicitudes
              </h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || dateFilter
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Aún no hay solicitudes registradas'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Detalles de Solicitud - {selectedApplication.folio_number}
                </h2>
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                >
                  Cerrar
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información del Cliente */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Información del Cliente</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Nombre:</span> {selectedApplication.first_names} {selectedApplication.paternal_surname} {selectedApplication.maternal_surname}</p>
                    <p><span className="font-medium">CURP:</span> {selectedApplication.curp}</p>
                    <p><span className="font-medium">RFC:</span> {selectedApplication.rfc_with_homoclave}</p>
                    <p><span className="font-medium">Email:</span> {selectedApplication.personal_email}</p>
                    <p><span className="font-medium">Teléfono:</span> {selectedApplication.mobile_phone}</p>
                    <p><span className="font-medium">Fecha de Nacimiento:</span> {selectedApplication.birth_date}</p>
                  </div>
                </div>

                {/* Información del Crédito */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Información del Crédito</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Producto:</span> {selectedApplication.product_type}</p>
                    <p><span className="font-medium">Monto:</span> {formatCurrency(selectedApplication.requested_amount)}</p>
                    <p><span className="font-medium">Plazo:</span> {selectedApplication.term_months} meses</p>
                    <p><span className="font-medium">Periodicidad:</span> {selectedApplication.payment_frequency}</p>
                    <p><span className="font-medium">Uso:</span> {selectedApplication.resource_usage}</p>
                    <p><span className="font-medium">Estado:</span> {getStatusBadge(selectedApplication.status)}</p>
                  </div>
                </div>

                {/* Información Laboral */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Información Laboral</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Empresa:</span> {selectedApplication.company_name}</p>
                    <p><span className="font-medium">Puesto:</span> {selectedApplication.job_position}</p>
                    <p><span className="font-medium">Antigüedad:</span> {selectedApplication.job_seniority_years} años, {selectedApplication.job_seniority_months} meses</p>
                    <p><span className="font-medium">Ingreso Mensual:</span> {formatCurrency(selectedApplication.monthly_income)}</p>
                  </div>
                </div>

                {/* Domicilio */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Domicilio</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Dirección:</span> {selectedApplication.street_and_number}</p>
                    <p><span className="font-medium">Colonia:</span> {selectedApplication.neighborhood}</p>
                    <p><span className="font-medium">Municipio:</span> {selectedApplication.municipality}</p>
                    <p><span className="font-medium">Estado:</span> {selectedApplication.state}</p>
                    <p><span className="font-medium">C.P.:</span> {selectedApplication.postal_code}</p>
                    <p><span className="font-medium">Tipo de Vivienda:</span> {selectedApplication.housing_type}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <Button
                  onClick={() => handleDownloadPDF(selectedApplication)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
