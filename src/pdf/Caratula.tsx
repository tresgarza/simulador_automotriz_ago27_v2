import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 11 },
  header: { fontSize: 16, fontWeight: 700, marginBottom: 8 },
  section: { marginTop: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
});

type SummaryShape = {
  pmt_total_month2: number;
  principal_total: number;
  initial_outlay: number;
  first_payment_date: string;
  last_payment_date: string;
};

export function CaratulaPDF({ summary }: { summary: SummaryShape }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Carátula de Cotización – Crédito Automotriz</Text>
        <View style={styles.section}>
          <View style={styles.row}><Text>Pago estimado (mes 2)</Text><Text>{formatMXN(summary.pmt_total_month2)}</Text></View>
          <View style={styles.row}><Text>Monto financiado</Text><Text>{formatMXN(summary.principal_total)}</Text></View>
          <View style={styles.row}><Text>Desembolso inicial</Text><Text>{formatMXN(summary.initial_outlay)}</Text></View>
          <View style={styles.row}><Text>Primer pago</Text><Text>{summary.first_payment_date}</Text></View>
          <View style={styles.row}><Text>Último pago</Text><Text>{summary.last_payment_date}</Text></View>
        </View>


      {/* Notas Legales */}
      <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
        <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 6 }}>Notas Legales</Text>
        <Text style={{ fontSize: 8, marginBottom: 3 }}>
          • Cotización informativa, sujeta a análisis y aprobación. Las tasas y condiciones pueden cambiar sin previo aviso.
        </Text>
        <Text style={{ fontSize: 8, marginBottom: 3 }}>
          • Los intereses causan IVA 16%. La comisión de apertura y el GPS se pagan al inicio.
        </Text>
        <Text style={{ fontSize: 8, marginBottom: 3 }}>
          • Primer pago prorrateado a la siguiente quincena. Base de cálculo: 360 días, pagos sobre saldos insolutos.
        </Text>
        <Text style={{ fontSize: 8, marginBottom: 3 }}>
          • La renta mensual de GPS y la instalación causan IVA. El CAT mostrado es informativo.
        </Text>
      </View>
    </Page>
  </Document>
);
}

function formatMXN(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}


