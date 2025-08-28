import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '../../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      simulation_id,
      quote_id,
      file_name,
      file_url,
      file_size_bytes,
      generated_by_user_id,
      ip_address,
      user_agent
    } = body

    // Validaciones básicas
    if (!simulation_id || !quote_id || !file_name) {
      return NextResponse.json(
        { error: 'simulation_id, quote_id y file_name son requeridos' },
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

    // Insertar registro de PDF generado
    const { data: pdfRecord, error: pdfError } = await supabaseClient
      .from('z_auto_pdfs_generated')
      .insert({
        simulation_id,
        quote_id,
        file_name,
        file_url,
        file_size_bytes,
        generated_by_user_id,
        ip_address,
        user_agent
      })
      .select()
      .single()

    if (pdfError) {
      console.error('Error al guardar PDF generado:', pdfError)
      return NextResponse.json(
        { error: 'Error al guardar registro de PDF generado' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      pdf_record: pdfRecord
    })

  } catch (error) {
    console.error('Error en API de tracking de PDFs:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET - Obtener PDFs generados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const simulationId = searchParams.get('simulation_id')
    const quoteId = searchParams.get('quote_id')
    const userId = searchParams.get('user_id')

    if (!simulationId && !quoteId && !userId) {
      return NextResponse.json(
        { error: 'simulation_id, quote_id o user_id son requeridos' },
        { status: 400 }
      )
    }

    let query = supabaseClient
      .from('z_auto_pdfs_generated')
      .select(`
        *,
        z_auto_simulations (
          id,
          tier_code,
          term_months,
          monthly_payment
        ),
        z_auto_quotes (
          id,
          client_name,
          client_email,
          vehicle_brand,
          vehicle_model
        )
      `)
      .order('created_at', { ascending: false })

    if (simulationId) {
      query = query.eq('simulation_id', simulationId)
    }

    if (quoteId) {
      query = query.eq('quote_id', quoteId)
    }

    if (userId) {
      query = query.eq('generated_by_user_id', userId)
    }

    const { data: pdfs, error } = await query

    if (error) {
      console.error('Error al obtener PDFs:', error)
      return NextResponse.json(
        { error: 'Error al obtener PDFs generados' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      pdfs
    })

  } catch (error) {
    console.error('Error en GET PDFs:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
