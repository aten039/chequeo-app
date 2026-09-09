import { Competitor, PriceCheck, Product } from '../database/types';

function splitRow(row: string, delimiter: ',' | ';') {
  return row.split(delimiter).map((value) => value.trim().replace(/^"|"$/g, ''));
}

function dataRows(csv: string) {
  return csv
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .slice(1);
}

function parseRows(csv: string) {
  const delimiter = csv.split(/\r?\n/, 1)[0].includes(';') ? ';' : ',';
  return dataRows(csv).map((row) => splitRow(row, delimiter));
}

export function parseProductsCsv(csv: string): Product[] {
  return parseRows(csv).map(([id, desc, prov, category = '']) => {
    if (!id || !desc || !prov) throw new Error('El CSV de productos tiene filas incompletas.');
    return { id, desc, prov, category };
  });
}

export function parseCompetitorsCsv(csv: string): Competitor[] {
  return parseRows(csv).map(([name], index) => {
    if (!name) throw new Error('El CSV de competidores tiene filas incompletas.');
    return { id: String(index + 1), name };
  });
}

export function formatShortDate(value: string | Date = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

export function priceChecksToCsv(rows: PriceCheck[]) {
  const columns = ['codigo', 'competidor', 'precio', 'marca', 'estado', 'observacion', 'fecha'];
  const body = rows.map((row) => [
    row.productId,
    row.competitor,
    row.price,
    row.brand ?? '',
    row.status,
    row.notes ?? '',
    formatShortDate(row.createdAt),
  ].join(';'));
  return [columns.join(';'), ...body].join('\n');
}

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: Array<keyof T>, delimiter = ';') {
  const header = columns.join(delimiter);
  const body = rows.map((row) => columns.map((column) => String(row[column] ?? '')).join(delimiter));
  return [header, ...body].join('\n');
}
