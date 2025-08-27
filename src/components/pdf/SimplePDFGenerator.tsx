"use client";
import jsPDF from "jspdf";
import { formatMXN } from "@/lib/utils";

interface Summary {
  pmt_total_month2: number;
  principal_total: number;
  initial_outlay: number;
  first_payment_date: string;
  last_payment_date: string;
  pmt_base: number;
  opening_fee: number;
  opening_fee_iva: number;
  gps: number;
  gps_iva: number;
}

interface Schedule {
  k: number;
  date: string;
  saldo_ini: number;
  interes: number;
  iva_interes: number;
  capital: number;
  pmt: number;
  gps_rent: number;
  gps_rent_iva: number;
  pago_total: number;
  saldo_fin: number;
}

interface PDFData {
  summary: Summary;
  schedule: Schedule[];
  vehicleValue: number;
  downPayment: number;
  insuranceAmount: number;
  insuranceMode: string;
  termMonths: number;
  rateTier: string;
}

export const generateSimplePDF = (data: PDFData) => {
  const { summary, schedule, vehicleValue, downPayment, insuranceAmount, insuranceMode, termMonths, rateTier } = data;
  
  const rateMap: Record<string, string> = {
    A: '36%',
    B: '40%',
    C: '45%'
  };

  const today = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const gpsMonthly = schedule.length > 0 ? schedule[0].gps_rent + schedule[0].gps_rent_iva : 0;
  const minimumIncome = Math.round(summary.pmt_total_month2 / 0.265);
  
  // Calcular seguro mensual si es financiado
  const insuranceMonthly = insuranceMode === 'financed' 
    ? Math.round((insuranceAmount * 1.16) / termMonths)
    : 0;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add text
  const addText = (text: string, x: number, y: number, options: {
    fontSize?: number;
    style?: "normal" | "bold";
    color?: number[];
    align?: "left" | "center" | "right";
  } = {}) => {
    pdf.setFontSize(options.fontSize || 10);
    pdf.setFont("helvetica", options.style || "normal");
    if (options.color) {
      pdf.setTextColor(options.color[0], options.color[1], options.color[2]);
    } else {
      pdf.setTextColor(0, 0, 0);
    }
    
    const align = options.align || 'left';
    if (align === 'center') {
      const textWidth = pdf.getTextWidth(text);
      x = x - textWidth / 2;
    } else if (align === 'right') {
      const textWidth = pdf.getTextWidth(text);
      x = x - textWidth;
    }
    
    pdf.text(text, x, y);
  };

  // Helper function to add line
  const addLine = (x1: number, y1: number, x2: number, y2: number) => {
    pdf.setDrawColor(0, 0, 0);
    pdf.line(x1, y1, x2, y2);
  };

  // Header
  addText("Financiera Incentiva", margin, yPosition, { fontSize: 18, style: "bold", color: [46, 184, 114] });
  addText("Tu aliado financiero", margin, yPosition + 6, { fontSize: 10, color: [100, 100, 100] });
  
  addText("Fecha de cotización:", pageWidth - 60, yPosition, { fontSize: 9, color: [100, 100, 100] });
  addText(today, pageWidth - 60, yPosition + 5, { fontSize: 9, style: "bold" });
  
  yPosition += 15;
  addLine(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Title
  addText("Cotización de Crédito Automotriz", pageWidth / 2, yPosition, { fontSize: 16, style: "bold", align: "center" });
  yPosition += 8;
  addText(`Nivel ${rateTier} • ${termMonths} meses • TAN ${rateMap[rateTier]}`, pageWidth / 2, yPosition, { fontSize: 11, color: [100, 100, 100], align: "center" });
  yPosition += 15;

  // Main payment amount (centered box)
  const boxWidth = 80;
  const boxHeight = 25;
  const boxX = (pageWidth - boxWidth) / 2;
  
  pdf.setFillColor(240, 253, 244); // Light green background
  pdf.setDrawColor(46, 184, 114); // Green border
  pdf.rect(boxX, yPosition, boxWidth, boxHeight, 'FD');
  
  addText("Pago Mensual", pageWidth / 2, yPosition + 8, { fontSize: 12, style: "bold", color: [22, 101, 52], align: "center" });
  addText(formatMXN(summary.pmt_total_month2), pageWidth / 2, yPosition + 16, { fontSize: 18, style: "bold", color: [21, 128, 61], align: "center" });
  addText("Incluye capital, intereses, IVA y GPS", pageWidth / 2, yPosition + 22, { fontSize: 8, color: [22, 101, 52], align: "center" });
  
  yPosition += 35;

  // Vehicle and Credit Info (two columns)
  const colWidth = (pageWidth - 3 * margin) / 2;
  
  // Left column - Vehicle Info
  addText("Información del Vehículo", margin, yPosition, { fontSize: 12, style: "bold" });
  yPosition += 8;
  addLine(margin, yPosition, margin + colWidth, yPosition);
  yPosition += 6;
  
  const vehicleData = [
    ["Valor del vehículo", formatMXN(vehicleValue)],
    ["Enganche", formatMXN(downPayment)],
    [`Seguro (${insuranceMode === 'cash' ? 'Contado' : 'Financiado'})`, formatMXN(insuranceAmount)],
    ["Monto a financiar", formatMXN(summary.principal_total)]
  ];

  vehicleData.forEach(([label, value], index) => {
    if (index % 2 === 1) {
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, yPosition - 2, colWidth, 6, 'F');
    }
    addText(label, margin + 2, yPosition + 2, { fontSize: 9 });
    addText(value, margin + colWidth - 2, yPosition + 2, { fontSize: 9, style: "bold", align: "right" });
    yPosition += 6;
  });

  // Right column - Payment breakdown
  yPosition -= 24; // Reset to top of left column
  const rightColX = margin + colWidth + margin;
  
  addText("Desglose de Pagos", rightColX, yPosition, { fontSize: 12, style: "bold" });
  yPosition += 8;
  addLine(rightColX, yPosition, rightColX + colWidth, yPosition);
  yPosition += 6;

  const paymentData = [
    ["Pago base", formatMXN(summary.pmt_base)],
    ["GPS mensual", formatMXN(gpsMonthly)],
    ...(insuranceMonthly > 0 ? [["Seguro mensual", formatMXN(insuranceMonthly)]] : []),
    ["Seguro de vida", formatMXN(177.21)],
    ["Total mensual", formatMXN(summary.pmt_total_month2)]
  ];

  paymentData.forEach(([label, value], index) => {
    if (index % 2 === 1) {
      pdf.setFillColor(249, 250, 251);
      pdf.rect(rightColX, yPosition - 2, colWidth, 6, 'F');
    }
    const isTotal = label === "Total mensual";
    addText(label, rightColX + 2, yPosition + 2, { fontSize: 9, style: isTotal ? "bold" : "normal" });
    addText(value, rightColX + colWidth - 2, yPosition + 2, { fontSize: 9, style: "bold", align: "right" });
    if (isTotal) {
      addLine(rightColX, yPosition - 1, rightColX + colWidth, yPosition - 1);
    }
    yPosition += 6;
  });

  yPosition += 10;

  // Credit Details
  addText("Detalles del Crédito", margin, yPosition, { fontSize: 12, style: "bold" });
  yPosition += 8;
  addLine(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6;

  const detailsData = [
    ["Comisión por apertura", formatMXN(summary.opening_fee + summary.opening_fee_iva), "Primer pago", summary.first_payment_date],
    ["Instalación GPS", formatMXN(summary.gps + summary.gps_iva), "Último pago", summary.last_payment_date],
    ["Desembolso inicial total", formatMXN(summary.initial_outlay), "Ingreso mínimo requerido", formatMXN(minimumIncome)]
  ];

  detailsData.forEach(([label1, value1, label2, value2], index) => {
    if (index % 2 === 1) {
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, yPosition - 2, pageWidth - 2 * margin, 6, 'F');
    }
    addText(label1, margin + 2, yPosition + 2, { fontSize: 9 });
    addText(value1, margin + colWidth - 2, yPosition + 2, { fontSize: 9, style: "bold", align: "right" });
    addText(label2, rightColX + 2, yPosition + 2, { fontSize: 9 });
    addText(value2, rightColX + colWidth - 2, yPosition + 2, { fontSize: 9, style: "bold", align: "right" });
    yPosition += 6;
  });

  yPosition += 10;

  // Amortization Table Header
  addText("Tabla de Amortización (Primeros 12 meses)", margin, yPosition, { fontSize: 12, style: "bold" });
  yPosition += 8;
  addLine(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6;

  // Check if we need a new page for the table
  if (yPosition > 200) {
    pdf.addPage();
    yPosition = margin;
  }

  // Table header with proper column widths for A4
  const tableWidth = pageWidth - 2 * margin;
  const colWidths = [12, 20, 28, 25, 25, 18, 28, 24]; // Total ~180mm
  const headers = ["Per.", "Fecha", "Saldo Ini.", "Interés", "Capital", "GPS", "Pago Total", "Saldo Fin."];
  
  pdf.setFillColor(46, 184, 114);
  pdf.rect(margin, yPosition, tableWidth, 8, 'F');
  
  let xPos = margin + 1;
  headers.forEach((header, index) => {
    addText(header, xPos + colWidths[index] / 2, yPosition + 5, { 
      fontSize: 7, 
      style: "bold", 
      color: [255, 255, 255], 
      align: "center" 
    });
    xPos += colWidths[index];
  });
  yPosition += 8;

  // Table rows with better formatting
  schedule.slice(0, 12).forEach((row, index) => {
    if (index % 2 === 1) {
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, yPosition, tableWidth, 6, 'F');
    }
    
    const rowData = [
      row.k.toString(),
      row.date.split('-').reverse().join('/'), // Format: DD/MM/YYYY
      `$${(row.saldo_ini / 1000).toFixed(0)}K`, // Shortened format
      `$${((row.interes + row.iva_interes) / 1000).toFixed(1)}K`,
      `$${(row.capital / 1000).toFixed(1)}K`,
      `$${((row.gps_rent + row.gps_rent_iva)).toFixed(0)}`,
      `$${(row.pago_total / 1000).toFixed(1)}K`,
      `$${(row.saldo_fin / 1000).toFixed(0)}K`
    ];
    
    xPos = margin + 1;
    rowData.forEach((data, colIndex) => {
      const align = colIndex === 0 || colIndex === 1 ? "left" : "right";
      const textX = align === "left" ? xPos + 1 : xPos + colWidths[colIndex] - 1;
      addText(data, textX, yPosition + 4, { fontSize: 6, align });
      xPos += colWidths[colIndex];
    });
    yPosition += 6;
  });

  yPosition += 10;

  // Footer
  addLine(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;
  
  addText("Esta cotización es válida por 15 días calendario. Las tasas y condiciones están sujetas a aprobación crediticia.", margin, yPosition, { fontSize: 8, color: [100, 100, 100] });
  yPosition += 5;
  addText("Los seguros son opcionales pero recomendados. El GPS es obligatorio para monitoreo del vehículo.", margin, yPosition, { fontSize: 8, color: [100, 100, 100] });
  yPosition += 8;
  addText("Financiera Incentiva • Tel: (55) 1234-5678 • ventas@financieraincentiva.com", pageWidth / 2, yPosition, { fontSize: 9, style: "bold", align: "center" });

  // Save PDF
  pdf.save(`cotizacion-${rateTier}-${termMonths}m.pdf`);
};
