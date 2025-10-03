import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '../../../../../../lib/supabase'
import { generateCreditApplicationPDF } from '../../../../../lib/credit-application-pdf-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID de solicitud requerido' },
        { status: 400 }
      )
    }

    // Obtener la solicitud con datos relacionados
    const { data: application, error } = await supabaseClient
      .from('z_auto_credit_applications')
      .select(`
        *,
        z_auto_quotes!quote_id (
          id,
          client_name,
          client_email,
          client_phone,
          vehicle_brand,
          vehicle_model,
          vehicle_year,
          vehicle_value,
          insurance_mode,
          insurance_amount,
          down_payment_amount,
          vendor_name
        ),
        z_auto_simulations!simulation_id (
          id,
          tier_code,
          term_months,
          monthly_payment,
          total_to_finance
        )
      `)
      .eq('id', id)
      .single()

    if (error || !application) {
      console.error('Error al obtener solicitud:', error)
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    // Generar PDF (devuelve un Buffer directamente)
    const pdfBuffer = await generateCreditApplicationPDF(application)

    // Crear nombre del archivo
    const fileName = `solicitud_${application.folio_number || application.id}.pdf`

    // Retornar PDF como respuesta
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error generando PDF:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
