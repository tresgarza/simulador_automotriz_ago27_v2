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
        <View style={styles.section}>
          <Text>Notas: IVA 16%, base 360/30, pagos sobre saldos insolutos, sujeto a aprobación.</Text>
        </View>
      </Page>
    </Document>
  );
}

function formatMXN(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}


