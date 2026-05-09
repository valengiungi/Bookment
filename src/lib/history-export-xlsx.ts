import { formatInTimeZone } from "date-fns-tz";
import ExcelJS from "exceljs";

const ACCENT = "FF0D9488"; // teal-600
const ACCENT_LIGHT = "FFCCFBF4"; // teal-50
const BORDER = "FFE2E8F0";
const HEADER_ROW_HEIGHT = 22;
const ZEBRA = "FFF8FAFC";

function thinBorder(): Partial<ExcelJS.Borders> {
  const edge = { style: "thin" as const, color: { argb: BORDER } };
  return { top: edge, left: edge, bottom: edge, right: edge };
}

function formatArsFromCents(cents: number): string {
  return (cents / 100).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export type BookingExportRow = {
  startsAt: Date;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  service: { name: string; priceCents: number | null };
  staff: { name: string };
};

export async function buildHistoryExportXlsxBuffer(args: {
  tenantName: string;
  tz: string;
  bookings: BookingExportRow[];
}): Promise<Buffer> {
  const { tenantName, tz, bookings } = args;
  const generatedAt = formatInTimeZone(new Date(), tz, "dd/MM/yyyy HH:mm");

  let totalCents = 0;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Bookment";
  wb.created = new Date();

  // --- Hoja Turnos ---
  const turnos = wb.addWorksheet("Turnos", {
    properties: { tabColor: { argb: ACCENT } },
    views: [{ state: "frozen", ySplit: 6, xSplit: 0 }],
  });

  turnos.columns = [
    { width: 18 },
    { width: 26 },
    { width: 20 },
    { width: 24 },
    { width: 16 },
    { width: 28 },
    { width: 14 },
    { width: 14 },
  ];

  turnos.mergeCells("A1:H1");
  const t1 = turnos.getCell("A1");
  t1.value = "Reservas confirmadas";
  t1.font = { size: 16, bold: true, color: { argb: ACCENT } };
  t1.alignment = { vertical: "middle" };

  turnos.mergeCells("A2:H2");
  turnos.getCell("A2").value = `Negocio: ${tenantName}`;
  turnos.getCell("A2").font = { size: 11, color: { argb: "FF475569" } };

  turnos.mergeCells("A3:H3");
  turnos.getCell("A3").value = `Generado: ${generatedAt} · Zona: ${tz}`;
  turnos.getCell("A3").font = { size: 10, italic: true, color: { argb: "FF64748B" } };

  turnos.mergeCells("A4:H4");
  turnos.getCell("A4").value =
    "Orden: turnos más recientes primero. Importes según precio configurado en cada servicio.";
  turnos.getCell("A4").font = { size: 10, color: { argb: "FF64748B" } };

  turnos.getRow(5).height = 6;

  const headers = [
    "Inicio (hora local)",
    "Servicio",
    "Profesional",
    "Cliente",
    "Teléfono",
    "Email",
    'Precio servicio ($)',
    'Importe ($)',
  ];

  const headerRow = turnos.getRow(6);
  headerRow.height = HEADER_ROW_HEIGHT;
  headers.forEach((text, i) => {
    const c = headerRow.getCell(i + 1);
    c.value = text;
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT } };
    c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    c.border = thinBorder();
  });

  let rowNum = 7;
  for (const b of bookings) {
    const lineCents = b.service.priceCents ?? 0;
    totalCents += lineCents;
    const ars = formatArsFromCents(lineCents);
    const r = turnos.getRow(rowNum);
    r.height = 18;
    const cells = [
      formatInTimeZone(b.startsAt, tz, "yyyy-MM-dd HH:mm"),
      b.service.name,
      b.staff.name,
      b.customerName,
      b.customerPhone,
      b.customerEmail ?? "",
      ars,
      ars,
    ];
    const zebra = rowNum % 2 === 1;
    cells.forEach((val, i) => {
      const c = r.getCell(i + 1);
      c.value = val;
      c.alignment = { vertical: "middle", wrapText: i === 1 || i === 5 };
      c.border = thinBorder();
      if (zebra) {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA } };
      }
    });
    rowNum++;
  }

  const lastDataRow = rowNum - 1;

  if (bookings.length === 0) {
    turnos.mergeCells(`A${rowNum}:H${rowNum}`);
    const empty = turnos.getCell(`A${rowNum}`);
    empty.value = "No hay reservas confirmadas para exportar.";
    empty.font = { italic: true, color: { argb: "FF94A3B8" } };
    empty.alignment = { horizontal: "center" };
  } else {
    turnos.autoFilter = `A6:H${lastDataRow}`;
  }

  // --- Hoja Balance ---
  const n = bookings.length;
  const avgCents = n > 0 ? Math.round(totalCents / n) : 0;

  const bal = wb.addWorksheet("Balance", {
    properties: { tabColor: { argb: "FF7C3AED" } },
    views: [{ state: "frozen", ySplit: 5 }],
  });

  bal.columns = [{ width: 42 }, { width: 22 }];

  bal.mergeCells("A1:B1");
  bal.getCell("A1").value = "Resumen estimado";
  bal.getCell("A1").font = { size: 15, bold: true, color: { argb: "FF7C3AED" } };

  bal.mergeCells("A2:B2");
  bal.getCell("A2").value =
    "Totales calculados con el precio guardado en cada servicio. No reemplaza facturación ni cobros reales.";
  bal.getCell("A2").font = { size: 10, color: { argb: "FF64748B" }, italic: true };
  bal.getCell("A2").alignment = { wrapText: true };

  bal.getRow(3).height = 8;

  const bh = bal.getRow(4);
  bh.height = HEADER_ROW_HEIGHT;
  ["Concepto", "Valor"].forEach((text, i) => {
    const c = bh.getCell(i + 1);
    c.value = text;
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7C3AED" } };
    c.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "right" };
    c.border = thinBorder();
  });

  const summaryRows: [string, string, "normal" | "highlight"][] = [
    ["Turnos incluidos en la hoja «Turnos»", String(n), "normal"],
    ["Total estimado ($)", formatArsFromCents(totalCents), "highlight"],
    ["Promedio por turno ($)", n > 0 ? formatArsFromCents(avgCents) : "—", "normal"],
  ];

  let br = 5;
  for (const [label, val, kind] of summaryRows) {
    const row = bal.getRow(br);
    row.height = kind === "highlight" ? 26 : 20;
    const c1 = row.getCell(1);
    const c2 = row.getCell(2);
    c1.value = label;
    c2.value = val;
    c1.font =
      kind === "highlight"
        ? { size: 12, bold: true, color: { argb: "FF0F172A" } }
        : { size: 11 };
    c2.font =
      kind === "highlight"
        ? { size: 14, bold: true, color: { argb: ACCENT } }
        : { size: 11 };
    c1.alignment = { vertical: "middle", wrapText: true };
    c2.alignment = { vertical: "middle", horizontal: "right" };
    c1.border = thinBorder();
    c2.border = thinBorder();
    const fillArg =
      kind === "highlight"
        ? { argb: "FFE6FFFA" }
        : br % 2 === 1
          ? { argb: ACCENT_LIGHT }
          : { argb: ZEBRA };
    c1.fill = { type: "pattern", pattern: "solid", fgColor: fillArg };
    c2.fill = { type: "pattern", pattern: "solid", fgColor: fillArg };
    br++;
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
