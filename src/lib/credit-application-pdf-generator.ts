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
  monthly_payment?: number | null
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
  rfc_homoclave?: string | null
  nss?: string | null
  birth_date?: string | null
  birth_state?: string | null
  birth_country?: string | null
  gender?: string | null
  nationality?: string | null
  birth_entity?: string | null
  education_level?: string | null
  electronic_signature_series?: string | null
  dependents_count?: number | null
  // Contacto
  personal_email?: string | null
  work_email?: string | null
  mobile_phone?: string | null
  home_phone?: string | null
  landline_phone?: string | null
  emergency_phone?: string | null
  // Empleo
  company_name?: string | null
  job_position?: string | null
  occupation?: string | null
  immediate_supervisor?: string | null
  job_seniority_years?: number | null
  job_seniority_months?: number | null
  monthly_income?: number | null
  work_phone?: string | null
  work_extension?: string | null
  work_address?: string | null
  // Referencias personales
  reference_1_name?: string | null
  reference_1_relationship?: string | null
  reference_1_phone1?: string | null
  reference_1_phone2?: string | null
  reference_1_mobile?: string | null
  reference_2_name?: string | null
  reference_2_relationship?: string | null
  reference_2_phone1?: string | null
  reference_2_phone2?: string | null
  reference_2_mobile?: string | null
  reference_3_name?: string | null
  reference_3_relationship?: string | null
  reference_3_phone1?: string | null
  reference_3_phone2?: string | null
  reference_3_mobile?: string | null
  // Domicilio
  street_address?: string | null
  street_and_number?: string | null
  between_streets?: string | null
  neighborhood?: string | null
  zip_code?: string | null
  postal_code?: string | null
  city?: string | null
  state?: string | null
  municipality?: string | null
  interior_number?: string | null
  housing_type?: string | null
  residence_years?: number | null
  country?: string | null
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
// CONSTANTS AND UTILITIES - OPTIMIZED FOR BETTER SPACING
// =========================================
const MARGIN = { top: 15, right: 12, bottom: 15, left: 12 }; // Márgenes reducidos para más espacio
const GUTTER = 6; // Espacio entre columnas optimizado
const SAFE_PAD = 2; // Padding interno reducido
const FONT_BASE = 7.5; // Tamaño base reducido para más contenido
const FONT_LABEL = 5.5; // Labels más pequeños (reducido de 6.5 a 5.5)
const FONT_HEADER = 10; // Header más compacto
const GAP_LABEL_VAL = 1.2; // Gap más reducido entre label y valor (reducido de 1.8 a 1.2)
const GAP_BETWEEN_ROWS = 1.8; // Gap más reducido entre filas para mayor compactación
const headerHeight = 16; // Header con más espacio para el logo

// Utility functions
const lineHeightMM = (pdf: jsPDF, size: number) => {
  const factor = pdf.getLineHeightFactor() || 1.25;
  return (size / pdf.internal.scaleFactor) * factor;
};

