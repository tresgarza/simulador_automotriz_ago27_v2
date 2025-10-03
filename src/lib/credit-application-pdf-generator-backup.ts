// =========================================
// IMPORTS
// =========================================
import jsPDF from 'jspdf'

// =========================================
// INTERFACES (campos extra como opcionales)
// =========================================
export interface CreditApplication {
  id: string
  folio_number?: string | null
  // Crédito / vehículo
  product_type?: string | null
  payment_frequency?: string | null
  requested_amount?: number | null
  term_months?: number | null
  down_payment_amount?: number | null
  insurance_amount?: number | null
  insurance_mode?: 'financed' | 'cash' | string | null
  vehicle_value?: number | null
  vehicle_brand?: string | null
  vehicle_model?: string | null
  vehicle_year?: number | null
  branch?: string | null
  // Solicitante
  first_names?: string | null
  paternal_surname?: string | null
  maternal_surname?: string | null
  marital_status?: string | null
  curp?: string | null
  rfc?: string | null
  nss?: string | null
  birth_date?: string | null
  gender?: string | null
  nationality?: string | null
  birth_entity?: string | null
  education_level?: string | null
  // Contacto
  personal_email?: string | null
  work_email?: string | null
  mobile_phone?: string | null
  home_phone?: string | null
  // Domicilio
  street_address?: string | null
  neighborhood?: string | null
  zip_code?: string | null
  city?: string | null
  state?: string | null
  municipality?: string | null
  interior_number?: string | null
  // Identificaciones
  ine_folio?: string | null
  passport_folio?: string | null
  professional_license_folio?: string | null
  // AML/PEP
  is_pep?: boolean | null
  pep_position?: string | null
  pep_period?: string | null
  has_pep_relative?: boolean | null
  pep_relative_name?: string | null
  pep_relative_relationship?: string | null
  pep_relative_position?: string | null
  acts_for_self?: boolean | null
  resources_are_legal?: boolean | null
  // SIC
  sic_authorization?: boolean | null
  sic_authorization_place?: string | null
  sic_authorization_date?: string | null
  collecting_advisor_name?: string | null
  // Privacidad / marketing
  privacy_notice_accepted?: boolean | null
  privacy_notice_date?: string | null
  marketing_consent?: boolean | null
  // Uso interno
  internal_folio?: string | null
  executive_name?: string | null
  has_ine?: boolean | null
  has_address_proof?: boolean | null
  has_payroll_receipts?: boolean | null
  has_bank_statements?: boolean | null
  has_discount_mandate?: boolean | null
  interview_result?: string | null
  // Metadatos
  created_at?: string | null
  updated_at?: string | null
  status?: string | null
}

export interface CreditApplicationPDFData {
  application: CreditApplication
  generatedByUserId?: string
  applicationId?: string
}

// =========================================
// GRID Y TIPOGRAFÍA PROFESIONAL
// =========================================
const MARGIN = { top: 18, right: 18, bottom: 18, left: 18 };
const GUTTER = 8;
const SAFE_PAD = 1.5;
const FONT_BASE = 9.5;
const FONT_LABEL = 8;
const FONT_HEADER = 11;
const GAP_LABEL_VAL = 3.0;
const GAP_BETWEEN_ROWS = 2.5;
const headerHeight = 25;

// Utility functions
const lineHeightMM = (pdf: jsPDF, size: number) => {
  const factor = pdf.getLineHeightFactor() || 1.25;
  return (size / pdf.internal.scaleFactor) * factor;
};

function makeGrid(pdf: jsPDF, fractions = [3,3,3,3]) {
  const pageW = pdf.internal.pageSize.getWidth();
  const contentW = pageW - MARGIN.left - MARGIN.right;
  const sum = fractions.reduce((a,b)=>a+b,0);
  const totalGutters = GUTTER * (fractions.length - 1);
  const unit = (contentW - totalGutters) / sum;

  const w: number[] = fractions.map(fr => +(fr * unit).toFixed(2));
  const x: number[] = [];
  let cursor = MARGIN.left;
  for (let i=0;i<w.length;i++) {
    x.push(cursor);
    if (i === w.length - 1) w[i] = Math.max(0, w[i] - SAFE_PAD);
    cursor += w[i] + (i < w.length-1 ? GUTTER : 0);
  }
  return { x, w, contentW };
}

