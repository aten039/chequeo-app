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

  return readCsvRows(csv).map(([code, rawLink], index) => {
    const recordNumber = index + 1;
    const link = rawLink?.trim();
    if (!code || !link) {
      throw new Error(`El registro ${recordNumber} del CSV de imágenes está incompleto.`);
    }
    const numericCode = Number(code);
    if (!Number.isInteger(numericCode)) {
      throw new Error(`Código de producto inválido en el registro ${recordNumber}: ${code}`);
    }
    if (seenCodes.has(numericCode)) {
      throw new Error(`El código ${numericCode} está duplicado en el CSV de imágenes (registro ${recordNumber}).`);
    }

    let imageUrl: URL;
    try {
      imageUrl = new URL(link);
    } catch {
      throw new Error(`URL inválida en el CSV de imágenes (registro ${recordNumber}, código ${numericCode}).`);
    }

    if (!['http:', 'https:'].includes(imageUrl.protocol) || !imageUrl.hostname) {
      throw new Error(`La imagen del registro ${recordNumber} debe tener una URL completa HTTP o HTTPS.`);
    }

    seenCodes.add(numericCode);
    return { code: numericCode, link: imageUrl.toString() };
  });
}
