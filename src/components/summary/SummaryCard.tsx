"use client";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, FileText, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaratulaPDF } from "@/pdf/Caratula";
import { exportScheduleXLSX } from "@/csv/export";
import { formatMXN } from "@/lib/utils";
import { brand } from "@/styles/theme";

type ApiResult = {
  summary: {
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
  };
  schedule: {
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
  }[];
};

type ComparativeResult = {
  A: ApiResult;
  B: ApiResult;
  C: ApiResult;
};

interface SummaryCardProps {
  result: ApiResult | ComparativeResult | null;
  isComparative?: boolean;
}

export function SummaryCard({ result, isComparative = false }: SummaryCardProps) {
  if (!result) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg space-y-4">
        <h2 className="text-xl font-bold" style={{ color: brand.primary }}>
          Resumen
        </h2>
        <p className="text-gray-600">
          Completa el formulario para ver tu pago estimado.
        </p>
      </div>
    );
  }

  if (isComparative && "A" in result) {
    return <ComparativeCards result={result} />;
  }

  const singleResult = result as ApiResult;
  
  const handleExportXLSX = () => {
    const rows = singleResult.schedule.map((row) => ({
      Periodo: row.k,
      Fecha: row.date,
      "Saldo Inicial": row.saldo_ini,
      "Interés": row.interes,
      "IVA Interés": row.iva_interes,
      Capital: row.capital,
      "PMT Base": row.pmt,
      "Renta GPS": row.gps_rent,
      "IVA GPS": row.gps_rent_iva,
      "Pago Total": row.pago_total,
      "Saldo Final": row.saldo_fin,
    }));
    exportScheduleXLSX(rows);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(singleResult, null, 2));
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg space-y-4">
      <h2 className="text-xl font-bold" style={{ color: brand.primary }}>
        Resumen
      </h2>
      
      <div className="space-y-3">
        <div className="text-center">
          <div className="text-4xl font-extrabold text-gray-900">
            {formatMXN(singleResult.summary.pmt_total_month2)}
          </div>
          <div className="text-gray-600">Pago estimado (mes 2)</div>
        </div>

        <div className="pt-4 border-t space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Monto financiado</span>
            <span className="font-medium">{formatMXN(singleResult.summary.principal_total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Desembolso inicial</span>
            <span className="font-medium">{formatMXN(singleResult.summary.initial_outlay)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Primer pago</span>
            <span className="font-medium">{singleResult.summary.first_payment_date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Último pago</span>
            <span className="font-medium">{singleResult.summary.last_payment_date}</span>
          </div>
        </div>

        <div className="pt-4 space-y-2">
          <PDFDownloadLink 
            document={<CaratulaPDF summary={singleResult.summary} />} 
            fileName="caratula.pdf"
          >
            {({ loading }) => (
              <Button
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                <FileText className="w-4 h-4 mr-2" />
                {loading ? "Generando PDF..." : "Descargar Carátula PDF"}
              </Button>
            )}
          </PDFDownloadLink>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleExportXLSX}
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar Tabla XLSX
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleCopyJSON}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Copiar JSON
          </Button>
        </div>
      </div>
    </div>
  );
}

function ComparativeCards({ result }: { result: ComparativeResult }) {
  const tiers = [
    { key: "A", label: "Nivel A", rate: "36%", color: "#10B981" },
    { key: "B", label: "Nivel B", rate: "40%", color: "#F59E0B" },
    { key: "C", label: "Nivel C", rate: "45%", color: "#EF4444" },
  ] as const;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold" style={{ color: brand.primary }}>
        Comparación de Niveles
      </h2>
      
      <div className="grid grid-cols-1 gap-4">
        {tiers.map((tier) => {
          const tierResult = result[tier.key];
          return (
            <div
              key={tier.key}
              className="bg-white rounded-lg border-2 p-4"
              style={{ borderColor: tier.color }}
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="font-semibold" style={{ color: tier.color }}>
                    {tier.label}
                  </h3>
                  <p className="text-xs text-gray-600">TAN {tier.rate}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" data-testid={`nivel-${tier.key.toLowerCase()}-payment`}>
                    {formatMXN(tierResult.summary.pmt_total_month2)}
                  </div>
                  <div className="text-xs text-gray-600">Pago mes 2</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">PMT base: </span>
                  <span>{formatMXN(tierResult.summary.pmt_base)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Desembolso: </span>
                  <span>{formatMXN(tierResult.summary.initial_outlay)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
