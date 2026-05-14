import { formatInTimeZone } from "date-fns-tz";
import ExcelJS from "exceljs";
import { TenantExpenseKind } from "@/generated/prisma";
import {
  groupCommissionExpensesByStaffDay,
  resolveBookingServicePriceCents,
} from "@/lib/staff-commissions";

const ACCENT = "FF0D9488"; // teal-600
const ACCENT_LIGHT = "FFCCFBF4";
const VIOLET = "FF7C3AED";
const GRID = "FFCBD5E1"; // slate-300 — grilla visible
const OUTLINE = "FF0F766E"; // teal-700 — marco exterior
const META_BG = "FFF1F5F9"; // slate-100
const ZEBRA = "FFF8FAFC";

const HEADER_ROW_H = 30;
const DATA_ROW_MIN_H = 24;
const TITLE_ROW_H = 28;
const SPACER_H = 16;

function thinGrid(): Partial<ExcelJS.Borders> {
  const e = { style: "thin" as const, color: { argb: GRID } };
  return { top: e, left: e, bottom: e, right: e };
}

/** Borde exterior más grueso en los bordes del rectángulo [r1,r2]×[c1,c2] */
function tableOutline(
  row: number,
  col: number,
  r1: number,
  r2: number,
  c1: number,
  c2: number,
): Partial<ExcelJS.Borders> {
  const grid = { style: "thin" as const, color: { argb: GRID } };
  const out = { style: "medium" as const, color: { argb: OUTLINE } };
  return {
    top: row === r1 ? out : grid,
    bottom: row === r2 ? out : grid,
    left: col === c1 ? out : grid,
    right: col === c2 ? out : grid,
  };
}

function balanceOutline(
  row: number,
  col: number,
  r1: number,
  r2: number,
  c1: number,
  c2: number,
): Partial<ExcelJS.Borders> {
  const grid = { style: "thin" as const, color: { argb: GRID } };
  const out = { style: "medium" as const, color: { argb: VIOLET } };
  return {
    top: row === r1 ? out : grid,
    bottom: row === r2 ? out : grid,
    left: col === c1 ? out : grid,
    right: col === c2 ? out : grid,
  };
}

