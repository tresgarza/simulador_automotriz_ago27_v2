import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: any;
  }
}

export interface ProfessionalAuthorizationData {
  // Información básica
  id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  status: string;
  created_at: string;
  
  // Información del vehículo
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_value?: number;
  
  // Información financiera
  monthly_payment?: number;
  requested_amount?: number;
  term_months?: number;
  interest_rate?: number;
  opening_fee?: number;
  
  // Información del asesor
  reviewer_name?: string;
  agency_name?: string;
  
  // Competidores (desde múltiples fuentes)
  competitors_data?: Array<{ name: string; price: number }>;
  
  // Datos del formulario (authorization_data)
  authorization_data?: {
    company?: string;
    applicant_name?: string;
    position?: string;
    age?: number;
    marital_status?: string;
    seniority?: number;
    monthly_salary?: number;
    requested_amount?: number;
    term_months?: number;
    interest_rate?: number;
    opening_fee?: number;
    monthly_capacity?: number;
    monthly_discount?: number;
    comments?: string;
    
    // Ingresos y gastos
    total_income?: number;
    average_income?: number;
    total_expenses?: number;
    average_expenses?: number;
    available_income?: number;
    payment_capacity?: number;
    viability_ratio?: number;
    
    // Competidores
    competitors?: Array<{ name: string; price: number }>;
    
    // Nombres de meses personalizados por el usuario
    month_labels?: string[];
    
    // Datos detallados de ingresos por mes
    mes1_nomina?: number;
    mes1_comisiones?: number;
    mes1_negocio?: number;
    mes1_efectivo?: number;
    mes2_nomina?: number;
    mes2_comisiones?: number;
    mes2_negocio?: number;
    mes2_efectivo?: number;
    mes3_nomina?: number;
    mes3_comisiones?: number;
    mes3_negocio?: number;
    mes3_efectivo?: number;
    
    // Datos detallados de gastos por mes
    mes1_compromisos?: number;
    mes1_gastos_personales?: number;
    mes1_gastos_negocio?: number;
    mes2_compromisos?: number;
    mes2_gastos_personales?: number;
    mes2_gastos_negocio?: number;
    mes3_compromisos?: number;
    mes3_gastos_personales?: number;
    mes3_gastos_negocio?: number;
  };
}

type RGB = [number, number, number];

