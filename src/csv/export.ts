import * as XLSX from "xlsx";

export function exportScheduleXLSX(rows: Record<string, unknown>[], filename = "tabla_amortizacion.xlsx") {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tabla");
  XLSX.writeFile(wb, filename);
}