function formatArsFromCents(cents: number): string {
  return (cents / 100).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatArs(value: number): string {
  return value.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function expenseKindLabel(kind: TenantExpenseKind): string {
  switch (kind) {
    case "FIXED_ONE_TIME":
      return "Fijo único";
    case "FIXED_MONTHLY":
      return "Fijo mensual";
    case "DYNAMIC":
      return "Dinámico";
    default:
      return kind;
  }
}

export type BookingExportRow = {
  staffId: string;
  startsAt: Date;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  servicePriceCentsSnapshot: number | null;
  staffCommissionPercentSnapshot: number | null;
  staffPayoutArsSnapshot: number | null;
  service: { name: string; priceCents: number | null };
  staff: { name: string; commissionPercent: number };
};

export type ExpenseExportRow = {
  expenseDate: Date;
  kind: TenantExpenseKind;
  name: string;
  amountArs: number;
  note: string | null;
};

export async function buildHistoryExportXlsxBuffer(args: {
  tenantName: string;
  tz: string;
  bookings: BookingExportRow[];
  expenses: ExpenseExportRow[];
}): Promise<Buffer> {
  const { tenantName, tz, bookings, expenses } = args;
  const generatedAt = formatInTimeZone(new Date(), tz, "dd/MM/yyyy HH:mm");
  const commissionExpenses = groupCommissionExpensesByStaffDay(bookings, tz);
  const combinedExpenses = [
    ...expenses.map((expense) => ({
      expenseDate: expense.expenseDate,
      kindLabel: expenseKindLabel(expense.kind),
      name: expense.name,
      amountArs: expense.amountArs,
      note: expense.note,
    })),
    ...commissionExpenses.map((expense) => ({
      expenseDate: expense.expenseDate,
      kindLabel: "Comisión profesional",
      name: `Pago por comisión a ${expense.staffName}`,
      amountArs: expense.amountArs,
      note: `${expense.bookingsCount} turno${expense.bookingsCount === 1 ? "" : "s"} del día`,
    })),
  ].sort((a, b) => {
    const diff = b.expenseDate.getTime() - a.expenseDate.getTime();
    return diff !== 0 ? diff : a.name.localeCompare(b.name, "es-AR");
  });

  let totalCents = 0;
  let totalExpensesArs = 0;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Bookment";
  wb.created = new Date();

  const turnos = wb.addWorksheet("Turnos", {
    properties: { tabColor: { argb: ACCENT } },
    views: [{ state: "frozen", ySplit: 7, xSplit: 0 }],
  });

  turnos.columns = [
    { width: 20 },
    { width: 30 },
    { width: 22 },
    { width: 26 },
    { width: 18 },
    { width: 32 },
    { width: 16 },
    { width: 16 },
  ];

  // Bloque encabezado con marco y fondo suave
  const metaRows = 4;
  for (let r = 1; r <= metaRows; r++) {
    turnos.getRow(r).height = r === 1 ? TITLE_ROW_H + 4 : 22;
    for (let c = 1; c <= 8; c++) {
      const cell = turnos.getRow(r).getCell(c);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: META_BG } };
      cell.border = tableOutline(r, c, 1, metaRows, 1, 8);
    }
  }

  turnos.mergeCells("A1:H1");
  const t1 = turnos.getCell("A1");
  t1.value = "Reservas confirmadas";
  t1.font = { size: 17, bold: true, color: { argb: ACCENT } };
  t1.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

  turnos.mergeCells("A2:H2");
  turnos.getCell("A2").value = `Negocio: ${tenantName}`;
  turnos.getCell("A2").font = { size: 12, color: { argb: "FF334155" } };
  turnos.getCell("A2").alignment = { vertical: "middle", indent: 1, wrapText: true };

  turnos.mergeCells("A3:H3");
  turnos.getCell("A3").value = `Generado: ${generatedAt} · Zona: ${tz}`;
  turnos.getCell("A3").font = { size: 10, italic: true, color: { argb: "FF64748B" } };
  turnos.getCell("A3").alignment = { vertical: "middle", indent: 1 };

  turnos.mergeCells("A4:H4");
  turnos.getCell("A4").value =
    "Orden: turnos más recientes primero. Importes según snapshot del turno cuando existe; si no, se usa el precio actual del servicio.";
  turnos.getCell("A4").font = { size: 10, color: { argb: "FF64748B" } };
  turnos.getCell("A4").alignment = { vertical: "middle", indent: 1, wrapText: true };

  turnos.getRow(5).height = SPACER_H;

  const headers = [
    "Inicio (hora local)",
    "Servicio",
    "Profesional",
    "Cliente",
    "Teléfono",
    "Email",
    "Precio servicio ($)",
    "Importe ($)",
  ];

  const headerRowIndex = 6;
  const headerRow = turnos.getRow(headerRowIndex);
  headerRow.height = HEADER_ROW_H;
  headers.forEach((text, i) => {
    const c = headerRow.getCell(i + 1);
    c.value = text;
    c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT } };
    c.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
      indent: 0,
    };
    c.border = thinGrid();
  });

  let rowNum = 7;
  for (const b of bookings) {
    const lineCents = resolveBookingServicePriceCents(b);
    totalCents += lineCents;
    const ars = formatArsFromCents(lineCents);
    const r = turnos.getRow(rowNum);
    r.height = DATA_ROW_MIN_H;
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
      const isText = i === 1 || i === 3 || i === 5;
      c.alignment = {
        vertical: "middle",
        wrapText: isText,
        horizontal: i >= 6 ? "right" : "left",
        indent: i >= 6 ? 0 : 1,
      };
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
    empty.font = { italic: true, color: { argb: "FF94A3B8" }, size: 11 };
    empty.alignment = { horizontal: "center", vertical: "middle" };
    empty.border = thinGrid();
    turnos.getRow(rowNum).height = 28;
  } else {
    // Marco exterior + grilla en toda la tabla de datos
    for (let r = headerRowIndex; r <= lastDataRow; r++) {
      for (let col = 1; col <= 8; col++) {
        const cell = turnos.getRow(r).getCell(col);
        cell.border = tableOutline(r, col, headerRowIndex, lastDataRow, 1, 8);
      }
    }
    turnos.autoFilter = `A${headerRowIndex}:H${lastDataRow}`;
  }

  // --- Gastos ---
  const gastos = wb.addWorksheet("Gastos", {
    properties: { tabColor: { argb: "FFEA580C" } },
    views: [{ state: "frozen", ySplit: 7, xSplit: 0 }],
  });

  gastos.columns = [{ width: 18 }, { width: 18 }, { width: 34 }, { width: 18 }, { width: 40 }];

  for (let r = 1; r <= metaRows; r++) {
    gastos.getRow(r).height = r === 1 ? TITLE_ROW_H + 4 : 22;
    for (let c = 1; c <= 5; c++) {
      const cell = gastos.getRow(r).getCell(c);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: META_BG } };
      cell.border = tableOutline(r, c, 1, metaRows, 1, 5);
    }
  }

  gastos.mergeCells("A1:E1");
  const g1 = gastos.getCell("A1");
  g1.value = "Gastos registrados";
  g1.font = { size: 17, bold: true, color: { argb: "FFEA580C" } };
  g1.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

  gastos.mergeCells("A2:E2");
  gastos.getCell("A2").value = `Negocio: ${tenantName}`;
  gastos.getCell("A2").font = { size: 12, color: { argb: "FF334155" } };
  gastos.getCell("A2").alignment = { vertical: "middle", indent: 1, wrapText: true };

  gastos.mergeCells("A3:E3");
  gastos.getCell("A3").value = `Generado: ${generatedAt} · Zona: ${tz}`;
  gastos.getCell("A3").font = { size: 10, italic: true, color: { argb: "FF64748B" } };
  gastos.getCell("A3").alignment = { vertical: "middle", indent: 1 };

  gastos.mergeCells("A4:E4");
  gastos.getCell("A4").value =
    "Incluye gastos manuales cargados en el panel y pagos calculados por comisión a profesionales.";
  gastos.getCell("A4").font = { size: 10, color: { argb: "FF64748B" } };
  gastos.getCell("A4").alignment = { vertical: "middle", indent: 1, wrapText: true };

  gastos.getRow(5).height = SPACER_H;

  const expenseHeaders = ["Fecha", "Tipo", "Concepto", "Importe ($)", "Nota"];
  const expenseHeaderRowIndex = 6;
  const expenseHeaderRow = gastos.getRow(expenseHeaderRowIndex);
  expenseHeaderRow.height = HEADER_ROW_H;
  expenseHeaders.forEach((text, i) => {
    const c = expenseHeaderRow.getCell(i + 1);
    c.value = text;
    c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEA580C" } };
    c.alignment = {
      vertical: "middle",
      horizontal: i === 3 ? "right" : "center",
      wrapText: true,
      indent: 0,
    };
    c.border = thinGrid();
  });

  let expenseRowNum = 7;
  for (const expense of combinedExpenses) {
    totalExpensesArs += expense.amountArs;
    const r = gastos.getRow(expenseRowNum);
    r.height = DATA_ROW_MIN_H;
    const cells = [
      formatInTimeZone(expense.expenseDate, tz, "yyyy-MM-dd"),
      expense.kindLabel,
      expense.name,
      formatArs(expense.amountArs),
      expense.note ?? "",
    ];
    const zebra = expenseRowNum % 2 === 1;
    cells.forEach((val, i) => {
      const c = r.getCell(i + 1);
      c.value = val;
      c.alignment = {
        vertical: "middle",
        wrapText: i === 2 || i === 4,
        horizontal: i === 3 ? "right" : "left",
        indent: i === 3 ? 0 : 1,
      };
      if (zebra) {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA } };
      }
    });
    expenseRowNum++;
  }

  const lastExpenseRow = expenseRowNum - 1;

  if (combinedExpenses.length === 0) {
    gastos.mergeCells(`A${expenseRowNum}:E${expenseRowNum}`);
    const empty = gastos.getCell(`A${expenseRowNum}`);
    empty.value = "No hay gastos registrados para exportar.";
    empty.font = { italic: true, color: { argb: "FF94A3B8" }, size: 11 };
    empty.alignment = { horizontal: "center", vertical: "middle" };
    empty.border = thinGrid();
    gastos.getRow(expenseRowNum).height = 28;
  } else {
    for (let r = expenseHeaderRowIndex; r <= lastExpenseRow; r++) {
      for (let col = 1; col <= 5; col++) {
        const cell = gastos.getRow(r).getCell(col);
        cell.border = tableOutline(r, col, expenseHeaderRowIndex, lastExpenseRow, 1, 5);
      }
    }
    gastos.autoFilter = `A${expenseHeaderRowIndex}:E${lastExpenseRow}`;
  }

  // --- Balance ---
  const n = bookings.length;
  const avgCents = n > 0 ? Math.round(totalCents / n) : 0;
  const incomeArs = Math.round(totalCents / 100);
  const netArs = incomeArs - totalExpensesArs;

  const bal = wb.addWorksheet("Balance", {
    properties: { tabColor: { argb: VIOLET } },
    views: [{ state: "frozen", ySplit: 6, xSplit: 0 }],
  });

  bal.columns = [{ width: 48 }, { width: 26 }];

  for (let r = 1; r <= 2; r++) {
    bal.getRow(r).height = r === 1 ? 30 : 36;
    for (let c = 1; c <= 2; c++) {
      bal.getRow(r).getCell(c).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: META_BG },
      };
      bal.getRow(r).getCell(c).border = balanceOutline(r, c, 1, 2, 1, 2);
    }
  }

  bal.mergeCells("A1:B1");
  bal.getCell("A1").value = "Resumen estimado";
  bal.getCell("A1").font = { size: 16, bold: true, color: { argb: VIOLET } };
  bal.getCell("A1").alignment = { vertical: "middle", indent: 1 };

  bal.mergeCells("A2:B2");
  bal.getCell("A2").value =
    "Combina ingresos estimados por turnos confirmados con gastos registrados en la hoja «Gastos». No reemplaza facturación ni contabilidad real.";
  bal.getCell("A2").font = { size: 10, color: { argb: "FF64748B" }, italic: true };
  bal.getCell("A2").alignment = { vertical: "middle", wrapText: true, indent: 1 };

  bal.getRow(3).height = SPACER_H;

  const hdrIdx = 4;
  const bh = bal.getRow(hdrIdx);
  bh.height = HEADER_ROW_H;
  ["Concepto", "Valor"].forEach((text, i) => {
    const c = bh.getCell(i + 1);
    c.value = text;
    c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VIOLET } };
    c.alignment = {
      vertical: "middle",
      horizontal: i === 0 ? "left" : "right",
      indent: i === 0 ? 1 : 0,
    };
    c.border = thinGrid();
  });

  const summaryRows: [string, string, "normal" | "highlight"][] = [
    ["Turnos incluidos en la hoja «Turnos»", String(n), "normal"],
    ["Gastos incluidos en la hoja «Gastos»", String(combinedExpenses.length), "normal"],
    ["Ingresos estimados ($)", formatArs(incomeArs), "normal"],
    ["Gastos registrados ($)", formatArs(totalExpensesArs), "normal"],
    ["Balance neto estimado ($)", formatArs(netArs), "highlight"],
    ["Promedio por turno ($)", n > 0 ? formatArsFromCents(avgCents) : "—", "normal"],
  ];

  let br = 5;
  let summaryEnd = 5;
  for (const [label, val, kind] of summaryRows) {
    const row = bal.getRow(br);
    row.height = kind === "highlight" ? 32 : 26;
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
        ? { size: 15, bold: true, color: { argb: ACCENT } }
        : { size: 11 };
    c1.alignment = { vertical: "middle", wrapText: true, indent: 1 };
    c2.alignment = { vertical: "middle", horizontal: "right", indent: 1 };
    const fillArg =
      kind === "highlight"
        ? { argb: "FFE6FFFA" }
        : br % 2 === 1
          ? { argb: ACCENT_LIGHT }
          : { argb: ZEBRA };
    c1.fill = { type: "pattern", pattern: "solid", fgColor: fillArg };
    c2.fill = { type: "pattern", pattern: "solid", fgColor: fillArg };
    summaryEnd = br;
    br++;
  }

  for (let r = hdrIdx; r <= summaryEnd; r++) {
    for (let col = 1; col <= 2; col++) {
      bal.getRow(r).getCell(col).border = balanceOutline(r, col, hdrIdx, summaryEnd, 1, 2);
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
