import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '../../../../../lib/supabase'

// POST - Conectar solicitud de autorización con simulación específica
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      authorization_request_id,
      client_name,
      tier_code,
      term_months
    } = body

    console.log('🔍 [DEBUG] Connecting authorization request:', { authorization_request_id, client_name, tier_code, term_months });

    // Buscar la simulación específica que coincida con los criterios
    const { data: simulations, error: simError } = await supabaseClient
      .from('z_auto_simulations')
      .select(`
        id,
        quote_id,
        tier_code,
        term_months,
        monthly_payment,
        pmt_total_month2,
        total_to_finance,
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
      .eq('tier_code', tier_code)
      .eq('term_months', term_months)
      .order('created_at', { ascending: false })

    if (simError) {
      console.error('❌ Error buscando simulaciones:', simError);
      return NextResponse.json(
        { error: 'Error al buscar simulaciones' },
        { status: 500 }
      )
    }

    console.log('🔍 Simulaciones encontradas:', simulations?.length || 0);

    // Buscar la simulación que mejor coincida con el nombre del cliente
    const matchingSimulation = simulations?.find(sim => 
      sim.z_auto_quotes?.client_name?.toLowerCase().trim().includes(client_name.toLowerCase().trim()) ||
      client_name.toLowerCase().trim().includes(sim.z_auto_quotes?.client_name?.toLowerCase().trim() || '')
    );

    if (!matchingSimulation) {
      console.warn('⚠️ No se encontró simulación que coincida para:', { client_name, tier_code, term_months });
      console.log('🔍 Simulaciones disponibles:', simulations?.map(s => ({ 
        id: s.id, 
        client: s.z_auto_quotes?.client_name, 
        tier: s.tier_code, 
        term: s.term_months 
      })));
      return NextResponse.json(
        { error: 'No se encontró simulación que coincida con los criterios' },
        { status: 404 }
      )
    }

    console.log('✅ Simulación encontrada:', matchingSimulation);

    // Actualizar la solicitud de autorización con los datos de la simulación
    const { data: updatedRequest, error: updateError } = await supabaseClient
      .from('z_auto_authorization_requests')
      .update({
        simulation_id: matchingSimulation.id,
        quote_id: matchingSimulation.quote_id,
        monthly_payment: matchingSimulation.pmt_total_month2 || matchingSimulation.monthly_payment,
        vehicle_brand: matchingSimulation.z_auto_quotes?.vehicle_brand,
        vehicle_model: matchingSimulation.z_auto_quotes?.vehicle_model,
        vehicle_year: matchingSimulation.z_auto_quotes?.vehicle_year,
        vehicle_value: matchingSimulation.z_auto_quotes?.vehicle_value,
        requested_amount: matchingSimulation.total_to_finance,
        client_email: matchingSimulation.z_auto_quotes?.client_email,
        client_phone: matchingSimulation.z_auto_quotes?.client_phone,
        internal_notes: 'Solicitud conectada automáticamente con simulación específica'
      })
      .eq('id', authorization_request_id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error actualizando solicitud:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar la solicitud de autorización' },
        { status: 500 }
      )
    }

    console.log('✅ Solicitud actualizada exitosamente con pmt_total_month2:', matchingSimulation.pmt_total_month2);

    return NextResponse.json({
      success: true,
      authorization_request: updatedRequest,
      connected_simulation: matchingSimulation
    })

  } catch (error) {
    console.error('❌ Error en API de conexión:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
