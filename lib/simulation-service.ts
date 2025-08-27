import { supabaseClient, Simulation, Quote } from './supabase'

export interface SimulationWithQuote extends Simulation {
  quote: Quote
}

export class SimulationService {
  
  // Obtener simulaciones de un usuario
  static async getUserSimulations(userId: string, userType: string): Promise<SimulationWithQuote[]> {
    try {
      let query = supabaseClient
        .from('z_auto_simulations')
        .select(`
          *,
          z_auto_quotes (*)
        `)
        .order('calculated_at', { ascending: false })

      // Filtrar según el tipo de usuario
      if (userType === 'agency') {
        // Las agencias solo ven sus propias cotizaciones
        query = query.eq('z_auto_quotes.user_id', userId)
      } else if (userType !== 'asesor') {
        // Los clientes solo ven sus propias cotizaciones
        query = query.eq('z_auto_quotes.user_id', userId)
      }
      // Los asesores pueden ver todas las simulaciones

      const { data, error } = await query

      if (error) {
        console.error('Error fetching simulations:', error)
        return []
      }

      return data as SimulationWithQuote[]
    } catch (error) {
      console.error('Error in getUserSimulations:', error)
      return []
    }
  }

  // Obtener simulaciones por session_id (para clientes anónimos)
  static async getSessionSimulations(sessionId: string): Promise<SimulationWithQuote[]> {
    try {
      const { data, error } = await supabaseClient
        .from('z_auto_simulations')
        .select(`
          *,
          z_auto_quotes (*)
        `)
        .eq('z_auto_quotes.session_id', sessionId)
        .is('z_auto_quotes.user_id', null)
        .order('calculated_at', { ascending: false })

      if (error) {
        console.error('Error fetching session simulations:', error)
        return []
      }

      return data as SimulationWithQuote[]
    } catch (error) {
      console.error('Error in getSessionSimulations:', error)
      return []
    }
  }

  // Obtener una simulación específica
  static async getSimulation(simulationId: string): Promise<SimulationWithQuote | null> {
    try {
      const { data, error } = await supabaseClient
        .from('z_auto_simulations')
        .select(`
          *,
          z_auto_quotes (*)
        `)
        .eq('id', simulationId)
        .single()

      if (error) {
        console.error('Error fetching simulation:', error)
        return null
      }

      return data as SimulationWithQuote
    } catch (error) {
      console.error('Error in getSimulation:', error)
      return null
    }
  }

  // Obtener estadísticas de simulaciones (para asesores)
  static async getSimulationStats(): Promise<{
    totalSimulations: number
    simulationsToday: number
    simulationsThisMonth: number
    topTiers: Array<{ tier: string; count: number }>
    topTerms: Array<{ term: number; count: number }>
  }> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const thisMonth = new Date().toISOString().slice(0, 7)

      // Total de simulaciones
      const { count: totalSimulations } = await supabaseClient
        .from('z_auto_simulations')
        .select('*', { count: 'exact', head: true })

      // Simulaciones de hoy
      const { count: simulationsToday } = await supabaseClient
        .from('z_auto_simulations')
        .select('*', { count: 'exact', head: true })
        .gte('calculated_at', today)

      // Simulaciones de este mes
      const { count: simulationsThisMonth } = await supabaseClient
        .from('z_auto_simulations')
        .select('*', { count: 'exact', head: true })
        .gte('calculated_at', thisMonth)

      // Top tiers
      const { data: tierStats } = await supabaseClient
        .from('z_auto_simulations')
        .select('tier_code')
        .order('tier_code')

      const tierCounts = tierStats?.reduce((acc: Record<string, number>, sim) => {
        acc[sim.tier_code] = (acc[sim.tier_code] || 0) + 1
        return acc
      }, {}) || {}

      const topTiers = Object.entries(tierCounts)
        .map(([tier, count]) => ({ tier, count: count as number }))
        .sort((a, b) => b.count - a.count)

      // Top terms
      const { data: termStats } = await supabaseClient
        .from('z_auto_simulations')
        .select('term_months')
        .order('term_months')

      const termCounts = termStats?.reduce((acc: Record<number, number>, sim) => {
        acc[sim.term_months] = (acc[sim.term_months] || 0) + 1
        return acc
      }, {}) || {}

