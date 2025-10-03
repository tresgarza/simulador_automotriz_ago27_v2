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
// CONSTANTS AND UTILITIES
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

  const day = new Date().getDate().toString().padStart(2,'0')
  const month = (new Date().getMonth()+1).toString().padStart(2,'0')
  const cleanName = (application.first_names || 'temp').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)
  const fileName = `fincentiva_solicitud_${day}_${month}_${application.folio_number || application.id}_${cleanName}.pdf`
  
  console.log('💾 Guardando PDF:', fileName)

  // === función que pinta todo con layout profesional de 2 páginas ===
  const paint = (pdf: jsPDF) => {
    // Configurar tipografía profesional
    pdf.setFont('helvetica','normal')
    pdf.setFontSize(FONT_BASE)
    pdf.setLineHeightFactor(1.25)

    // ancho/alto reales del doc
    const PAGE_WIDTH  = pdf.internal.pageSize.getWidth()
    const PAGE_HEIGHT = pdf.internal.pageSize.getHeight()

    // Grid correcto (nunca se sale del margen)
    const grid = makeGrid(pdf)

    let y = MARGIN.top
    const currentFolio = application.folio_number || application.id

    // ====== HEADER ======
    paintHeader(pdf, currentFolio)
    y = headerHeight + 5

    // ====== A) DATOS DEL CRÉDITO ======
    y = ensureSpace(pdf, y, 12, currentFolio)
    pdf.setFont('helvetica','bold')
    pdf.setFontSize(FONT_HEADER)
    pdf.setTextColor(0,0,0)
    pdf.text('A) DATOS DEL CRÉDITO', MARGIN.left, y)
    pdf.setDrawColor(0); pdf.setLineWidth(0.2)
    pdf.line(MARGIN.left, y, PAGE_WIDTH - MARGIN.right, y)
    y += 6

    const paymentEach = (() => {
      const principal = application.requested_amount || 0
      const rate = 0.15/12
      const n = application.term_months || 48
      return principal * rate / (1 - Math.pow(1+rate, -n))
    })()

    // Use 3 columns for credit data
    const g3 = makeGrid(pdf, [4,4,4])
    
    // Row 1
    y = ensureSpace(pdf, y, 20, currentFolio)
    pdf.setFont('helvetica','bold'); pdf.setFontSize(FONT_LABEL)
    pdf.text('PRODUCTO:', g3.x[0], y)
    pdf.setFont('helvetica','normal'); pdf.setFontSize(FONT_BASE)
    pdf.text(application.product_type || 'Auto', g3.x[0], y + 4)
    pdf.setDrawColor(180); pdf.setLineWidth(0.2)
    pdf.line(g3.x[0], y + 6, g3.x[0] + g3.w[0], y + 6)

    pdf.setFont('helvetica','bold'); pdf.setFontSize(FONT_LABEL)
    pdf.text('MARCA/MODELO:', g3.x[1], y)
    pdf.setFont('helvetica','normal'); pdf.setFontSize(FONT_BASE)
    pdf.text(`${application.vehicle_brand || ''} ${application.vehicle_model || ''}`.trim(), g3.x[1], y + 4)
    pdf.line(g3.x[1], y + 6, g3.x[1] + g3.w[1], y + 6)

    pdf.setFont('helvetica','bold'); pdf.setFontSize(FONT_LABEL)
    pdf.text('PRECIO VEHÍCULO:', g3.x[2], y)
    pdf.setFont('helvetica','normal'); pdf.setFontSize(FONT_BASE)
    pdf.text(formatMXN(application.vehicle_value), g3.x[2] + g3.w[2], y + 4, { align: 'right' })
    pdf.line(g3.x[2], y + 6, g3.x[2] + g3.w[2], y + 6)
    y += 12

    // Row 2
    y = ensureSpace(pdf, y, 20, currentFolio)
    pdf.setFont('helvetica','bold'); pdf.setFontSize(FONT_LABEL)
    pdf.text('ENGANCHE:', g3.x[0], y)
    pdf.setFont('helvetica','normal'); pdf.setFontSize(FONT_BASE)
    pdf.text(formatMXN(application.down_payment_amount), g3.x[0] + g3.w[0], y + 4, { align: 'right' })
    pdf.line(g3.x[0], y + 6, g3.x[0] + g3.w[0], y + 6)

    pdf.setFont('helvetica','bold'); pdf.setFontSize(FONT_LABEL)
    pdf.text('PLAN DE CRÉDITO:', g3.x[1], y)
    pdf.setFont('helvetica','normal'); pdf.setFontSize(FONT_BASE)
    pdf.text(application.payment_frequency || 'Mensual', g3.x[1], y + 4)
    pdf.line(g3.x[1], y + 6, g3.x[1] + g3.w[1], y + 6)

    pdf.setFont('helvetica','bold'); pdf.setFontSize(FONT_LABEL)
    pdf.text('IMPORTE CRÉDITO:', g3.x[2], y)
    pdf.setFont('helvetica','normal'); pdf.setFontSize(FONT_BASE)
    pdf.text(formatMXN(application.requested_amount), g3.x[2] + g3.w[2], y + 4, { align: 'right' })
    pdf.line(g3.x[2], y + 6, g3.x[2] + g3.w[2], y + 6)
    y += 12

    // Radios
    y = ensureSpace(pdf, y, 8, currentFolio)
    pdf.setFont('helvetica','bold'); pdf.setFontSize(FONT_LABEL)
    pdf.text('SEGURO FINANCIADO:', g3.x[0], y)
    pdf.rect(g3.x[0] + 46, y - 1, 2.8, 2.8)
    if (application.insurance_mode === 'financed') {
      pdf.setLineWidth(0.3)
      pdf.line(g3.x[0] + 46.6, y - 0.4, g3.x[0] + 48.2, y + 1.2)
      pdf.line(g3.x[0] + 48.2, y - 0.4, g3.x[0] + 46.6, y + 1.2)
      pdf.setLineWidth(0.2)
    }
    pdf.setFont('helvetica','normal'); pdf.setFontSize(FONT_BASE)
    pdf.text('SÍ', g3.x[0] + 50, y + 1)
    
    pdf.rect(g3.x[0] + 62, y - 1, 2.8, 2.8)
    if (application.insurance_mode !== 'financed') {
      pdf.setLineWidth(0.3)
      pdf.line(g3.x[0] + 62.6, y - 0.4, g3.x[0] + 64.2, y + 1.2)
      pdf.line(g3.x[0] + 64.2, y - 0.4, g3.x[0] + 62.6, y + 1.2)
      pdf.setLineWidth(0.2)
    }
    pdf.text('NO', g3.x[0] + 66, y + 1)
    y += 8

    // Footer profesional
    y += 12
    const now = new Date()
    pdf.setFont('helvetica','normal')
    pdf.setFontSize(8)
    pdf.setTextColor(128,128,128)
    pdf.text(`Documento generado el ${now.toLocaleDateString('es-MX')} a las ${now.toLocaleTimeString('es-MX')}`, PAGE_WIDTH/2, y, { align:'center' })
    y += 4
    pdf.text('Página 1 de 2', PAGE_WIDTH/2, y, { align:'center' })

    return y
  }

  // ===== Generar PDF con layout profesional =====
  let pdfInstance = new jsPDF('p','mm','a4')
  const finalY = paint(pdfInstance)
  
  console.log('📄 PDF generado con layout profesional, altura final:', finalY)

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





