import Papa from "papaparse";

/** Convert an array of flat objects into a CSV string using the given column order. */
export function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; label: string }[]
): string {
  const header = columns.map((c) => c.label);
  const data = rows.map((row) => columns.map((c) => formatCell(row[c.key])));
  return Papa.unparse({ fields: header, data });
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

/** Parse an uploaded CSV file's text into an array of row objects keyed by header. */
export function parseCSV(text: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (v) => v.trim(),
  });
  return result.data;
}

/** Build a downloadable CSV Response for a route handler. */
export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
