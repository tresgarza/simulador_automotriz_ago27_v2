import { supabaseClient } from './supabase'

export interface AuthorizationRequest {
  id: string
  simulation_id: string
  quote_id: string
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
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
  created_by_user_id?: string
  assigned_to_user_id?: string
  client_comments?: string
  internal_notes?: string
  approval_notes?: string
  risk_level: 'low' | 'medium' | 'high'
  created_at: string
  updated_at?: string
  reviewed_at?: string
  approved_at?: string
  rejected_at?: string
  authorization_data?: Record<string, unknown>
}

export interface CreateAuthorizationRequestData {
  simulation_id: string
  quote_id: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  client_comments?: string
  risk_level?: 'low' | 'medium' | 'high'
  authorization_data?: Record<string, unknown>
  created_by_user_id?: string
}

export interface UpdateAuthorizationRequestData {
  status?: 'pending' | 'in_review' | 'approved' | 'rejected' | 'cancelled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to_user_id?: string
  internal_notes?: string
  approval_notes?: string
  risk_level?: 'low' | 'medium' | 'high'
  authorization_data?: Record<string, unknown>
}

export class AuthorizationService {
  /**
   * Crear una nueva solicitud de autorización
   */
  static async createAuthorizationRequest(data: CreateAuthorizationRequestData): Promise<AuthorizationRequest> {
    const response = await fetch('/api/authorization-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Error al crear solicitud de autorización')
    }

    return result.authorization_request
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
  }): Promise<{ requests: AuthorizationRequest[], pagination: { total: number; limit: number; offset: number } }> {
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
      throw new Error(result.error || 'Error al obtener solicitudes de autorización')
    }

    return {
      requests: result.authorization_requests,
      pagination: result.pagination
    }
  }

  /**
   * Obtener una solicitud de autorización específica
   */
  static async getAuthorizationRequest(id: string): Promise<AuthorizationRequest> {
    const response = await fetch(`/api/authorization-requests/${id}`)
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Error al obtener solicitud de autorización')
    }

    return result.authorization_request
  }

  /**
   * Actualizar una solicitud de autorización
   */
  static async updateAuthorizationRequest(id: string, data: UpdateAuthorizationRequestData): Promise<AuthorizationRequest> {
    const response = await fetch(`/api/authorization-requests/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Error al actualizar solicitud de autorización')
    }

    return result.authorization_request
  }

  /**
   * Asignar una solicitud a un asesor
   */
  static async assignRequest(id: string, assignedToUserId: string, internalNotes?: string): Promise<AuthorizationRequest> {
    return this.updateAuthorizationRequest(id, {
      assigned_to_user_id: assignedToUserId,
      status: 'in_review',
      internal_notes: internalNotes
    })
  }

  /**
   * Aprobar una solicitud de autorización
   */
  static async approveRequest(id: string, approvalNotes?: string): Promise<AuthorizationRequest> {
    return this.updateAuthorizationRequest(id, {
      status: 'approved',
      approval_notes: approvalNotes
    })
  }

  /**
   * Rechazar una solicitud de autorización
   */
  static async rejectRequest(id: string, approvalNotes?: string): Promise<AuthorizationRequest> {
    return this.updateAuthorizationRequest(id, {
      status: 'rejected',
      approval_notes: approvalNotes
    })
  }

  /**
   * Cancelar una solicitud de autorización
   */
  static async cancelRequest(id: string): Promise<void> {
    const response = await fetch(`/api/authorization-requests/${id}`, {
      method: 'DELETE'
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Error al cancelar solicitud de autorización')
    }
  }

  /**
   * Obtener métricas de solicitudes de autorización
   */
  static async getMetrics(): Promise<{
    total: number
    pending: number
    in_review: number
    approved: number
    rejected: number
    cancelled: number
    by_priority: Record<string, number>
    by_risk_level: Record<string, number>
    avg_processing_time_hours: number
  }> {
    try {
      // Obtener todas las solicitudes para calcular métricas
      const { data: requests, error } = await supabaseClient
        .from('z_auto_authorization_requests')
        .select('*')

      if (error) throw error

      const metrics = {
        total: requests.length,
        pending: 0,
        in_review: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        by_priority: { low: 0, medium: 0, high: 0, urgent: 0 },
        by_risk_level: { low: 0, medium: 0, high: 0 },
        avg_processing_time_hours: 0
      }

      let totalProcessingTime = 0
      let processedCount = 0

      requests.forEach(request => {
        // Contar por status
        metrics[request.status as keyof typeof metrics]++

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

      return metrics
    } catch (error) {
      console.error('Error getting authorization metrics:', error)
      throw new Error('Error al obtener métricas de autorización')
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

      if (error) throw error

      return asesores || []
    } catch (error) {
      console.error('Error getting available asesores:', error)
      throw new Error('Error al obtener asesores disponibles')
    }
  }

  /**
   * Auto-asignar solicitud al asesor con menos carga de trabajo
   */
  static async autoAssignRequest(requestId: string): Promise<AuthorizationRequest> {
    try {
      // Obtener asesores disponibles
      const asesores = await this.getAvailableAsesores()
      
      if (asesores.length === 0) {
        throw new Error('No hay asesores disponibles para asignación')
      }

      // Obtener carga de trabajo actual de cada asesor
      const { data: workload, error } = await supabaseClient
        .from('z_auto_authorization_requests')
        .select('assigned_to_user_id')
        .in('status', ['pending', 'in_review'])
        .in('assigned_to_user_id', asesores.map(a => a.id))

      if (error) throw error

      // Contar solicitudes por asesor
      const workloadCount: Record<string, number> = {}
      asesores.forEach(asesor => {
        workloadCount[asesor.id] = 0
      })

      workload?.forEach(item => {
        if (item.assigned_to_user_id) {
          workloadCount[item.assigned_to_user_id] = (workloadCount[item.assigned_to_user_id] || 0) + 1
        }
      })

      // Encontrar asesor con menor carga
      const asesorWithLeastWork = asesores.reduce((min, asesor) => 
        workloadCount[asesor.id] < workloadCount[min.id] ? asesor : min
      )

      // Asignar la solicitud
      return await this.assignRequest(
        requestId, 
        asesorWithLeastWork.id, 
        `Auto-asignado a ${asesorWithLeastWork.name}`
      )
    } catch (error) {
      console.error('Error auto-assigning request:', error)
      throw new Error('Error en auto-asignación de solicitud')
    }
  }
}
