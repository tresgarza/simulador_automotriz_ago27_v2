import jsPDF from 'jspdf'
import { CreditApplication } from './credit-application-service'

// Colores Fincentiva
const FINCENTIVA_GREEN = '#2ECC71' // Verde principal
const FINCENTIVA_DARK_GREEN = '#27AE60' // Verde oscuro
const FINCENTIVA_LIGHT_GREEN = '#A8E6CF' // Verde claro
const FINCENTIVA_GRAY = '#34495E' // Gris corporativo

export interface CreditApplicationPDFData {
  application: CreditApplication
  generatedByUserId?: string
  applicationId?: string
}

export const generateCreditApplicationPDF = async (data: CreditApplicationPDFData | CreditApplication) => {
  console.log('🔍 [DEBUG] PDF Generator - received data:', data)
  console.log('🔍 [DEBUG] PDF Generator - data type:', typeof data)
  console.log('🔍 [DEBUG] PDF Generator - has folio_number:', 'folio_number' in data)
  
  // Validar que tenemos datos válidos
  if (!data) {
    throw new Error('No se proporcionaron datos para generar el PDF')
  }
  
  // Si se pasa directamente un CreditApplication, lo envolvemos en el formato esperado
  const application = 'folio_number' in data ? data : data.application
  
  console.log('🔍 [DEBUG] PDF Generator - final application:', application)
  console.log('🔍 [DEBUG] PDF Generator - application folio_number:', application?.folio_number)
  
  // Validar que tenemos una aplicación válida
  if (!application) {
    throw new Error('No se encontró información de la solicitud para generar el PDF')
  }
  
  // Validar que tenemos al menos los datos mínimos
  if (!application.folio_number && !application.id) {
    throw new Error('La solicitud no tiene folio_number ni ID válido')
  }
  
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 8
  const contentWidth = pageWidth - (margin * 2)
  
  let yPosition = margin

  // Variables de escala optimizadas para máxima compacidad
  let FONT_BASE = 8
  let FONT_LABEL = 7
  let FONT_HEADER = 9
  let LINE_GAP = 3.4 // Más compacto

  // Rejilla fija de 4 columnas
  const col1 = margin + 2
  const col2 = margin + 50
  const col3 = margin + 100
  const col4 = margin + 150

  // Helper functions optimizadas
  const addText = (text: string, x: number, y: number, options: {
    fontSize?: number
    style?: "normal" | "bold"
    color?: string
    align?: "left" | "center" | "right"
    maxWidth?: number
  } = {}) => {
    pdf.setFontSize(options.fontSize || FONT_BASE)
    pdf.setFont("helvetica", options.style || "normal")
    
    if (options.color === 'green') {
      pdf.setTextColor(46, 204, 113)
    } else if (options.color === 'gray') {
      pdf.setTextColor(52, 73, 94)
    } else if (options.color === 'white') {
      pdf.setTextColor(255, 255, 255)
    } else {
      pdf.setTextColor(0, 0, 0)
    }
    
    if (options.maxWidth) {
      const lines = pdf.splitTextToSize(text, options.maxWidth)
      pdf.text(lines, x, y, { align: options.align || 'left' })
      return lines.length * (options.fontSize || FONT_BASE) * 0.35
    } else {
      pdf.text(text, x, y, { align: options.align || 'left' })
      return (options.fontSize || FONT_BASE) * 0.35
    }
  }

  const addRect = (x: number, y: number, width: number, height: number, fill = false, color = 'black') => {
    if (color === 'green') {
      pdf.setDrawColor(46, 204, 113)
      if (fill) pdf.setFillColor(46, 204, 113)
    } else if (color === 'lightgreen') {
      pdf.setDrawColor(168, 230, 207)
      if (fill) pdf.setFillColor(168, 230, 207)
    } else {
      pdf.setDrawColor(0, 0, 0)
      if (fill) pdf.setFillColor(240, 240, 240)
    }
    
    if (fill) {
      pdf.rect(x, y, width, height, 'FD')
    } else {
      pdf.rect(x, y, width, height)
    }
  }

  const addLine = (x1: number, y1: number, x2: number, y2: number) => {
    pdf.setDrawColor(0, 0, 0)
    pdf.line(x1, y1, x2, y2)
  }

  // Checkbox mejorado con X más clara
  const addCheckbox = (x: number, y: number, checked = false, size = 2.8) => {
    pdf.setDrawColor(0, 0, 0)
    pdf.rect(x, y, size, size)
    if (checked) {
      // X más gruesa y clara
      pdf.setLineWidth(0.3)
      pdf.line(x + 0.6, y + 0.6, x + size - 0.6, y + size - 0.6)
      pdf.line(x + size - 0.6, y + 0.6, x + 0.6, y + size - 0.6)
      pdf.setLineWidth(0.1) // Reset
    }
  }

  // Helper para radio buttons exclusivos
  const radio = (value: boolean | undefined) => ({
    yes: value === true,
    no: value === false
  })

  const addField = (label: string, value: string, x: number, y: number, width: number) => {
    addText(label.toUpperCase() + ':', x, y, { fontSize: FONT_LABEL, style: 'bold' })
    addText(value || '', x, y + LINE_GAP, { fontSize: FONT_BASE })
    addLine(x, y + LINE_GAP + 1, x + width, y + LINE_GAP + 1)
    return LINE_GAP + 2.5
  }

  // Helper para 4 campos en misma línea (rejilla fija)
  const addField4 = (
    label1: string, value1: string,
    label2: string, value2: string,
    label3: string, value3: string,
    label4: string, value4: string,
    y: number
  ) => {
    addField(label1, value1, col1, y, 45)
    addField(label2, value2, col2, y, 45)
    addField(label3, value3, col3, y, 45)
    addField(label4, value4, col4, y, 35)
    return LINE_GAP + 2.5
  }

  const addSectionHeader = (title: string, y: number) => {
    addRect(margin, y, contentWidth, 5, true, 'lightgreen')
    addText(title, margin + 2, y + 3.5, { fontSize: FONT_HEADER, style: 'bold' })
    return 6
  }

  // Funciones de normalización
  const formatCurrency = (amount?: number) => {
    if (!amount) return ''
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('es-MX')
  }

  const toTitleCase = (str?: string) => {
    if (!str) return ''
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const toUpperCase = (str?: string) => {
    if (!str) return ''
    return str.toUpperCase()
  }

  // Cálculo correcto del importe del crédito
  const calculateCreditAmount = () => {
    const precio = application.requested_amount ?? 0
    const enganche = 20000 // Valor por defecto para demo
    const seguroAmount = 20000 // Valor por defecto para demo
    const seguroFinanciado = true // Valor por defecto para demo
    
    return Math.max(0, precio - enganche + (seguroFinanciado ? seguroAmount : 0))
  }

  // ===========================================
  // HEADER COMPACTO FINCENTIVA
  // ===========================================
  addRect(margin, yPosition, contentWidth, 12, true, 'green')
  addText('FINCENTIVA', margin + 2, yPosition + 4, { 
    fontSize: 14, 
    style: 'bold', 
    color: 'white' 
  })
  addText('Tu aliado financiero', margin + 2, yPosition + 8, { 
    fontSize: 8, 
    color: 'white' 
  })
  addText(`Folio: ${application.folio_number || application.id || 'N/A'}`, pageWidth - margin - 35, yPosition + 6, { 
    fontSize: 10, 
    style: 'bold', 
    color: 'white' 
  })
  yPosition += 15

  // TÍTULO PRINCIPAL FINCENTIVA
  addText('SOLICITUD DE CRÉDITO - PERSONA FÍSICA (FINCENTIVA)', pageWidth / 2, yPosition, {
    fontSize: 10,
    style: 'bold',
    align: 'center'
  })
  yPosition += 7

  // CHECKBOXES DE TIPO DE SOLICITANTE
  let xPos = margin + 15
  addCheckbox(xPos, yPosition, true)
  addText('SOLICITANTE', xPos + 4, yPosition + 2, { fontSize: 7 })
  xPos += 40
  addCheckbox(xPos, yPosition)
  addText('OBLIGADO SOLIDARIO', xPos + 4, yPosition + 2, { fontSize: 7 })
  xPos += 50
  addCheckbox(xPos, yPosition)
  addText('AVAL', xPos + 4, yPosition + 2, { fontSize: 7 })
  xPos += 20
  addCheckbox(xPos, yPosition)
  addText('PF ACT. EMPRESARIAL', xPos + 4, yPosition + 2, { fontSize: 7 })
  yPosition += 8

  // ===========================================
  // A) INFORMACIÓN DEL CRÉDITO - MEJORADA
  // ===========================================
  yPosition += addSectionHeader('A) INFORMACIÓN DEL CRÉDITO', yPosition)

  const productType = toUpperCase(application.product_type) || 'AUTO'
  const creditAmount = calculateCreditAmount()
  
  yPosition += addField4(
    'PRODUCTO', productType,
    'MARCA/MODELO/VERSIÓN', 'CAPTIVA 2022',
    'AÑO', '2022',
    'PRECIO VEHÍCULO', formatCurrency(application.requested_amount),
    yPosition
  )

  yPosition += 1
  yPosition += addField4(
    'ENGANCHE', formatCurrency(20000),
    'MONTO SEGURO', formatCurrency(20000),
    'PLAN DE CRÉDITO', 'ESTÁNDAR',
    'IMPORTE CRÉDITO', formatCurrency(creditAmount),
    yPosition
  )

  // SEGURO FINANCIADO - Exclusivo
  yPosition += 1
  const seguroRadio = radio(true) // Valor por defecto para demo
  addText('SEGURO FINANCIADO:', col1, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  addCheckbox(col1 + 35, yPosition - 1, seguroRadio.yes, 2.5)
  addText('SÍ', col1 + 39, yPosition + 1, { fontSize: FONT_BASE - 1 })
  addCheckbox(col1 + 50, yPosition - 1, seguroRadio.no, 2.5)
  addText('NO', col1 + 54, yPosition + 1, { fontSize: FONT_BASE - 1 })

  yPosition += addField('IMPORTE C/U PAGOS', formatCurrency(10878), col2, yPosition, 45)
  yPosition -= LINE_GAP + 2.5
  yPosition += addField('PLAZO (MESES)', application.term_months?.toString() || '48', col3, yPosition, 45)
  yPosition -= LINE_GAP + 2.5
  yPosition += addField('SUCURSAL', application.branch_office || '', col4, yPosition, 35)

  yPosition += 3

  // ===========================================
  // B) INFORMACIÓN PERSONAL - COMPLETA
  // ===========================================
  yPosition += addSectionHeader('B) INFORMACIÓN PERSONAL', yPosition)

  // Datos personales básicos
  yPosition += addField4(
    'APELLIDO PATERNO', toTitleCase(application.paternal_surname),
    'APELLIDO MATERNO', toTitleCase(application.maternal_surname),
    'NOMBRE(S)', toTitleCase(application.first_names),
    'ESTADO CIVIL', toTitleCase(application.marital_status),
    yPosition
  )

  yPosition += 1
  yPosition += addField4(
    'CURP', toUpperCase(application.curp),
    'RFC', toUpperCase(application.rfc_with_homoclave),
    'NSS', application.nss || '',
    'FECHA NACIMIENTO', formatDate(application.birth_date),
    yPosition
  )

  yPosition += 1
  yPosition += addField4(
    'GÉNERO', application.gender || '',
    'NACIONALIDAD', toTitleCase(application.nationality),
    'PAÍS NACIMIENTO', 'MÉXICO',
    'NIVEL ESTUDIOS', toTitleCase(application.education_level),
    yPosition
  )

  // Contacto
  yPosition += 2
  yPosition += addField4(
    'EMAIL PERSONAL', application.personal_email || '',
    'EMAIL LABORAL', application.work_email || '',
    'CELULAR', application.mobile_phone || '',
    'TEL. CON LADA', application.landline_phone || '',
    yPosition
  )

  yPosition += 1
  yPosition += addField('TEL. RECADOS LADA', '', col1, yPosition, 90)

  // DOMICILIO - Compacto
  yPosition += 2
  yPosition += addField4(
    'DOMICILIO', application.street_and_number || '',
    'ENTRE CALLES', application.between_streets || '',
    'COLONIA', toTitleCase(application.neighborhood),
    'MUNICIPIO/ALCALDÍA', toTitleCase(application.municipality),
    yPosition
  )

  yPosition += 1
  yPosition += addField4(
    'ESTADO', toTitleCase(application.state),
    'C.P.', application.postal_code || '',
    'TIPO VIVIENDA', toTitleCase(application.housing_type),
    'AÑOS RESIDENCIA', application.residence_years?.toString() || '',
    yPosition
  )

  yPosition += 1
  yPosition += addField('# DEPENDIENTES', '0', col1, yPosition, 45)

  yPosition += 3

  // ===========================================
  // C) INFORMACIÓN DEL EMPLEO - MEJORADA
  // ===========================================
  yPosition += addSectionHeader('C) INFORMACIÓN DEL EMPLEO', yPosition)

  yPosition += addField4(
    'EMPRESA/DEPENDENCIA', toTitleCase(application.company_name),
    'PUESTO', toTitleCase(application.job_position),
    'OCUPACIÓN', toTitleCase(application.job_position),
    'JEFE INMEDIATO', '',
    yPosition
  )

  yPosition += 1
  yPosition += addField4(
    'ANTIGÜEDAD', `${application.job_seniority_years || 0} años ${application.job_seniority_months || 0} meses`,
    'INGRESO MENSUAL', formatCurrency(application.monthly_income),
    'TEL. CON LADA', application.work_phone || '',
    'EXTENSIÓN', application.work_extension || '',
    yPosition
  )

  yPosition += 1
  yPosition += addField('DOMICILIO LABORAL', application.work_address || '', col1, yPosition, 140)

  yPosition += 4

  // ===========================================
  // D) REFERENCIAS PERSONALES - 2x2 COMPACTO
  // ===========================================
  yPosition += addSectionHeader('D) REFERENCIAS PERSONALES', yPosition)

  // Referencia 1 y 2 en misma fila
  const ref1Name = application.reference_1_name || ''
  const ref2Name = application.reference_2_name || ''
  
  addText('1. NOMBRE:', col1, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  addText(ref1Name.length > 20 ? ref1Name.substring(0, 20) + '...' : ref1Name, col1, yPosition + LINE_GAP, { fontSize: FONT_BASE })
  addLine(col1, yPosition + LINE_GAP + 1, col1 + 45, yPosition + LINE_GAP + 1)
  
  addText('2. NOMBRE:', col3, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  addText(ref2Name.length > 20 ? ref2Name.substring(0, 20) + '...' : ref2Name, col3, yPosition + LINE_GAP, { fontSize: FONT_BASE })
  addLine(col3, yPosition + LINE_GAP + 1, col3 + 45, yPosition + LINE_GAP + 1)
  yPosition += LINE_GAP + 3

  addText('PARENTESCO:', col1, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  addText(application.reference_1_relationship || '', col1, yPosition + LINE_GAP, { fontSize: FONT_BASE })
  addLine(col1, yPosition + LINE_GAP + 1, col1 + 45, yPosition + LINE_GAP + 1)
  
  addText('PARENTESCO:', col3, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  addText(application.reference_2_relationship || '', col3, yPosition + LINE_GAP, { fontSize: FONT_BASE })
  addLine(col3, yPosition + LINE_GAP + 1, col3 + 45, yPosition + LINE_GAP + 1)
  yPosition += LINE_GAP + 3

  addText('TEL. LADA:', col1, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  addText(application.reference_1_phone1 || '', col1, yPosition + LINE_GAP, { fontSize: FONT_BASE })
  addLine(col1, yPosition + LINE_GAP + 1, col1 + 45, yPosition + LINE_GAP + 1)
  
  addText('TEL. LADA:', col3, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  addText(application.reference_2_phone1 || '', col3, yPosition + LINE_GAP, { fontSize: FONT_BASE })
  addLine(col3, yPosition + LINE_GAP + 1, col3 + 45, yPosition + LINE_GAP + 1)
  yPosition += LINE_GAP + 3

  addText('CELULAR:', col1, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  addText(application.reference_1_phone2 || '', col1, yPosition + LINE_GAP, { fontSize: FONT_BASE })
  addLine(col1, yPosition + LINE_GAP + 1, col1 + 45, yPosition + LINE_GAP + 1)
  
  addText('CELULAR:', col3, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  addText(application.reference_2_phone2 || '', col3, yPosition + LINE_GAP, { fontSize: FONT_BASE })
  addLine(col3, yPosition + LINE_GAP + 1, col3 + 45, yPosition + LINE_GAP + 1)
  yPosition += LINE_GAP + 4

  // Referencia 3 y 4 en segunda fila
  const ref3Name = application.reference_3_name || ''
  
  addText('3. NOMBRE:', col1, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  addText(ref3Name.length > 20 ? ref3Name.substring(0, 20) + '...' : ref3Name, col1, yPosition + LINE_GAP, { fontSize: FONT_BASE })
  addLine(col1, yPosition + LINE_GAP + 1, col1 + 45, yPosition + LINE_GAP + 1)
  
  addText('4. NOMBRE (OPCIONAL):', col3, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  addText('', col3, yPosition + LINE_GAP, { fontSize: FONT_BASE })
  addLine(col3, yPosition + LINE_GAP + 1, col3 + 45, yPosition + LINE_GAP + 1)
  yPosition += LINE_GAP + 3

  addText('PARENTESCO:', col1, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  addText(application.reference_3_relationship || '', col1, yPosition + LINE_GAP, { fontSize: FONT_BASE })
  addLine(col1, yPosition + LINE_GAP + 1, col1 + 45, yPosition + LINE_GAP + 1)
  
  addText('PARENTESCO:', col3, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  addText('', col3, yPosition + LINE_GAP, { fontSize: FONT_BASE })
  addLine(col3, yPosition + LINE_GAP + 1, col3 + 45, yPosition + LINE_GAP + 1)
  yPosition += LINE_GAP + 3

  addText('TEL. LADA:', col1, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  addText(application.reference_3_phone1 || '', col1, yPosition + LINE_GAP, { fontSize: FONT_BASE })
  addLine(col1, yPosition + LINE_GAP + 1, col1 + 45, yPosition + LINE_GAP + 1)
  
  addText('TEL. LADA:', col3, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  addText('', col3, yPosition + LINE_GAP, { fontSize: FONT_BASE })
  addLine(col3, yPosition + LINE_GAP + 1, col3 + 45, yPosition + LINE_GAP + 1)
  yPosition += LINE_GAP + 3

  addText('CELULAR:', col1, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  addText(application.reference_3_phone2 || '', col1, yPosition + LINE_GAP, { fontSize: FONT_BASE })
  addLine(col1, yPosition + LINE_GAP + 1, col1 + 45, yPosition + LINE_GAP + 1)
  
  addText('CELULAR:', col3, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  addText('', col3, yPosition + LINE_GAP, { fontSize: FONT_BASE })
  addLine(col3, yPosition + LINE_GAP + 1, col3 + 45, yPosition + LINE_GAP + 1)
  yPosition += LINE_GAP + 4

  // ===========================================
  // E) IDENTIFICACIONES PRESENTADAS
  // ===========================================
  yPosition += addSectionHeader('E) IDENTIFICACIONES PRESENTADAS', yPosition)

  yPosition += addField4(
    'INE (FOLIO)', application.ine_folio || '',
    'PASAPORTE (FOLIO)', application.passport_folio || '',
    'CÉDULA PROFESIONAL', application.professional_license_folio || '',
    '', '',
    yPosition
  )

  yPosition += 3

  // ===========================================
  // F) DECLARACIONES AML/PEP - COMPLETAS
  // ===========================================
  yPosition += addSectionHeader('F) DECLARACIONES AML/PEP Y ORIGEN DE RECURSOS', yPosition)

  // PEP Solicitante
  const pepRadio = radio(application.is_pep)
  addText('¿HA DESEMPEÑADO FUNCIONES PÚBLICAS DESTACADAS?', margin + 2, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  addCheckbox(margin + 80, yPosition - 1, pepRadio.yes, 2.5)
  addText('SÍ', margin + 84, yPosition + 1, { fontSize: FONT_BASE - 1 })
  addCheckbox(margin + 95, yPosition - 1, pepRadio.no, 2.5)
  addText('NO', margin + 99, yPosition + 1, { fontSize: FONT_BASE - 1 })
  yPosition += 4

  if (application.is_pep) {
    yPosition += addField4(
      'CARGO', application.pep_position || '',
      'PERÍODO', application.pep_period || '',
      '', '',
      '', '',
      yPosition
    )
    yPosition += 1
  }

  // Familiar PEP
  const pepFamiliarRadio = radio(application.has_pep_relative)
  addText('¿TIENE FAMILIAR PEP HASTA SEGUNDO GRADO?', margin + 2, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  addCheckbox(margin + 80, yPosition - 1, pepFamiliarRadio.yes, 2.5)
  addText('SÍ', margin + 84, yPosition + 1, { fontSize: FONT_BASE - 1 })
  addCheckbox(margin + 95, yPosition - 1, pepFamiliarRadio.no, 2.5)
  addText('NO', margin + 99, yPosition + 1, { fontSize: FONT_BASE - 1 })
  yPosition += 4

  if (application.has_pep_relative) {
    yPosition += addField4(
      'NOMBRE COMPLETO', application.pep_relative_name || '',
      'PARENTESCO', application.pep_relative_relationship || '',
      'CARGO', application.pep_relative_position || '',
      '', '',
      yPosition
    )
    yPosition += 1
  }

  // Declaraciones bajo protesta
  addText('DECLARACIÓN BAJO PROTESTA:', margin + 2, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  yPosition += 3
  addCheckbox(margin + 2, yPosition, application.acts_for_self, 2.5)
  addText('Actúo por cuenta propia', margin + 7, yPosition + 1.5, { fontSize: FONT_BASE - 1 })
  addCheckbox(margin + 60, yPosition, application.resources_are_legal, 2.5)
  addText('Recursos de procedencia lícita', margin + 65, yPosition + 1.5, { fontSize: FONT_BASE - 1 })
  yPosition += 5

  // ===========================================
  // G) AUTORIZACIÓN SIC (BURÓ) - COMPLETA
  // ===========================================
  yPosition += addSectionHeader('G) AUTORIZACIÓN PARA CONSULTA EN SIC (BURÓ)', yPosition)

  addCheckbox(margin + 2, yPosition, application.sic_authorization, 2.5)
  addText('Autorizo consulta en SIC y consultas periódicas (vigencia 3 años)', margin + 7, yPosition + 1.5, { fontSize: FONT_BASE })
  yPosition += 4

  yPosition += addField4(
    'NOMBRE SOLICITANTE', `${toTitleCase(application.first_names)} ${toTitleCase(application.paternal_surname)} ${toTitleCase(application.maternal_surname)}`,
    'RFC/CURP', `${toUpperCase(application.rfc_with_homoclave)} / ${toUpperCase(application.curp)}`,
    'LUGAR Y FECHA', `${application.sic_authorization_place || ''}, ${formatDate(application.sic_authorization_date)}`,
    'ASESOR QUE RECABA', application.collecting_advisor_name || '',
    yPosition
  )

  yPosition += 4

  // ===========================================
  // H) AVISO DE PRIVACIDAD - COMPACTO EN DOS COLUMNAS
  // ===========================================
  yPosition += addSectionHeader('H) AVISO DE PRIVACIDAD (EXTRACTO)', yPosition)

  addCheckbox(margin + 2, yPosition, application.privacy_notice_accepted, 2.5)
  addText('Acepto el Aviso de Privacidad para las siguientes finalidades:', margin + 7, yPosition + 1.5, { fontSize: FONT_BASE, style: 'bold' })
  yPosition += 4

  // Finalidades en dos columnas compactas
  addText('• EVALUACIÓN/OTORGAMIENTO', margin + 4, yPosition, { fontSize: FONT_BASE - 2 })
  addText('• PUBLICIDAD/TELEMARKETING (si autoriza)', margin + 105, yPosition, { fontSize: FONT_BASE - 2 })
  yPosition += 2.5
  addText('• CONSULTA EN SIC', margin + 4, yPosition, { fontSize: FONT_BASE - 2 })
  addText('• ESTADÍSTICAS/CALIDAD', margin + 105, yPosition, { fontSize: FONT_BASE - 2 })
  yPosition += 2.5
  addText('• PREVENCIÓN DE FRAUDE', margin + 4, yPosition, { fontSize: FONT_BASE - 2 })
  addText('• TRANSFERENCIAS: Cesión de derechos', margin + 105, yPosition, { fontSize: FONT_BASE - 2 })
  yPosition += 2.5
  addText('• ADMINISTRACIÓN/COBRANZA', margin + 4, yPosition, { fontSize: FONT_BASE - 2 })
  addText('• DERECHOS ARCO: contacto@fincentiva.com.mx', margin + 105, yPosition, { fontSize: FONT_BASE - 2 })
  yPosition += 3

  // Leyenda Art. 28 LRSIC
  addText('Art. 28 LRSIC: Este documento queda bajo propiedad de Fincentiva para control regulatorio.', margin + 2, yPosition, { fontSize: FONT_BASE - 2, color: 'gray' })
  yPosition += 3

  yPosition += addField('FECHA ACEPTACIÓN', formatDate(application.privacy_notice_date), col1, yPosition, 60)

  yPosition += 4

  // ===========================================
  // I) CONSENTIMIENTO DE MARKETING - EXCLUSIVO
  // ===========================================
  yPosition += addSectionHeader('I) CONSENTIMIENTO DE MARKETING', yPosition)

  const marketingRadio = radio(application.marketing_consent)
  addText('¿Acepta recibir publicidad y promociones?', margin + 2, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  addCheckbox(margin + 80, yPosition - 1, marketingRadio.yes, 2.5)
  addText('SÍ', margin + 84, yPosition + 1, { fontSize: FONT_BASE - 1 })
  addCheckbox(margin + 95, yPosition - 1, marketingRadio.no, 2.5)
  addText('NO', margin + 99, yPosition + 1, { fontSize: FONT_BASE - 1 })
  yPosition += 5

  // ===========================================
  // J) USO INTERNO FINCENTIVA - COMPLETO
  // ===========================================
  yPosition += addSectionHeader('J) PARA USO INTERNO FINCENTIVA', yPosition)

  yPosition += addField4(
    'FOLIO INTERNO', application.internal_folio || '',
    'EJECUTIVO', application.executive_name || '',
    'SUCURSAL', application.branch_office || '',
    'FECHA CONSULTA BC', '',
    yPosition
  )

  yPosition += 1
  yPosition += addField('FOLIO CONSULTA BC', '', col1, yPosition, 45)

  yPosition += 2
  addText('CHECKLIST DE EXPEDIENTE:', margin + 2, yPosition, { fontSize: FONT_LABEL, style: 'bold' })
  yPosition += 3

  // Checklist en formato compacto
  addCheckbox(margin + 2, yPosition, application.has_ine, 2.5)
  addText('INE', margin + 7, yPosition + 1.5, { fontSize: FONT_BASE - 1 })
  addCheckbox(margin + 25, yPosition, application.has_address_proof, 2.5)
  addText('Comp. domicilio', margin + 30, yPosition + 1.5, { fontSize: FONT_BASE - 1 })
  addCheckbox(margin + 70, yPosition, application.has_payroll_receipts, 2.5)
  addText('Recibos nómina', margin + 75, yPosition + 1.5, { fontSize: FONT_BASE - 1 })
  addCheckbox(margin + 120, yPosition, application.has_bank_statements, 2.5)
  addText('Estados cuenta', margin + 125, yPosition + 1.5, { fontSize: FONT_BASE - 1 })
  yPosition += 3

  addCheckbox(margin + 2, yPosition, application.has_discount_mandate, 2.5)
  addText('Mandato descuento', margin + 7, yPosition + 1.5, { fontSize: FONT_BASE - 1 })
  yPosition += 4

  yPosition += addField('RESULTADO ENTREVISTA PERSONAL', application.interview_result || '', col1, yPosition, 140)

  yPosition += 4

  // ===========================================
  // FIRMAS ALINEADAS A LA REJILLA
  // ===========================================
  addLine(col1, yPosition, col1 + 60, yPosition)
  addLine(col3, yPosition, col3 + 60, yPosition)
  yPosition += 2
  addText('FIRMA DEL SOLICITANTE', col1 + 15, yPosition, { fontSize: FONT_BASE - 1, align: 'center' })
  addText('FIRMA DEL ASESOR', col3 + 15, yPosition, { fontSize: FONT_BASE - 1, align: 'center' })
  yPosition += 2
  addText(`Fecha: ${formatDate(application.client_signature_date)}`, col1, yPosition, { fontSize: FONT_BASE - 2 })
  addText(`Fecha: ${formatDate(application.advisor_signature_date)}`, col3, yPosition, { fontSize: FONT_BASE - 2 })

  yPosition += 4

  // ===========================================
  // FOOTER
  // ===========================================
  const now = new Date()
  addText(`Generado el ${now.toLocaleDateString('es-MX')} ${now.toLocaleTimeString('es-MX')}`, 
    pageWidth / 2, yPosition, { fontSize: FONT_BASE - 2, align: 'center', color: 'gray' })

  // Verificación final de una sola página
  if (yPosition > pageHeight - margin) {
    console.warn('⚠️ PDF excede una página. Altura final:', yPosition, 'Límite:', pageHeight - margin)
    // Aplicar escalado de emergencia
    FONT_BASE = 7
    FONT_LABEL = 6
    LINE_GAP = 3.0
    console.log('🔧 Aplicando escalado de emergencia...')
  }

  // Generar y descargar el PDF
  const cleanName = (application.first_names || 'cliente').replace(/[^a-zA-Z0-9]/g, '_')
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const fileName = `fincentiva_solicitud_${day}_${month}_${application.folio_number || application.id || 'temp'}_${cleanName}.pdf`
  
  pdf.save(fileName)

  console.log('✅ PDF generado exitosamente:', fileName)
  console.log('📏 Altura final:', yPosition, 'de', pageHeight - margin, 'disponibles')

  // Tracking opcional de generación de PDF
  try {
    await fetch('/api/credit-applications/pdf-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: application.id,
        folio: application.folio_number || application.id,
        fileName,
        generatedAt: new Date().toISOString()
      })
    })
  } catch (error) {
    console.log('ℹ️ PDF tracking no disponible:', error)
  }

  return fileName
}