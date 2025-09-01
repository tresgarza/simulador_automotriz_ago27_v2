import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '../../../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientName = searchParams.get('client_name')
    const tier = searchParams.get('tier')
    const term = searchParams.get('term')
    const vehicleBrand = searchParams.get('vehicle_brand')

    console.log('🔍 Buscando simulación con criterios:', {
      clientName, tier, term, vehicleBrand
    });

    if (!clientName || !tier || !term) {
      return NextResponse.json(
        { error: 'client_name, tier y term son requeridos' },
        { status: 400 }
      )
    }

    // Buscar la simulación más reciente que coincida con los criterios
    let query = supabaseClient
      .from('z_auto_simulations')
      .select(`
        id,
        quote_id,
        tier_code,
        term_months,
        pmt_total_month2,
        monthly_payment,
        quote:z_auto_quotes(client_name, vehicle_brand, vehicle_model, vehicle_value)
      `)
      .eq('tier_code', tier)
      .eq('term_months', parseInt(term))
      .order('calculated_at', { ascending: false })
      .limit(1)

    // Filtrar por nombre de cliente si está disponible
    if (clientName && clientName.trim()) {
      // Usar el join con quotes para filtrar por nombre de cliente
      const { data: simulations, error } = await supabaseClient
        .from('z_auto_simulations')
        .select(`
          id,
          quote_id,
          tier_code,
          term_months,
          pmt_total_month2,
          monthly_payment,
          calculated_at,
          quote:z_auto_quotes!inner(client_name, vehicle_brand, vehicle_model, vehicle_value)
        `)
        .eq('tier_code', tier)
        .eq('term_months', parseInt(term))
        .order('calculated_at', { ascending: false })

      if (error) {
        console.error('Error buscando simulaciones:', error)
        return NextResponse.json(
          { error: 'Error al buscar simulaciones' },
          { status: 500 }
        )
      }

      // Filtrar por nombre de cliente (case insensitive)
      const matchingSimulations = simulations?.filter(sim => 
        sim.quote?.client_name?.toLowerCase().includes(clientName.toLowerCase())
      ) || []

      // También filtrar por marca de vehículo si está disponible
      let finalMatches = matchingSimulations
      if (vehicleBrand && vehicleBrand.trim()) {
        finalMatches = matchingSimulations.filter(sim =>
          sim.quote?.vehicle_brand?.toLowerCase().includes(vehicleBrand.toLowerCase())
        )
      }

      if (finalMatches.length > 0) {
        const bestMatch = finalMatches[0]
        console.log('✅ Simulación encontrada:', bestMatch)
        
        return NextResponse.json({
          simulation_id: bestMatch.id,
          quote_id: bestMatch.quote_id,
          pmt_total_month2: bestMatch.pmt_total_month2,
          monthly_payment: bestMatch.monthly_payment,
          client_data: bestMatch.quote
        })
      }
    }

    // Si no se encuentra nada, retornar null
    console.log('❌ No se encontró simulación que coincida')
    return NextResponse.json({
      simulation_id: null,
      quote_id: null,
      message: 'No se encontró simulación que coincida con los criterios'
    })

  } catch (error) {
    console.error('Error en API de búsqueda de simulaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

