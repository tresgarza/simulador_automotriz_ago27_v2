import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '../../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // DEBUG: Log del body recibido
    console.log('🔍 [DEBUG] Simulation save request body:', JSON.stringify(body, null, 2))
    
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
      console.error('❌ [ERROR] Faltan campos requeridos:', { quoteId, tierCode, termMonths })
      return NextResponse.json(
        { error: 'Quote ID, tier code y term months son requeridos' },
        { status: 400 }
      )
    }

    // Validaciones adicionales
    if (!['A', 'B', 'C'].includes(tierCode)) {
      return NextResponse.json(
        { error: 'Tier code debe ser A, B o C' },
        { status: 400 }
      )
    }

    if (![24, 36, 48].includes(termMonths)) {
      return NextResponse.json(
        { error: 'Term months debe ser 24, 36 o 48' },
        { status: 400 }
      )
    }

    // Validar que los montos sean positivos
    const numericFields = [financedAmount, openingFee, openingFeeIva, totalToFinance, monthlyPayment, initialOutlay, pmtBase, pmtTotalMonth2];
    for (const field of numericFields) {
      if (field !== undefined && field < 0) {
        return NextResponse.json(
          { error: 'Todos los montos deben ser positivos o cero' },
          { status: 400 }
        )
      }
    }

    // Validar que financedAmount sea razonable (no más del 85% del valor del vehículo)
    if (financedAmount && financedAmount > 0) {
      const { data: quote } = await supabaseClient
        .from('z_auto_quotes')
        .select('vehicle_value, down_payment_amount')
        .eq('id', quoteId)
        .single();

      if (quote) {
        const maxFinanced = quote.vehicle_value * 0.85; // Aumentado de 70% a 85%
        if (financedAmount > maxFinanced) {
          return NextResponse.json(
            { error: `El monto financiado no puede exceder el 85% del valor del vehículo (máximo: ${maxFinanced.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })})` },
            { status: 400 }
          )
        }
      }
    }

    // Validar fechas (permitir fechas hasta 7 días en el pasado para evitar problemas de timezone)
    if (firstPaymentDate) {
      const firstPayment = new Date(firstPaymentDate);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      if (firstPayment < sevenDaysAgo) {
        console.warn('⚠️ Fecha de primer pago muy antigua:', firstPaymentDate);
        return NextResponse.json(
          { error: 'La fecha del primer pago es demasiado antigua' },
          { status: 400 }
        )
      }
    }

    if (firstPaymentDate && lastPaymentDate) {
      const firstPayment = new Date(firstPaymentDate);
      const lastPayment = new Date(lastPaymentDate);

      if (lastPayment <= firstPayment) {
        return NextResponse.json(
          { error: 'La fecha del último pago debe ser posterior a la fecha del primer pago' },
          { status: 400 }
        )
      }
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

