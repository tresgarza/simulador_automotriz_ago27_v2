import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '../../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      quoteId,
      tierCode,
      termMonths,
      
      // Resultados del resumen
      financedAmount,
      openingFee,
      openingFeeIva,
      totalToFinance,
      monthlyPayment,
      initialOutlay,
      pmtBase,
      pmtTotalMonth2,
      
      // Fechas calculadas
      firstPaymentDate,
      lastPaymentDate,
      
      // Tabla de amortización
      amortizationSchedule,
      
      // Metadata
      calculationVersion = '1.0'
    } = body

    // Validaciones básicas
    if (!quoteId || !tierCode || !termMonths) {
      return NextResponse.json(
        { error: 'Quote ID, tier code y term months son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que la cotización existe
    const { data: existingQuote, error: quoteError } = await supabaseClient
      .from('z_auto_quotes')
      .select('id')
      .eq('id', quoteId)
      .single()

    if (quoteError || !existingQuote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    // Insertar simulación
    const { data: simulation, error: simulationError } = await supabaseClient
      .from('z_auto_simulations')
      .insert({
        quote_id: quoteId,
        tier_code: tierCode,
        term_months: termMonths,
        
        // Resultados del resumen
        financed_amount: financedAmount,
        opening_fee: openingFee,
        opening_fee_iva: openingFeeIva,
        total_to_finance: totalToFinance,
        monthly_payment: monthlyPayment,
        initial_outlay: initialOutlay,
        pmt_base: pmtBase,
        pmt_total_month2: pmtTotalMonth2,
        
        // Fechas calculadas
        first_payment_date: firstPaymentDate,
        last_payment_date: lastPaymentDate,
        
        // Tabla de amortización
        amortization_schedule: amortizationSchedule,
        
        // Metadata
        calculation_version: calculationVersion
      })
      .select()
      .single()

    if (simulationError) {
      console.error('Error al guardar simulación:', simulationError)
      return NextResponse.json(
        { error: 'Error al guardar la simulación' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      simulation
    })

  } catch (error) {
    console.error('Error en API de simulaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET - Obtener simulaciones de una cotización
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const quoteId = searchParams.get('quoteId')
    const userId = searchParams.get('userId')
    const userType = searchParams.get('userType')

    if (!quoteId) {
      return NextResponse.json(
        { error: 'Quote ID es requerido' },
        { status: 400 }
      )
    }

    let query = supabaseClient
      .from('z_auto_simulations')
      .select(`
        *,
        z_auto_quotes (
          id,
          client_name,
          client_email,
          vehicle_brand,
          vehicle_model,
          vehicle_year,
          vehicle_value,
          created_at
        )
      `)
      .eq('quote_id', quoteId)

    // Si no es asesor, verificar permisos
    if (userType !== 'asesor' && userId) {
      query = query.eq('z_auto_quotes.user_id', userId)
    }

    const { data: simulations, error } = await query

    if (error) {
      console.error('Error al obtener simulaciones:', error)
      return NextResponse.json(
        { error: 'Error al obtener simulaciones' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      simulations
    })

  } catch (error) {
    console.error('Error en GET simulaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

