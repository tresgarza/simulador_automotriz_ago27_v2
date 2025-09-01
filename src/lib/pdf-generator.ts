import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface PDFAuthorizationData {
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
  
  // Información del asesor
  reviewer_name?: string;
  agency_name?: string;
  
  // Datos del formulario (authorization_data)
  authorization_data?: {
    company?: string;
    applicant_name?: string;
    position?: string;
    age?: number;
    marital_status?: string;
    seniority?: number;
    monthly_salary?: number;
    monthly_capacity?: number;
    interest_rate?: number;
    opening_fee?: number;
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
  };
}

export const generateAuthorizationPDF = (data: PDFAuthorizationData): void => {
  const doc = new jsPDF();
  
  // Configuración del documento
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let yPosition = margin;
  
  // Función helper para agregar texto
  const addText = (text: string, x: number, y: number, options?: any) => {
    if (options?.fontSize) doc.setFontSize(options.fontSize);
    if (options?.font) doc.setFont(options.font);
    doc.text(text, x, y);
    return y + (options?.lineHeight || 7);
  };
  
  // Header con logo (simulado)
  doc.setFillColor(46, 184, 114); // Verde Fincentiva
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FINCENTIVA', margin, 20);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Reporte de Autorización de Crédito Automotriz', margin, 27);
  
  // Reset color y posición
  doc.setTextColor(0, 0, 0);
  yPosition = 45;
  
  // Título del documento
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  yPosition = addText('SOLICITUD DE AUTORIZACIÓN DE CRÉDITO', margin, yPosition, { lineHeight: 10 });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPosition = addText(`ID de Solicitud: ${data.id}`, margin, yPosition, { lineHeight: 8 });
  yPosition = addText(`Fecha de Creación: ${new Date(data.created_at).toLocaleDateString('es-MX')}`, margin, yPosition, { lineHeight: 10 });
  
  // Información del Cliente
  yPosition += 5;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  yPosition = addText('INFORMACIÓN DEL CLIENTE', margin, yPosition, { lineHeight: 10 });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const clientInfo = [
    ['Nombre:', data.client_name || 'No especificado'],
    ['Email:', data.client_email || 'No especificado'],
    ['Teléfono:', data.client_phone || 'No especificado'],
    ['Estado:', data.status.toUpperCase()]
  ];
  
  clientInfo.forEach(([label, value]) => {
    yPosition = addText(`${label} ${value}`, margin, yPosition, { lineHeight: 6 });
  });
  
  // Información del Vehículo
  yPosition += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  yPosition = addText('INFORMACIÓN DEL VEHÍCULO', margin, yPosition, { lineHeight: 10 });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const vehicleInfo = [
    ['Marca:', data.vehicle_brand || 'No especificado'],
    ['Modelo:', data.vehicle_model || 'No especificado'],
    ['Año:', data.vehicle_year?.toString() || 'No especificado'],
    ['Valor del Vehículo:', data.vehicle_value ? `$${data.vehicle_value.toLocaleString('es-MX')}` : 'No especificado']
  ];
  
  vehicleInfo.forEach(([label, value]) => {
    yPosition = addText(`${label} ${value}`, margin, yPosition, { lineHeight: 6 });
  });
  
  // Información Financiera
  yPosition += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  yPosition = addText('INFORMACIÓN FINANCIERA', margin, yPosition, { lineHeight: 10 });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const financialInfo = [
    ['Monto Solicitado:', data.requested_amount ? `$${data.requested_amount.toLocaleString('es-MX')}` : 'No especificado'],
    ['Pago Mensual:', data.monthly_payment ? `$${data.monthly_payment.toLocaleString('es-MX')}` : 'No especificado'],
    ['Plazo:', data.term_months ? `${data.term_months} meses` : 'No especificado'],
    ['Asesor Asignado:', data.reviewer_name || 'Sin asignar'],
    ['Agencia:', data.agency_name || 'No especificada']
  ];
  
  financialInfo.forEach(([label, value]) => {
    yPosition = addText(`${label} ${value}`, margin, yPosition, { lineHeight: 6 });
  });
  
  // Datos del Formulario de Autorización (si existen)
  if (data.authorization_data) {
    yPosition += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('DATOS DEL FORMULARIO DE AUTORIZACIÓN', margin, yPosition, { lineHeight: 10 });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const formData = data.authorization_data;
    
    // Información del solicitante
    if (formData.company || formData.applicant_name) {
      yPosition += 5;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      yPosition = addText('Datos del Solicitante:', margin, yPosition, { lineHeight: 8 });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const applicantInfo = [
        ['Empresa:', formData.company || 'No especificado'],
        ['Nombre:', formData.applicant_name || 'No especificado'],
        ['Puesto:', formData.position || 'No especificado'],
        ['Edad:', formData.age?.toString() || 'No especificado'],
        ['Estado Civil:', formData.marital_status || 'No especificado'],
        ['Antigüedad:', formData.seniority ? `${formData.seniority} años` : 'No especificado'],
        ['Sueldo Mensual:', formData.monthly_salary ? `$${formData.monthly_salary.toLocaleString('es-MX')}` : 'No especificado']
      ];
      
      applicantInfo.forEach(([label, value]) => {
        yPosition = addText(`  ${label} ${value}`, margin, yPosition, { lineHeight: 5 });
      });
    }
    
    // Análisis Financiero
    if (formData.total_income || formData.total_expenses) {
      yPosition += 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      yPosition = addText('Análisis Financiero:', margin, yPosition, { lineHeight: 8 });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const financialAnalysis = [
        ['Ingresos Totales (3 meses):', formData.total_income ? `$${formData.total_income.toLocaleString('es-MX')}` : 'No especificado'],
        ['Ingresos Promedio:', formData.average_income ? `$${formData.average_income.toLocaleString('es-MX')}` : 'No especificado'],
        ['Gastos Totales (3 meses):', formData.total_expenses ? `$${formData.total_expenses.toLocaleString('es-MX')}` : 'No especificado'],
        ['Gastos Promedio:', formData.average_expenses ? `$${formData.average_expenses.toLocaleString('es-MX')}` : 'No especificado'],
        ['Ingresos Disponibles:', formData.available_income ? `$${formData.available_income.toLocaleString('es-MX')}` : 'No especificado'],
        ['Capacidad de Pago:', formData.payment_capacity ? `$${formData.payment_capacity.toLocaleString('es-MX')}` : 'No especificado'],
        ['Ratio de Viabilidad:', formData.viability_ratio ? `${(formData.viability_ratio * 100).toFixed(1)}%` : 'No calculado']
      ];
      
      financialAnalysis.forEach(([label, value]) => {
        yPosition = addText(`  ${label} ${value}`, margin, yPosition, { lineHeight: 5 });
      });
    }
    
    // Competidores (si existen)
    if (formData.competitors && formData.competitors.length > 0) {
      yPosition += 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      yPosition = addText('Precios de Competidores:', margin, yPosition, { lineHeight: 8 });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      formData.competitors.forEach((competitor, index) => {
        if (competitor.name && competitor.price) {
          yPosition = addText(`  ${index + 1}. ${competitor.name}: $${competitor.price.toLocaleString('es-MX')}`, margin, yPosition, { lineHeight: 5 });
        }
      });
    }
    
    // Comentarios
    if (formData.comments) {
      yPosition += 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      yPosition = addText('Comentarios:', margin, yPosition, { lineHeight: 8 });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Dividir comentarios en líneas para que no se salgan de la página
      const maxCharsPerLine = 80;
      const commentLines = formData.comments.match(new RegExp(`.{1,${maxCharsPerLine}}`, 'g')) || [formData.comments];
      
      commentLines.forEach(line => {
        yPosition = addText(`  ${line}`, margin, yPosition, { lineHeight: 5 });
      });
    }
  }
  
  // Footer
  yPosition = pageHeight - 30;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128, 128, 128);
  doc.text('Documento generado por Sistema de Autorizaciones Fincentiva', margin, yPosition);
  doc.text(`Generado el: ${new Date().toLocaleString('es-MX')}`, margin, yPosition + 5);
  
  // Generar y descargar el PDF
  const fileName = `autorizacion_${data.client_name?.replace(/\s+/g, '_') || 'cliente'}_${data.id.substring(0, 8)}.pdf`;
  doc.save(fileName);
};

export const formatMXNForPDF = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};
