import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { applicationId, folio, fileName, generatedAt } = body

    console.log('📊 PDF Track:', {
      applicationId,
      folio,
      fileName,
      generatedAt,
      timestamp: new Date().toISOString()
    })

    // Aquí podrías guardar en base de datos si necesitas tracking
    // Por ahora solo loggeamos para debugging

    return NextResponse.json({
      success: true,
      message: 'PDF tracking logged successfully'
    })

  } catch (error) {
    console.error('❌ Error en PDF tracking:', error)
    return NextResponse.json(
      { error: 'Error en tracking de PDF' },
      { status: 500 }
    )
  }
}





