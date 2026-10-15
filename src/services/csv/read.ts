function delimiterFor(csv: string): ',' | ';' {
  const firstLine = csv.split(/\r?\n/, 1)[0] ?? '';
  let commas = 0;
  let semicolons = 0;
  let quoted = false;

  for (let index = 0; index < firstLine.length; index += 1) {
    const character = firstLine[index];
    if (character === '"') {
      if (quoted && firstLine[index + 1] === '"') {
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && character === ',') {
      commas += 1;
    } else if (!quoted && character === ';') {
      semicolons += 1;
    }
  }

  return semicolons > 0 || commas === 0 || semicolons >= commas ? ';' : ',';
}

export function readCsvRows(csv: string): string[][] {
  const content = csv.replace(/^\uFEFF/, '');
  const delimiter = delimiterFor(content);
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];

    if (character === '"') {
      if (quoted && content[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && character === delimiter) {
      row.push(value.trim());
      value = '';
    } else if (!quoted && (character === '\n' || character === '\r')) {
      if (character === '\r' && content[index + 1] === '\n') index += 1;
      row.push(value.trim());
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }

  row.push(value.trim());
  if (row.some((cell) => cell !== '')) rows.push(row);
  if (quoted) throw new Error('El CSV contiene comillas sin cerrar.');

  const headerCellPattern = /^(categor[ií]a|c[oó]digo|code|descripci[oó]n|proveedor|nombre|competidor|imagen(?:es)?|image|enlace|link|url)(?:$|[\s_-])/;
  const hasHeader = rows[0]?.some((cell) => headerCellPattern.test(cell.trim().toLowerCase())) ?? false;
  return hasHeader ? rows.slice(1) : rows;
}
