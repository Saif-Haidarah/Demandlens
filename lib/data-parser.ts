import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { DataPoint } from "@/types";

export interface ParsedFile {
  rows: Record<string, unknown>[];
  columns: string[];
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "csv" || ext === "txt") {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (res) => {
          const rows = res.data as Record<string, unknown>[];
          const columns = res.meta.fields ?? [];
          resolve({ rows, columns });
        },
        error: (err) => reject(err),
      });
    });
  }

  if (ext === "xlsx" || ext === "xls") {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    return { rows, columns };
  }

  throw new Error("Unsupported file format. Use CSV or Excel.");
}

/**
 * Attempt to map columns automatically.
 */
export function autoMapColumns(
  columns: string[],
  rows: Record<string, unknown>[]
): Record<string, string> {
  const map: Record<string, string> = {};
  const lower = columns.map((c) => c.toLowerCase());

  const find = (keywords: string[]) => {
    for (const kw of keywords) {
      const idx = lower.findIndex((c) => c.includes(kw));
      if (idx >= 0) return columns[idx];
    }
    return "";
  };

  map.period = find(["date", "period", "month", "time", "week"]);
  map.demand = find(["demand", "sales", "quantity", "units", "volume"]);
  map.planned = find(["plan", "forecast", "planned", "target"]);
  map.actual = find(["actual", "realized", "actuals"]);

  // Fallback: if no date column, use first column
  if (!map.period && columns.length > 0) map.period = columns[0];
  // Fallback: if no numeric column, use second column
  if (!map.demand && columns.length > 1) map.demand = columns[1];

  return map;
}

export function mapToDataPoints(
  rows: Record<string, unknown>[],
  mapping: Record<string, string>
): DataPoint[] {
  const periodKey = mapping.period;
  const demandKey = mapping.demand;
  if (!periodKey || !demandKey) return [];

  return rows
    .map((row) => {
      const periodRaw = row[periodKey];
      const demandRaw = row[demandKey];
      const plannedRaw = mapping.planned ? row[mapping.planned] : undefined;
      const actualRaw = mapping.actual ? row[mapping.actual] : undefined;

      const period = String(periodRaw ?? "").trim();
      const demand = Number(demandRaw);
      if (!period || !isFinite(demand)) return null;

      let date: Date;
      const asDate = new Date(periodRaw as string | number);
      if (!isNaN(asDate.getTime())) {
        date = asDate;
      } else {
        // Try common month formats
        const tryDate = new Date(`${period} 1`);
        date = isNaN(tryDate.getTime()) ? new Date() : tryDate;
      }

      return {
        period,
        date,
        demand,
        planned: plannedRaw !== undefined ? Number(plannedRaw) : undefined,
        actual: actualRaw !== undefined ? Number(actualRaw) : undefined,
      };
    })
    .filter((d): d is DataPoint => d !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
