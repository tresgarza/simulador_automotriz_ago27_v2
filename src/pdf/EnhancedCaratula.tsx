import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2EB872',
  },
  logo: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#2EB872',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 12,
    color: '#6B7280',
  },
  dateInfo: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  mainAmount: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#166534',
    marginBottom: 8,
    fontFamily: 'Helvetica-Bold',
  },
  amount: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: '#15803D',
  },
  amountSubtext: {
    fontSize: 12,
    color: '#166534',
    marginTop: 4,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#1F2937',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  rowEven: {
    backgroundColor: '#F9FAFB',
  },
  label: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
  },
  value: {
    fontSize: 12,
    color: '#1F2937',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    gap: 20,
  },
  gridColumn: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2EB872',
    padding: 8,
    borderRadius: 4,
  },
  tableHeaderText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
    flex: 1,
    textAlign: 'center',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  disclaimer: {
    fontSize: 8,
    color: '#6B7280',
    lineHeight: 1.4,
    marginBottom: 10,
  },
  contact: {
    fontSize: 9,
    color: '#4B5563',
    textAlign: 'center',
  },
});

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

interface EnhancedCaratulaPDFProps {
  summary: Summary;
  schedule: Schedule[];
  vehicleValue: number;
  downPayment: number;
  insuranceAmount: number;
  insuranceMode: string;
  termMonths: number;
  rateTier: string;
}

