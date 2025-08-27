import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '../../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      // Datos del usuario
      userId,
      sessionId,
      clientName,
      clientEmail,
      clientPhone,
      agencyId = null,
      promoterCode,
      vendorName,
      originProcedencia,
      
      // Datos del vehículo
      vehicleBrand,
      vehicleModel,
      vehicleYear,
      vehicleType,
      vehicleUsage,
      vehicleOrigin,
      serialNumber,
      vehicleValue,
      
      // Datos del crédito
      downPaymentAmount,
      insuranceMode,
      insuranceAmount,
      commissionMode,
      
      // Parámetros de cálculo
      openingFeePercentage = 0.03,
      gpsMonthly = 400,
      lifeInsuranceMonthly = 300,
      ivaRate = 0.16,
      
      // Metadata
      ipAddress,
      userAgent
    } = body

    // Validaciones básicas
    if (!vehicleValue || !downPaymentAmount) {
      return NextResponse.json(
        { error: 'Valor del vehículo y enganche son requeridos' },
        { status: 400 }
      )
    }

    // Si hay userId, obtener el agency_id si es usuario de agencia
    let finalAgencyId = agencyId;
    if (userId && !agencyId) {
      const { data: userData } = await supabaseClient
        .from('z_auto_users')
        .select('user_type, agency_code')
        .eq('id', userId)
        .single();
      
      if (userData?.user_type === 'agency' && userData.agency_code) {
        const { data: agencyData } = await supabaseClient
          .from('z_auto_agencies')
          .select('id')
          .eq('agency_code', userData.agency_code)
          .single();
        
        if (agencyData) {
          finalAgencyId = agencyData.id;
        }
      }
    }

    // Insertar cotización
    const { data: quote, error: quoteError } = await supabaseClient
      .from('z_auto_quotes')
      .insert({
        user_id: userId || null,
        session_id: sessionId || null,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        agency_id: finalAgencyId,
        promoter_code: promoterCode,
        vendor_name: vendorName,
        origin_procedencia: originProcedencia,
        
        // Datos del vehículo
        vehicle_brand: vehicleBrand,
        vehicle_model: vehicleModel,
        vehicle_year: vehicleYear,
        vehicle_type: vehicleType,
        vehicle_usage: vehicleUsage,
        vehicle_origin: vehicleOrigin,
        serial_number: serialNumber,
        vehicle_value: vehicleValue,
        
        // Datos del crédito
        down_payment_amount: downPaymentAmount,
        insurance_mode: insuranceMode,
        insurance_amount: insuranceAmount,
        commission_mode: commissionMode,
        
        // Parámetros de cálculo
        opening_fee_percentage: openingFeePercentage,
        gps_monthly: gpsMonthly,
        life_insurance_monthly: lifeInsuranceMonthly,
        iva_rate: ivaRate,
        
        // Metadata
        ip_address: ipAddress,
        user_agent: userAgent
      })
      .select()
      .single()

    if (quoteError) {
      console.error('Error al guardar cotización:', quoteError)
      return NextResponse.json(
        { error: 'Error al guardar la cotización' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      quote
    })

  } catch (error) {
    console.error('Error en API de cotizaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
