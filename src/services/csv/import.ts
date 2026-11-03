import { Competitor, Product } from '../../database/types';
import { readCsvRows } from './read';

export function parseProductsCsv(csv: string): Product[] {
  return readCsvRows(csv).map(([category, code, codExt = '', desc, prov, rawLink]) => {
    if (!category || !code || !desc || !prov) throw new Error('El CSV de productos tiene filas incompletas.');
    const numericCode = Number(code);
    if (!Number.isInteger(numericCode)) throw new Error(`Código de producto inválido: ${code}`);
    return { category, code: numericCode, desc, prov, codExt: codExt || null, link: normalizeProductImageLink(rawLink) };
  });
}

function normalizeProductImageLink(rawLink?: string): string | null {
  const link = rawLink?.trim();
  if (!link) return null;

  try {
    const imageUrl = new URL(link);
    if (['http:', 'https:'].includes(imageUrl.protocol) && imageUrl.hostname) {
      return imageUrl.toString();
    }
  } catch {
    return null;
  }

  return null;
}

export function parseCompetitorsCsv(csv: string): Competitor[] {
  return readCsvRows(csv).map(([name]) => {
    if (!name) throw new Error('El CSV de competidores tiene filas incompletas.');
    return { name };
  });
}