export const generateProfessionalAuthorizationPDF = async (data: ProfessionalAuthorizationData): Promise<void> => {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "p" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Inicializar autoTable
  autoTable(pdf, {});

  // ---- Tokens de diseño
  const M = 18;            // margen
  const G = 6;             // gutter
  const COL = (pageWidth - M*2 - G) / 2;

  const colors: Record<string, RGB> = {
    primary: [63,166,41],
    primaryDark: [50,133,33],
    primaryLight: [220,252,231],
    secondary: [59,130,246],
    danger: [239,68,68],
    gray: [75,85,99],
    grayMid: [156,163,175],
    grayLight: [248,250,252],
    black: [17,24,39],
    white: [255,255,255],
    gold: [245,158,11],
  };

  const money = (n=0) =>
    new Intl.NumberFormat("es-MX", { style:"currency", currency:"MXN", minimumFractionDigits:2 }).format(Number(n)||0);

  const addText = (
    text: string, x: number, y: number,
    { size=9, style="normal", color=colors.black, align="left" as "left" | "center" | "right" }={}
  )=>{
    pdf.setFont("helvetica", style as any);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    pdf.text(text, x, y, { align });
  };

  const sectionHeader = (x: number, y: number, w: number, title: string, color=colors.primary)=>{
    pdf.setFillColor(...color);
    pdf.rect(x, y, w, 8, "F");
    pdf.setDrawColor(...colors.gold);
    pdf.setLineWidth(0.6);
    pdf.line(x, y, x+w, y);
    addText(title, x + w/2, y + 5.5, { size: 11, style: "bold", color: colors.white, align:"center" });
    return y + 8;
  };

  const ensureSpace = (needed: number) => {
    const last = (pdf as any).lastAutoTable?.finalY ?? currentY;
    if (last + needed > pageHeight - 20) {
      pdf.addPage();
      currentY = 18; // margen superior
      return currentY;
    }
    return Math.max(currentY, (pdf as any).lastAutoTable?.finalY ?? currentY);
  };

  // ---- HEADER
  pdf.setFillColor(...colors.primary);
  pdf.rect(0, 0, pageWidth, 26, "F");
  pdf.setFillColor(...colors.gold);
  pdf.rect(0, 0, pageWidth, 2, "F");
  
  // LOGO en la esquina superior izquierda (más grande, sin texto adicional)
  try {
    const logoUrl = '/LOGO FINCENTIVA BLANCO.png';
    const response = await fetch(logoUrl);
    const blob = await response.blob();
    const dataUrl: string = await new Promise(res => {
      const fr = new FileReader(); 
      fr.onload = () => res(fr.result as string); 
      fr.readAsDataURL(blob);
    });
    const props = (pdf as any).getImageProperties(dataUrl);
    const logoH = 18; // mm - más grande
    const logoW = (props.width / props.height) * logoH;
    const logoX = M;
    const logoY = (26 - logoH) / 2;
    pdf.addImage(dataUrl, 'PNG', logoX, logoY, logoW, logoH, undefined, 'FAST');
  } catch { 
    /* si falla, no mostramos texto de fallback */ 
  }
  addText(`Folio: ${data.id.substring(0,8).toUpperCase()}`, pageWidth - M, 22, { size: 9, style:"bold", color: colors.white, align:"right" });
  addText(new Date().toLocaleDateString("es-MX", { weekday:"long", year:"numeric", month:"long", day:"numeric" }),
          pageWidth - M, 12, { size: 9, color: colors.white, align:"right" });

  let currentY = 26 + 8;

  // ---- TÍTULO
  pdf.setDrawColor(...colors.grayMid); 
  pdf.setLineWidth(0.3);
  pdf.setFillColor(...colors.grayLight); 
  pdf.rect(M, currentY, pageWidth - 2*M, 10, "F");
  addText("REPORTE DE AUTORIZACIÓN DE CRÉDITO AUTOMOTRIZ", pageWidth/2, currentY+7,
          { size: 14, style:"bold", align:"center" });
  currentY += 16;

  // ---- DOS TARJETAS (Solicitante / Vehículo)
  // Solicitante
  let y = sectionHeader(M, currentY, COL, "DATOS DEL SOLICITANTE", colors.primary);
  const S = data.authorization_data || {} as any;
  const L = 4.6;
  let ly = y + 5;
  const labelX = M+4, valueX = M + COL*0.45;
  const row = (label: string, val: string, bold=false) => {
    addText(label, labelX, ly, { color: colors.gray });
    addText(val || "No especificado", valueX, ly, { style: bold? "bold":"normal" });
    ly += L;
  };
  row("Empresa:", S.company, true);
  row("Nombre Completo:", S.applicant_name, true);
  row("Puesto:", S.position);
  row("Edad:", (S.age ? `${S.age} años` : ""));
  row("Estado Civil:", S.marital_status);
  row("Antigüedad:", (S.seniority ? `${S.seniority} años` : ""));
  row("Sueldo Mensual:", money(S.monthly_salary), true);

  const mensualidad = data.monthly_payment
    ?? S.monthly_capacity ?? S.payment_capacity
    ?? (data.requested_amount && data.term_months ? data.requested_amount / data.term_months : 0);

  ly += 2;
  row("Monto Solicitado:", money(data.requested_amount), true);
  row("Plazo:", data.term_months ? `${data.term_months} meses` : "");
  row("Tasa:", data.interest_rate ? `${data.interest_rate}% anual` : "");
  
  // Calcular capacidad de pago
  const mes1Income = (S.mes1_nomina || 0) + (S.mes1_comisiones || 0) + (S.mes1_negocio || 0) + (S.mes1_efectivo || 0);
  const mes2Income = (S.mes2_nomina || 0) + (S.mes2_comisiones || 0) + (S.mes2_negocio || 0) + (S.mes2_efectivo || 0);
  const mes3Income = (S.mes3_nomina || 0) + (S.mes3_comisiones || 0) + (S.mes3_negocio || 0) + (S.mes3_efectivo || 0);
  const promedioIngresos = (mes1Income + mes2Income + mes3Income) / 3;
  
  const mes1Expenses = (S.mes1_compromisos || 0) + (S.mes1_gastos_personales || 0) + (S.mes1_gastos_negocio || 0);
  const mes2Expenses = (S.mes2_compromisos || 0) + (S.mes2_gastos_personales || 0) + (S.mes2_gastos_negocio || 0);
  const mes3Expenses = (S.mes3_compromisos || 0) + (S.mes3_gastos_personales || 0) + (S.mes3_gastos_negocio || 0);
  const promedioGastos = (mes1Expenses + mes2Expenses + mes3Expenses) / 3;
  
  // Calcular capacidad de pago con validaciones seguras
  const safeNumber = (val: any): number => {
    const num = Number(val);
    return isNaN(num) || !isFinite(num) ? 0 : num;
  };
  
  const tempPromIngresos = (safeNumber(S.mes1_nomina) + safeNumber(S.mes1_comisiones) + safeNumber(S.mes1_negocio) + safeNumber(S.mes1_efectivo) +
                           safeNumber(S.mes2_nomina) + safeNumber(S.mes2_comisiones) + safeNumber(S.mes2_negocio) + safeNumber(S.mes2_efectivo) +
                           safeNumber(S.mes3_nomina) + safeNumber(S.mes3_comisiones) + safeNumber(S.mes3_negocio) + safeNumber(S.mes3_efectivo)) / 3;
  const tempPromGastos = (safeNumber(S.mes1_compromisos) + safeNumber(S.mes1_gastos_personales) + safeNumber(S.mes1_gastos_negocio) +
                         safeNumber(S.mes2_compromisos) + safeNumber(S.mes2_gastos_personales) + safeNumber(S.mes2_gastos_negocio) +
                         safeNumber(S.mes3_compromisos) + safeNumber(S.mes3_gastos_personales) + safeNumber(S.mes3_gastos_negocio)) / 3;
  
  const disponibleTemp = tempPromIngresos - tempPromGastos;
  const capacidadPagoTemp = safeNumber(disponibleTemp * 0.4);
  
  console.log('🔍 Debug Capacidad de Pago:', {
    tempPromIngresos,
    tempPromGastos, 
    disponibleTemp,
    capacidadPagoTemp
  });
  
  row("Capacidad de Pago:", money(capacidadPagoTemp), true);
  row("Descuento:", money(mensualidad), true);
  
  const leftBoxBottom = ly + 2;

  // Vehículo
  y = sectionHeader(M + COL + G, currentY, COL, "DATOS DEL CARRO", colors.secondary);
  let ry = y + 5;
  const rLabel = M + COL + G + 4;
  const rValue = M + COL + G + COL*0.4;
  const rrow = (label: string, val: string, bold=false) => {
    addText(label, rLabel, ry, { color: colors.gray });
    addText(val || "No especificado", rValue, ry, { style: bold? "bold":"normal" });
    ry += L;
  };
  rrow("Agencia:", data.agency_name || "", true);
  rrow("Marca:", data.vehicle_brand || "", true);
  rrow("Modelo:", data.vehicle_model || "", true);
  rrow("Año:", String(data.vehicle_year||""));
  rrow("Valor de venta:", money(data.vehicle_value), true);

  const comps = (S.competitors || data.competitors_data || [])
    .filter((c:any)=>c && c.name && c.price>0).slice(0,3);
  if (comps.length){ ry += 2; comps.forEach((c:any)=>{ rrow(`${c.name}:`, money(c.price), true); }); }

  currentY = Math.max(leftBoxBottom, ry) + 8;

  // ---- INGRESOS (AutoTable)
  // Usar nombres de meses guardados por el usuario, o calcular automáticamente como fallback
  const getMonthName = (monthsBack: number) => {
    const date = new Date().getMonth() - monthsBack;
    const monthNames = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", 
                       "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
    const year = new Date().getFullYear().toString().slice(-2);
    const monthIndex = date < 0 ? 12 + date : date;
    return `${monthNames[monthIndex]} ${year}`;
  };

  // Usar los nombres de meses guardados por el usuario si existen
  const monthLabels = S.month_labels || [
    getMonthName(2), getMonthName(1), getMonthName(0)
  ];

  const incomes = [
    { mes: monthLabels[0], nom: S.mes1_nomina, com: S.mes1_comisiones, neg: S.mes1_negocio, efe: S.mes1_efectivo },
    { mes: monthLabels[1], nom: S.mes2_nomina, com: S.mes2_comisiones, neg: S.mes2_negocio, efe: S.mes2_efectivo },
    { mes: monthLabels[2], nom: S.mes3_nomina, com: S.mes3_comisiones, neg: S.mes3_negocio, efe: S.mes3_efectivo },
  ];
  const sum = (k: keyof typeof incomes[number]) => incomes.reduce((a,b)=>a+Number(b[k]||0),0);
  const tNom = sum("nom"), tCom = sum("com"), tNeg = sum("neg"), tEfe = sum("efe");
  const rowsIn = incomes.map(r=>{
    const total = Number(r.nom||0)+Number(r.com||0)+Number(r.neg||0)+Number(r.efe||0);
    return [r.mes, money(r.nom), money(r.com), money(r.neg), money(r.efe), money(total)];
  });

  // ---- INGRESOS (AutoTable)
  currentY = ensureSpace(40);
  currentY = sectionHeader(M, currentY, pageWidth - 2*M, "INGRESOS MENSUALES COMPROBABLES (Últimos 3 Meses)", colors.primary) + 2;

  autoTable(pdf, {
    startY: currentY,
    margin: { left: M, right: M },
    head: [["Mes","Nómina","Comisiones","Negocio","Otros","Total"]],
    body: [
      ...rowsIn,
      [{ content:"Total:", styles:{ fontStyle:"bold" } }, money(tNom), money(tCom), money(tNeg), money(tEfe), { content: money(tNom+tCom+tNeg+tEfe), styles:{ fontStyle:"bold" } }],
      [{ content:"Promedio:", styles:{ fontStyle:"bold" } },
        money(tNom/3), money(tCom/3), money(tNeg/3), money(tEfe/3), { content: money((tNom+tCom+tNeg+tEfe)/3), styles:{ fontStyle:"bold" } }],
    ],
    theme: "plain",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2, lineWidth: 0.2, lineColor: colors.grayMid },
    headStyles: { fillColor: [248,250,252], textColor: [17,24,39], fontStyle:"bold" },
    columnStyles: {
      0: { halign: "left" },
      1: { halign: "right" }, 2: { halign: "right" },
      3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" },
    },
    didParseCell: (d:any)=>{
      // zebra para filas principales (no totales/promedios)
      if (d.section==="body" && d.row.index < 3) {
        d.cell.styles.fillColor = d.row.index % 2 ? [255,255,255] : [250,250,250];
      }
      if (d.section==="body" && d.row.index >= 3) {
        d.cell.styles.fillColor = d.row.index===3 ? colors.primaryLight : [235, 248, 255];
      }
    }
  });
  currentY = ((pdf as any).lastAutoTable.finalY || currentY) + 8;

  // ---- GASTOS (AutoTable)
  const expenses = [
    { mes: monthLabels[0], comp:S.mes1_compromisos, per:S.mes1_gastos_personales, neg:S.mes1_gastos_negocio },
    { mes: monthLabels[1], comp:S.mes2_compromisos, per:S.mes2_gastos_personales, neg:S.mes2_gastos_negocio },
    { mes: monthLabels[2], comp:S.mes3_compromisos, per:S.mes3_gastos_personales, neg:S.mes3_gastos_negocio },
  ];
  const esum = (k: keyof typeof expenses[number]) => expenses.reduce((a,b)=>a+Number(b[k]||0),0);
  const eComp=esum("comp"), ePer=esum("per"), eNeg=esum("neg");
  
  // Ahora que tenemos todos los datos, calcular la capacidad de pago correcta
  const promIngresosSolicitante = (tNom+tCom+tNeg+tEfe)/3;
  const promEgresosSolicitante = (eComp+ePer+eNeg)/3; // incluir gastos de negocio
  const disponibleCorrect = promIngresosSolicitante - promEgresosSolicitante;
  const capacidadPagoCorrect = disponibleCorrect * 0.4;
  
  const rowsEx = expenses.map(r=>{
    const total = Number(r.comp||0)+Number(r.per||0)+Number(r.neg||0);
    return [r.mes, money(r.comp), money(r.per), money(r.neg), money(total)];
  });

  currentY = ensureSpace(32);
  currentY = sectionHeader(M, currentY, pageWidth - 2*M, "GASTOS MENSUALES COMPROBABLES", colors.danger) + 2;

  autoTable(pdf, {
    startY: currentY,
    margin: { left: M, right: M },
    head: [["Mes","Compromisos Buró","Gastos Personales","Gastos Negocio","Total"]],
    body: [
      ...rowsEx,
      [{ content:"PROMEDIO:", styles:{ fontStyle:"bold" } },
        money(eComp/3), money(ePer/3), money(eNeg/3), { content: money((eComp+ePer+eNeg)/3), styles:{ fontStyle:"bold" } }],
    ],
    theme: "plain",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2, lineWidth: 0.2, lineColor: colors.grayMid },
    headStyles: { fillColor: [248,250,252], textColor: [17,24,39], fontStyle:"bold" },
    columnStyles: { 0:{halign:"left"}, 1:{halign:"right"}, 2:{halign:"right"}, 3:{halign:"right"}, 4:{halign:"right"} },
    didParseCell: (d:any)=>{
      if (d.section==="body" && d.row.index < 3) {
        d.cell.styles.fillColor = d.row.index % 2 ? [255,255,255] : [250,250,250];
      }
      if (d.section==="body" && d.row.index === 3) d.cell.styles.fillColor = [254, 226, 226];
    }
  });
  currentY = ((pdf as any).lastAutoTable.finalY || currentY) + 8;

  // ---- RESUMEN FINANCIERO CON TOGGLE
  // Toggle para incluir o excluir gastos de negocio en la capacidad de pago
  const INCLUDE_BUSINESS_EXPENSES = true; // true para coincidir con la plataforma
  
  const promIngresos = (tNom+tCom+tNeg+tEfe)/3;
  const promComp = eComp/3;
  const promPers = ePer/3;
  const promNeg = eNeg/3;

  const promEgresos = INCLUDE_BUSINESS_EXPENSES
    ? (promComp + promPers + promNeg)   // con negocio
    : (promComp + promPers);            // sin negocio (cálculo original)

  const disponibleCalc = promIngresos - promEgresos;
  const cap40 = disponibleCalc * 0.4;
  const proporcion = mensualidad ? cap40 / mensualidad : 0;

  currentY = ensureSpace(30);
  currentY = sectionHeader(M, currentY, pageWidth - 2*M, "RESUMEN FINANCIERO", colors.primary) + 5;

  const Lh = 6;
  const col1 = M + 2, val1 = M + 65;
  const col2 = M + 105, val2 = M + 155;

  addText("Total Ingresos (Prom.):", col1, currentY, { color: colors.gray });
  addText(money(promIngresos), val1, currentY, { style:"bold" });
  addText("Capacidad de Pago (40%):", col2, currentY, { color: colors.gray });
  addText(money(cap40), val2, currentY, { style:"bold" }); currentY += Lh;

  addText("Total Egresos (Prom.):", col1, currentY, { color: colors.gray });
  addText(money(promEgresos), val1, currentY, { style:"bold", color: colors.danger });
  addText("Pago Mensual Total:", col2, currentY, { color: colors.gray });
  addText(money(mensualidad), val2, currentY, { style:"bold", color: colors.secondary }); currentY += Lh;

  addText("Disponible:", col1, currentY, { size:10, color: colors.gray });
  addText(money(disponibleCalc), val1, currentY, { size:10, style:"bold" });

  // Proporción con color de texto según nivel de riesgo (sin fondo)
  let textColor: RGB = colors.primary;
  let estadoTexto = "";
  
  if (proporcion < 1.0) {
    textColor = [239, 68, 68]; // Rojo - No Viable
    estadoTexto = "No Viable";
  } else if (proporcion >= 1.0 && proporcion < 1.2) {
    textColor = [245, 158, 11]; // Naranja - Riesgoso
    estadoTexto = "Riesgoso";
  } else if (proporcion >= 1.2 && proporcion < 1.4) {
    textColor = [251, 191, 36]; // Amarillo - Aceptable
    estadoTexto = "Aceptable";
  } else if (proporcion >= 1.4 && proporcion < 1.8) {
    textColor = [63, 166, 41]; // Verde - Óptimo
    estadoTexto = "Óptimo";
  } else if (proporcion >= 1.8) {
    textColor = [50, 133, 33]; // Verde oscuro - Excelente
    estadoTexto = "Excelente";
  }
  
  addText("Proporción (Capacidad/Pago):", col2, currentY, { color: colors.gray });
  addText(`${proporcion.toFixed(2)} (${estadoTexto})`, val2, currentY, { style:"bold", color: textColor });
  currentY += Lh + 4;

  // Subtexto explicativo del cálculo
  addText(
    `Capacidad calculada ${INCLUDE_BUSINESS_EXPENSES ? "con" : "sin"} gastos de negocio`,
    M + 6, currentY,
    { size: 8, color: colors.gray }
  );
  currentY += 6;

  // ---- COMENTARIOS (opcional)
  if (S.comments){
    currentY = ensureSpace(18);
    currentY = sectionHeader(M, currentY, pageWidth - 2*M, "COMENTARIOS ADICIONALES", colors.gray) + 4;
    pdf.setTextColor(...colors.black);
    const lines = pdf.splitTextToSize(String(S.comments), pageWidth - 2*M - 8);
    pdf.text(lines, M+6, currentY);
    currentY += lines.length * 4;
  }

  // ---- FOOTER (siempre al final)
  const drawFooter = () => {
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const fy = pageH - 16;
    pdf.setFillColor(...colors.grayLight); 
    pdf.rect(0, fy, pageW, 16, "F");
    pdf.setFillColor(...colors.gold); 
    pdf.rect(0, fy, pageW, 1, "F");
    addText("FINCENTIVA", M, fy+6, { style:"bold", color: colors.primaryDark });
    addText("Sistema de Autorización de Créditos Automotrices", M, fy+11, { size:8, color: colors.gray });
    addText(`Generado: ${new Date().toLocaleString("es-MX",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"})}`,
            M, fy+14, { size:7, color: colors.grayMid });
    addText("Documento Confidencial", pageW - M - 2, fy+6, { size:8, style:"bold", color: colors.danger, align:"right" });
    addText("Página 1 de 1", pageW - M - 2, fy+14, { size:7, color: colors.grayMid, align:"right" });
  };
  
  // Dibujar footer después de terminar todo el contenido
  drawFooter();

  const cleanClient = (data.client_name || "cliente").toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,15);
  const fileName = `fincentiva_autorizacion_${cleanClient}_${data.id.substring(0,8)}.pdf`;
  pdf.save(fileName);
};
