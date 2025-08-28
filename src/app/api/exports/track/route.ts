import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '../../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      simulation_id,
      quote_id,
      export_type, // 'excel', 'json', 'pdf'
      file_name,
      file_url,
      file_size_bytes,
      generated_by_user_id,
      ip_address,
      user_agent
    } = body

    // Validaciones básicas
    if (!simulation_id || !quote_id || !export_type) {
      return NextResponse.json(
        { error: 'simulation_id, quote_id y export_type son requeridos' },
        { status: 400 }
      )
    }

    if (!['excel', 'json', 'pdf'].includes(export_type)) {
      return NextResponse.json(
        { error: 'export_type debe ser excel, json o pdf' },
        { status: 400 }
      )
    }

    // Verificar que la simulación existe
    const { data: existingSimulation, error: simError } = await supabaseClient
      .from('z_auto_simulations')
      .select('id')
      .eq('id', simulation_id)
      .single()

    if (simError || !existingSimulation) {
      return NextResponse.json(
        { error: 'Simulación no encontrada' },
        { status: 404 }
      )
    }

    // Insertar registro de exportación
    const { data: exportRecord, error: exportError } = await supabaseClient
      .from('z_auto_exports_generated')
      .insert({
        simulation_id,
        quote_id,
        export_type,
        file_name,
        file_url,
        file_size_bytes,
        generated_by_user_id,
        ip_address,
        user_agent
      })
      .select()
      .single()

    if (exportError) {
      console.error('Error al guardar exportación:', exportError)
      return NextResponse.json(
        { error: 'Error al guardar registro de exportación' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      export_record: exportRecord
    })

  } catch (error) {
    console.error('Error en API de tracking de exportaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET - Obtener exportaciones de una simulación
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const simulationId = searchParams.get('simulation_id')
    const quoteId = searchParams.get('quote_id')

    if (!simulationId && !quoteId) {
      return NextResponse.json(
        { error: 'simulation_id o quote_id son requeridos' },
        { status: 400 }
      )
    }

    let query = supabaseClient
      .from('z_auto_exports_generated')
      .select(`
        *,
        z_auto_simulations (
          id,
          tier_code,
          term_months,
          monthly_payment,
          total_to_finance,
          financed_amount
        ),
        z_auto_quotes (
          id,
          client_name,
          client_email,
          vehicle_brand,
          vehicle_model,
          vehicle_year
        ),
        generated_by:z_auto_users!generated_by_user_id (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (simulationId) {
      query = query.eq('simulation_id', simulationId)
    }

    if (quoteId) {
      query = query.eq('quote_id', quoteId)
    }

    const { data: exports, error } = await query

    if (error) {
      console.error('Error al obtener exportaciones:', error)
      return NextResponse.json(
        { error: 'Error al obtener exportaciones' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      exports
    })

  } catch (error) {
    console.error('Error en GET exportaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
