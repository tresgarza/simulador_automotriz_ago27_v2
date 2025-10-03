import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: any;
  }
}

export interface ClientCreditAuthorizationData {
  // Client data
  client: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
  };
  
  // Authorization data
  authorization: {
    id: string;
    date?: string;
  };
  
  // Credit data
  credit: {
    requested_amount: number;
    term_months: number;
    interest_rate_annual: number;
    opening_fee_pct: number;
    down_payment?: number;
  };
  
  // Insurance data
  insurance: {
    mode: "financed" | "cash";
    premium?: number;
    term_months?: number;
  };
  
  // Payment data
  payments: {
    monthly_without_insurance?: number;
    monthly_total?: number;
  };
  
  // Vehicle data
  vehicle: {
    brand: string;
    model: string;
    year: number;
    agency_value: number;
  };
  
  // Agency data
  agency?: {
    name?: string;
  };
  
  // Validity
  valid_until: string;
}

type RGB = [number, number, number];

export const generateClientCreditAuthorizationPDF = async (data: ClientCreditAuthorizationData): Promise<void> => {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "p" });
  
  // Inicializar autoTable correctamente
  autoTable(pdf, {
    head: [[]],
    body: [[]],
    theme: 'plain'
  });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Sistema de diseño
  const M = 20; // margen
  const G = 8;  // gutter
  const COL = (pageWidth - 2*M - G) / 2; // ancho de columna
  const S2 = 4, S3 = 6, S4 = 8, S5 = 12; // espaciados
  
  // Fincentiva tokens
  const FIN = {
    primary: [63, 166, 41],       // verde actualizado #3fa629
    primaryDark: [50, 133, 33],
    gold: [245, 158, 11],
    blue: [59, 130, 246],
    gray: [75, 85, 99],
    grayMid: [156, 163, 175],
    grayLight: [248, 250, 252],
    black: [17, 24, 39],
    white: [255, 255, 255],
  };

  let currentY = 0;

  // Utilidades profesionales
  const money = (v: number = 0) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v) || 0);
  const dateMx = (d: Date = new Date()) => d.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  // Función para normalizar nombres (Title Case)
  const toTitleCase = (str: string): string => {
    if (!str) return str;
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };
  
  const FOOTER_H = 22;
  
  const blockHeight = (lines: string | string[], size = 10) => {
    pdf.setFontSize(size);
    const text = Array.isArray(lines) ? lines.join('\n') : lines;
    return pdf.getTextDimensions(text).h;
  };
  
  const ensureSpace = (need: number) => {
    const last = (pdf as any).lastAutoTable?.finalY ?? currentY;
    const yref = Math.max(currentY, last || 0);
    if (yref + need > pageHeight - FOOTER_H) { 
      pdf.addPage(); 
      currentY = M; 
      (pdf as any).lastAutoTable = undefined; 
    } else { 
      currentY = yref; 
    }
  };
  
  // Dibuja una sola línea justificada (menos la última)
  const drawJustifiedLine = (words: string[], x: number, y: number, lineWidth: number) => {
    if (words.length === 1) { pdf.text(words[0], x, y); return; }
    // Anchos de palabra (con fuente/tamaño actuales)
    const wWidths = words.map(w => pdf.getTextWidth(w));
    const totalWordsW = wWidths.reduce((a, b) => a + b, 0);
    const spaceW = pdf.getTextWidth(' ');
    const gaps = words.length - 1;
    const extra = Math.max(lineWidth - (totalWordsW + gaps * spaceW), 0);
    const addPerGap = extra / gaps;

    let cx = x;
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      pdf.text(w, cx, y);
      if (i < words.length - 1) {
        cx += wWidths[i] + spaceW + addPerGap;
      }
    }
  };

  // Párrafo justificado con control de página
  const justifyParagraph = (
    text: string,
    x: number,
    width: number,
    opts: { size?: number; color?: RGB; before?: number; after?: number; lineGap?: number } = {}
  ) => {
    const { size = 10, color = FIN.black, before = 6, after = 8, lineGap = 1.35 } = opts;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    pdf.setLineHeightFactor(lineGap);

    // Rompe en palabras y arma líneas que no excedan width
    const rawWords = text.replace(/\s+/g, ' ').trim().split(' ');
    const lines: string[][] = [];
    let line: string[] = [];
    let lineW = 0;

    for (const word of rawWords) {
      const w = pdf.getTextWidth(word);
      const space = line.length ? pdf.getTextWidth(' ') : 0;
      if (lineW + space + w <= width) {
        line.push(word);
        lineW += space + w;
      } else {
        lines.push(line);
        line = [word];
        lineW = w;
      }
    }
    if (line.length) lines.push(line);

    // Altura estimada (mm) para control de página
    const lineHeight = size * 0.3528 * lineGap; // 1pt ≈ 0.3528mm
    const needH = before + lines.length * lineHeight + after;
    ensureSpace(needH);

    currentY += before;
    // Dibuja todas menos la última justificadas; la última normal
    for (let i = 0; i < lines.length; i++) {
      // Evita 1 sola línea al pie
      if (i === lines.length - 1) {
        // última línea: izquierda
        pdf.text(lines[i].join(' '), x, currentY);
      } else {
        drawJustifiedLine(lines[i], x, currentY, width);
      }
      currentY += lineHeight;

      // Si la siguiente línea no cabe, salto de página
      if (i < lines.length - 1 && currentY + lineHeight > pageHeight - FOOTER_H) {
        pdf.addPage(); currentY = M;
      }
    }
    currentY += after;
  };
  
  const sectionHeading = (title: string, x: number = M) => {
    ensureSpace(12);
    pdf.setFont('helvetica', 'bold'); 
    pdf.setFontSize(11); 
    pdf.setTextColor(...FIN.black);
    pdf.text(title, x, currentY);
    currentY += 6; 
    pdf.setDrawColor(...FIN.grayMid); 
    pdf.setLineWidth(0.2); 
    pdf.line(x, currentY, x + COL, currentY);
    currentY += 6;
  };

  const addLogo = async (pdf: any, x: number, y: number, h: number, src: string) => {
    try {
      const blob = await fetch(src).then(r => r.blob());
      const dataUrl = await new Promise<string>(res => { 
        const fr = new FileReader(); 
        fr.onload = () => res(fr.result as string); 
        fr.readAsDataURL(blob); 
      });
      const props = (pdf as any).getImageProperties(dataUrl);
      const w = (props.width / props.height) * h;
      pdf.addImage(dataUrl, 'PNG', x, y, w, h, undefined, 'FAST');
      return w;
    } catch {
      return 0;
    }
  };

  const SHOW_LINE = false;

  const loadImageAsDataURL = async (src: string): Promise<string|null> => {
    try {
      const blob = await fetch(src).then(r => r.blob());
      return await new Promise<string>(res => { 
        const fr = new FileReader(); 
        fr.onload = () => res(fr.result as string); 
        fr.readAsDataURL(blob); 
      });
    } catch { 
      return null; 
    }
  };

  const drawSignatureBlock = async (opts: {
    imgSrc?: string;      // '/firma_digital_adolfo.png' o data.signatureUrl
    name: string;         // 'Adolfo Medina'
    role: string;         // 'Director General'
    imgH?: number;        // default 18mm
  }) => {
    const imgH = opts.imgH ?? 18;
    const name = opts.name || '';
    const role = opts.role || '';

    // Estimar alto total del bloque (imagen + gaps + textos + línea opcional)
    const gap1 = 2, gap2 = 2, lineH = SHOW_LINE ? 6 : 0;
    const textH = 11*0.3528 + 10*0.3528 + 2; // ~altura nombre+rol con separación
    const need = imgH + gap1 + lineH + gap2 + textH + 2;
    ensureSpace(need);

    // Cargar imagen
    let dataUrl: string|null = null;
    if (opts.imgSrc) dataUrl = await loadImageAsDataURL(opts.imgSrc);

    // Dibujo centrado
    let y = currentY;
    if (dataUrl) {
      const props = (pdf as any).getImageProperties(dataUrl);
      const imgW = (props.width/props.height) * imgH;
      const x = (pageWidth - imgW) / 2;
      pdf.addImage(dataUrl, 'PNG', x, y, imgW, imgH, undefined, 'FAST');
    }
    y += imgH + gap1;

    if (SHOW_LINE) {
      const lineW = 60;
      const x1 = (pageWidth - lineW) / 2;
      pdf.setDrawColor(156,163,175); 
      pdf.setLineWidth(0.2);
      pdf.line(x1, y, x1 + lineW, y);
      y += lineH;
    }

    // Nombre
    pdf.setFont('helvetica','bold'); 
    pdf.setFontSize(11); 
    pdf.setTextColor(17,24,39);
    pdf.text(name, pageWidth/2, y + 2, { align: 'center' });
    // Cargo
    pdf.setFont('helvetica','normal'); 
    pdf.setFontSize(10); 
    pdf.setTextColor(107,114,128);
    pdf.text(role, pageWidth/2, y + 7, { align: 'center' });

    currentY = y + 12; // avanza después del bloque
  };

  const drawFooterOnLastPage = () => {
    pdf.setPage(pdf.getNumberOfPages());
    const footerY = pageHeight - 25;
    pdf.setFillColor(...FIN.grayLight);
    pdf.rect(0, footerY - 5, pageWidth, 30, "F");
    pdf.setFillColor(...FIN.gold);
    pdf.rect(0, footerY - 5, pageWidth, 1, "F");

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(...FIN.primaryDark);
    pdf.text("FINCENTIVA", M, footerY + 2);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...FIN.gray);
    pdf.text("Sistema de Autorización de Créditos Automotrices", M, footerY + 7);
    
    pdf.setFontSize(7);
    pdf.setTextColor(...FIN.grayMid);
    pdf.text("San Francisco 2340, Col. Lomas de San Francisco, Monterrey, Nuevo León, C.P. 64710", M, footerY + 12);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...FIN.blue);
    pdf.text("Documento Confidencial", pageWidth - M, footerY + 2, { align: 'right' });
  };

  // Header
  const headerHeight = 26;
  pdf.setFillColor(...FIN.primary);
  pdf.rect(0, 0, pageWidth, headerHeight, "F");
  pdf.setFillColor(...FIN.gold);
  pdf.rect(0, 0, pageWidth, 1, "F");

  // Logo blanco (grande y prominente)
  await addLogo(pdf, M, (headerHeight - 16) / 2, 16, '/LOGO FINCENTIVA BLANCO.png');

  // Fecha y folio (alineados a la derecha)
  const today = new Date();
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...FIN.white);
  pdf.text(dateMx(today), pageWidth - M, 8, { align: 'right' });
  
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Folio: ${data.authorization.id.substring(0, 8).toUpperCase()}`, pageWidth - M, 18, { align: 'right' });

  // Establecer interlineado consistente
  pdf.setLineHeightFactor(1.35);
  
  currentY = headerHeight + S5;

  // Destinatario
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...FIN.black);
  pdf.text(`Estimada/o ${toTitleCase(data.client.name)}:`, M, currentY);
  currentY += S4;

  // Dirección (si existe)
  const clientAddress = [data.client.address, data.client.city, data.client.state].filter(Boolean).join(", ");
  if (clientAddress) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...FIN.gray);
    pdf.text(clientAddress, M, currentY);
    currentY += S4;
  }

  // Párrafo de introducción (justificado)
  const introText = `Por medio de la presente, y con base en la evaluación realizada por nuestro comité de crédito, nos es grato informarle que su solicitud de crédito automotriz ha sido aprobada bajo las siguientes condiciones:`;
  
  justifyParagraph(introText, M, pageWidth - 2*M, { size: 10, before: 0, after: 8 });

  // Cálculo de pago mensual (si falta)
  const P = data.credit.requested_amount - (data.credit.down_payment || 0);
  const r = (data.credit.interest_rate_annual/100)/12;
  const n = data.credit.term_months;
  const basePM = r > 0 ? (P*r)/(1-Math.pow(1+r, -n)) : (P/n);
  const insPerMonth = data.insurance.mode === 'financed' ? ((data.insurance.premium||0)/ (data.insurance.term_months||n)) : 0;
  const monthlyPayment = (data.insurance.mode === 'financed'
    ? (data.payments.monthly_total || (basePM + insPerMonth))
    : (data.payments.monthly_without_insurance || basePM)
  );

  const insuranceText = data.insurance.mode === "financed" ? "Financiado" : "De Contado";

  const creditConditions = [
    ["Monto Autorizado", money(data.credit.requested_amount)],
    ["Plazo", `${data.credit.term_months} meses`],
    ["Tasa de Interés Mensual", `${(data.credit.interest_rate_annual / 12).toFixed(2)}%`],
    ["Modalidad de Seguro", insuranceText],
    ["Pago Mensual", money(monthlyPayment)],
  ];

  if (data.credit.down_payment && data.credit.down_payment > 0) {
    creditConditions.push(["Enganche", money(data.credit.down_payment)]);
  }

  const vehicleData = [
    ["Marca", toTitleCase(data.vehicle.brand)],
    ["Modelo", toTitleCase(data.vehicle.model)],
    ["Año", data.vehicle.year.toString()],
    ["Valor", money(data.vehicle.agency_value)]
  ];

  if (data.agency?.name) {
    vehicleData.push(["Agencia", toTitleCase(data.agency.name)]);
  }

  // Datos bancarios para transferencia
  const bankingData = [
    ["Beneficiario", "Banco Banorte"],
    ["Cuenta", "0 653 215 428"],
    ["Cuenta Clabe", "072 580 006 532 154 280"],
    ["Razón Social", "Financiera Incentiva SAPI de CV Sofom ENR"]
  ];

  // --- Títulos por columna (cada uno en su X) ---
  const leftX = M;
  const rightX = M + COL + G;

  pdf.setFont('helvetica','bold'); 
  pdf.setFontSize(11);
  pdf.setTextColor(...FIN.black);
  pdf.text('Datos del crédito autorizado', leftX, currentY);
  pdf.text('Datos del vehículo', rightX, currentY);
  currentY += 6;
  pdf.setDrawColor(...FIN.grayMid); 
  pdf.setLineWidth(0.2);
  pdf.line(leftX, currentY, leftX + COL, currentY);
  pdf.line(rightX, currentY, rightX + COL, currentY);
  currentY += 6;

  // --- Estimar altura y decidir lado-a-lado vs apiladas ---
  const estRowH = 5.0; // ~ densidad 8pt + padding reducido
  const estCredito = 8 + (creditConditions.length + 1) * estRowH; // +1 header
  const estVeh = 8 + (vehicleData.length + 1) * estRowH;
  const canSide = (currentY + Math.max(estCredito, estVeh) <= pageHeight - FOOTER_H);

  const autoTableBase = {
    theme: 'plain' as const,
    head: [['Concepto','Detalle']],
    styles: { 
      font: 'helvetica', 
      fontSize: 8, 
      cellPadding: 1.5, 
      lineWidth: 0.2, 
      lineColor: FIN.grayMid as [number, number, number], 
      overflow: 'linebreak', 
      valign: 'middle' 
    },
    headStyles: { fillColor: FIN.grayLight as [number, number, number], textColor: FIN.black as [number, number, number], fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 40 }, // Concepto fijo
      1: { halign: 'left' } // Detalle ocupa el resto
    },
    rowPageBreak: 'avoid' as const,
    showHead: 'everyPage' as const,
    alternateRowStyles: { fillColor: [250,250,250] as [number, number, number] },
    didParseCell: (d:any) => {
      // Resaltar filas clave y alinear montos específicos a la izquierda
      if (d.section==='body' && d.column.index===1) {
        const label = String(d.row.raw?.[0] ?? '');
        const raw = String(d.cell.raw ?? '');
        
        // Campos específicos que deben ir alineados a la izquierda
        if (label === 'Monto Autorizado' || label === 'Pago Mensual' || label === 'Valor') {
          d.cell.styles.fontStyle = 'bold';
          d.cell.styles.textColor = FIN.primaryDark as [number, number, number];
          d.cell.styles.halign = 'left'; // Alinear a la izquierda
        }
        // Otros montos mantienen alineación a la derecha
        else if (/^\$[\d.,]+/.test(raw)) {
          d.cell.styles.halign = 'right';
        }
      }
    }
  };

  const drawCreditTable = (startY:number, left:number) => {
    autoTable(pdf, {
      ...autoTableBase,
      startY,
      margin: { left, right: pageWidth - (left + COL) },
      body: creditConditions,
    });
    return (pdf as any).lastAutoTable.finalY as number;
  };

  const drawVehicleTable = (startY:number, left:number) => {
    autoTable(pdf, {
      ...autoTableBase,
      startY,
      margin: { left, right: pageWidth - (left + COL) },
      body: vehicleData,
      didParseCell: (d:any) => {
        autoTableBase.didParseCell?.(d);
        // 'Valor' ya se maneja en autoTableBase.didParseCell, no necesitamos sobreescribir aquí
      }
    });
    return (pdf as any).lastAutoTable.finalY as number;
  };

  const drawBankingTable = (startY:number, left:number) => {
    autoTable(pdf, {
      ...autoTableBase,
      startY,
      margin: { left, right: pageWidth - (left + COL) },
      body: bankingData,
      didParseCell: (d:any) => {
        autoTableBase.didParseCell?.(d);
        // Resaltar datos bancarios importantes
        if (d.section==='body' && d.column.index===1) {
          const label = String(d.row.raw?.[0] ?? '');
          if (label === 'Cuenta Clabe' || label === 'Cuenta') {
            d.cell.styles.fontStyle = 'bold';
            d.cell.styles.textColor = FIN.primaryDark as [number, number, number];
          }
        }
      }
    });
    return (pdf as any).lastAutoTable.finalY as number;
  };

  if (!canSide) {
    // --- Apiladas ---
    const fy1 = drawCreditTable(currentY, leftX);
    currentY = (fy1 || currentY) + 6;
    const fy2 = drawVehicleTable(currentY, leftX);
    currentY = (fy2 || currentY) + 8;
  } else {
    // --- Lado a lado con misma línea base ---
    const startY = currentY;
    const fyL = drawCreditTable(startY, leftX);
    const fyR = drawVehicleTable(startY, rightX);
    currentY = Math.max(fyL, fyR) + 6;
  }

  // Espacio adicional antes de la tabla de datos bancarios
  currentY += 8;

  // Agregar título y tabla de datos bancarios (centrados)
  pdf.setFont('helvetica','bold'); 
  pdf.setFontSize(11);
  pdf.setTextColor(...FIN.black);
  pdf.text('Datos para transferencia bancaria', pageWidth/2, currentY, { align: 'center' });
  currentY += 6;
  pdf.setDrawColor(...FIN.grayMid); 
  pdf.setLineWidth(0.2);
  const lineStartX = (pageWidth - COL) / 2;
  pdf.line(lineStartX, currentY, lineStartX + COL, currentY);
  currentY += 6;

  // Dibujar tabla de datos bancarios (centrada)
  const bankingTableWidth = COL; // Usar el mismo ancho que las otras tablas
  const centerX = (pageWidth - bankingTableWidth) / 2; // Centrar la tabla
  const fy3 = drawBankingTable(currentY, centerX);
  currentY = (fy3 || currentY) + 6;

  // Siguientes pasos (justificado) - espaciado reducido
  justifyParagraph(
    `El siguiente paso es contactar a la agencia y realizar el pago del enganche. Posteriormente, coordinaremos la firma del contrato. Y con eso, ¡ya estarías lista para recibir tu nuevo auto!`,
    M, pageWidth - 2*M, 
    { size: 10, before: 0, after: 4 }
  );

  // Vigencia (destacada, justificada) - espaciado reducido
  const validUntilDate = new Date(data.valid_until);
  justifyParagraph(
    `Esta autorización tiene vigencia hasta el ${dateMx(validUntilDate)}.`,
    M, pageWidth - 2*M,
    { size: 10, before: 0, after: 4 }
  );

  // Disclaimer legal (justificado) - espaciado muy reducido
  justifyParagraph(
    `Esta carta se emite con base en la evaluación crediticia; sujeta a validación documental y firma de contrato. Tasa fija; condiciones económicas pueden ajustar si cambian variables del vehículo, seguro o plazos. No constituye obligación de contratar.`,
    M, pageWidth - 2*M,
    { size: 8, color: FIN.gray, before: 0, after: 4 }
  );

  // --- Cierre y firma --- espaciado muy reducido para que quepa en primera hoja
  pdf.setFont('helvetica','normal'); 
  pdf.setFontSize(10);
  pdf.setTextColor(...FIN.black);
  pdf.text('Sin más por el momento, reciba un cordial saludo.', pageWidth/2, currentY, { align: 'center' });
  currentY += 4;
  pdf.text('Atentamente,', pageWidth/2, currentY, { align: 'center' });
  currentY += 3;

  // Firma más compacta para que quepa en la primera hoja
  await drawSignatureBlock({
    imgSrc: '/firma_digital_adolfo.png',
    name: 'Adolfo Medina',
    role: 'Director General',
    imgH: 24, // Reducir altura de imagen para ahorrar espacio
  });

  // Footer en la última página
  drawFooterOnLastPage();

  // Guardar PDF
  const fileName = `carta_autorizacion_${toTitleCase(data.client.name).replace(/\s+/g, '_')}_${data.authorization.id.substring(0, 8)}_${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}.pdf`;
  pdf.save(fileName);
};
