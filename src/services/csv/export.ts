import { PriceCheck } from '../../database/types';

export function formatShortDate(value: string | Date = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

export function priceChecksToCsv(rows: PriceCheck[]) {
  const columns = ['codigo', 'relacion', 'marca', 'competidor', 'precio', 'fecha'];
  const body = rows.map((row) => [
    row.productCode,
    row.status,
    row.brand,
    row.competitor,
    String(row.price).replace('.', ','),
    formatShortDate(row.createdAt),
  ].join(';'));
  return [columns.join(';'), ...body].join('\n');
}

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: Array<keyof T>, delimiter = ';') {
  const header = columns.join(delimiter);
  const body = rows.map((row) => columns.map((column) => String(row[column] ?? '')).join(delimiter));
  return [header, ...body].join('\n');
}
