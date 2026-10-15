import * as SQLite from 'expo-sqlite';
import { PriceCheck, Product, ProductImage } from './types';

const database = SQLite.openDatabaseSync('chequeo-precios-dev.db');
let databaseInitialized = false;

export function initializeDatabase() {
  if (databaseInitialized) return;

  database.execSync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  database.withTransactionSync(() => {
    database.execSync(`
      CREATE TABLE IF NOT EXISTS products (
        category TEXT NOT NULL,
        code INTEGER PRIMARY KEY NOT NULL,
        description TEXT NOT NULL,
        provider TEXT NOT NULL,
        cod_ext TEXT
      );
      CREATE TABLE IF NOT EXISTS competitors (
        name TEXT PRIMARY KEY NOT NULL
      );

      CREATE TABLE IF NOT EXISTS images (
        code INTEGER PRIMARY KEY NOT NULL,
        link TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS register (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_code INTEGER NOT NULL,
        competitor TEXT NOT NULL,
        price REAL NOT NULL,
        brand TEXT,
        status TEXT NOT NULL CHECK (status IN ('Igual', 'Similar')),
        created_at TEXT NOT NULL,
        FOREIGN KEY (product_code) REFERENCES products(code) ON DELETE CASCADE
      );
    `);
  });

  const competitorColumns = database.getAllSync<{ name: string }>('PRAGMA table_info(competitors)');
  if (!competitorColumns.some((column) => column.name === 'name')) {
    if (competitorColumns.some((column) => column.name === 'nombre')) {
      database.execSync('ALTER TABLE competitors RENAME COLUMN nombre TO name');
    } else {
      throw new Error('El esquema de competidores no contiene una columna reconocida.');
    }
  }

  databaseInitialized = true;
}

function ensureDatabase() {
  initializeDatabase();
}

export function clearDatabase() {
  ensureDatabase();
  database.withTransactionSync(() => {
    database.execSync(`
      DELETE FROM register;
      DELETE FROM products;
      DELETE FROM competitors;
      DELETE FROM images;
      DELETE FROM sqlite_sequence WHERE name = 'register';
    `);
  });
}

export function replaceProducts(products: Product[]) {
  ensureDatabase();
  database.withTransactionSync(() => {
    database.runSync('DELETE FROM products');
    for (const product of products) {
      database.runSync(
        `INSERT INTO products (category, code, description, provider, cod_ext) VALUES (?, ?, ?, ?, ?)`,
        product.category,
        product.code,
        product.desc,
        product.prov,
        product.codExt ?? null,
      );
    }
  });
}

export function replaceCompetitors(names: string[]) {
  ensureDatabase();
  database.withTransactionSync(() => {
    database.runSync('DELETE FROM competitors');
    for (const name of names) database.runSync('INSERT INTO competitors (name) VALUES (?)', name);
  });
}

export function replaceProductImages(images: ProductImage[]) {
  ensureDatabase();
  database.withTransactionSync(() => {
    database.runSync('DELETE FROM images');
    for (const image of images) {
      database.runSync('INSERT INTO images (code, link) VALUES (?, ?)', image.code, image.link);
    }
  });
}

export function getProductImageLink(productCode: number): string | null {
  ensureDatabase();
  const image = database.getFirstSync<{ link: string }>(
    'SELECT link FROM images WHERE code = ?',
    productCode,
  );
  return image?.link ?? null;
}

export function listProducts(): Product[] {
  ensureDatabase();
  return database.getAllSync<Product>('SELECT category, code, description AS desc, provider AS prov, cod_ext AS codExt FROM products ORDER BY code');
}

export function listCompetitors(): string[] {
  ensureDatabase();
  const names = database.getAllSync<{ name: string }>('SELECT name FROM competitors ORDER BY name').map((row) => row.name);
  return [...names.filter((name) => name.trim().toLowerCase() !== 'otro'), 'Otro'];
}

export function savePriceCheck(check: Omit<PriceCheck, 'id' | 'createdAt'>) {
  ensureDatabase();
  const createdAt = new Date().toISOString();
  const result = database.runSync(
    `INSERT INTO register (product_code, competitor, price, brand, status, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    check.productCode, check.competitor, check.price, check.brand ?? null, check.status, createdAt,
  );
  return { ...check, id: result.lastInsertRowId, createdAt };
}

export function updatePriceCheck(check: PriceCheck) {
  ensureDatabase();
  database.runSync(
    `UPDATE register SET competitor = ?, price = ?, brand = ?, status = ? WHERE id = ?`,
    check.competitor, check.price, check.brand ?? null, check.status, check.id,
  );
}

export function listPriceChecks(): PriceCheck[] {
  ensureDatabase();
  return database.getAllSync<PriceCheck>('SELECT id, product_code AS productCode, competitor, price, brand, status, created_at AS createdAt FROM register ORDER BY id DESC');
}

export function listPriceChecksForProduct(productCode: number) {
  return listPriceChecks().filter((check) => check.productCode === productCode);
}
