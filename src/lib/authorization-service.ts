/**
 * SERVICIO CONSOLIDADO DE AUTORIZACIONES
 * Combina las mejores funciones de ambos servicios existentes
 * Proyecto: Sistema de Autorizaciones Automotriz
 * Fecha: 2025-01-26
 */

import { supabaseClient } from '../../lib/supabase'

// =========================================
// TIPOS E INTERFACES
// =========================================

export interface AuthorizationRequest {
  id: string
  simulation_id?: string | null
  quote_id?: string | null
  
  // Estados del workflow - ACTUALIZADOS
  status: 'pending' | 'in_review' | 'advisor_approved' | 'internal_committee' | 'partners_committee' | 'approved' | 'rejected' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  risk_level: 'low' | 'medium' | 'high'
  
  // Información del cliente
  client_name?: string
  client_email?: string
  client_phone?: string
  
  // Información del vehículo
  vehicle_brand?: string
  vehicle_model?: string
  vehicle_year?: number
  vehicle_value?: number
  
  // Información financiera
  requested_amount?: number
  monthly_payment?: number
  term_months?: number
  
  // Información de la agencia
  agency_name?: string
  dealer_name?: string
  promoter_code?: string
  
  // Usuarios del workflow - ACTUALIZADOS
  created_by_user_id?: string
  assigned_to_user_id?: string
  claimed_by_user_id?: string
  advisor_reviewed_by?: string
  internal_committee_reviewed_by?: string
  partners_committee_reviewed_by?: string
  
  // Comentarios y notas
  client_comments?: string
  internal_notes?: string
  approval_notes?: string
  rejection_reason?: string
  
  // Datos del formulario
  authorization_data?: Record<string, unknown>
  competitors_data?: Array<{ name: string; price: number }>
  
  // Timestamps - ACTUALIZADOS
  created_at: string
  updated_at?: string
  claimed_at?: string
  advisor_reviewed_at?: string
  internal_committee_reviewed_at?: string
  partners_committee_reviewed_at?: string
  approved_at?: string
  rejected_at?: string
  
  // Metadatos
  ip_address?: string
  user_agent?: string
}

export interface CreateAuthorizationRequestData {
  simulation_id?: string
  quote_id?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  risk_level?: 'low' | 'medium' | 'high'
  client_name?: string
  client_email?: string
  client_phone?: string
  vehicle_brand?: string
  vehicle_model?: string
  vehicle_year?: number
  vehicle_value?: number
  requested_amount?: number
  monthly_payment?: number
  term_months?: number
  agency_name?: string
  dealer_name?: string
  promoter_code?: string
  client_comments?: string
  authorization_data?: Record<string, unknown>
  competitors_data?: Array<{ name: string; price: number }>
  created_by_user_id?: string
}

export interface UpdateAuthorizationRequestData {
  status?: AuthorizationRequest['status']
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  risk_level?: 'low' | 'medium' | 'high'
  assigned_to_user_id?: string
  internal_notes?: string
  approval_notes?: string
  authorization_data?: Record<string, unknown>
  competitors_data?: Array<{ name: string; price: number }>
}

export interface AuthorizationMetrics {
  total: number
  pending: number
  in_review: number
  advisor_approved: number
  internal_committee: number
  partners_committee: number
  approved: number
  rejected: number
  cancelled: number
  by_priority: Record<string, number>
  by_risk_level: Record<string, number>
  avg_processing_time_hours: number
}

// =========================================
// SERVICIO PRINCIPAL
// =========================================

export class AuthorizationService {
  
  // =========================================
  // OPERACIONES BÁSICAS CRUD
  // =========================================