function paintHeader(pdf: jsPDF, folio: string, subtitle = '') {
  const PAGE_W = pdf.internal.pageSize.getWidth();
  pdf.setFillColor(46,204,113);
  pdf.rect(0, 0, PAGE_W, headerHeight, 'F');
  pdf.setFont('helvetica','bold'); 
  pdf.setFontSize(FONT_HEADER + 1);
  pdf.setTextColor(255,255,255);
  pdf.text('SOLICITUD DE CRÉDITO', MARGIN.left+25, 8);
  if (subtitle) {
    pdf.setFontSize(FONT_HEADER);
    pdf.text(subtitle.toUpperCase(), MARGIN.left+25, 14);
  }
  pdf.setFontSize(9);
  pdf.text(`Folio: ${folio}`, PAGE_W - MARGIN.right - 38, 8);
  pdf.setDrawColor(0); pdf.setLineWidth(0.2);
  pdf.line(MARGIN.left, headerHeight-1, PAGE_W - MARGIN.right, headerHeight-1);
}

function ensureSpace(pdf: jsPDF, y: number, needed: number, currentFolio: string) {
  const PAGE_H = pdf.internal.pageSize.getHeight();
  if (y + needed <= PAGE_H - MARGIN.bottom) return y;

  pdf.addPage();
  paintHeader(pdf, currentFolio, 'CONTINUACIÓN');
  return headerHeight + 6;
}

function drawField(
  pdf: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  opt: { align?: 'left'|'right' } = {}
) {
  const align = opt.align ?? 'left';

  pdf.setFont('helvetica','bold'); pdf.setFontSize(FONT_LABEL);
  const lh = pdf.splitTextToSize((label||'').toUpperCase()+':', width);
  const lhH = lh.length * (FONT_LABEL / pdf.internal.scaleFactor) * pdf.getLineHeightFactor();

  pdf.setFont('helvetica','normal'); pdf.setFontSize(FONT_BASE);
  const vh = pdf.splitTextToSize(value || '', width);
  const vhH = vh.length * (FONT_BASE / pdf.internal.scaleFactor) * pdf.getLineHeightFactor();

  y = ensureSpace(pdf, y, lhH + 3 + vhH + 2, 'temp');
  const tx = align === 'right' ? x + width : x;
  pdf.text(lh, x, y);
  pdf.text(vh, tx, y + lhH + 3, { align });

  pdf.setDrawColor(180); pdf.setLineWidth(0.2);
  pdf.line(x, y + lhH + 3 + vhH + 0.8, x + width, y + lhH + 3 + vhH + 0.8);

  return lhH + 3 + vhH + 3;
}

function section(pdf: jsPDF, title: string, y: number, currentFolio: string) {
  y = ensureSpace(pdf, y, 12, currentFolio);
  pdf.setFont('helvetica','bold');
  pdf.setFontSize(FONT_HEADER);
  pdf.setTextColor(0,0,0);
  pdf.text(title, MARGIN.left, y);
  const PAGE_W = pdf.internal.pageSize.getWidth();
  pdf.setDrawColor(0); pdf.setLineWidth(0.2);
  pdf.line(MARGIN.left, y, PAGE_W - MARGIN.right, y);
  return y + 6;
}

// Update drawText
const drawText = (
  pdf: jsPDF,
  txt: string,
  x: number,
  y: number,
  opt: { size?: number, bold?: boolean, color?: 'green'|'gray'|'white', align?: 'left'|'center'|'right', maxW?: number } = {}
) => {
  const size = opt.size ?? FONT_BASE
  pdf.setFont('helvetica', opt.bold ? 'bold' : 'normal')
  pdf.setFontSize(size)
  if (opt.color === 'green') pdf.setTextColor(46,204,113)
  else if (opt.color === 'gray') pdf.setTextColor(52,73,94)
  else if (opt.color === 'white') pdf.setTextColor(255,255,255)
  else pdf.setTextColor(0,0,0)
  const lines = opt.maxW ? pdf.splitTextToSize(txt ?? '', opt.maxW) : [txt ?? '']
  pdf.text(lines, x, y, { align: opt.align || 'left' })
  return lines.length * lineHeightMM(pdf, size)
}

const addLine = (pdf: jsPDF, x1: number, y1: number, x2: number, y2: number) => {
  pdf.setLineWidth(0.1)
  pdf.setDrawColor(0,0,0)
  pdf.line(x1, y1, x2, y2)
}

const field = (pdf: jsPDF, label: string, val: string, x: number, y: number, width: number) => {
  const lh = drawText(pdf, (label || '').toUpperCase()+':', x, y, { size: FONT_LABEL, bold: true, maxW: width })
  const vh = drawText(pdf, val || '', x, y + lh + GAP_LABEL_VAL, { size: FONT_BASE, maxW: width })
  const h  = lh + GAP_LABEL_VAL + vh
  addLine(pdf, x, y + h + 0.6, x + width, y + h + 0.6)
  return h + 1.2
}