function makeGrid(pdf: jsPDF, fractions = [4,3,3,2]) { // Distribución por defecto optimizada
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

function paintHeader(pdf: jsPDF, folio: string, subtitle = '', logoDataUrl?: string) {
  const PAGE_W = pdf.internal.pageSize.getWidth();
  pdf.setFillColor(46,204,113);
  pdf.rect(0, 0, PAGE_W, headerHeight, 'F');
  
  // Agregar logo si está disponible
  if (logoDataUrl) {
    try {
      const logoWidth = 28; // Logo más grande
      const logoHeight = 11; // Proporción aproximada del logo
      const logoX = MARGIN.left;
      const logoY = 2.5; // Centrado verticalmente en el nuevo header
      
      pdf.addImage(logoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
      console.log('✅ Logo agregado al PDF correctamente');
    } catch (error) {
      console.warn('⚠️ No se pudo agregar el logo al PDF:', error);
    }
  }
  
  // Texto centrado "SOLICITUD DE CRÉDITO"
  pdf.setFont('helvetica','bold'); 
  pdf.setFontSize(FONT_HEADER + 2);
  pdf.setTextColor(255,255,255);
  pdf.text('SOLICITUD DE CRÉDITO', PAGE_W / 2, 10, { align: 'center' });
  
  if (subtitle) {
    pdf.setFontSize(FONT_HEADER);
    pdf.text(subtitle.toUpperCase(), PAGE_W / 2, 14, { align: 'center' });
  }
  
  // Folio a la derecha
  pdf.setFontSize(9);
  pdf.text(`Folio: ${folio}`, PAGE_W - MARGIN.right - 38, 10);
  pdf.setDrawColor(0); pdf.setLineWidth(0.2);
  pdf.line(MARGIN.left, headerHeight-1, PAGE_W - MARGIN.right, headerHeight-1);
}

function ensureSpace(pdf: jsPDF, y: number, needed: number, currentFolio: string, logoDataUrl?: string) {
  const PAGE_H = pdf.internal.pageSize.getHeight();
  if (y + needed <= PAGE_H - MARGIN.bottom) return y;

  pdf.addPage();
  paintHeader(pdf, currentFolio, '', logoDataUrl);
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

  // Obtener nombre del asesor con fallback desde localStorage (disponible para toda la función)
  let advisorName = application.collecting_advisor_name || '';
  console.log('🔍 [PDF] Advisor name from application:', advisorName);
  
  if (!advisorName && typeof window !== 'undefined') {
    try {
      const savedUser = localStorage.getItem('current_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        console.log('🔍 [PDF] User data from localStorage:', userData);
        if (userData && (userData.user_type === 'asesor' || userData.user_type === 'agency') && userData.name) {
          advisorName = userData.name;
          console.log('✅ [PDF] Using advisor name from localStorage:', advisorName);
        }
      }
    } catch (error) {
      console.error('❌ [PDF] Error getting user from localStorage:', error);
    }
  }
  
  // Fallback final si no hay nombre - dejar en blanco
  if (!advisorName) {
    advisorName = '';
    console.warn('⚠️ [PDF] No advisor name found, leaving blank');
  }

  if (!application.folio_number && !application.id) {
    throw new Error('La solicitud no tiene folio_number ni ID')
  }

  const day = new Date().getDate().toString().padStart(2,'0')
  const month = (new Date().getMonth()+1).toString().padStart(2,'0')
  const cleanName = (application.first_names || 'temp').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)
  const fileName = `fincentiva_solicitud_${day}_${month}_${application.folio_number || application.id}_${cleanName}.pdf`
  
  console.log('💾 Guardando PDF:', fileName)

  // Cargar logo
  let logoDataUrl: string | undefined
  try {
    if (typeof window !== 'undefined') {
      const logoPath = '/LOGO FINCENTIVA BLANCO.png'
      const response = await fetch(logoPath)
      const blob = await response.blob()
      logoDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
      console.log('✅ Logo cargado correctamente')
    }
  } catch (error) {
    console.warn('⚠️ No se pudo cargar el logo:', error)
  }

  // === función que pinta todo con layout profesional de 2 páginas ===
  const paint = (pdf: jsPDF, logo?: string) => {
    // Debug: Log application data
    console.log('🔍 [DEBUG] Application data:', {
      id: application.id,
      insurance_mode: application.insurance_mode,
      insurance_amount: application.insurance_amount,
      vehicle_brand: application.vehicle_brand,
      vehicle_model: application.vehicle_model,
      requested_amount: application.requested_amount
    })
    
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
    paintHeader(pdf, currentFolio, '', logo)
    y = headerHeight + 5

    // ====== A) DATOS DEL CRÉDITO ======
    y = ensureSpace(pdf, y, 12, currentFolio, logo)

    const paymentEach = (() => {
      const principal = application.requested_amount || 0
      const rate = 0.15/12
      const n = application.term_months || 48
      return principal * rate / (1 - Math.pow(1+rate, -n))
    })()

    // Función para acortar inteligentemente los labels largos
    function smartShortenLabel(label: string): string {
      const labelMap: { [key: string]: string } = {
        'FECHA DE NACIMIENTO': 'FECHA NAC.',
        'ASESOR QUE RECABA': 'ASESOR',
        'APELLIDO PATERNO': 'AP. PATERNO',
        'APELLIDO MATERNO': 'AP. MATERNO',
        'RFC CON HOMOCLAVE': 'RFC',
        'ENTIDAD DE NACIMIENTO': 'ENTIDAD NAC.',
        'NIVEL DE ESTUDIOS': 'ESTUDIOS',
        'TELÉFONO MÓVIL': 'TEL. MÓVIL',
        'TELÉFONO FIJO': 'TEL. FIJO',
        'EMAIL PERSONAL': 'EMAIL PERS.',
        'EMAIL LABORAL': 'EMAIL LAB.',
        'CALLE Y NÚMERO': 'DIRECCIÓN',
        'NÚMERO INTERIOR': 'NUM. INT.',
        'ENTRE CALLES': 'ENTRE CALLES',
        'CÓDIGO POSTAL': 'C.P.',
        'TIPO DE VIVIENDA': 'VIVIENDA',
        'AÑOS DE RESIDENCIA': 'AÑOS RESID.',
        'NOMBRE DE LA EMPRESA': 'EMPRESA',
        'PUESTO DE TRABAJO': 'PUESTO',
        'ANTIGÜEDAD AÑOS': 'ANTIG. AÑOS',
        'ANTIGÜEDAD MESES': 'ANTIG. MESES',
        'INGRESO MENSUAL': 'INGRESO',
        'TELÉFONO TRABAJO': 'TEL. TRABAJO',
        'EXTENSIÓN': 'EXT.',
        'DIRECCIÓN TRABAJO': 'DIR. TRABAJO',
        'NOMBRE COMPLETO': 'NOMBRE',
        'PARENTESCO': 'RELACIÓN',
        'TELÉFONO 1': 'TEL. 1',
        'TELÉFONO 2': 'TEL. 2',
        'FOLIO CREDENCIAL': 'FOLIO INE',
        'FOLIO PASAPORTE': 'PASAPORTE',
        'CÉDULA PROFESIONAL': 'CÉDULA PROF.',
        'LUGAR Y FECHA': 'LUGAR/FECHA'
      };
      
      const upperLabel = label.toUpperCase().trim();
      return labelMap[upperLabel] || upperLabel;
    }

    // --- Medición real de un campo (label+valor con subrayado) - OPTIMIZADA
    function measureField(pdf: jsPDF, label: string, value: string, width: number) {
      const cleanLabel = smartShortenLabel(label || '');
      const cleanValue = (value || '').trim();
      
      // Medir label con ajuste dinámico
      pdf.setFont('helvetica', 'bold');
      let labelFontSize = FONT_LABEL;
      if (cleanLabel.length > 20) {
        labelFontSize = FONT_LABEL - 0.5;
      }
      pdf.setFontSize(labelFontSize);
      
      const lh = pdf.splitTextToSize(cleanLabel + ':', width);
      const lhH = lh.length * lineHeightMM(pdf, labelFontSize);
      
      // Medir value con ajuste dinámico
      pdf.setFont('helvetica', 'normal');
      let valueFontSize = FONT_BASE;
      if (cleanValue.length > 40) {
        valueFontSize = FONT_BASE - 0.5;
      }
      pdf.setFontSize(valueFontSize);
      
      const vh = pdf.splitTextToSize(cleanValue, width);
      const vhH = vh.length * lineHeightMM(pdf, valueFontSize);
      
      // Calcular altura total real (igual que en drawMeasuredField)
      const total = lhH + GAP_LABEL_VAL + vhH + 2.0;
      
      return { lh, lhH, vh, vhH, total };
    }

    function drawMeasuredField(
      pdf: jsPDF,
      label: string,
      value: string,
      x: number,
      y: number,
      width: number,
      align: 'left' | 'right' = 'left',
      rightPad = 1.5 // padding interno reducido
    ) {
      // Acortar inteligentemente labels largos
      const cleanLabel = smartShortenLabel(label || '');
      const cleanValue = (value || '').trim();
      
      // Dibujar label con ajuste dinámico
      pdf.setFont('helvetica', 'bold'); 
      let labelFontSize = FONT_LABEL;
      let labelText = cleanLabel + ':';
      
      // Si aún es muy largo después del acortamiento, reducir fuente
      if (cleanLabel.length > 20) {
        labelFontSize = FONT_LABEL - 0.5;
      }
      pdf.setFontSize(labelFontSize);
      
      const lh = pdf.splitTextToSize(labelText, width);
      pdf.text(lh, x, y);
      const labelHeight = lh.length * lineHeightMM(pdf, labelFontSize);
      
      // Dibujar value con ajuste dinámico
      pdf.setFont('helvetica', 'normal');
      let valueFontSize = FONT_BASE;
      
      // Si el valor es muy largo, usar un tamaño más pequeño
      if (cleanValue.length > 40) {
        valueFontSize = FONT_BASE - 0.5;
      }
      pdf.setFontSize(valueFontSize);
      
      const vh = pdf.splitTextToSize(cleanValue, width);
      const valueY = y + labelHeight + GAP_LABEL_VAL;
      const textX = align === 'right' ? x + width - rightPad : x;
      pdf.text(vh, textX, valueY, { align });
      const valueHeight = vh.length * lineHeightMM(pdf, valueFontSize);
      
      // Posicionar línea exactamente después del último texto
      const lineY = valueY + valueHeight + 0.3;
      
      // Dibujar línea de subrayado más sutil
      pdf.setDrawColor(160); 
      pdf.setLineWidth(0.15);
      pdf.line(x, lineY, x + width, lineY);
      
      // Retornar altura total real con menos padding
      return labelHeight + GAP_LABEL_VAL + valueHeight + 2.0;
    }

    // --- Fila de N celdas: mide todas, asegura espacio 1 vez, dibuja y avanza
    type Cell = { label: string; value: string; col: number; align?: 'left' | 'right' };
    function rowN(
      pdf: jsPDF,
      cells: Cell[],
      y: number,
      grid: ReturnType<typeof makeGrid>,
      currentFolio: string
    ) {
      // Calcular altura uniforme para todas las celdas (altura mínima estándar)
      const minRowHeight = 8; // Altura mínima muy reducida para máxima compactación
      const heights = cells.map(c =>
        measureField(pdf, c.label, c.value, grid.w[c.col]).total
      );
      const calculatedHeight = Math.max(...heights);
      const h = Math.max(calculatedHeight, minRowHeight); // Usar la mayor entre calculada y mínima
      
      y = ensureSpace(pdf, y, h + GAP_BETWEEN_ROWS, currentFolio, logo);
      
      // Dibujar todas las celdas con la misma altura base
      cells.forEach(c => {
        drawMeasuredField(pdf, c.label, c.value, grid.x[c.col], y, grid.w[c.col], c.align);
      });
      
      return y + h + GAP_BETWEEN_ROWS;
    }

    const checkbox = (x: number, y: number, checked: boolean) => {
      pdf.rect(x, y, 2.8, 2.8)
      if (checked) {
        pdf.setLineWidth(0.3)
        pdf.line(x + 0.6, y + 0.6, x + 2.2, y + 2.2)
        pdf.line(x + 2.2, y + 0.6, x + 0.6, y + 2.2)
        pdf.setLineWidth(0.2)
    }
  }

  const addLine = (x1: number, y1: number, x2: number, y2: number) => {
      pdf.setDrawColor(0); pdf.setLineWidth(0.2)
    pdf.line(x1, y1, x2, y2)
  }

    // ====== A) DATOS DEL CRÉDITO - FORMATO SIMPLIFICADO ======
    y = ensureSpace(pdf, y, 12, currentFolio, logo)
    
    // Título de sección con fondo verde
    const sectionWidth = pdf.internal.pageSize.getWidth() - MARGIN.left - MARGIN.right;
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(FONT_HEADER)
    pdf.setTextColor(255, 255, 255) // Texto blanco
    pdf.setFillColor(34, 197, 94) // Fondo verde Financiera Incentiva
    pdf.rect(MARGIN.left, y, sectionWidth, 6, 'F')
    pdf.text('A) DATOS DEL CRÉDITO', pdf.internal.pageSize.getWidth() / 2, y + 4, { align: 'center' })
    y += 8
    
    // Resetear color del texto a negro para el contenido
    pdf.setTextColor(0, 0, 0)
    
    // Usar el sistema de grid existente para mantener consistencia
    const creditGrid = makeGrid(pdf, [4, 3, 3, 2])
    
    // Primera fila: Información básica del vehículo (desde quote relacionada)
    const quote = (application as any).z_auto_quotes
    const simulation = (application as any).z_auto_simulations
    
    y = rowN(pdf, [
      { label: 'MARCA/MODELO', value: `${quote?.vehicle_brand || application.vehicle_brand || ''} ${quote?.vehicle_model || application.vehicle_model || ''}`.trim(), col: 0 },
      { label: 'AÑO', value: (quote?.vehicle_year || application.vehicle_year)?.toString() || '', col: 1 },
      { label: 'PRECIO VEHÍCULO', value: formatMXN(quote?.vehicle_value || application.vehicle_value), col: 2, align: 'right' },
      { label: 'ENGANCHE', value: formatMXN(quote?.down_payment_amount || application.down_payment_amount), col: 3, align: 'right' }
    ], y, creditGrid, currentFolio)
    
    // Segunda fila: Información del crédito (usando datos de simulation y quote)
    const monthlyPayment = simulation?.monthly_payment || application.monthly_payment || paymentEach
    const agencyName = quote?.vendor_name || application.branch || ''
    
    y = rowN(pdf, [
      { label: 'IMPORTE CRÉDITO', value: formatMXN(application.requested_amount), col: 0, align: 'right' },
      { label: 'PLAZO (MESES)', value: application.term_months?.toString() || '', col: 1 },
      { label: 'PAGO MENSUAL', value: formatMXN(monthlyPayment), col: 2, align: 'right' },
      { label: 'AGENCIA', value: agencyName, col: 3 }
    ], y, creditGrid, currentFolio)
    
    // Tercera fila: Seguro y plan - con checkboxes para seguro financiado
    y = ensureSpace(pdf, y, 15, currentFolio, logo)
    
    // Dibujar campos normales primero (usando monto de seguro desde quote o formulario)
    const seguroY = y
    const insuranceAmount = quote?.insurance_amount || application.insurance_amount
    
    y = rowN(pdf, [
      { label: 'MONTO SEGURO', value: formatMXN(insuranceAmount), col: 0, align: 'right' },
      { label: '', value: '', col: 1 }, // Espacio para checkboxes
      { label: 'PLAN DE PAGOS', value: application.payment_frequency || 'Mensual', col: 2 },
      { label: 'ASESOR', value: advisorName, col: 3 }
    ], seguroY, creditGrid, currentFolio)
    
    // Agregar checkboxes para seguro financiado en la columna 1
    const checkboxX = creditGrid.x[1]
    const checkboxSize = 3
    
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(FONT_LABEL)
    pdf.text('SEGURO FINANCIADO:', checkboxX, seguroY)
    
    // Posicionar checkboxes arriba de la línea de respuesta
    const checkboxY = seguroY + 4 // Más cerca del label, arriba de la línea
    
    // Checkbox SÍ
    pdf.rect(checkboxX, checkboxY, checkboxSize, checkboxSize)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(FONT_BASE - 1)
    pdf.text('SÍ', checkboxX + checkboxSize + 2, checkboxY + 2)
    
    // Checkbox NO
    const noCheckboxX = checkboxX + 25
    pdf.rect(noCheckboxX, checkboxY, checkboxSize, checkboxSize)
    pdf.text('NO', noCheckboxX + checkboxSize + 2, checkboxY + 2)
    
    // Marcar el checkbox correspondiente con X
    // El insurance_mode viene de la quote relacionada, no de la application directamente
    const insuranceMode = (application as any).z_auto_quotes?.insurance_mode || application.insurance_mode
    console.log('🔍 [DEBUG] Insurance mode from quote:', insuranceMode)
    console.log('🔍 [DEBUG] Application insurance_mode:', application.insurance_mode)
    console.log('🔍 [DEBUG] Quote data:', (application as any).z_auto_quotes)
    
    if (insuranceMode === 'financed') {
      console.log('✅ Marcando checkbox SÍ (financed)')
      pdf.setLineWidth(0.3)
      pdf.line(checkboxX + 0.6, checkboxY + 0.6, checkboxX + 2.4, checkboxY + 2.4)
      pdf.line(checkboxX + 2.4, checkboxY + 0.6, checkboxX + 0.6, checkboxY + 2.4)
    } else if (insuranceMode === 'cash' || insuranceMode === 'separate') {
      console.log('✅ Marcando checkbox NO (cash/separate)')
      pdf.setLineWidth(0.3)
      pdf.line(noCheckboxX + 0.6, checkboxY + 0.6, noCheckboxX + 2.4, checkboxY + 2.4)
      pdf.line(noCheckboxX + 2.4, checkboxY + 0.6, noCheckboxX + 0.6, checkboxY + 2.4)
    } else {
      console.log('⚠️ Insurance mode no reconocido:', insuranceMode)
    }
    
    pdf.setLineWidth(0.2) // Resetear grosor de línea
    
    y += 6

    // ====== B) INFORMACIÓN PERSONAL ======
    y += 6
    y = ensureSpace(pdf, y, 8, currentFolio, logo)
    
    // Título de sección con fondo verde
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(FONT_HEADER)
    pdf.setTextColor(255, 255, 255) // Texto blanco
    pdf.setFillColor(34, 197, 94) // Fondo verde Financiera Incentiva
    pdf.rect(MARGIN.left, y, sectionWidth, 6, 'F')
    pdf.text('B) INFORMACIÓN PERSONAL', pdf.internal.pageSize.getWidth() / 2, y + 4, { align: 'center' })
    y += 8
    
    // Resetear color del texto a negro para el contenido
    pdf.setTextColor(0, 0, 0)

    // Grid de 4 columnas para información personal
    const g4 = makeGrid(pdf, [4,3,3,2]); // Distribución optimizada para labels largos
    
    // Primera fila: Nombres y apellidos
    y = rowN(pdf, [
      { label:'APELLIDO PATERNO', value: application.paternal_surname || '', col:0 },
      { label:'APELLIDO MATERNO', value: application.maternal_surname || '', col:1 },
      { label:'NOMBRE(S)', value: application.first_names || '', col:2 },
      { label:'ESTADO CIVIL', value: application.marital_status || '', col:3 }
    ], y, g4, currentFolio);

    // Segunda fila: Documentos de identidad
    y = rowN(pdf, [
      { label:'CURP', value: application.curp || '', col:0 },
      { label:'RFC', value: application.rfc || '', col:1 },
      { label:'NSS', value: application.nss || '', col:2 },
      { label:'HOMOCLAVE', value: application.rfc_homoclave || '', col:3 }
    ], y, g4, currentFolio);

    // Tercera fila: Información personal básica
    y = rowN(pdf, [
      { label:'FECHA NACIMIENTO', value: formatDate(application.birth_date), col:0 },
      { label:'GÉNERO (F/M)', value: application.gender || '', col:1 },
      { label:'PAÍS NACIMIENTO', value: application.birth_country || 'México', col:2 },
      { label:'NACIONALIDAD', value: application.nationality || 'Mexicana', col:3 }
    ], y, g4, currentFolio);

    // Cuarta fila: Educación y otros (usando nuevos campos disponibles)
    y = rowN(pdf, [
      { label:'NIVEL ESTUDIOS', value: application.education_level || '', col:0 },
      { label:'ENTIDAD FEDERATIVA NAC.', value: application.birth_state || '', col:1 },
      { label:'SERIE FIRMA ELECTRÓNICA', value: application.electronic_signature_series || '', col:2 },
      { label:'NUM. DEPENDIENTES', value: application.dependents_count?.toString() || '', col:3 }
    ], y, g4, currentFolio);

    // Quinta fila: Dirección principal (corrigiendo mapeo de calle)
    y = rowN(pdf, [
      { label:'CALLE Y NÚMERO', value: application.street_and_number || '', col:0 },
      { label:'COLONIA', value: application.neighborhood || '', col:1 },
      { label:'DELEGACIÓN/MUNICIPIO', value: application.municipality || '', col:2 },
      { label:'ESTADO', value: application.state || '', col:3 }
    ], y, g4, currentFolio);

    // Sexta fila: Detalles domicilio (usando campos disponibles del formulario)
    y = rowN(pdf, [
      { label:'C.P.', value: application.postal_code || '', col:0 },
      { label:'ENTRE CALLES', value: application.between_streets || '', col:1 },
      { label:'TIPO VIVIENDA', value: application.housing_type || '', col:2 },
      { label:'AÑOS RESIDENCIA', value: application.residence_years?.toString() || '', col:3 }
    ], y, g4, currentFolio);

    // Séptima fila: Información de contacto (usando nuevos campos disponibles)
    y = rowN(pdf, [
      { label:'TEL. CON CLAVE LADA', value: application.landline_phone || '', col:0 },
      { label:'TEL. RECADOS C/LADA', value: application.emergency_phone || '', col:1 },
      { label:'TELÉFONO CELULAR', value: application.mobile_phone || '', col:2 },
      { label:'PAÍS', value: application.country || 'México', col:3 }
    ], y, g4, currentFolio);

    // Octava fila: Emails
    const emailRows = [
      { label:'E-MAIL PERSONAL', value: application.personal_email || '', col:0 }
    ];
    
    // Solo agregar E-MAIL LABORAL si tiene valor
    if (application.work_email && application.work_email.trim()) {
      emailRows.push({ label:'E-MAIL LABORAL', value: application.work_email, col:1 });
    }
    
    // Completar con espacios vacíos
    while (emailRows.length < 4) {
      emailRows.push({ label:'', value: '', col: emailRows.length });
    }
    
    y = rowN(pdf, emailRows, y, g4, currentFolio);

    // ====== C) INFORMACIÓN DEL EMPLEO ======
    y += 6
    y = ensureSpace(pdf, y, 8, currentFolio, logo)
    
    // Título de sección con fondo verde
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(FONT_HEADER)
    pdf.setTextColor(255, 255, 255) // Texto blanco
    pdf.setFillColor(34, 197, 94) // Fondo verde Financiera Incentiva
    pdf.rect(MARGIN.left, y, sectionWidth, 6, 'F')
    pdf.text('C) INFORMACIÓN DEL EMPLEO', pdf.internal.pageSize.getWidth() / 2, y + 4, { align: 'center' })
    y += 8
    
    // Resetear color del texto a negro para el contenido
    pdf.setTextColor(0, 0, 0)

    // Primera fila: Información básica del empleo
    const antiguedad = `${application.job_seniority_years || 0} años ${application.job_seniority_months || 0} meses`;
    y = rowN(pdf, [
      { label:'ANTIGÜEDAD (MESES/AÑOS)', value: antiguedad, col:0 },
      { label:'OCUPACIÓN', value: application.occupation || '', col:1 },
      { label:'EMPRESA O DEPENDENCIA', value: application.company_name || '', col:2 },
      { label:'JEFE INMEDIATO', value: application.immediate_supervisor || '', col:3 }
    ], y, g4, currentFolio);

    // Segunda fila: Puesto y contacto
    y = rowN(pdf, [
      { label:'PUESTO', value: application.job_position || '', col:0 },
      { label:'TELÉFONO CON LADA', value: application.work_phone || '', col:1 },
      { label:'EXTENSIÓN', value: application.work_extension || '', col:2 },
      { label:'INGRESO MENSUAL', value: formatMXN(application.monthly_income), col:3, align: 'right' }
    ], y, g4, currentFolio);

    // Tercera fila: Domicilio laboral (campo amplio) - solo si tiene valor
    if (application.work_address && application.work_address.trim()) {
      y = rowN(pdf, [
        { label:'DOMICILIO LABORAL', value: application.work_address, col:0 },
        { label:'', value: '', col:1 }, // Continuación del domicilio
        { label:'', value: '', col:2 }, // Continuación del domicilio
        { label:'', value: '', col:3 } // Espacio vacío
      ], y, g4, currentFolio);
    }

    // ====== D) REFERENCIAS PERSONALES ======
    y += 6
    y = ensureSpace(pdf, y, 8, currentFolio, logo)
    
    // Título de sección con fondo verde
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(FONT_HEADER)
    pdf.setTextColor(255, 255, 255) // Texto blanco
    pdf.setFillColor(34, 197, 94) // Fondo verde Financiera Incentiva
    pdf.rect(MARGIN.left, y, sectionWidth, 6, 'F')
    pdf.text('D) REFERENCIAS PERSONALES', pdf.internal.pageSize.getWidth() / 2, y + 4, { align: 'center' })
    y += 8
    
    // Resetear color del texto a negro para el contenido
    pdf.setTextColor(0, 0, 0)

    // Referencia 1
    y = rowN(pdf, [
      { label:'REFERENCIA 1 - NOMBRE', value: application.reference_1_name || '', col:0 },
      { label:'TELÉFONO CON LADA', value: application.reference_1_phone1 || '', col:1 },
      { label:'TELÉFONO 2', value: application.reference_1_phone2 || '', col:2 },
      { label:'PARENTESCO', value: application.reference_1_relationship || '', col:3 }
    ], y, g4, currentFolio);

    // Referencia 2
    y = rowN(pdf, [
      { label:'REFERENCIA 2 - NOMBRE', value: application.reference_2_name || '', col:0 },
      { label:'TELÉFONO CON LADA', value: application.reference_2_phone1 || '', col:1 },
      { label:'TELÉFONO 2', value: application.reference_2_phone2 || '', col:2 },
      { label:'PARENTESCO', value: application.reference_2_relationship || '', col:3 }
    ], y, g4, currentFolio);

    // Referencia 3 (con teléfono celular)
    y = rowN(pdf, [
      { label:'REFERENCIA 3 - NOMBRE', value: application.reference_3_name || '', col:0 },
      { label:'TELÉFONO CON LADA', value: application.reference_3_phone1 || '', col:1 },
      { label:'TELÉFONO CELULAR', value: application.reference_3_mobile || '', col:2 },
      { label:'PARENTESCO', value: application.reference_3_relationship || '', col:3 }
    ], y, g4, currentFolio);

    // ====== INFORMACIÓN ADICIONAL REFERENCIAS ======
    y += 6

    // ====== ASEGURAR QUE RESULTADO DE ENTREVISTA ESTÉ EN PÁGINA 2 ======
    y = ensureSpace(pdf, y, 50, currentFolio, logo) // Forzar salto a página 2 si no hay espacio

    // Resultado de la entrevista personal
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(FONT_BASE)
    pdf.setTextColor(0, 0, 0)
    pdf.text('RESULTADO DE LA ENTREVISTA PERSONAL:', MARGIN.left, y)
    y += 4
    
    // Línea para el resultado
    pdf.setLineWidth(0.2)
    pdf.setDrawColor(0, 0, 0)
    const lineWidth = pdf.internal.pageSize.getWidth() - MARGIN.left - MARGIN.right
    pdf.line(MARGIN.left, y, MARGIN.left + lineWidth, y)
    y += 8

    // Información adicional PEP
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(FONT_BASE)
    pdf.text('INFORMACIÓN ADICIONAL:', MARGIN.left, y)
    y += 4

    // Texto PEP con formato compacto
    const pepTextRef = '¿Usted desempeña o ha desempeñado funciones públicas destacadas en un país extranjero o en territorio nacional, considerado entre otros, a los jefes de estado o de gobierno, líderes políticos, funcionarios gubernamentales, judiciales o militares de alta jerarquía, altos ejecutivos de empresas estatales o funcionarios o miembros importantes de partidos políticos?'
    
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(FONT_BASE - 1)
    const pepLinesRef = pdf.splitTextToSize(pepTextRef, lineWidth)
    pdf.text(pepLinesRef, MARGIN.left, y)
    y += pepLinesRef.length * lineHeightMM(pdf, FONT_BASE - 1) + 2

    // Respuesta Sí/No
    pdf.setFont('helvetica', 'bold')
    pdf.text('Respuesta:', MARGIN.left, y)
    pdf.setFont('helvetica', 'normal')
    
    // Checkboxes para Sí/No con valores automáticos
    const checkboxSizeRef = 3
    const siXRef = MARGIN.left + 25
    const noXRef = siXRef + 20
    
    // Checkbox SÍ
    pdf.rect(siXRef, y - 2, checkboxSizeRef, checkboxSizeRef)
    if (application.is_pep) {
      // Marcar checkbox SÍ si es PEP
      pdf.setFont('helvetica', 'bold')
      pdf.text('X', siXRef + 0.5, y + 0.5)
      pdf.setFont('helvetica', 'normal')
    }
    pdf.text('SÍ', siXRef + checkboxSizeRef + 2, y)
    
    // Checkbox NO
    pdf.rect(noXRef, y - 2, checkboxSizeRef, checkboxSizeRef)
    if (!application.is_pep) {
      // Marcar checkbox NO si no es PEP
      pdf.setFont('helvetica', 'bold')
      pdf.text('X', noXRef + 0.5, y + 0.5)
      pdf.setFont('helvetica', 'normal')
    }
    pdf.text('NO', noXRef + checkboxSizeRef + 2, y)
    y += 6

    // Campos en caso afirmativo con datos automáticos
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(FONT_BASE - 1)
    const pepPosition = application.is_pep && application.pep_position ? application.pep_position : '_________________________________'
    const pepPeriod = application.is_pep && application.pep_period ? application.pep_period : '_________________________________'
    pdf.text(`En caso afirmativo: a) Puesto o cargo: ${pepPosition} b) Período: ${pepPeriod}`, MARGIN.left, y)
    y += 6

    // Pregunta sobre familiares PEP
    const familiarPepTextRef = '¿Algún familiar de usted de hasta segundo grado de consanguinidad o afinidad (cónyuge, concubina, padre, madre, hijos, hermanos, abuelos, tíos, primos, cuñados, suegros, yernos o nueras), se encuentra en el supuesto antes mencionado?'
    const familiarLinesRef = pdf.splitTextToSize(familiarPepTextRef, lineWidth)
    pdf.text(familiarLinesRef, MARGIN.left, y)
    y += familiarLinesRef.length * lineHeightMM(pdf, FONT_BASE - 1) + 2

    // Respuesta familiar Sí/No con valores automáticos
    pdf.setFont('helvetica', 'bold')
    pdf.text('Respuesta:', MARGIN.left, y)
    pdf.setFont('helvetica', 'normal')
    
    // Checkbox SÍ para familiar PEP
    pdf.rect(siXRef, y - 2, checkboxSizeRef, checkboxSizeRef)
    if (application.has_pep_relative) {
      pdf.setFont('helvetica', 'bold')
      pdf.text('X', siXRef + 0.5, y + 0.5)
      pdf.setFont('helvetica', 'normal')
    }
    pdf.text('SÍ', siXRef + checkboxSizeRef + 2, y)
    
    // Checkbox NO para familiar PEP
    pdf.rect(noXRef, y - 2, checkboxSizeRef, checkboxSizeRef)
    if (!application.has_pep_relative) {
      pdf.setFont('helvetica', 'bold')
      pdf.text('X', noXRef + 0.5, y + 0.5)
      pdf.setFont('helvetica', 'normal')
    }
    pdf.text('NO', noXRef + checkboxSizeRef + 2, y)
    y += 6

    // Información del familiar en caso afirmativo con datos automáticos
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(FONT_BASE - 1)
    const relativeName = application.has_pep_relative && application.pep_relative_name ? application.pep_relative_name : 'Apellido Paterno _____________ Apellido Materno _____________ Nombre(s) _____________'
    pdf.text(`En caso afirmativo: a) Nombre completo: ${relativeName}`, MARGIN.left, y)
    y += 4
    const relativeRelationship = application.has_pep_relative && application.pep_relative_relationship ? application.pep_relative_relationship : '_________________'
    const relativePosition = application.has_pep_relative && application.pep_relative_position ? application.pep_relative_position : '_________________'
    const relativePeriod = application.has_pep_relative && application.pep_period ? application.pep_period : '_________________'
    pdf.text(`b) Parentesco ${relativeRelationship} c) Puesto o cargo ${relativePosition} d) Período ${relativePeriod}`, MARGIN.left, y)
    y += 8

    // Declaración bajo protesta
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(FONT_BASE)
    pdf.text('DECLARACIÓN BAJO PROTESTA:', MARGIN.left, y)
    y += 4

    const declaracionText = 'Bajo protesta de decir verdad, manifiesto que la información asentada en, y los documentos proporcionados para, la presente solicitud por el(la) suscrito(a), son verdaderos, correctos y auténticos, así como las manifestaciones contenidas en la misma, lo que ratifico con mi firma asentada a continuación. Así mismo, que: (i) formulo la presente solicitud por mi propio derecho y actúo a nombre y por cuenta propia; y, (ii) el crédito será pagado con mis propios recursos, los cuales son y serán lícitos. En caso de que aplique "obligado solidario", éste deberá llenar y firmar otra solicitud, que será integrante de la presente, siendo ambas un mismo documento.'
    
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(FONT_BASE - 1)
    const declaracionLines = pdf.splitTextToSize(declaracionText, lineWidth)
    pdf.text(declaracionLines, MARGIN.left, y)
    y += declaracionLines.length * lineHeightMM(pdf, FONT_BASE - 1) + 6

    // Línea de fecha y lugar
    pdf.text('_________________________, a _______ de _________________ de _______', MARGIN.left, y)
    y += 8

    // ====== SALTO A PÁGINA 2 ======
    y = ensureSpace(pdf, y, 50, currentFolio, logo)

    // Secciones E, F eliminadas por solicitud del usuario

    // Firmas sin fechas - más limpio
    y += 10
    y = ensureSpace(pdf, y, 12, currentFolio, logo)
    const g4Firmas = makeGrid(pdf, [4,3,3,2]); // Definir grid para firmas
    addLine(g4Firmas.x[0], y, g4Firmas.x[0] + 70, y)
    addLine(g4Firmas.x[2], y, g4Firmas.x[2] + 70, y)
    y += 4
    pdf.setFont('helvetica','bold'); pdf.setFontSize(FONT_BASE)
    pdf.text('FIRMA DEL SOLICITANTE', g4Firmas.x[0] + 10, y)
    pdf.text('FIRMA DEL ASESOR', g4Firmas.x[2] + 15, y)

    // ====== E) AVISO DE PRIVACIDAD Y F) AUTORIZACIÓN ======
    y += 8
    y = ensureSpace(pdf, y, 80, currentFolio, logo) // Asegurar espacio para el texto legal
    
    // Configuración para texto legal compacto
    const legalFontSize = 5.5; // Fuente muy pequeña
    const legalLineHeight = 1.8; // Espaciado mínimo entre líneas
    const legalMargin = MARGIN.left;
    const legalWidth = pdf.internal.pageSize.getWidth() - MARGIN.left - MARGIN.right;
    
    // Título de sección con fondo verde (mismo formato que secciones A, B, C, D)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(FONT_HEADER);
    pdf.setTextColor(255, 255, 255); // Texto blanco
    pdf.setFillColor(34, 197, 94); // Fondo verde Financiera Incentiva
    pdf.rect(legalMargin, y, legalWidth, 6, 'F');
    pdf.text('E) AVISO DE PRIVACIDAD', pdf.internal.pageSize.getWidth() / 2, y + 4, { align: 'center' });
    y += 8;
    
    // Texto del aviso de privacidad
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(legalFontSize);
    pdf.setTextColor(0, 0, 0);
    
    const privacyText = `FINANCIERA INCENTIVA, S.A.P.I. DE C.V., SOFOM, E.N.R., con domicilio en San Antonio #2340, Colonia Lomas de San Francisco, Monterrey, Nuevo León, C.P. 64710, es responsable del uso y protección de sus datos personales, y al respecto le informa lo siguiente:

Los datos personales que recabamos de usted serán utilizados para la evaluación, otorgamiento y administración de productos financieros, incluyendo el análisis de riesgo crediticio, la integración de su expediente, así como para fines de identificación, verificación, cumplimiento de disposiciones legales y regulatorias aplicables.

Asimismo, sus datos podrán ser utilizados con fines mercadotécnicos, publicitarios o de prospección comercial, siempre que usted nos otorgue su consentimiento expreso.

Usted tiene derecho a acceder, rectificar y cancelar sus datos personales, así como a oponerse al tratamiento de los mismos o revocar el consentimiento que nos haya otorgado, a través de la Unidad Especializada de Atención a Usuarios (UNE), ubicada en San Antonio #2340, Colonia Lomas de San Francisco, Monterrey, Nuevo León, C.P. 64710, con teléfono +52 (81) 8218 0477 y correo electrónico une@fincentiva.com.mx.

Para mayor información sobre los términos y condiciones del tratamiento de sus datos personales, usted puede consultar nuestro Aviso de Privacidad Integral en www.fincentiva.com.mx.`;
    
    const privacyLines = pdf.splitTextToSize(privacyText, legalWidth);
    privacyLines.forEach((line: string) => {
      y = ensureSpace(pdf, y, legalLineHeight + 1, currentFolio, logo);
      pdf.text(line, legalMargin, y);
      y += legalLineHeight;
    });
    
    y += 4;

    // Campos adicionales para aviso de privacidad con datos reales
    const fullName = `${application.first_names || ''} ${application.paternal_surname || ''} ${application.maternal_surname || ''}`.trim();
    const currentDate = new Date().toLocaleDateString('es-MX');
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(legalFontSize);
    
    // Configurar posiciones para ambos elementos a la misma altura
    const leftTextWidth = 120;
    const privacySignatureLineWidth = 80;
    const rightMargin = pdf.internal.pageSize.getWidth() - MARGIN.right;
    const signatureX = rightMargin - privacySignatureLineWidth;
    
    // Texto izquierdo
    pdf.text('Lugar y fecha de firma del Aviso de Privacidad:', legalMargin, y);
    
    // Línea izquierda para fecha
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.3);
    pdf.line(legalMargin + leftTextWidth, y + 2, legalMargin + leftTextWidth + 60, y + 2);
    
    // Línea derecha para firma
    pdf.line(signatureX, y + 2, signatureX + privacySignatureLineWidth, y + 2);
    
    // Textos debajo de las líneas
    y += 8;
    pdf.text(`Firma del (la) titular: ${fullName}`, signatureX, y);
    y += 8;
    
    // Título de sección con fondo verde (mismo formato que secciones A, B, C, D)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(FONT_HEADER);
    pdf.setTextColor(255, 255, 255);
    pdf.setFillColor(34, 197, 94); // Fondo verde Financiera Incentiva
    pdf.rect(legalMargin, y, legalWidth, 6, 'F');
    pdf.text('F) AUTORIZACIÓN PARA SOLICITAR REPORTES DE CRÉDITO', pdf.internal.pageSize.getWidth() / 2, y + 4, { align: 'center' });
    y += 8;
    
    // Texto de autorización de crédito
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(legalFontSize);
    pdf.setTextColor(0, 0, 0);
    
    const creditAuthText = `Por este conducto autorizo expresamente a FINANCIERA INCENTIVA, S.A.P.I. DE C.V., SOFOM, E.N.R., para que, por conducto de sus funcionarios facultados, lleve a cabo investigaciones sobre mi comportamiento crediticio en Trans Union de México, S.A. SIC y/o Dun & Bradstreet, S.A. SIC, así como en cualquier otra sociedad de información crediticia legalmente constituida.

Declaro que conozco la naturaleza y alcance de la información que se solicitará, el uso que FINANCIERA INCENTIVA hará de dicha información, y autorizo a que se realicen consultas periódicas de mi historial crediticio durante el tiempo en que se mantenga vigente la relación jurídica derivada de la presente solicitud de crédito, y hasta por un periodo máximo de tres (3) años contados a partir de la fecha de su otorgamiento.

En caso de ser persona moral, manifiesto bajo protesta de decir verdad que soy representante legal de la empresa solicitante, y que mis facultades no me han sido revocadas ni limitadas a la fecha de la firma de la presente autorización.`;
    
    const creditLines = pdf.splitTextToSize(creditAuthText, legalWidth);
    creditLines.forEach((line: string) => {
      y = ensureSpace(pdf, y, legalLineHeight + 1, currentFolio, logo);
      pdf.text(line, legalMargin, y);
      y += legalLineHeight;
    });
    
    y += 6;

    // Campos adicionales para autorización de crédito con datos reales
    const rfc = application.rfc_homoclave || application.rfc || '';
    const curp = application.curp || '';
    
    // El nombre del asesor ya se obtuvo al inicio de la función
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(legalFontSize);
    pdf.text(`Nombre del solicitante: ${fullName}`, legalMargin, y);
    y += 4;
    pdf.text(`RFC o CURP del solicitante: ${rfc || curp}`, legalMargin, y);
    y += 4;
    pdf.text(`Lugar y fecha en que se firma la autorización: México, ${currentDate}`, legalMargin, y);
    y += 4;
    pdf.text(`Nombre de la persona que recaba la autorización: ${advisorName}`, legalMargin, y);
    y += 8;
    
    // Configurar posiciones para firmas lado a lado
    y = ensureSpace(pdf, y, 20, currentFolio, logo);
    const leftSignatureX = legalMargin;
    const rightSignatureX = legalMargin + 100;
    const signatureLineWidth = 80;
    
    // Líneas para firmas
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.3);
    pdf.line(leftSignatureX, y, leftSignatureX + signatureLineWidth, y);
    pdf.line(rightSignatureX, y, rightSignatureX + signatureLineWidth, y);
    
    // Textos debajo de las líneas
    y += 4;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(legalFontSize);
    pdf.text(fullName, leftSignatureX + 10, y);
    pdf.text(advisorName, rightSignatureX + 10, y);
    
    y += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(legalFontSize);
    pdf.text('Firma del (de la) solicitante, Obligado', leftSignatureX, y);
    pdf.text('Firma del Asesor', rightSignatureX, y);
    y += 3;
    pdf.text('Solidario o coacreditado', leftSignatureX, y);
    y += 8;
    
    // Información de la empresa
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(legalFontSize + 0.5);
    pdf.text('FINANCIERA INCENTIVA, S.A.P.I. DE C.V., SOFOM, E.N.R.', legalMargin, y);
    y += legalLineHeight + 0.5;
    pdf.setFont('helvetica', 'normal');
    pdf.text('Domicilio: San Antonio #2340, Colonia Lomas de San Francisco, Monterrey, N.L., C.P. 64710', legalMargin, y);
    y += 8;

    // Footer profesional
  const now = new Date()
    pdf.setFont('helvetica','normal')
    pdf.setFontSize(8)
    pdf.setTextColor(128,128,128)
    pdf.text(`Documento generado el ${now.toLocaleDateString('es-MX')} a las ${now.toLocaleTimeString('es-MX')}`, PAGE_WIDTH/2, y, { align:'center' })
    y += 4
    
    // Add page numbering at the end
    const totalPages = pdf.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.setFont('helvetica','normal')
      pdf.setFontSize(8)
      pdf.setTextColor(128,128,128)
      pdf.text(`Página ${i} de ${totalPages}`, PAGE_WIDTH/2, PAGE_HEIGHT - 8, { align: 'center' })
    }

    return y
  }

  // ===== Generar PDF con layout profesional =====
  let pdfInstance = new jsPDF('p','mm','a4')
  const finalY = paint(pdfInstance, logoDataUrl)
  
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
  
  // Retornar el buffer del PDF para uso en APIs
  return Buffer.from(pdfInstance.output('arraybuffer'))
}
