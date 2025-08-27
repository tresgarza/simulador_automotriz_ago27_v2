"use client";
import jsPDF from "jspdf";
import { formatMXN } from "@/lib/utils";

import { calculateAmortization, AmortizationInputs, AmortizationResult } from '@/lib/amortization-calculator';

// Interfaces simplificadas - la lógica completa está en amortization-calculator.ts
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
  commissionMode: string;
  termMonths: number;
  rateTier: string;
  includeAmortizationTable?: boolean; // Solo asesores ven la tabla
  // Nuevos campos opcionales del cliente y vehículo
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  promoterCode?: string;
  vendorName?: string;
  dealerAgency?: string;
  procedencia?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  vehicleType?: string;
  vehicleUsage?: string;
  vehicleOrigin?: string;
  serialNumber?: string;
}

export const generateProfessionalPDF = async (data: PDFData) => {
      const {
    summary,
    vehicleValue,
    downPayment,
    insuranceAmount,
    insuranceMode,
    commissionMode,
    termMonths,
    rateTier,
    includeAmortizationTable = true, // Por defecto true para compatibilidad
    clientName = "—",
    clientPhone = "—",
    clientEmail = "—",
    vendorName = "—",
    dealerAgency = "—",
    vehicleBrand = "—",
    vehicleModel = "—",
    vehicleYear = "—"
  } = data;

  // Mapear rateTier a tasas numéricas
  const rateMap: Record<string, { annual: number; annualWithIVA: number }> = {
    A: { annual: 0.36, annualWithIVA: 0.4176 }, // 36% sin IVA, 41.76% con IVA
    B: { annual: 0.40, annualWithIVA: 0.4640 }, // 40% sin IVA, 46.40% con IVA
    C: { annual: 0.45, annualWithIVA: 0.5220 }  // 45% sin IVA, 52.20% con IVA
  };

  const selectedRate = rateMap[rateTier as keyof typeof rateMap] || rateMap.C;

  // Calcular amortización usando la nueva lógica
  const amortizationInputs: AmortizationInputs = {
    vehiclePrice: vehicleValue,
    downPayment: downPayment,
    insuranceAmount: insuranceAmount,
    insuranceMode: insuranceMode as 'financed' | 'cash',
    commissionMode: commissionMode as 'financed' | 'cash',
    termMonths: termMonths,
    annualRate: selectedRate.annual,
    annualRateWithIVA: selectedRate.annualWithIVA,
    ivaRate: 0.16,
    gpsMonthly: summary.gps,
    lifeInsuranceMonthly: 300, // Valor fijo del Excel
    openingFeePercentage: 0.03
  };

  const amortizationResult: AmortizationResult = calculateAmortization(amortizationInputs);

  // Usar los resultados calculados
  const calculatedSummary = amortizationResult.summary;
  const calculatedSchedule = amortizationResult.schedule;

  const today = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const minimumIncome = Math.round(calculatedSummary.pmt_total_month2 / 0.265);

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Colors
  const greenPrimary = [46, 184, 114];
  const greenLight = [240, 253, 244];
  const bluePrimary = [37, 99, 235];
  const grayText = [75, 85, 99];
  const grayLight = [249, 250, 251];

  // Helper function to add text with better formatting
  const addText = (text: string, x: number, y: number, options: {
    fontSize?: number;
    style?: "normal" | "bold";
    color?: number[];
    align?: "left" | "center" | "right";
    maxWidth?: number;
  } = {}) => {
    pdf.setFontSize(options.fontSize || 10);
    pdf.setFont("helvetica", options.style || "normal");
    
    if (options.color) {
      pdf.setTextColor(options.color[0], options.color[1], options.color[2]);
    } else {
      pdf.setTextColor(0, 0, 0);
    }
    
    const align = options.align || 'left';
    let textX = x;
    
    if (align === 'center') {
      const textWidth = pdf.getTextWidth(text);
      textX = x - textWidth / 2;
    } else if (align === 'right') {
      const textWidth = pdf.getTextWidth(text);
      textX = x - textWidth;
    }
    
    if (options.maxWidth) {
      const lines = pdf.splitTextToSize(text, options.maxWidth);
      pdf.text(lines, textX, y);
      return lines.length * (options.fontSize || 10) * 0.3;
    } else {
      pdf.text(text, textX, y);
      return (options.fontSize || 10) * 0.3;
    }
  };

  // Helper function to add rectangle
  const addRect = (x: number, y: number, width: number, height: number, fillColor?: number[], strokeColor?: number[]) => {
    if (fillColor) {
      pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    }
    if (strokeColor) {
      pdf.setDrawColor(strokeColor[0], strokeColor[1], strokeColor[2]);
    }
    
    if (fillColor && strokeColor) {
      pdf.rect(x, y, width, height, 'FD');
    } else if (fillColor) {
      pdf.rect(x, y, width, height, 'F');
    } else if (strokeColor) {
      pdf.rect(x, y, width, height, 'S');
    }
  };

  // Header with logo and company info - más compacto
  addRect(0, 0, pageWidth, 20, greenLight);
  
  // Agregar logo en el header (esquina superior izquierda)
  try {
    const headerLogoImg = new Image();
    headerLogoImg.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      headerLogoImg.onload = () => {
        // Calcular proporciones correctas del logo
        const originalWidth = headerLogoImg.width;
        const originalHeight = headerLogoImg.height;
        const aspectRatio = originalWidth / originalHeight;
        
        // Tamaño del logo en el header
        const logoHeight = 12; // Altura fija para el header
        const logoWidth = logoHeight * aspectRatio; // Mantener proporción
        
        // Crear canvas para convertir a base64
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = originalWidth;
        canvas.height = originalHeight;
        ctx?.drawImage(headerLogoImg, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        
        pdf.addImage(dataURL, 'PNG', margin, 4, logoWidth, logoHeight); // Posición fija dentro del header verde
        resolve(true);
      };
      headerLogoImg.onerror = () => reject(new Error('Header logo not found'));
      headerLogoImg.src = '/logo_fincentiva_original.png';
    });
  } catch (error) {
    // Fallback si no se puede cargar el logo
    addText("FINANCIERA INCENTIVA", margin, 10, { 
      fontSize: 14, 
      style: "bold", 
      color: greenPrimary 
    });
  }
  // Nombre del cliente debajo del header verde, en la parte blanca
  addText(clientName, margin, 25, { 
    fontSize: 9, 
    color: grayText 
  });
  
  // Date on the right - también dentro del header verde
  addText("Fecha de cotización:", pageWidth - margin, 8, { 
    fontSize: 8, 
    color: grayText, 
    align: "right" 
  });
  addText(today, pageWidth - margin, 16, { 
    fontSize: 9, 
    style: "bold", 
    align: "right" 
  });
  
  yPosition += 25;

  // Main title - más arriba
  addText("COTIZACIÓN DE CRÉDITO AUTOMOTRIZ", pageWidth / 2, yPosition, { 
    fontSize: 14, 
    style: "bold", 
    align: "center" 
  });
  yPosition += 15;

  // Layout con dos columnas: DATOS DEL VEHÍCULO (izquierda) y PAGO MENSUAL (derecha)
  const leftColWidth = (pageWidth - 3 * margin) * 0.6; // 60% para datos del vehículo
  const rightColWidth = (pageWidth - 3 * margin) * 0.4; // 40% para pago mensual
  const rightColX = margin + leftColWidth + margin;
  const vehicleSectionY = yPosition;
  
  // Left column - Vehicle Information
  addText("DATOS DEL VEHÍCULO", margin, yPosition, { fontSize: 11, style: "bold" });
  yPosition += 3;
  
  pdf.setDrawColor(greenPrimary[0], greenPrimary[1], greenPrimary[2]);
  pdf.line(margin, yPosition, margin + leftColWidth, yPosition);
  yPosition += 6;
  
  // Formatear vendedor según el tipo de usuario
  let formattedVendor = "—";
  if (dealerAgency && dealerAgency !== "—") {
    if (vendorName && vendorName !== "—") {
      formattedVendor = `${dealerAgency} (${vendorName})`;
    } else {
      formattedVendor = dealerAgency;
    }
  } else if (vendorName && vendorName !== "—") {
    formattedVendor = vendorName;
  }

  const vehicleInfo = [
    ["Año", vehicleYear],
    ["Marca", vehicleBrand],
    ["Modelo", vehicleModel],
    ["Vendedor", formattedVendor]
  ];

  vehicleInfo.forEach(([label, value], index) => {
    if (index % 2 === 1) {
      addRect(margin, yPosition - 2, leftColWidth, 8, grayLight);
    }
    addText(label, margin + 2, yPosition + 3, { fontSize: 8, color: grayText });
    addText(value, margin + leftColWidth - 2, yPosition + 3, { fontSize: 8, style: "bold", align: "right" });
    yPosition += 8;
  });

  // Right column - Payment box
  const paymentBoxY = vehicleSectionY + 5; // Alineado con el inicio de la sección de vehículo
  const boxHeight = 35;
  
  addRect(rightColX, paymentBoxY, rightColWidth, boxHeight, greenLight, greenPrimary);
  
  addText("PAGO MENSUAL", rightColX + rightColWidth / 2, paymentBoxY + 8, { 
    fontSize: 10, 
    style: "bold", 
    color: greenPrimary, 
    align: "center" 
  });
  
  // Total mensual estimado usando datos calculados
  const totalMonthlyHeader = calculatedSummary.pmt_total_month2;

  addText(formatMXN(totalMonthlyHeader), rightColX + rightColWidth / 2, paymentBoxY + 20, { 
    fontSize: 14, 
    style: "bold", 
    color: greenPrimary, 
    align: "center" 
  });
  addText("Incluye financiamiento auto,", rightColX + rightColWidth / 2, paymentBoxY + 28, { 
    fontSize: 6, 
    color: grayText, 
    align: "center" 
  });
  addText("GPS y seguros", rightColX + rightColWidth / 2, paymentBoxY + 32, { 
    fontSize: 6, 
    color: grayText, 
    align: "center" 
  });
  
  // Ajustar yPosition para continuar después de ambas secciones
  yPosition = Math.max(yPosition, paymentBoxY + boxHeight) + 10;

  // Define column widths for credit characteristics section - más balanceado
  const creditColWidth = (pageWidth - 3 * margin) * 0.55; // 55% para montos a financiar
  const creditRightColWidth = (pageWidth - 3 * margin) * 0.45; // 45% para desembolso inicial
  const creditRightColX = margin + creditColWidth + margin;

  // Check if we need new page before credit characteristics
  if (yPosition > pageHeight - 100) {
    pdf.addPage();
    yPosition = margin;
  }

  // Financing breakdown section (similar to Datamovil)
  addText("PRINCIPALES CARACTERÍSTICAS DEL CRÉDITO", margin, yPosition, { fontSize: 11, style: "bold" });
  yPosition += 3;
  pdf.setDrawColor(bluePrimary[0], bluePrimary[1], bluePrimary[2]);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6;

  // Two column layout for credit characteristics

  // Títulos de ambas columnas a la misma altura
  addText("MONTOS A FINANCIAR:", margin, yPosition, { fontSize: 10, style: "bold", color: bluePrimary });
  addText("DESEMBOLSO INICIAL:", creditRightColX, yPosition, { fontSize: 10, style: "bold", color: bluePrimary });
  yPosition += 6;
  
  // Left column data starts here
  let leftColumnY = yPosition;

  // Cálculo lógico de montos a financiar según el modo de comisión
  const valorVehiculo = vehicleValue; // 300,000
  const enganche = downPayment; // 100,000
  const saldoVehiculo = valorVehiculo - enganche; // 200,000
  const comisionSinIVA = calculatedSummary.openingFee; // 6,185.57
  const seguroFinanciado = insuranceMode === 'financed' ? insuranceAmount : 0; // 25,000
  
  // Lógica según el modo de comisión
  let financingDetails: [string, string][];
  if (commissionMode === 'financed') {
    // Si la comisión se financia, se incluye en el monto del crédito
    const montoDelCredito = saldoVehiculo + comisionSinIVA; // 200,000 + 6,185.57 = 206,185.57
    const totalMontoAFinanciar = montoDelCredito + seguroFinanciado; // 206,185.57 + 25,000 = 231,185.57
    
    financingDetails = [
      ["(+) Valor del vehículo", formatMXN(valorVehiculo)],
      ["(-) Enganche", formatMXN(-enganche)],
      ["(=) Saldo del vehículo", formatMXN(saldoVehiculo)],
      ["(+) Gastos de administración (comisión) 3%", formatMXN(comisionSinIVA)], // Se financia
      ["(=) Monto del crédito", formatMXN(montoDelCredito)],
      ["Accesorios:", ""],
      ["(+) Seguro automotriz (1 año)", formatMXN(seguroFinanciado)],
      ["(+) Refrendo", formatMXN(0)],
      ["(+) Gastos de investigación", formatMXN(0)],
      ["(+) Gastos de notariales", formatMXN(0)],
      ["(+) Instalación de GPS", formatMXN(0)],
      ["(=) Total monto a financiar", formatMXN(totalMontoAFinanciar)]
    ];
  } else {
    // Si la comisión se paga de contado, NO se incluye en el financiamiento
    const montoDelCredito = saldoVehiculo; // Solo el saldo del vehículo: 200,000
    const totalMontoAFinanciar = montoDelCredito + seguroFinanciado; // 200,000 + 25,000 = 225,000
    
    financingDetails = [
      ["(+) Valor del vehículo", formatMXN(valorVehiculo)],
      ["(-) Enganche", formatMXN(-enganche)],
      ["(=) Saldo del vehículo", formatMXN(saldoVehiculo)],
      ["Accesorios:", ""],
      ["(+) Seguro automotriz (1 año)", formatMXN(seguroFinanciado)],
      ["(+) Refrendo", formatMXN(0)],
      ["(+) Gastos de investigación", formatMXN(0)],
      ["(+) Gastos de notariales", formatMXN(0)],
      ["(+) Instalación de GPS", formatMXN(0)],
      ["(=) Total monto a financiar", formatMXN(totalMontoAFinanciar)]
    ];
  }

  financingDetails.forEach(([label, value], index) => {
    if (label === "Accesorios:") {
      addText(label, margin + 2, leftColumnY + 3, { fontSize: 8, style: "bold", color: bluePrimary });
    } else if (label === "(=) Total monto a financiar") {
      addRect(margin, leftColumnY - 2, creditColWidth, 8, greenLight);
      addText(label, margin + 2, leftColumnY + 3, { fontSize: 8, style: "bold", color: greenPrimary });
      addText(value, margin + creditColWidth - 2, leftColumnY + 3, { fontSize: 8, style: "bold", align: "right", color: greenPrimary });
    } else if (label === "(=) Saldo del vehículo") {
      // Línea especial para el saldo del vehículo
      addRect(margin, leftColumnY - 2, creditColWidth, 8, [240, 248, 255]); // Azul claro
      addText(label, margin + 2, leftColumnY + 3, { fontSize: 8, style: "bold", color: bluePrimary });
      addText(value, margin + creditColWidth - 2, leftColumnY + 3, { fontSize: 8, style: "bold", align: "right", color: bluePrimary });
    } else if (label === "(=) Monto del crédito") {
      // Línea especial para el monto del crédito
      addRect(margin, leftColumnY - 2, creditColWidth, 8, [255, 248, 220]); // Amarillo claro
      addText(label, margin + 2, leftColumnY + 3, { fontSize: 8, style: "bold", color: [184, 134, 11] });
      addText(value, margin + creditColWidth - 2, leftColumnY + 3, { fontSize: 8, style: "bold", align: "right", color: [184, 134, 11] });
    } else {
      if (index % 2 === 1) {
        addRect(margin, leftColumnY - 2, creditColWidth, 8, grayLight);
      }
      addText(label, margin + 2, leftColumnY + 3, { fontSize: 7, color: grayText });
      addText(value, margin + creditColWidth - 2, leftColumnY + 3, { fontSize: 7, style: value ? "bold" : "normal", align: "right" });
    }
    leftColumnY += 8;
  });

  // Right column data starts here
  let desembolsoYPos = yPosition; // Misma altura que leftColumnY

  // DESEMBOLSO INICIAL: Según el modo de comisión
  const comisionEnDesembolso = commissionMode === 'cash' ? calculatedSummary.openingFee + calculatedSummary.openingFeeIVA : 0;
  
  const disbursementDetails = [
    ["(+) Abono a precio de venta (enganche)", formatMXN(downPayment)], // Enganche que paga el cliente
    ["Accesorios:", ""],
    ["(+) Seguro automotriz (1 año)", formatMXN(insuranceMode === 'cash' ? insuranceAmount : 0)], // Solo si se paga en efectivo
    ["(+) Refrendo", formatMXN(0)],
    ["(+) Gastos de investigación", formatMXN(0)], // No incluidos en la API
    ["(+) Gastos de notariales", formatMXN(0)], // No incluidos en la API
    ["(+) Instalación de GPS", formatMXN(0)], // GPS se paga mensualmente, no al inicio
    ["(+) Gastos de administración (comisión) 3%", formatMXN(comisionEnDesembolso)], // Solo si se paga de contado
    ["(=) Total desembolso inicial", formatMXN(calculatedSummary.initialOutlay)]
  ];

  disbursementDetails.forEach(([label, value], index) => {
    if (label === "Accesorios:") {
      addText(label, creditRightColX + 2, desembolsoYPos + 3, { fontSize: 8, style: "bold", color: bluePrimary });
    } else if (label === "(=) Total desembolso inicial") {
      addRect(creditRightColX, desembolsoYPos - 2, creditRightColWidth, 8, greenLight);
      addText(label, creditRightColX + 2, desembolsoYPos + 3, { fontSize: 8, style: "bold", color: greenPrimary });
      addText(value, creditRightColX + creditRightColWidth - 2, desembolsoYPos + 3, { fontSize: 8, style: "bold", align: "right", color: greenPrimary });
    } else {
      if (index % 2 === 1) {
        addRect(creditRightColX, desembolsoYPos - 2, creditRightColWidth, 8, grayLight);
      }
      addText(label, creditRightColX + 2, desembolsoYPos + 3, { fontSize: 7, color: grayText });
      addText(value, creditRightColX + creditRightColWidth - 2, desembolsoYPos + 3, { fontSize: 7, style: value ? "bold" : "normal", align: "right" });
    }
    desembolsoYPos += 8;
  });

  // Ajustar yPosition para continuar después de ambas columnas
  yPosition = Math.max(leftColumnY, desembolsoYPos) + 8;

  // SECCIONES EN 2 COLUMNAS: OPCIÓN DE PAGO (izquierda) y DESGLOSE MENSUAL ESTIMADO (derecha)
  const startYPosition = yPosition;
  const columnWidth = (pageWidth - 3 * margin) / 2; // Ancho de cada columna con separación
  const leftColX = margin;
  const rightColXNew = margin + columnWidth + margin; // Columna derecha con separación

  // COLUMNA IZQUIERDA: OPCIÓN DE PAGO
  let leftYPos = startYPosition;
  addText("OPCIÓN DE PAGO:", leftColX, leftYPos, { fontSize: 11, style: "bold" });
  leftYPos += 3;
  pdf.line(leftColX, leftYPos, leftColX + columnWidth, leftYPos);
  leftYPos += 6;

  // Calcular correctamente los componentes del pago
  const seguroVida = 300; // Valor corregido
  const gpsTotal = 400; // GPS sin IVA como solicitado
  
  // Calcular correctamente: Pago base = PMT completo (con IVA), Adicionales = solo seguros + GPS
  const pmtCompleto = calculatedSchedule[0]?.pmt || 0; // PMT completo con IVA
  const seguroAuto = insuranceMode === 'financed' ? Number(((insuranceAmount * 1.3047) / 12).toFixed(2)) : 0;
  const pagosAdicionalesCorrectos = seguroAuto + seguroVida + gpsTotal;
  
  const paymentDetails = [
    ["Plazo mensual", termMonths],
    ["(+) Pago mensual base", formatMXN(pmtCompleto)], // PMT completo (Crédito Auto)
    ["(+) Pagos adicionales", formatMXN(pagosAdicionalesCorrectos)], // Solo seguros + GPS
    ["(=) Total pago mensual *", formatMXN(calculatedSummary.pmt_total_month2)]
  ];

  paymentDetails.forEach(([label, value], index) => {
    if (index === paymentDetails.length - 1) {
      addRect(leftColX, leftYPos - 2, columnWidth, 8, greenLight);
      pdf.setDrawColor(greenPrimary[0], greenPrimary[1], greenPrimary[2]);
      pdf.line(leftColX, leftYPos - 1, leftColX + columnWidth, leftYPos - 1);
    } else if (index % 2 === 1) {
      addRect(leftColX, leftYPos - 2, columnWidth, 8, grayLight);
    }
    
    addText(String(label), leftColX + 2, leftYPos + 3, { 
      fontSize: 8, 
      style: index === paymentDetails.length - 1 ? "bold" : "normal",
      color: index === paymentDetails.length - 1 ? greenPrimary : grayText 
    });
    addText(String(value), leftColX + columnWidth - 2, leftYPos + 3, { 
      fontSize: 8, 
      style: "bold", 
      align: "right",
      color: index === paymentDetails.length - 1 ? greenPrimary : undefined
    });
    leftYPos += 8;
  });

  // Income requirement en columna izquierda
  leftYPos += 3;
  addText(`Ingresos a comprobar mensual: ${formatMXN(minimumIncome)}`, leftColX, leftYPos, { 
    fontSize: 9, 
    style: "bold",
    maxWidth: columnWidth
  });
  leftYPos += 6;
  addText("*INCLUYE I.V.A", leftColX + columnWidth - 2, leftYPos, { 
    fontSize: 8, 
    color: grayText, 
    align: "right" 
  });

  // COLUMNA DERECHA: DESGLOSE MENSUAL ESTIMADO
  let rightYPos = startYPosition;
  addText("DESGLOSE MENSUAL ESTIMADO", rightColXNew, rightYPos, { fontSize: 11, style: "bold" });
  rightYPos += 3;
  pdf.setDrawColor(greenPrimary[0], greenPrimary[1], greenPrimary[2]);
  pdf.line(rightColXNew, rightYPos, rightColXNew + columnWidth, rightYPos);
  rightYPos += 6;

  // Calcular componentes del desglose mensual usando datos calculados
  // El financiamiento auto debe ser el PMT completo (capital + interés + IVA), no solo pmt_base
  const financiamientoAuto = Number((calculatedSchedule[0]?.pmt || calculatedSummary?.pmt_base || 0).toFixed(2));
  const seguroDanos = insuranceMode === 'financed' ? Number(((insuranceAmount * 1.3047) / 12).toFixed(2)) : 0;
  const gpsConIva = gpsTotal; // $400 (GPS sin IVA como solicitado)
  const pagoMensualTotal = calculatedSummary.pmt_total_month2;

  const monthlyBreakdown = [
    ["Financiamiento auto", formatMXN(financiamientoAuto)],
    ...(seguroDanos > 0 ? [["Seguro de daños", formatMXN(seguroDanos)]] : []),
    ["Seguro de vida", formatMXN(seguroVida)],
    ["GPS", formatMXN(gpsConIva)],
    ["", ""], // Separator
    ["PAGO MENSUAL TOTAL", formatMXN(pagoMensualTotal)]
  ];

  monthlyBreakdown.forEach(([label, value], index) => {
    if (label === "" && value === "") {
      rightYPos += 4;
      return;
    }
    
    const isTotal = label === "PAGO MENSUAL TOTAL";
    if (isTotal) {
      addRect(rightColXNew, rightYPos - 2, columnWidth, 8, greenLight);
      pdf.setDrawColor(greenPrimary[0], greenPrimary[1], greenPrimary[2]);
      pdf.line(rightColXNew, rightYPos - 1, rightColXNew + columnWidth, rightYPos - 1);
    } else if (index % 2 === 1) {
      addRect(rightColXNew, rightYPos - 2, columnWidth, 8, grayLight);
    }
    
    addText(label, rightColXNew + 2, rightYPos + 3, { 
      fontSize: 8, 
      style: isTotal ? "bold" : "normal",
      color: isTotal ? greenPrimary : grayText 
    });
    addText(value, rightColXNew + columnWidth - 2, rightYPos + 3, { 
      fontSize: 8, 
      style: "bold", 
      align: "right",
      color: isTotal ? greenPrimary : undefined
    });
    rightYPos += 8;
  });

  // Ajustar yPosition al final de ambas columnas
  yPosition = Math.max(leftYPos, rightYPos) + 8;

  yPosition += 8;

  // Check if we need new page before important notes
  if (yPosition > pageHeight - 60) {
    pdf.addPage();
    yPosition = margin;
  }

  // Important notes section (similar to Datamovil)
  addText("NOTAS IMPORTANTES", margin, yPosition, { fontSize: 11, style: "bold" });
  yPosition += 3;
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6;

  const importantNotes = [
    "La presente información es únicamente para efectos ilustrativos, no representa ningún ofrecimiento formal.",
    "La cotización no incluye gastos de control vehicular.",
    "Los pagos de las mensualidades deberán ser a favor de Financiera Incentiva, S.A.P.I. de C.V., SOFOM, E.N.R."
  ];

  importantNotes.forEach(note => {
    const lineHeight = addText(note, margin, yPosition, { 
      fontSize: 8, 
      color: grayText, 
      maxWidth: pageWidth - 2 * margin 
    });
    yPosition += lineHeight + 4;
  });

  yPosition += 6;

  // Inicializar currentY para uso posterior
  let currentY = yPosition;

  // Tabla de amortización - Solo para asesores
  if (includeAmortizationTable) {
    // Check if we need new page for table
    if (yPosition > pageHeight - 100) {
      pdf.addPage();
      yPosition = margin;
      currentY = yPosition;
    }

    // Amortization table
    addText(`TABLA DE AMORTIZACIÓN COMPLETA (${termMonths} meses)`, margin, yPosition, { fontSize: 11, style: "bold" });
    yPosition += 3;
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;
    currentY = yPosition;

  // Table setup optimized for ALL months (full amounts with two decimals)
  const tableWidth = pageWidth - 2 * margin; // 180mm with margin=15
  // 11 columnas sumando 180mm
  const colWidths = [8, 14, 22, 17, 17, 12, 12, 12, 12, 26, 28];
  const headers = [
    "#",
    "Fecha",
    "Saldo",
    "Capital",
    "Interés",
    "IVA",
    "GPS",
    "Seg. Veh.",
    "Seg. Vida",
    "Pago mensual",
    "Saldo Fin."
  ];

  let pageCount = 1;
  
  // Function to add table header
  const addTableHeader = (y: number) => {
    addRect(margin, y, tableWidth, 8, greenPrimary);
    
    let xPos = margin;
    headers.forEach((header, index) => {
      // Encabezados alineados a la izquierda para coincidir con las celdas
      addText(header, xPos + 1, y + 5, { 
        fontSize: 7, 
        style: "bold", 
        color: [255, 255, 255], 
        align: "left" 
      });
      xPos += colWidths[index];
    });
    return y + 8;
  };

  // Add first table header
  currentY = addTableHeader(currentY);

  // Table rows - usar datos calculados
  calculatedSchedule.forEach((row, idx) => {
    // Check if we need a new page (leave space for footer)
    if (currentY > pageHeight - 50) {
      pdf.addPage();
      currentY = margin;
      pageCount++;
      addText(`TABLA DE AMORTIZACIÓN (Continuación - Página ${pageCount})`, margin, currentY, { fontSize: 11, style: "bold" });
      currentY += 10;
      currentY = addTableHeader(currentY);
    }

    // Alternate row background
    if (idx % 2 === 1) {
      addRect(margin, currentY, tableWidth, 6, grayLight);
    }
    
    const saldo = row.saldo_ini;
    const interes = row.interes;
    const ivaInteres = row.iva_interes;
    const capital = row.capital;
    const gpsRow = Number((row.gps_rent || 0).toFixed(2)); // Solo GPS sin IVA como solicitado
    const saldoFin = row.saldo_fin;
    const insuranceMonthlyCalc = row.insurance_monthly;
    const lifeInsurance = row.life_insurance_monthly;

    // Pago mensual constante (ya calculado correctamente)
    const pagoMensual = row.pago_total;

    const rowData = [
      row.k.toString(),
      new Date(row.date).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '/'),
      formatMXN(saldo),
      formatMXN(capital),
      formatMXN(interes),
      formatMXN(ivaInteres),
      formatMXN(gpsRow),
      formatMXN(insuranceMonthlyCalc),
      formatMXN(lifeInsurance),
      formatMXN(pagoMensual),
      formatMXN(saldoFin)
    ];
    
    let xPos = margin;
    rowData.forEach((data, colIndex) => {
      const textX = xPos + 1; // padding izquierdo mínimo
      addText(data, textX, currentY + 4, { fontSize: 6, align: "left" });
      xPos += colWidths[colIndex];
    });
    currentY += 6;
  });

    // Espacio después de la tabla
    currentY += 15;
    if (currentY > pageHeight - 120) { pdf.addPage(); currentY = margin; }
  } // Fin del condicional includeAmortizationTable

  // Las tres reglas importantes
  addText("Las tres reglas que nunca debe olvidar sobre los pagos:", margin, currentY, { 
    fontSize: 10, 
    style: "bold",
    color: bluePrimary 
  });
  currentY += 10;
  
  const paymentRules = [
    "1. Es una obligación hacerlos completos y en la fecha comprometida.",
    "2. Debe conservar el comprobante de depósito de los lugares aprobados por Financiera Incentiva.",
    "3. Por ningún motivo debe entregar dinero a personal de Financiera Incentiva."
  ];

  paymentRules.forEach(rule => {
    const lineHeight = addText(rule, margin, currentY, {
      fontSize: 8,
      color: grayText,
      maxWidth: pageWidth - 2 * margin
    });
    currentY += lineHeight + 6; // Más espacio entre reglas
  });

  // Footer - siempre al final con espacio adecuado
  currentY += 15; // Más espacio antes del footer
  if (currentY > pageHeight - 80) { pdf.addPage(); currentY = margin; }
  
  pdf.setDrawColor(greenPrimary[0], greenPrimary[1], greenPrimary[2]);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;
  addText("TÉRMINOS Y CONDICIONES", margin, currentY, { fontSize: 9, style: "bold" });
  currentY += 8;
  
  const disclaimers = [
    "• Esta cotización es válida por 15 días calendario.",
    "• Las tasas y condiciones están sujetas a aprobación crediticia.",
    "• El GPS es obligatorio para monitoreo del vehículo.",
    "• Aplican términos y condiciones generales de Financiera Incentiva."
  ];

  disclaimers.forEach(disclaimer => {
    const lineHeight = addText(disclaimer, margin, currentY, { 
      fontSize: 7, 
      color: grayText, 
      maxWidth: pageWidth - 2 * margin 
    });
    currentY += lineHeight + 4; // Más espacio entre disclaimers
  });

  currentY += 10; // Más espacio antes del logo
  
  // Agregar logo de Financiera Incentiva en el footer
  try {
    // Cargar el logo como base64 para jsPDF
    const footerLogoImg = new Image();
    footerLogoImg.crossOrigin = 'anonymous';
    
    // Usar una promesa para manejar la carga de la imagen
    await new Promise((resolve, reject) => {
      footerLogoImg.onload = () => {
        // Calcular proporciones correctas del logo
        const originalWidth = footerLogoImg.width;
        const originalHeight = footerLogoImg.height;
        const aspectRatio = originalWidth / originalHeight;
        
        // Tamaño del logo en el footer (más pequeño que el header)
        const logoHeight = 15; // Altura fija para el footer
        const logoWidth = logoHeight * aspectRatio; // Mantener proporción
        const logoX = (pageWidth - logoWidth) / 2; // Centrar horizontalmente
        
        // Crear canvas para convertir a base64
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = originalWidth;
        canvas.height = originalHeight;
        ctx?.drawImage(footerLogoImg, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        
        pdf.addImage(dataURL, 'PNG', logoX, currentY, logoWidth, logoHeight);
        currentY += logoHeight + 4; // Espacio después del logo
        resolve(true);
      };
      footerLogoImg.onerror = () => reject(new Error('Footer logo not found'));
      footerLogoImg.src = '/logo_fincentiva_original.png';
    });
  } catch (error) {
    // Fallback si no se puede cargar el logo
    addText("FINANCIERA INCENTIVA", pageWidth / 2, currentY, { 
      fontSize: 10, 
      style: "bold", 
      align: "center" 
    });
    currentY += 8;
  }
  
  addText("Tel: (81) 8218-0477 • contabilidad@fincentiva.com.mx", pageWidth / 2, currentY, { 
    fontSize: 8, 
    color: bluePrimary, 
    align: "center" 
  });

  // Generar nombre del archivo: fincentiva_cotizacion_dia_mes_plazo_nombredelcliente
  const currentDate = new Date();
  const day = currentDate.getDate().toString().padStart(2, '0');
  const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 
                     'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const month = monthNames[currentDate.getMonth()];
  
  // Limpiar nombre del cliente para el archivo (remover caracteres especiales)
  const cleanClientName = (clientName || 'cliente')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15); // Limitar longitud
  
  const fileName = `fincentiva_cotizacion_${day}_${month}_${termMonths}meses_${cleanClientName}.pdf`;
  
  // Save PDF
  pdf.save(fileName);
};