const checkbox = (pdf: jsPDF, x:number, y:number, checked=false, size=2.8) => {
  pdf.rect(x, y, size, size)
  if (checked) {
    pdf.setLineWidth(0.3)
    pdf.line(x+0.6, y+0.6, x+size-0.6, y+size-0.6)
    pdf.line(x+size-0.6, y+0.6, x+0.6, y+size-0.6)
    pdf.setLineWidth(0.1)
  }
}

// Celda tipada
type Cell = readonly [label: string, value: string, x: number, width: number]

// Utilidades de formato
const formatMXN = (n?: number | null) =>
  new Intl.NumberFormat('es-MX', { style:'currency', currency:'MXN', minimumFractionDigits:2 }).format(n || 0)
const formatDate = (d?: string | Date | null) => {
  if (!d) return ''
  const dd = new Date(d)
  return dd.toLocaleDateString('es-MX', { day:'2-digit', month:'2-digit', year:'numeric' })
}

// =========================================
// GENERADOR
// =========================================
export const generateCreditApplicationPDF = async (data: CreditApplicationPDFData | CreditApplication) => {
  console.log('🔍 [DEBUG] PDF Generator - received data:', data)
  console.log('🔍 [DEBUG] PDF Generator - data type:', typeof data)
  console.log('🔍 [DEBUG] PDF Generator - has folio_number:', 'folio_number' in data)
  
  // Validación robusta de datos
  if (!data) {
    throw new Error('No se proporcionaron datos para generar el PDF')
  }

  // Extraer application object
  const application: CreditApplication = ('folio_number' in data) ? data as CreditApplication : (data as CreditApplicationPDFData).application
  
  console.log('🔍 [DEBUG] PDF Generator - final application:', application)
  console.log('🔍 [DEBUG] PDF Generator - application folio_number:', application?.folio_number)
  
  if (!application) {
    throw new Error('No se encontró información de la solicitud')
  }

  if (!application.folio_number && !application.id) {
    throw new Error('La solicitud no tiene folio_number ni ID')
  }

  // === función que pinta todo con layout profesional de 2 páginas ===
  const paint = (pdf: jsPDF, scale = 1) => {
    // Configurar tipografía profesional
    pdf.setFont('helvetica','normal')
    pdf.setFontSize(9)
    pdf.setLineHeightFactor(1.25)

    // ancho/alto reales del doc
    const PAGE_WIDTH  = pdf.internal.pageSize.getWidth()
    const PAGE_HEIGHT = pdf.internal.pageSize.getHeight()
    const contentWidth = PAGE_WIDTH - MARGIN.left - MARGIN.right

    // Grid correcto (nunca se sale del margen)
    const grid = makeGrid(pdf)

    let y = MARGIN.top
    let currentPage = 1

    // Función helper para salto de página
    const addPageIfNeeded = (needed: number = 20) => {
      y = ensureSpace(pdf, y, needed, application.folio_number || application.id)
    }

    // ====== HEADER ======
    const headerHeight = 25
    pdf.setFillColor(46,204,113)
    pdf.rect(0, 0, PAGE_WIDTH, headerHeight, 'F')
    // título
    drawText(pdf, 'SOLICITUD DE CRÉDITO', MARGIN.left + 25, 8, { size: FONT_HEADER+2, bold:true, color:'white' })
    drawText(pdf, (application.product_type || 'AUTOMOTRIZ').toUpperCase(), MARGIN.left + 25, 14, { size: FONT_HEADER, bold:true, color:'white' })
    drawText(pdf, `Folio: ${application.folio_number || application.id}`, PAGE_WIDTH - MARGIN.right - 35, 8, { size: FONT_BASE, bold:true, color:'white' })
    addLine(pdf, MARGIN.left, headerHeight-1, PAGE_WIDTH - MARGIN.right, headerHeight-1)
    y = headerHeight + 5

    // ====== A) DATOS DEL CRÉDITO ======
    y += drawText(pdf, 'A) DATOS DEL CRÉDITO', MARGIN.left, y, { size:FONT_HEADER, bold:true })
    addLine(pdf, MARGIN.left, y, PAGE_WIDTH - MARGIN.right, y); y += 6

    const paymentEach = (() => {
      const principal = application.requested_amount || 0
      const rate = 0.15/12
      const n = application.term_months || 48
      return principal * rate / (1 - Math.pow(1+rate, -n))
    })()

    y = row4(pdf, [
      { label:'PRODUCTO', value: application.product_type || 'Auto', col:0 },
      { label:'MARCA/MODELO/VERSIÓN', value: `${application.vehicle_brand || ''} ${application.vehicle_model || ''}`.trim(), col:1 },
      { label:'AÑO', value: String(application.vehicle_year || ''), col:2 },
      { label:'PRECIO VEHÍCULO', value: formatMXN(application.vehicle_value), col:3 }
    ], y, grid)

    y = row4(pdf, [
      { label:'ENGANCHE', value: formatMXN(application.down_payment_amount), col:0 },
      { label:'MONTO SEGURO', value: formatMXN(application.insurance_amount), col:1 },
      { label:'PLAN DE CRÉDITO', value: application.payment_frequency || 'Mensual', col:2 },
      { label:'IMPORTE CRÉDITO', value: formatMXN(application.requested_amount), col:3 }
    ], y, grid)

    // Radios (reservando altura)
    drawText(pdf, 'SEGURO FINANCIADO:', grid.x[0], y, { size:FONT_LABEL, bold:true })
    checkbox(pdf, grid.x[0] + 45, y-1, application.insurance_mode === 'financed')
    drawText(pdf, 'SÍ', grid.x[0] + 49, y+1, { size:FONT_BASE })
    checkbox(pdf, grid.x[0] + 65, y-1, application.insurance_mode !== 'financed')
    drawText(pdf, 'NO', grid.x[0] + 69, y+1, { size:FONT_BASE })
    y += 8

    y = row4(pdf, [
      { label:'IMPORTE C/U PAGOS', value: formatMXN(paymentEach), col:0 },
      { label:'PLAZO (MESES)', value: String(application.term_months || 48), col:1 },
      { label:'SUCURSAL', value: application.branch || 'Principal', col:2 },
      { label:'ESTADO', value: 'Pendiente', col:3 }
    ], y, grid)

    // ====== B) DATOS DEL SOLICITANTE ======
    y += 10
    y += drawText(pdf, 'B) DATOS DEL SOLICITANTE', MARGIN.left, y, { size:FONT_HEADER, bold:true })
    addLine(pdf, MARGIN.left, y, PAGE_WIDTH - MARGIN.right, y); y += 6

    y = row4(pdf, [
      { label:'NOMBRE(S)', value: application.first_names || '', col:0 },
      { label:'APELLIDO PATERNO', value: application.paternal_surname || '', col:1 },
      { label:'APELLIDO MATERNO', value: application.maternal_surname || '', col:2 },
      { label:'ESTADO CIVIL', value: application.marital_status || '', col:3 }
    ], y, grid)

    y = row4(pdf, [
      { label:'CURP', value: application.curp || '', col:0 },
      { label:'RFC CON HOMOCLAVE', value: application.rfc || '', col:1 },
      { label:'NSS', value: application.nss || '', col:2 },
      { label:'FECHA DE NACIMIENTO', value: formatDate(application.birth_date), col:3 }
    ], y, grid)

    y = row4(pdf, [
      { label:'GÉNERO', value: application.gender || '', col:0 },
      { label:'NACIONALIDAD', value: application.nationality || 'Mexicana', col:1 },
      { label:'ENTIDAD DE NACIMIENTO', value: application.birth_entity || '', col:2 },
      { label:'NIVEL DE ESTUDIOS', value: application.education_level || '', col:3 }
    ], y, grid)

    // ====== CONTACTO ======
    y += 10
    y += drawText(pdf, 'CONTACTO', MARGIN.left, y, { size:FONT_HEADER, bold:true })
    addLine(pdf, MARGIN.left, y, PAGE_WIDTH - MARGIN.right, y); y += 6

    y = row4(pdf, [
      { label:'EMAIL PERSONAL', value: application.personal_email || '', col:0 },
      { label:'EMAIL LABORAL', value: application.work_email || '', col:1 },
      { label:'TELÉFONO MÓVIL', value: application.mobile_phone || '', col:2 },
      { label:'TELÉFONO FIJO', value: application.home_phone || '', col:3 }
    ], y, grid)

    // ====== DOMICILIO ======
    y += 10
    y += drawText(pdf, 'DOMICILIO', MARGIN.left, y, { size:FONT_HEADER, bold:true })
    addLine(pdf, MARGIN.left, y, PAGE_WIDTH - MARGIN.right, y); y += 6

    y = row4(pdf, [
      { label:'CALLE Y NÚMERO', value: application.street_address || '', col:0 },
      { label:'COLONIA', value: application.neighborhood || '', col:1 },
      { label:'CÓDIGO POSTAL', value: application.zip_code || '', col:2 },
      { label:'CIUDAD', value: application.city || '', col:3 }
    ], y, grid)

    y = row4(pdf, [
      { label:'ESTADO', value: application.state || '', col:0 },
      { label:'MUNICIPIO', value: application.municipality || '', col:1 },
      { label:'NO. INTERIOR', value: application.interior_number || '', col:2 },
      { label:'PAÍS', value: 'México', col:3 }
    ], y, grid)

    // Footer página 1
    const footerY1 = PAGE_HEIGHT - 10
    drawText(pdf, `Página 1 de 2`, PAGE_WIDTH/2, footerY1, { size:FONT_BASE - 2, align:'center', color:'gray' })

    // ====== SALTO A PÁGINA 2 ======
    console.log('📄 Agregando página 2 para layout profesional')
    addPageIfNeeded(50) // Saltar a página 2

    // ====== E) IDENTIFICACIONES PRESENTADAS ======
    y += drawText(pdf, 'E) IDENTIFICACIONES PRESENTADAS', MARGIN.left, y, { size:FONT_HEADER, bold:true })
    addLine(pdf, MARGIN.left, y, PAGE_WIDTH - MARGIN.right, y); y += 6

    y = row4(pdf, [
      { label:'INE (FOLIO)', value: application.ine_folio || '', col:0 },
      { label:'PASAPORTE (FOLIO)', value: application.passport_folio || '', col:1 },
      { label:'CÉDULA PROFESIONAL', value: application.professional_license_folio || '', col:2 },
      { label:'OTRO', value: '', col:3 }
    ], y, grid)

    // ====== F) DECLARACIONES AML/PEP Y ORIGEN DE RECURSOS ======
    y += 10
    y += drawText(pdf, 'F) DECLARACIONES AML/PEP Y ORIGEN DE RECURSOS', MARGIN.left, y, { size:FONT_HEADER, bold:true })
    addLine(pdf, MARGIN.left, y, PAGE_WIDTH - MARGIN.right, y); y += 6

    // PEP propio con mejor espaciado
    drawText(pdf, '¿HA DESEMPEÑADO FUNCIONES PÚBLICAS DESTACADAS?', grid.x[0], y, { size:FONT_LABEL, bold:true })
    checkbox(pdf, grid.x[0] + 85, y - 1, application.is_pep === true);  drawText(pdf, 'SÍ', grid.x[0] + 90, y + 1, { size:FONT_BASE })
    checkbox(pdf, grid.x[0] + 105, y - 1, application.is_pep === false); drawText(pdf, 'NO', grid.x[0] + 110, y + 1, { size:FONT_BASE })
    y += 8

  if (application.is_pep) {
      y = row4(pdf, [
        { label:'CARGO', value: application.pep_position || '', col:0 },
        { label:'PERÍODO', value: application.pep_period || '', col:1 },
        { label:'INSTITUCIÓN', value: '', col:2 },
        { label:'NIVEL', value: '', col:3 }
      ], y, grid)
    }

    // PEP familiar con mejor espaciado
    drawText(pdf, '¿TIENE FAMILIAR PEP HASTA SEGUNDO GRADO?', grid.x[0], y, { size:FONT_LABEL, bold:true })
    checkbox(pdf, grid.x[0] + 85, y - 1, application.has_pep_relative === true);  drawText(pdf, 'SÍ', grid.x[0] + 90, y + 1, { size:FONT_BASE })
    checkbox(pdf, grid.x[0] + 105, y - 1, application.has_pep_relative === false); drawText(pdf, 'NO', grid.x[0] + 110, y + 1, { size:FONT_BASE })
    y += 8

  if (application.has_pep_relative) {
      y = row4(pdf, [
        { label:'NOMBRE COMPLETO', value: application.pep_relative_name || '', col:0 },
        { label:'PARENTESCO', value: application.pep_relative_relationship || '', col:1 },
        { label:'CARGO', value: application.pep_relative_position || '', col:2 },
        { label:'INSTITUCIÓN', value: '', col:3 }
      ], y, grid)
    }

    // Bajo protesta con mejor espaciado
    y += 8
    drawText(pdf, 'DECLARACIÓN BAJO PROTESTA:', grid.x[0], y, { size:FONT_LABEL, bold:true })
    y += 6
    checkbox(pdf, grid.x[0], y - 1, !!application.acts_for_self);       drawText(pdf, 'Actúo por cuenta propia', grid.x[0] + 6, y + 1, { size:FONT_BASE })
    checkbox(pdf, grid.x[0] + 70, y - 1, !!application.resources_are_legal); drawText(pdf, 'Recursos de procedencia lícita', grid.x[0] + 76, y + 1, { size:FONT_BASE })
    y += 8

    // ====== G) AUTORIZACIÓN PARA CONSULTA EN SIC (BURÓ) ======
    y += 10
    y += drawText(pdf, 'G) AUTORIZACIÓN PARA CONSULTA EN SIC (BURÓ)', MARGIN.left, y, { size:FONT_HEADER, bold:true })
    addLine(pdf, MARGIN.left, y, PAGE_WIDTH - MARGIN.right, y); y += 6

    checkbox(pdf, grid.x[0], y - 1, !!application.sic_authorization)
    drawText(pdf, 'Autorizo consulta en SIC y consultas periódicas (vigencia 3 años)', grid.x[0] + 6, y + 1, { size:FONT_BASE })
    y += 8

    const fullName = `${application.first_names || ''} ${application.paternal_surname || ''} ${application.maternal_surname || ''}`.trim()
    y = row4(pdf, [
      { label:'NOMBRE SOLICITANTE', value: fullName, col:0 },
      { label:'RFC/CURP', value: `${application.rfc || ''} / ${application.curp || ''}`, col:1 },
      { label:'LUGAR Y FECHA', value: `${application.sic_authorization_place || ''} ${formatDate(application.sic_authorization_date)}`, col:2 },
      { label:'ASESOR QUE RECABA', value: application.collecting_advisor_name || '', col:3 }
    ], y, grid)

    // ====== H) AVISO DE PRIVACIDAD (EXTRACTO) ======
    y += 10
    y += drawText(pdf, 'H) AVISO DE PRIVACIDAD (EXTRACTO)', MARGIN.left, y, { size:FONT_HEADER, bold:true })
    addLine(pdf, MARGIN.left, y, PAGE_WIDTH - MARGIN.right, y); y += 6

    checkbox(pdf, grid.x[0], y - 1, !!application.privacy_notice_accepted)
    drawText(pdf, 'Acepto el Aviso de Privacidad para las siguientes finalidades:', grid.x[0] + 6, y + 1, { size:FONT_BASE, bold:true })
    y += 8

    const colW = (contentWidth - 12) / 2
    const leftBullets =
      '• EVALUACIÓN/OTORGAMIENTO\n• CONSULTA EN SIC\n• PREVENCIÓN DE FRAUDE\n• ADMINISTRACIÓN/COBRANZA'
    const rightBullets =
      '• PUBLICIDAD (si autoriza)\n• ESTADÍSTICAS/CALIDAD\n• TRANSFERENCIAS (cesión de derechos)\n• ARCO: contacto@fincentiva.com.mx'
    const h1 = drawText(pdf, leftBullets, MARGIN.left + 4, y, { size: FONT_BASE - 1, maxW: colW })
    const h2 = drawText(pdf, rightBullets, MARGIN.left + 8 + colW, y, { size: FONT_BASE - 1, maxW: colW })
    y += Math.max(h1, h2) + 5
    drawText(pdf, 'Art. 28 LRSIC: Este documento queda bajo propiedad de Fincentiva para control regulatorio.', MARGIN.left + 4, y, { size: FONT_BASE - 1, color: 'gray', maxW: contentWidth })
    y += 6
    y = row4(pdf, [
      { label:'FECHA ACEPTACIÓN', value: formatDate(application.privacy_notice_date), col:0 },
      { label:'LUGAR', value: 'En línea', col:1 },
      { label:'IP', value: '', col:2 },
      { label:'HORA', value: '', col:3 }
    ], y, grid)

    // ====== I) CONSENTIMIENTO DE MARKETING ======
    y += 10
    y += drawText(pdf, 'I) CONSENTIMIENTO DE MARKETING', MARGIN.left, y, { size:FONT_HEADER, bold:true })
    addLine(pdf, MARGIN.left, y, PAGE_WIDTH - MARGIN.right, y); y += 6
    drawText(pdf, '¿Acepta recibir publicidad y promociones?', grid.x[0], y, { size:FONT_LABEL, bold:true })
    checkbox(pdf, grid.x[0] + 85, y - 1, application.marketing_consent === true);  drawText(pdf, 'SÍ', grid.x[0] + 90, y + 1, { size:FONT_BASE })
    checkbox(pdf, grid.x[0] + 105, y - 1, application.marketing_consent === false); drawText(pdf, 'NO', grid.x[0] + 110, y + 1, { size:FONT_BASE })
    y += 8

    // ====== J) PARA USO INTERNO FINCENTIVA ======
    y += 10
    y += drawText(pdf, 'J) PARA USO INTERNO FINCENTIVA', MARGIN.left, y, { size:FONT_HEADER, bold:true })
    addLine(pdf, MARGIN.left, y, PAGE_WIDTH - MARGIN.right, y); y += 6

    y = row4(pdf, [
      { label:'FOLIO INTERNO', value: application.internal_folio || '', col:0 },
      { label:'EJECUTIVO', value: application.executive_name || '', col:1 },
      { label:'SUCURSAL', value: application.branch || '', col:2 },
      { label:'FECHA CAPTURA', value: formatDate(application.created_at), col:3 }
    ], y, grid)

    // Checklist con mejor espaciado
    y += 8
    drawText(pdf, 'CHECKLIST DE EXPEDIENTE:', grid.x[0], y, { size:FONT_LABEL, bold:true })
    y += 6
    checkbox(pdf, grid.x[0], y - 1, !!application.has_ine);                 drawText(pdf, 'INE', grid.x[0] + 6, y + 1, { size:FONT_BASE })
    checkbox(pdf, grid.x[0] + 30, y - 1, !!application.has_address_proof); drawText(pdf, 'Comp. domicilio', grid.x[0] + 36, y + 1, { size:FONT_BASE })
    checkbox(pdf, grid.x[0] + 80, y - 1, !!application.has_payroll_receipts); drawText(pdf, 'Recibos nómina', grid.x[0] + 86, y + 1, { size:FONT_BASE })
    checkbox(pdf, grid.x[0] + 130, y - 1, !!application.has_bank_statements); drawText(pdf, 'Estados cuenta', grid.x[0] + 136, y + 1, { size:FONT_BASE })
    y += 6
    checkbox(pdf, grid.x[0], y - 1, !!application.has_discount_mandate);   drawText(pdf, 'Mandato descuento', grid.x[0] + 6, y + 1, { size:FONT_BASE })
    y += 8

    y = row4(pdf, [
      { label:'RESULTADO ENTREVISTA PERSONAL', value: application.interview_result || '', col:0 },
      { label:'OBSERVACIONES', value: '', col:1 },
      { label:'ESTADO', value: application.status || 'Pendiente', col:2 },
      { label:'PRIORIDAD', value: 'Normal', col:3 }
    ], y, grid)

    // Firmas con mejor espaciado
    y += 20
    addLine(pdf, grid.x[0], y, grid.x[0] + 70, y)
    addLine(pdf, grid.x[2], y, grid.x[2] + 70, y)
    y += 6
    drawText(pdf, 'FIRMA DEL SOLICITANTE', grid.x[0] + 10, y, { size:FONT_BASE, bold:true })
    drawText(pdf, 'FIRMA DEL ASESOR', grid.x[2] + 15, y, { size:FONT_BASE, bold:true })
    y += 6
    drawText(pdf, `Fecha: ${formatDate(application.created_at)}`, grid.x[0], y, { size:FONT_BASE - 1 })
    drawText(pdf, `Fecha: ${formatDate(application.updated_at)}`, grid.x[2], y, { size:FONT_BASE - 1 })

    // Footer profesional
    y += 12
  const now = new Date()
    drawText(pdf, `Documento generado el ${now.toLocaleDateString('es-MX')} a las ${now.toLocaleTimeString('es-MX')}`, PAGE_WIDTH/2, y, { size:FONT_BASE - 1, align:'center', color:'gray' })
    y += 4
    drawText(pdf, `Página ${currentPage} de 2`, PAGE_WIDTH/2, y, { size:FONT_BASE - 2, align:'center', color:'gray' })

    return y // Y final para control de una página
  }

  // ===== Generar PDF con layout de 2 páginas profesional =====
  let pdfInstance = new jsPDF('p','mm','a4')
  const finalY = paint(pdfInstance, 1.00) // Siempre usar escala 1.0 para máxima legibilidad
  
  console.log('📄 PDF generado con layout profesional de 2 páginas, altura final:', finalY)

  const day = new Date().getDate().toString().padStart(2,'0')
  const month = (new Date().getMonth()+1).toString().padStart(2,'0')
  const cleanName = (application.first_names || 'temp').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)
  const fileName = `fincentiva_solicitud_${day}_${month}_${application.folio_number || application.id}_${cleanName}.pdf`
  
  console.log('💾 Guardando PDF:', fileName)

  // Setup will be done in paint function

  // Update drawText
  const drawText = (
    pdf: jsPDF,
    txt: string,
    x: number,
    y: number,
    opt: { size?: number, bold?: boolean, color?: 'green'|'gray'|'white', align?: 'left'|'center'|'right', maxW?: number } = {}
  ) => {
    const size = opt.size ?? FONT_BASE
    pdf.setFont('helvetica', opt.bold ? 'bold' : 'normal')
    pdf.setFontSize(size)
    if (opt.color === 'green') pdf.setTextColor(46,204,113)
    else if (opt.color === 'gray') pdf.setTextColor(52,73,94)
    else if (opt.color === 'white') pdf.setTextColor(255,255,255)
    else pdf.setTextColor(0,0,0)
    const lines = opt.maxW ? pdf.splitTextToSize(txt ?? '', opt.maxW) : [txt ?? '']
    pdf.text(lines, x, y, { align: opt.align || 'left' })
    return lines.length * lineHeightMM(pdf, size)
  }

  const addLine = (pdf: jsPDF, x1: number, y1: number, x2: number, y2: number) => {
    pdf.setLineWidth(0.1)
    pdf.setDrawColor(0,0,0)
    pdf.line(x1, y1, x2, y2)
  }

  const field = (pdf: jsPDF, label: string, val: string, x: number, y: number, width: number) => {
    const lh = drawText(pdf, (label || '').toUpperCase()+':', x, y, { size: FONT_LABEL, bold: true, maxW: width })
    const vh = drawText(pdf, val || '', x, y + lh + GAP_LABEL_VAL, { size: FONT_BASE, maxW: width })
    const h  = lh + GAP_LABEL_VAL + vh
    addLine(pdf, x, y + h + 0.6, x + width, y + h + 0.6)
    return h + 1.2
  }

  const checkbox = (pdf: jsPDF, x:number, y:number, checked=false, size=2.8) => {
    pdf.rect(x, y, size, size)
    if (checked) {
      pdf.setLineWidth(0.3)
      pdf.line(x+0.6, y+0.6, x+size-0.6, y+size-0.6)
      pdf.line(x+size-0.6, y+0.6, x+0.6, y+size-0.6)
      pdf.setLineWidth(0.1)
    }
  }

  // Row functions for the paint function
  function measureField(pdf: jsPDF, label: string, value: string, width: number, sizes = {label: FONT_LABEL, value: FONT_BASE}) {
    pdf.setFontSize(sizes.label);
    const lh = pdf.splitTextToSize((label||'').toUpperCase()+':', width);
    const lhH = lh.length * lineHeightMM(pdf, sizes.label);

    pdf.setFontSize(sizes.value);
    const vh = pdf.splitTextToSize(value || '', width);
    const vhH = vh.length * lineHeightMM(pdf, sizes.value);

    return { lh, lhH, vh, vhH, total: lhH + GAP_LABEL_VAL + vhH + 1.2 };
  }

  function row2(pdf: jsPDF, cells: Array<{label: string, value: string, col: number}>, y: number, grid: ReturnType<typeof makeGrid>) {
    const hs = cells.map(c => drawField(pdf, c.label, c.value, grid.x[c.col], y, grid.w[c.col]));
    return y + Math.max(...hs) + GAP_BETWEEN_ROWS;
  }

  function row3(pdf: jsPDF, cells: Array<{label: string, value: string, col: number}>, y: number, grid: ReturnType<typeof makeGrid>) {
    const hs = cells.map(c => drawField(pdf, c.label, c.value, grid.x[c.col], y, grid.w[c.col]));
    return y + Math.max(...hs) + GAP_BETWEEN_ROWS;
  }

  function row4(pdf: jsPDF, cells: Array<{label: string, value: string, col: number}>, y: number, grid: ReturnType<typeof makeGrid>) {
    const hs = cells.map(c => drawField(pdf, c.label, c.value, grid.x[c.col], y, grid.w[c.col]));
    return y + Math.max(...hs) + GAP_BETWEEN_ROWS;
  }

    // Footer profesional
    y += 12
    const now = new Date()
    drawText(pdf, `Documento generado el ${now.toLocaleDateString('es-MX')} a las ${now.toLocaleTimeString('es-MX')}`, PAGE_WIDTH/2, y, { size:FONT_BASE - 1, align:'center', color:'gray' })
    y += 4
    drawText(pdf, `Página ${currentPage} de 2`, PAGE_WIDTH/2, y, { size:FONT_BASE - 2, align:'center', color:'gray' })

    return y // Y final para control de una página
  }

  // ===== Generar PDF con layout de 2 páginas profesional =====
  let pdfInstance = new jsPDF('p','mm','a4')
  const finalY = paint(pdfInstance, 1.00) // Siempre usar escala 1.0 para máxima legibilidad
  
  console.log('📄 PDF generado con layout profesional de 2 páginas, altura final:', finalY)

  pdfInstance.save(fileName)

  // tracking opcional (no bloquea)
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
    console.warn('⚠️ Error en tracking de PDF (no crítico):', error)
  }

  console.log('✅ PDF profesional generado exitosamente:', fileName)
  return { success: true, fileName }
}