  /**
   * Crear una nueva solicitud de autorización
   */
  static async createAuthorizationRequest(data: CreateAuthorizationRequestData): Promise<{
    request: AuthorizationRequest | null
    error: string | null
  }> {
    try {
      console.log('🔧 AuthorizationService.createAuthorizationRequest:', data)

      const response = await fetch('/api/authorization-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ Error creating authorization request:', result.error)
        return { request: null, error: result.error || 'Error al crear solicitud de autorización' }
      }

      console.log('✅ Authorization request created:', result.authorization_request?.id)
      return { request: result.authorization_request, error: null }
    } catch (error) {
      console.error('💥 Exception in createAuthorizationRequest:', error)
      return { request: null, error: 'Error interno del servidor' }
    }
  }

  /**
   * Obtener todas las solicitudes de autorización con filtros
   */
  static async getAuthorizationRequests(filters?: {
    status?: string
    assigned_to?: string
    created_by?: string
    priority?: string
    limit?: number
    offset?: number
  }): Promise<{
    requests: AuthorizationRequest[]
    total: number
    error: string | null
  }> {
    try {
      console.log('🔧 AuthorizationService.getAuthorizationRequests:', filters)

      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to)
      if (filters?.created_by) params.append('created_by', filters.created_by)
      if (filters?.priority) params.append('priority', filters.priority)
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.offset) params.append('offset', filters.offset.toString())

      const response = await fetch(`/api/authorization-requests?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        console.error('❌ Error fetching authorization requests:', result.error)
        return { requests: [], total: 0, error: result.error || 'Error al obtener solicitudes de autorización' }
      }

      console.log('✅ Fetched authorization requests:', result.authorization_requests?.length || 0)
      return {
        requests: result.authorization_requests || [],
        total: result.total || 0,
        error: null
      }
    } catch (error) {
      console.error('💥 Exception in getAuthorizationRequests:', error)
      return { requests: [], total: 0, error: 'Error interno del servidor' }
    }
  }

  /**
   * Obtener una solicitud específica de autorización
   */
  static async getAuthorizationRequest(id: string): Promise<{
    request: AuthorizationRequest | null
    error: string | null
  }> {
    try {
      const response = await fetch(`/api/authorization-requests/${id}`)
      const result = await response.json()

      if (!response.ok) {
        return { request: null, error: result.error || 'Error al obtener solicitud de autorización' }
      }

      return { request: result.authorization_request, error: null }
    } catch (error) {
      console.error('Error in getAuthorizationRequest:', error)
      return { request: null, error: 'Error interno del servidor' }
    }
  }

  /**
   * Actualizar una solicitud de autorización
   */
  static async updateAuthorizationRequest(id: string, data: UpdateAuthorizationRequestData): Promise<{
    request: AuthorizationRequest | null
    error: string | null
  }> {
    try {
      console.log('🔄 AuthorizationService.updateAuthorizationRequest:', { id, data })

      const response = await fetch('/api/authorization-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ Error updating authorization request:', result.error)
        return { request: null, error: result.error || 'Error al actualizar solicitud de autorización' }
      }

      console.log('✅ Authorization request updated:', result.authorization_request?.id)
      return { request: result.authorization_request, error: null }
    } catch (error) {
      console.error('💥 Exception in updateAuthorizationRequest:', error)
      return { request: null, error: 'Error interno del servidor' }
    }
  }

  // =========================================
  // OPERACIONES DE WORKFLOW
  // =========================================

  /**
   * Reclamar una solicitud por un asesor
   */
  static async claimAuthorizationRequest(
    requestId: string,
    advisorId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('🎯 Claiming authorization request:', { requestId, advisorId })

      const { data, error } = await supabaseClient.rpc('claim_authorization_request', {
        p_request_id: requestId,
        p_advisor_id: advisorId
      })

      if (error) {
        console.error('❌ Error claiming authorization request:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Authorization request claimed successfully')
      return { success: data || true, error: null }
    } catch (error) {
      console.error('💥 Exception in claimAuthorizationRequest:', error)
      return { success: false, error: 'Error interno del servidor' }
    }
  }

  /**
   * Marcar como revisado por asesor (aprobar como asesor)
   */
  static async markAdvisorReviewed(
    requestId: string,
    advisorId: string,
    notes?: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('✅ Marking as advisor reviewed:', { requestId, advisorId, notes })

      const { data, error } = await supabaseClient.rpc('mark_advisor_reviewed', {
        p_request_id: requestId,
        p_advisor_id: advisorId,
        p_notes: notes
      })

      if (error) {
        console.error('❌ Error marking advisor reviewed:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Marked as advisor reviewed successfully')
      return { success: data || true, error: null }
    } catch (error) {
      console.error('💥 Exception in markAdvisorReviewed:', error)
      return { success: false, error: 'Error interno del servidor' }
    }
  }

  /**
   * Enviar a comité interno
   */
  static async approveByInternalCommittee(
    requestId: string,
    committeeMemberId: string,
    notes?: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('🏛️ Sending to internal committee:', { requestId, committeeMemberId, notes })

      const { data, error } = await supabaseClient.rpc('approve_by_internal_committee', {
        p_request_id: requestId,
        p_committee_member_id: committeeMemberId,
        p_notes: notes
      })

      if (error) {
        console.error('❌ Error sending to internal committee:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Sent to internal committee successfully')
      return { success: data || true, error: null }
    } catch (error) {
      console.error('💥 Exception in approveByInternalCommittee:', error)
      return { success: false, error: 'Error interno del servidor' }
    }
  }

  /**
   * Aprobar por comité de socios (aprobación final)
   */
  static async approveByPartnersCommittee(
    requestId: string,
    committeeMemberId: string,
    notes?: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('🏛️ Approving by partners committee:', { requestId, committeeMemberId, notes })

      const { data, error } = await supabaseClient.rpc('approve_by_partners_committee', {
        p_request_id: requestId,
        p_committee_member_id: committeeMemberId,
        p_notes: notes
      })

      if (error) {
        console.error('❌ Error approving by partners committee:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Approved by partners committee successfully')
      return { success: data || true, error: null }
    } catch (error) {
      console.error('💥 Exception in approveByPartnersCommittee:', error)
      return { success: false, error: 'Error interno del servidor' }
    }
  }

  /**
   * Rechazar solicitud en cualquier etapa
   */
  static async rejectAuthorizationRequest(
    requestId: string,
    userId: string,
    notes: string,
    stage: string = 'general'
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('❌ Rejecting authorization request:', { requestId, userId, notes, stage })

      const { data, error } = await supabaseClient.rpc('reject_authorization_request', {
        p_request_id: requestId,
        p_user_id: userId,
        p_notes: notes,
        p_stage: stage
      })

      if (error) {
        console.error('❌ Error rejecting authorization request:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Authorization request rejected successfully')
      return { success: data || true, error: null }
    } catch (error) {
      console.error('💥 Exception in rejectAuthorizationRequest:', error)
      return { success: false, error: 'Error interno del servidor' }
    }
  }

  // =========================================
  // MÉTRICAS Y REPORTES
  // =========================================

  /**
   * Obtener métricas de solicitudes de autorización
   */
  static async getMetrics(): Promise<AuthorizationMetrics> {
    try {
      console.log('📊 Getting authorization metrics...')

      // Obtener todas las solicitudes para calcular métricas
      const { data: requests, error } = await supabaseClient
        .from('z_auto_authorization_requests')
        .select('*')

      if (error) {
        console.error('❌ Error fetching requests for metrics:', error)
        throw new Error(error.message)
      }

      const metrics: AuthorizationMetrics = {
        total: requests?.length || 0,
        pending: 0,
        in_review: 0,
        advisor_approved: 0,
        internal_committee: 0,
        partners_committee: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        by_priority: { low: 0, medium: 0, high: 0, urgent: 0 },
        by_risk_level: { low: 0, medium: 0, high: 0 },
        avg_processing_time_hours: 0
      }

      let totalProcessingTime = 0
      let processedCount = 0

      requests?.forEach(request => {
        // Contar por status
        if (request.status === 'pending') metrics.pending++
        else if (request.status === 'in_review') metrics.in_review++
        else if (request.status === 'advisor_approved') metrics.advisor_approved++
        else if (request.status === 'internal_committee') metrics.internal_committee++
        else if (request.status === 'partners_committee') metrics.partners_committee++
        else if (request.status === 'approved') metrics.approved++
        else if (request.status === 'rejected') metrics.rejected++
        else if (request.status === 'cancelled') metrics.cancelled++

        // Contar por prioridad
        if (request.priority) {
          metrics.by_priority[request.priority as keyof typeof metrics.by_priority]++
        }

        // Contar por nivel de riesgo
        if (request.risk_level) {
          metrics.by_risk_level[request.risk_level as keyof typeof metrics.by_risk_level]++
        }

        // Calcular tiempo de procesamiento para solicitudes completadas
        if ((request.status === 'approved' || request.status === 'rejected') && request.approved_at) {
          const createdAt = new Date(request.created_at)
          const completedAt = new Date(request.approved_at)
          const processingTime = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60) // horas
          totalProcessingTime += processingTime
          processedCount++
        }
      })

      if (processedCount > 0) {
        metrics.avg_processing_time_hours = totalProcessingTime / processedCount
      }

      console.log('✅ Metrics calculated:', metrics)
      return metrics
    } catch (error) {
      console.error('💥 Exception in getMetrics:', error)
      // Retornar métricas vacías en caso de error
      return {
        total: 0,
        pending: 0,
        in_review: 0,
        advisor_approved: 0,
        internal_committee: 0,
        partners_committee: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        by_priority: { low: 0, medium: 0, high: 0, urgent: 0 },
        by_risk_level: { low: 0, medium: 0, high: 0 },
        avg_processing_time_hours: 0
      }
    }
  }

  /**
   * Obtener asesores disponibles para asignación
   */
  static async getAvailableAsesores(): Promise<Array<{ id: string, name: string, email: string }>> {
    try {
      const { data: asesores, error } = await supabaseClient
        .from('z_auto_users')
        .select('id, name, email')
        .eq('user_type', 'asesor')
        .eq('is_active', true)

      if (error) {
        console.error('❌ Error getting available asesores:', error)
        throw new Error(error.message)
      }

      return asesores || []
    } catch (error) {
      console.error('💥 Exception in getAvailableAsesores:', error)
      return []
    }
  }

  /**
   * Buscar solicitudes de autorización
   */
  static async searchAuthorizationRequests(
    searchTerm: string,
    status?: string,
    limit: number = 20
  ): Promise<{ requests: AuthorizationRequest[], error: string | null }> {
    try {
      let query = supabaseClient
        .from('z_auto_authorization_requests')
        .select(`
          *,
          z_auto_simulations (
            id,
            tier_code,
            monthly_payment,
            pmt_total_month2,
            financed_amount
          ),
          z_auto_quotes (
            id,
            client_name,
            client_email,
            client_phone,
            vehicle_brand,
            vehicle_model,
            vehicle_year,
            vehicle_value
          )
        `)
        .or(`client_name.ilike.%${searchTerm}%,client_email.ilike.%${searchTerm}%,vehicle_brand.ilike.%${searchTerm}%,vehicle_model.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Error searching authorization requests:', error)
        return { requests: [], error: error.message }
      }

      return { requests: data || [], error: null }
    } catch (error) {
      console.error('💥 Exception in searchAuthorizationRequests:', error)
      return { requests: [], error: 'Error interno del servidor' }
    }
  }

  /**
   * Verificar si un usuario es del comité
   */
  static async isCommitteeMember(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseClient.rpc('is_internal_committee_member', {
        p_user_id: userId
      })

      if (error) {
        console.error('❌ Error checking committee membership:', error)
        return false
      }

      return data || false
    } catch (error) {
      console.error('💥 Exception in isCommitteeMember:', error)
      return false
    }
  }

  // =========================================
  // OPERACIONES DE CONVENIENCIA
  // =========================================

  /**
   * Crear solicitud automáticamente desde una simulación completada
   */
  static async createFromSimulation(
    simulationId: string,
    quoteId: string,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      createComments?: boolean
      createdByUserId?: string
    } = {}
  ): Promise<{ request: AuthorizationRequest | null; error: string | null }> {
    try {
      // Obtener datos de la simulación y cotización
      const { data: simulation, error: simError } = await supabaseClient
        .from('z_auto_simulations')
        .select('*')
        .eq('id', simulationId)
        .single()

      if (simError) {
        console.error('❌ Error fetching simulation:', simError)
        return { request: null, error: 'Simulación no encontrada' }
      }

      const { data: quote, error: quoteError } = await supabaseClient
        .from('z_auto_quotes')
        .select('*')
        .eq('id', quoteId)
        .single()

      if (quoteError) {
        console.error('❌ Error fetching quote:', quoteError)
        return { request: null, error: 'Cotización no encontrada' }
      }

      // Determinar prioridad automáticamente basada en el monto
      const financedAmount = simulation.financed_amount || 0
      let priority = options.priority || 'medium'

      if (financedAmount >= 500000) {
        priority = 'high'
      } else if (financedAmount >= 300000) {
        priority = 'medium'
      } else {
        priority = 'low'
      }

      // Crear comentarios automáticos si está habilitado
      let clientComments = null
      if (options.createComments) {
        clientComments = `Solicitud automática creada desde simulación. Monto financiado: $${financedAmount.toLocaleString('es-MX')}. Prioridad determinada: ${priority}.`
      }

      // Crear la solicitud de autorización
      const requestData: CreateAuthorizationRequestData = {
        simulation_id: simulationId,
        quote_id: quoteId,
        client_name: quote.client_name,
        client_email: quote.client_email,
        client_phone: quote.client_phone,
        vehicle_brand: quote.vehicle_brand,
        vehicle_model: quote.vehicle_model,
        vehicle_year: quote.vehicle_year,
        vehicle_value: quote.vehicle_value,
        requested_amount: simulation.financed_amount,
        monthly_payment: simulation.pmt_total_month2 || simulation.monthly_payment,
        term_months: simulation.term_months,
        priority,
        client_comments: clientComments,
        created_by_user_id: options.createdByUserId
      }

      return await this.createAuthorizationRequest(requestData)
    } catch (error) {
      console.error('💥 Exception in createFromSimulation:', error)
      return { request: null, error: 'Error interno del servidor' }
    }
  }
}

// =========================================
// EXPORTACIONES ADICIONALES
// =========================================

// Re-exportar tipos para conveniencia
export type {
  AuthorizationRequest,
  CreateAuthorizationRequestData,
  UpdateAuthorizationRequestData,
  AuthorizationMetrics
}

// Exportación por defecto
export default AuthorizationService