const formatMXN = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const EnhancedCaratulaPDF: React.FC<EnhancedCaratulaPDFProps> = ({
  summary,
  schedule,
  vehicleValue,
  downPayment,
  insuranceAmount,
  insuranceMode,
  termMonths,
  rateTier,
}) => {
  const today = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const rateMap: Record<string, string> = {
    A: '36%',
    B: '40%',
    C: '45%'
  };

  const gpsMonthly = schedule.length > 0 ? schedule[0].gps_rent + schedule[0].gps_rent_iva : 0;
  const minimumIncome = Math.round(summary.pmt_total_month2 / 0.265);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.companyName}>Financiera Incentiva</Text>
            <Text style={styles.tagline}>Tu aliado financiero</Text>
          </View>
          <View style={styles.dateInfo}>
            <Text style={styles.dateText}>Fecha de cotización:</Text>
            <Text style={styles.dateText}>{today}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Cotización de Crédito Automotriz</Text>
        <Text style={styles.subtitle}>
          Nivel {rateTier} • {termMonths} meses • TAN {rateMap[rateTier]}
        </Text>

        {/* Main Payment Amount */}
        <View style={styles.mainAmount}>
          <Text style={styles.amountLabel}>Pago Mensual</Text>
          <Text style={styles.amount}>{formatMXN(summary.pmt_total_month2)}</Text>
          <Text style={styles.amountSubtext}>Incluye capital, intereses, IVA y GPS</Text>
        </View>

        {/* Vehicle and Credit Info */}
        <View style={styles.grid}>
          <View style={styles.gridColumn}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información del Vehículo</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Valor del vehículo</Text>
                <Text style={styles.value}>{formatMXN(vehicleValue)}</Text>
              </View>
              <View style={[styles.row, styles.rowEven]}>
                <Text style={styles.label}>Enganche</Text>
                <Text style={styles.value}>{formatMXN(downPayment)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Seguro ({insuranceMode === 'cash' ? 'Contado' : 'Financiado'})</Text>
                <Text style={styles.value}>{formatMXN(insuranceAmount)}</Text>
              </View>
              <View style={[styles.row, styles.rowEven]}>
                <Text style={styles.label}>Monto a financiar</Text>
                <Text style={styles.value}>{formatMXN(summary.principal_total)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.gridColumn}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Desglose de Pagos</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Pago base</Text>
                <Text style={styles.value}>{formatMXN(summary.pmt_base)}</Text>
              </View>
              <View style={[styles.row, styles.rowEven]}>
                <Text style={styles.label}>GPS mensual</Text>
                <Text style={styles.value}>{formatMXN(gpsMonthly)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Seguro de vida</Text>
                <Text style={styles.value}>{formatMXN(177.21)}</Text>
              </View>
              <View style={[styles.row, styles.rowEven]}>
                <Text style={styles.label}>Total mensual</Text>
                <Text style={styles.value}>{formatMXN(summary.pmt_total_month2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles del Crédito</Text>
          <View style={styles.grid}>
            <View style={styles.gridColumn}>
              <View style={styles.row}>
                <Text style={styles.label}>Comisión por apertura</Text>
                <Text style={styles.value}>{formatMXN(summary.opening_fee + summary.opening_fee_iva)}</Text>
              </View>
              <View style={[styles.row, styles.rowEven]}>
                <Text style={styles.label}>Instalación GPS</Text>
                <Text style={styles.value}>{formatMXN(summary.gps + summary.gps_iva)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Desembolso inicial total</Text>
                <Text style={styles.value}>{formatMXN(summary.initial_outlay)}</Text>
              </View>
            </View>
            <View style={styles.gridColumn}>
              <View style={styles.row}>
                <Text style={styles.label}>Primer pago</Text>
                <Text style={styles.value}>{summary.first_payment_date}</Text>
              </View>
              <View style={[styles.row, styles.rowEven]}>
                <Text style={styles.label}>Último pago</Text>
                <Text style={styles.value}>{summary.last_payment_date}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Ingreso mínimo requerido</Text>
                <Text style={styles.value}>{formatMXN(minimumIncome)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Amortization Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tabla de Amortización</Text>
          
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Período</Text>
            <Text style={styles.tableHeaderText}>Fecha</Text>
            <Text style={styles.tableHeaderText}>Saldo Inicial</Text>
            <Text style={styles.tableHeaderText}>Interés</Text>
            <Text style={styles.tableHeaderText}>Capital</Text>
            <Text style={styles.tableHeaderText}>GPS</Text>
            <Text style={styles.tableHeaderText}>Pago Total</Text>
            <Text style={styles.tableHeaderText}>Saldo Final</Text>
          </View>
          
          {/* Table Rows - Show first 12 months on first page */}
          {schedule.slice(0, 12).map((row, index) => (
            <View key={row.k} style={[styles.tableRow, index % 2 === 1 ? styles.rowEven : {}]}>
              <Text style={styles.tableCell}>{row.k}</Text>
              <Text style={styles.tableCell}>{row.date}</Text>
              <Text style={styles.tableCell}>{formatMXN(row.saldo_ini)}</Text>
              <Text style={styles.tableCell}>{formatMXN(row.interes + row.iva_interes)}</Text>
              <Text style={styles.tableCell}>{formatMXN(row.capital)}</Text>
              <Text style={styles.tableCell}>{formatMXN(row.gps_rent + row.gps_rent_iva)}</Text>
              <Text style={styles.tableCell}>{formatMXN(row.pago_total)}</Text>
              <Text style={styles.tableCell}>{formatMXN(row.saldo_fin)}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.disclaimer}>
            Esta cotización es válida por 15 días calendario. Las tasas y condiciones están sujetas a aprobación crediticia. 
            El CAT (Costo Anual Total) se calculará en función del perfil crediticio del solicitante. 
            Todos los importes incluyen IVA cuando aplica.
          </Text>
          <Text style={styles.disclaimer}>
            Los seguros son opcionales pero recomendados para proteger tu inversión. El GPS es obligatorio para monitoreo del vehículo.
          </Text>
          <Text style={styles.contact}>
            Financiera Incentiva • Tel: (55) 1234-5678 • ventas@financieraincentiva.com
          </Text>
        </View>
      </Page>

      {/* Second page with complete amortization table if needed */}
      {schedule.length > 12 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.companyName}>Financiera Incentiva</Text>
            <Text style={styles.dateText}>Tabla de Amortización Completa</Text>
          </View>

          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Período</Text>
            <Text style={styles.tableHeaderText}>Fecha</Text>
            <Text style={styles.tableHeaderText}>Saldo Inicial</Text>
            <Text style={styles.tableHeaderText}>Interés</Text>
            <Text style={styles.tableHeaderText}>Capital</Text>
            <Text style={styles.tableHeaderText}>GPS</Text>
            <Text style={styles.tableHeaderText}>Pago Total</Text>
            <Text style={styles.tableHeaderText}>Saldo Final</Text>
          </View>
          
          {schedule.slice(12).map((row, index) => (
            <View key={row.k} style={[styles.tableRow, index % 2 === 1 ? styles.rowEven : {}]}>
              <Text style={styles.tableCell}>{row.k}</Text>
              <Text style={styles.tableCell}>{row.date}</Text>
              <Text style={styles.tableCell}>{formatMXN(row.saldo_ini)}</Text>
              <Text style={styles.tableCell}>{formatMXN(row.interes + row.iva_interes)}</Text>
              <Text style={styles.tableCell}>{formatMXN(row.capital)}</Text>
              <Text style={styles.tableCell}>{formatMXN(row.gps_rent + row.gps_rent_iva)}</Text>
              <Text style={styles.tableCell}>{formatMXN(row.pago_total)}</Text>
              <Text style={styles.tableCell}>{formatMXN(row.saldo_fin)}</Text>
            </View>
          ))}
        </Page>
      )}
    </Document>
  );
};
