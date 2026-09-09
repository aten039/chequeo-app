import * as SQLite from 'expo-sqlite';
import { PriceCheck, Product } from './types';

const database = SQLite.openDatabaseSync('chequeo-precios.db');

export function initializeDatabase() {
  database.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      description TEXT NOT NULL,
      provider TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS price_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      competitor TEXT NOT NULL,
      price REAL NOT NULL,
      brand TEXT,
      status TEXT NOT NULL CHECK (status IN ('Igual', 'Similar')),
      notes TEXT,
      created_at TEXT NOT NULL
    );
  `);
  try {
    database.execSync("ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT ''");
  } catch {
    // La columna ya existe en instalaciones nuevas o previamente migradas.
  }

  const notesColumn = database.getAllSync<{ name: string; notnull: number }>('PRAGMA table_info(price_checks)').find((column) => column.name === 'notes');
  if (notesColumn?.notnull) {
    database.withTransactionSync(() => {
      database.execSync('ALTER TABLE price_checks RENAME TO price_checks_legacy');
      database.execSync(`
        CREATE TABLE price_checks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id TEXT NOT NULL,
          competitor TEXT NOT NULL,
          price REAL NOT NULL,
          brand TEXT,
          status TEXT NOT NULL CHECK (status IN ('Igual', 'Similar')),
          notes TEXT,
          created_at TEXT NOT NULL
        );
        INSERT INTO price_checks (id, product_id, competitor, price, brand, status, notes, created_at)
        SELECT id, product_id, competitor, price, brand, status, notes, created_at
        FROM price_checks_legacy;
        DROP TABLE price_checks_legacy;
      `);
    });
  }
}

export function replaceProducts(products: Product[]) {
  database.withTransactionSync(() => {
    database.runSync('DELETE FROM products');
    for (const product of products) {
      database.runSync(
        'INSERT INTO products (id, description, provider, category) VALUES (?, ?, ?, ?)',
        product.id,
        product.desc,
        product.prov,
        product.category,
      );
    }
  });
}

export function listProducts(): Product[] {
  return database.getAllSync<Product>(
    'SELECT id, description AS desc, provider AS prov, category FROM products ORDER BY id',
  );
}

export function savePriceCheck(check: Omit<PriceCheck, 'id' | 'createdAt'>) {
  const result = database.runSync(
    `INSERT INTO price_checks
      (product_id, competitor, price, brand, status, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    check.productId,
    check.competitor,
    check.price,
    check.brand,
    check.status,
    check.notes ?? null,
    new Date().toISOString(),
  );
  return { ...check, id: result.lastInsertRowId, createdAt: new Date().toISOString() };
}

export function updatePriceCheck(check: PriceCheck) {
  database.runSync(
    `UPDATE price_checks
     SET competitor = ?, price = ?, brand = ?, status = ?, notes = ?
     WHERE id = ?`,
    check.competitor,
    check.price,
    check.brand,
    check.status,
    check.notes ?? null,
    check.id,
  );
}

export function listPriceChecks(): PriceCheck[] {
  return database.getAllSync<PriceCheck>(
    `SELECT id, product_id AS productId, competitor, price, brand, status,
      notes, created_at AS createdAt
     FROM price_checks ORDER BY id DESC`,
  );
}

export function listPriceChecksForProduct(productId: string) {
  return listPriceChecks().filter((check) => check.productId === productId);
}