      const topTerms = Object.entries(termCounts)
        .map(([term, count]) => ({ term: parseInt(term), count: count as number }))
        .sort((a, b) => b.count - a.count)

      return {
        totalSimulations: totalSimulations || 0,
        simulationsToday: simulationsToday || 0,
        simulationsThisMonth: simulationsThisMonth || 0,
        topTiers,
        topTerms
      }
    } catch (error) {
      console.error('Error in getSimulationStats:', error)
      return {
        totalSimulations: 0,
        simulationsToday: 0,
        simulationsThisMonth: 0,
        topTiers: [],
        topTerms: []
      }
    }
  }

  // Eliminar una simulación (solo asesores)
  static async deleteSimulation(simulationId: string, userId: string): Promise<boolean> {
    try {
      // Verificar que el usuario es asesor
      const { data: user } = await supabaseClient
        .from('z_auto_users')
        .select('user_type')
        .eq('id', userId)
        .eq('user_type', 'asesor')
        .single()

      if (!user) {
        console.error('User not authorized to delete simulations')
        return false
      }

      const { error } = await supabaseClient
        .from('z_auto_simulations')
        .delete()
        .eq('id', simulationId)

      if (error) {
        console.error('Error deleting simulation:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteSimulation:', error)
      return false
    }
  }

  // Buscar simulaciones (para asesores)
  static async searchSimulations(searchTerm: string): Promise<SimulationWithQuote[]> {
    try {
      const { data, error } = await supabaseClient
        .from('z_auto_simulations')
        .select(`
          *,
          z_auto_quotes (*)
        `)
        .or(`
          z_auto_quotes.client_name.ilike.%${searchTerm}%,
          z_auto_quotes.client_email.ilike.%${searchTerm}%,
          z_auto_quotes.client_phone.ilike.%${searchTerm}%,
          z_auto_quotes.vehicle_brand.ilike.%${searchTerm}%,
          z_auto_quotes.vehicle_model.ilike.%${searchTerm}%
        `)
        .order('calculated_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error searching simulations:', error)
        return []
      }

      return data as SimulationWithQuote[]
    } catch (error) {
      console.error('Error in searchSimulations:', error)
      return []
    }
  }

  // Exportar simulaciones a CSV (para asesores)
  static async exportSimulationsToCSV(filters?: {
    startDate?: string
    endDate?: string
    tierCode?: string
    termMonths?: number
  }): Promise<string> {
    try {
      let query = supabaseClient
        .from('z_auto_simulations')
        .select(`
          *,
          z_auto_quotes (*)
        `)
        .order('calculated_at', { ascending: false })

      // Aplicar filtros
      if (filters?.startDate) {
        query = query.gte('calculated_at', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('calculated_at', filters.endDate)
      }
      if (filters?.tierCode) {
        query = query.eq('tier_code', filters.tierCode)
      }
      if (filters?.termMonths) {
        query = query.eq('term_months', filters.termMonths)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error exporting simulations:', error)
        return ''
      }

      // Convertir a CSV
      const headers = [
        'ID Simulación',
        'Fecha',
        'Cliente',
        'Email',
        'Teléfono',
        'Vehículo',
        'Valor Vehículo',
        'Enganche',
        'Tasa',
        'Plazo',
        'Pago Mensual',
        'Monto Financiado'
      ]

      const rows = data?.map((sim: any) => [
        sim.id,
        new Date(sim.calculated_at).toLocaleDateString(),
        sim.z_auto_quotes?.client_name || '',
        sim.z_auto_quotes?.client_email || '',
        sim.z_auto_quotes?.client_phone || '',
        `${sim.z_auto_quotes?.vehicle_brand || ''} ${sim.z_auto_quotes?.vehicle_model || ''}`.trim(),
        sim.z_auto_quotes?.vehicle_value || '',
        sim.z_auto_quotes?.down_payment_amount || '',
        sim.tier_code,
        sim.term_months,
        sim.monthly_payment,
        sim.financed_amount
      ]) || []

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')

      return csvContent
    } catch (error) {
      console.error('Error in exportSimulationsToCSV:', error)
      return ''
    }
  }
}

