import { supabaseClient, AuthorizationRequest, Simulation, Quote, User } from './supabase'

// Re-export types for convenience
export type { AuthorizationRequest } from './supabase'

export class AuthorizationService {

  // Crear una solicitud de autorización desde una simulación
  static async createAuthorizationRequest(
    simulationId: string,
    quoteId: string,
    createdByUserId?: string,
    assignedToUserId?: string,
    clientComments?: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<{ request: AuthorizationRequest | null, error: string | null }> {
    try {
      console.log('🔧 AuthorizationService.createAuthorizationRequest called with:', {
        simulationId, quoteId, createdByUserId, assignedToUserId, clientComments, priority
      });

      // Usar la función de PostgreSQL que creamos
      const { data, error } = await supabaseClient.rpc('create_authorization_request', {
        p_simulation_id: simulationId,
        p_quote_id: quoteId,
        p_created_by_user_id: createdByUserId,
        p_assigned_to_user_id: assignedToUserId,
        p_client_comments: clientComments,
        p_priority: priority
      })

      if (error) {
        console.error('Error creating authorization request:', error)
        return { request: null, error: error.message }
      }

      return { request: data, error: null }
    } catch (error) {
      console.error('Error in createAuthorizationRequest:', error)
      return { request: null, error: 'Error interno del servidor' }
    }
  }

  // Obtener todas las solicitudes de autorización
  static async getAuthorizationRequests(
    userId?: string,
    status?: string,
    priority?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ requests: AuthorizationRequest[], error: string | null }> {
    try {
      console.log('🔧 AuthorizationService.getAuthorizationRequests called with:', {
        userId, status, priority, limit, offset
      });

      console.log('🔗 Supabase client status:', {
        clientExists: !!supabaseClient,
        clientType: typeof supabaseClient
      });

      let query = supabaseClient
        .from('z_auto_authorization_requests')
        .select(`
          *,
          simulation:z_auto_simulations(*),
          quote:z_auto_quotes(*),
          created_by_user:z_auto_users!z_auto_authorization_requests_created_by_user_id_fkey(id, name, email),
          assigned_to_user:z_auto_users!z_auto_authorization_requests_assigned_to_user_id_fkey(id, name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1)

      console.log('📝 Base query constructed');

      // Filtros opcionales
      if (userId) {
        console.log('🔍 Adding userId filter:', userId);
        query = query.or(`created_by_user_id.eq.${userId},assigned_to_user_id.eq.${userId}`)
      }

      if (status) {
        console.log('🔍 Adding status filter:', status);
        query = query.eq('status', status)
      }

      if (priority) {
        console.log('🔍 Adding priority filter:', priority);
        query = query.eq('priority', priority)
      }

      console.log('🚀 Executing Supabase query...');
      const { data, error } = await query

      console.log('📊 Supabase response:', {
        hasData: !!data,
        dataLength: data?.length || 0,
        hasError: !!error,
        errorMessage: error?.message,
        errorDetails: error?.details,
        errorHint: error?.hint,
        errorCode: error?.code
      });

      if (error) {
        console.error('❌ Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return { requests: [], error: error.message }
      }

      console.log('✅ Successfully fetched authorization requests:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('📋 Sample request:', {
          id: data[0].id,
          client_name: data[0].client_name,
          status: data[0].status,
          created_at: data[0].created_at
        });
      }

      return { requests: data || [], error: null }
    } catch (error) {
      console.error('💥 Exception in getAuthorizationRequests:', error)
      return { requests: [], error: 'Error interno del servidor' }
    }
  }

  // Obtener una solicitud específica de autorización
  static async getAuthorizationRequest(requestId: string): Promise<{ request: AuthorizationRequest | null, error: string | null }> {
    try {
      const { data, error } = await supabaseClient
        .from('z_auto_authorization_requests')
        .select(`
          *,
          simulation:z_auto_simulations(*),
          quote:z_auto_quotes(*),
          created_by_user:z_auto_users(id, name, email),
          assigned_to_user:z_auto_users(id, name, email)
        `)
        .eq('id', requestId)
        .single()

      if (error) {
        console.error('Error fetching authorization request:', error)
        return { request: null, error: error.message }
      }

      return { request: data, error: null }
    } catch (error) {
      console.error('Error in getAuthorizationRequest:', error)
      return { request: null, error: 'Error interno del servidor' }
    }
  }

  // Actualizar el estado de una solicitud de autorización
  static async updateAuthorizationStatus(
    requestId: string,
    status: 'pending' | 'approved' | 'rejected' | 'in_review',
    approvalNotes?: string,
    updatedByUserId?: string
  ): Promise<{ success: boolean, error: string | null }> {
    try {
      // Usar la función de PostgreSQL que creamos
      const { data, error } = await supabaseClient.rpc('update_authorization_status', {
        p_request_id: requestId,
        p_status: status,
        p_approval_notes: approvalNotes,
        p_updated_by_user_id: updatedByUserId
      })

      if (error) {
        console.error('Error updating authorization status:', error)
        return { success: false, error: error.message }
      }

      return { success: data || false, error: null }
    } catch (error) {
      console.error('Error in updateAuthorizationStatus:', error)
      return { success: false, error: 'Error interno del servidor' }
    }
  }

  // Actualizar la prioridad de una solicitud
  static async updateAuthorizationPriority(
    requestId: string,
    priority: 'low' | 'medium' | 'high' | 'urgent'
  ): Promise<{ success: boolean, error: string | null }> {
    try {
      const { error } = await supabaseClient
        .from('z_auto_authorization_requests')
        .update({
          priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) {
        console.error('Error updating authorization priority:', error)
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Error in updateAuthorizationPriority:', error)
      return { success: false, error: 'Error interno del servidor' }
    }
  }

  // Asignar una solicitud a un asesor
  static async assignAuthorizationRequest(
    requestId: string,
    assignedToUserId: string
  ): Promise<{ success: boolean, error: string | null }> {
    try {
      const { error } = await supabaseClient
        .from('z_auto_authorization_requests')
        .update({
          assigned_to_user_id: assignedToUserId,
          status: 'in_review',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) {
        console.error('Error assigning authorization request:', error)
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Error in assignAuthorizationRequest:', error)
      return { success: false, error: 'Error interno del servidor' }
    }
  }

  // Agregar notas internas
  static async addInternalNotes(
    requestId: string,
    notes: string
  ): Promise<{ success: boolean, error: string | null }> {
    try {
      const { data: currentRequest, error: fetchError } = await supabaseClient
        .from('z_auto_authorization_requests')
        .select('internal_notes')
        .eq('id', requestId)
        .single()

      if (fetchError) {
        console.error('Error fetching current request:', fetchError)
        return { success: false, error: fetchError.message }
      }

      const existingNotes = currentRequest?.internal_notes || ''
      const updatedNotes = existingNotes ? `${existingNotes}\n\n${new Date().toLocaleString()}: ${notes}` : `${new Date().toLocaleString()}: ${notes}`

      const { error } = await supabaseClient
        .from('z_auto_authorization_requests')
        .update({
          internal_notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) {
        console.error('Error adding internal notes:', error)
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Error in addInternalNotes:', error)
      return { success: false, error: 'Error interno del servidor' }
    }
  }

  // Obtener estadísticas de autorizaciones
  static async getAuthorizationStats(): Promise<{
    stats: {
      total_requests: number
      pending_requests: number
      approved_requests: number
      rejected_requests: number
      in_review_requests: number
      avg_processing_time: string | null
    } | null,
    error: string | null
  }> {
    try {
      const { data, error } = await supabaseClient.rpc('get_authorization_stats')

      if (error) {
        console.error('Error fetching authorization stats:', error)
        return { stats: null, error: error.message }
      }

      return { stats: data?.[0] || null, error: null }
    } catch (error) {
      console.error('Error in getAuthorizationStats:', error)
      return { stats: null, error: 'Error interno del servidor' }
    }
  }

  // Buscar solicitudes de autorización
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
          simulation:z_auto_simulations(*),
          quote:z_auto_quotes(*),
          created_by_user:z_auto_users!z_auto_authorization_requests_created_by_user_id_fkey(id, name, email),
          assigned_to_user:z_auto_users!z_auto_authorization_requests_assigned_to_user_id_fkey(id, name, email)
        `)
        .or(`client_name.ilike.%${searchTerm}%,client_email.ilike.%${searchTerm}%,vehicle_brand.ilike.%${searchTerm}%,vehicle_model.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error searching authorization requests:', error)
        return { requests: [], error: error.message }
      }

      return { requests: data || [], error: null }
    } catch (error) {
      console.error('Error in searchAuthorizationRequests:', error)
      return { requests: [], error: 'Error interno del servidor' }
    }
  }

  // Crear solicitud de autorización automáticamente desde una simulación completada
  static async createFromSimulation(
    simulationId: string,
    quoteId: string,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      createComments?: boolean
    } = {}
  ): Promise<{ request: AuthorizationRequest | null, error: string | null }> {
    try {
      // Obtener datos de la simulación y cotización
      const { data: simulation, error: simError } = await supabaseClient
        .from('z_auto_simulations')
        .select('*')
        .eq('id', simulationId)
        .single()

      if (simError) {
        console.error('Error fetching simulation:', simError)
        return { request: null, error: 'Simulación no encontrada' }
      }

      const { data: quote, error: quoteError } = await supabaseClient
        .from('z_auto_quotes')
        .select('*')
        .eq('id', quoteId)
        .single()

      if (quoteError) {
        console.error('Error fetching quote:', quoteError)
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
      const { request, error } = await this.createAuthorizationRequest(
        simulationId,
        quoteId,
        undefined, // created_by_user_id - será determinado por el sistema
        undefined, // assigned_to_user_id - será asignado por el sistema
        clientComments,
        priority
      )

      return { request, error }
    } catch (error) {
      console.error('Error in createFromSimulation:', error)
      return { request: null, error: 'Error interno del servidor' }
    }
  }

  // Crear solicitud directa (bypass RLS para casos especiales)
  static async createDirectAuthorizationRequest(
    requestData: {
      client_name: string
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
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      created_by_user_id?: string
    }
  ): Promise<{ request: AuthorizationRequest | null, error: string | null }> {
    try {
      console.log('🔧 Creating direct authorization request:', requestData);

      const { data, error } = await supabaseClient
        .from('z_auto_authorization_requests')
        .insert([{
          status: 'pending',
          priority: requestData.priority || 'medium',
          client_name: requestData.client_name,
          client_email: requestData.client_email,
          client_phone: requestData.client_phone,
          vehicle_brand: requestData.vehicle_brand,
          vehicle_model: requestData.vehicle_model,
          vehicle_year: requestData.vehicle_year,
          vehicle_value: requestData.vehicle_value,
          requested_amount: requestData.requested_amount,
          monthly_payment: requestData.monthly_payment,
          term_months: requestData.term_months,
          agency_name: requestData.agency_name,
          dealer_name: requestData.dealer_name,
          promoter_code: requestData.promoter_code,
          created_by_user_id: requestData.created_by_user_id,
          client_comments: requestData.client_comments,
          risk_level: 'medium'
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating direct authorization request:', error)
        return { request: null, error: error.message }
      }

      console.log('✅ Direct authorization request created:', data.id);
      return { request: data, error: null }
    } catch (error) {
      console.error('Error in createDirectAuthorizationRequest:', error)
      return { request: null, error: 'Error interno del servidor' }
    }
  }
}
