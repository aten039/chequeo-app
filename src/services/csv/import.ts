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
  const seenCodes = new Set<number>();
  const images: ProductImage[] = [];

  for (const [index, [code, rawLink]] of readCsvRows(csv).entries()) {
    const recordNumber = index + 1;
    const link = rawLink?.trim();
    if (!code) {
      throw new Error(`El registro ${recordNumber} del CSV de imágenes está incompleto.`);
    }
    const numericCode = Number(code);
    if (!Number.isInteger(numericCode)) {
      throw new Error(`Código de producto inválido en el registro ${recordNumber}: ${code}`);
    }
    if (seenCodes.has(numericCode)) {
      throw new Error(`El código ${numericCode} está duplicado en el CSV de imágenes (registro ${recordNumber}).`);
    }
    if (!link) continue;

    let imageUrl: URL;
    try {
      imageUrl = new URL(link);
    } catch {
      continue;
    }

    if (!['http:', 'https:'].includes(imageUrl.protocol) || !imageUrl.hostname) {
      continue;
    }

    seenCodes.add(numericCode);
    images.push({ code: numericCode, link: imageUrl.toString() });
  }

  return images;
}
