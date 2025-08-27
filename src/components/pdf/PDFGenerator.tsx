"use client";
import { useRef } from "react";
import html2canvas from "html2canvas";
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

// Componente PDF que se renderiza oculto y se convierte a PDF
const PDFDocument = ({ data }: { data: PDFData }) => {
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
    ? Math.round((insuranceAmount * 1.16) / termMonths) // Con IVA distribuido
    : 0;

  return (
    <div className="bg-white text-black p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-green-600">
        <div>
          <h1 className="text-2xl font-bold text-green-600 mb-1">Financiera Incentiva</h1>
          <p className="text-sm text-gray-600">Tu aliado financiero</p>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p>Fecha de cotización:</p>
          <p className="font-semibold">{today}</p>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Cotización de Crédito Automotriz</h2>
        <p className="text-gray-600">
          Nivel {rateTier} • {termMonths} meses • TAN {rateMap[rateTier]}
        </p>
      </div>

      {/* Main Payment Amount */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center mb-6">
        <p className="text-green-700 font-semibold mb-2">Pago Mensual</p>
        <p className="text-3xl font-bold text-green-800">{formatMXN(summary.pmt_total_month2)}</p>
        <p className="text-sm text-green-600 mt-1">Incluye capital, intereses, IVA y GPS</p>
      </div>

      {/* Vehicle and Credit Info */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Información del Vehículo</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1"><span>Valor del vehículo</span><span className="font-semibold">{formatMXN(vehicleValue)}</span></div>
            <div className="flex justify-between py-1 bg-gray-50 px-2"><span>Enganche</span><span className="font-semibold">{formatMXN(downPayment)}</span></div>
            <div className="flex justify-between py-1"><span>Seguro ({insuranceMode === 'cash' ? 'Contado' : 'Financiado'})</span><span className="font-semibold">{formatMXN(insuranceAmount)}</span></div>
            <div className="flex justify-between py-1 bg-gray-50 px-2"><span>Monto a financiar</span><span className="font-semibold">{formatMXN(summary.principal_total)}</span></div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Desglose de Pagos</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1"><span>Pago base</span><span className="font-semibold">{formatMXN(summary.pmt_base)}</span></div>
            <div className="flex justify-between py-1 bg-gray-50 px-2"><span>GPS mensual</span><span className="font-semibold">{formatMXN(gpsMonthly)}</span></div>
            {insuranceMonthly > 0 && (
              <div className="flex justify-between py-1"><span>Seguro mensual</span><span className="font-semibold">{formatMXN(insuranceMonthly)}</span></div>
            )}
            <div className="flex justify-between py-1 bg-gray-50 px-2"><span>Seguro de vida</span><span className="font-semibold">{formatMXN(177.21)}</span></div>
            <div className="flex justify-between py-1 border-t pt-2 font-bold"><span>Total mensual</span><span>{formatMXN(summary.pmt_total_month2)}</span></div>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Detalles del Crédito</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1"><span>Comisión por apertura</span><span className="font-semibold">{formatMXN(summary.opening_fee + summary.opening_fee_iva)}</span></div>
            <div className="flex justify-between py-1 bg-gray-50 px-2"><span>Instalación GPS</span><span className="font-semibold">{formatMXN(summary.gps + summary.gps_iva)}</span></div>
            <div className="flex justify-between py-1 font-bold"><span>Desembolso inicial total</span><span>{formatMXN(summary.initial_outlay)}</span></div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1"><span>Primer pago</span><span className="font-semibold">{summary.first_payment_date}</span></div>
            <div className="flex justify-between py-1 bg-gray-50 px-2"><span>Último pago</span><span className="font-semibold">{summary.last_payment_date}</span></div>
            <div className="flex justify-between py-1"><span>Ingreso mínimo requerido</span><span className="font-semibold">{formatMXN(minimumIncome)}</span></div>
          </div>
        </div>
      </div>

      {/* Amortization Table */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Tabla de Amortización (Primeros 12 meses)</h3>
        
        <div className="overflow-hidden border border-gray-300">
          {/* Table Header */}
          <div className="bg-green-600 text-white text-xs font-semibold">
            <div className="grid grid-cols-8 gap-1 p-2">
              <div className="text-center">Período</div>
              <div className="text-center">Fecha</div>
              <div className="text-center">Saldo Inicial</div>
              <div className="text-center">Interés</div>
              <div className="text-center">Capital</div>
              <div className="text-center">GPS</div>
              <div className="text-center">Pago Total</div>
              <div className="text-center">Saldo Final</div>
            </div>
          </div>
          
          {/* Table Rows */}
          {schedule.slice(0, 12).map((row, index) => (
            <div key={row.k} className={`text-xs ${index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
              <div className="grid grid-cols-8 gap-1 p-2 border-b border-gray-200">
                <div className="text-center">{row.k}</div>
                <div className="text-center">{row.date}</div>
                <div className="text-center">{formatMXN(row.saldo_ini)}</div>
                <div className="text-center">{formatMXN(row.interes + row.iva_interes)}</div>
                <div className="text-center">{formatMXN(row.capital)}</div>
                <div className="text-center">{formatMXN(row.gps_rent + row.gps_rent_iva)}</div>
                <div className="text-center">{formatMXN(row.pago_total)}</div>
                <div className="text-center">{formatMXN(row.saldo_fin)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-600 border-t pt-4">
        <p className="mb-2">
          Esta cotización es válida por 15 días calendario. Las tasas y condiciones están sujetas a aprobación crediticia. 
          El CAT (Costo Anual Total) se calculará en función del perfil crediticio del solicitante.
        </p>
        <p className="mb-2">
          Los seguros son opcionales pero recomendados para proteger tu inversión. El GPS es obligatorio para monitoreo del vehículo.
        </p>
        <p className="text-center font-semibold">
          Financiera Incentiva • Tel: (55) 1234-5678 • ventas@financieraincentiva.com
        </p>
      </div>
    </div>
  );
};

// Hook para generar PDF
export const usePDFGenerator = () => {
  const pdfRef = useRef<HTMLDivElement>(null);

  const generatePDF = async (data: PDFData) => {
    if (!pdfRef.current) return;

    try {
      // Configurar html2canvas para mejor calidad
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`cotizacion-${data.rateTier}-${data.termMonths}m.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
    }
  };

  const PDFPreview = ({ data }: { data: PDFData }) => (
    <div ref={pdfRef} className="fixed -left-[9999px] top-0 z-[-1]">
      <PDFDocument data={data} />
    </div>
  );

  return { generatePDF, PDFPreview };
};


