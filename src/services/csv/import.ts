import { Competitor, Product, ProductImage } from '../../database/types';
import { readCsvRows } from './read';

export function parseProductsCsv(csv: string): Product[] {
  return readCsvRows(csv).map(([category, code, codExt = '', desc, prov]) => {
    if (!category || !code || !desc || !prov) throw new Error('El CSV de productos tiene filas incompletas.');
    const numericCode = Number(code);
    if (!Number.isInteger(numericCode)) throw new Error(`Código de producto inválido: ${code}`);
    return { category, code: numericCode, desc, prov, codExt: codExt || null };
  });
}

export function parseCompetitorsCsv(csv: string): Competitor[] {
  return readCsvRows(csv).map(([name]) => {
    if (!name) throw new Error('El CSV de competidores tiene filas incompletas.');
    return { name };
  });
}

export function parseProductImagesCsv(csv: string): ProductImage[] {
  return readCsvRows(csv).map(([code, link]) => {
    if (!code || !link) throw new Error('El CSV de imágenes tiene filas incompletas.');
    const numericCode = Number(code);
    if (!Number.isInteger(numericCode)) throw new Error(`Código de producto inválido: ${code}`);
    return { code: numericCode, link };
  });
}
