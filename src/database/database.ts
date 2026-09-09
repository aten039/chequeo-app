import * as SQLite from 'expo-sqlite';
import { PriceCheck, Product } from './types';

const database = SQLite.openDatabaseSync('chequeo-precios.db');

function hasColumn(table: string, column: string) {
  return database.getAllSync<{ name: string }>(`PRAGMA table_info(${table})`).some((item) => item.name === column);
}

function migrateLegacySchema() {
  if (hasColumn('products', 'id') && !hasColumn('products', 'code')) database.execSync('ALTER TABLE products RENAME TO products_legacy');
  if (hasColumn('price_checks', 'product_id')) database.execSync('ALTER TABLE price_checks RENAME TO register_legacy');
  if (hasColumn('competitors', 'id') && !hasColumn('competitors', 'nombre')) database.execSync('ALTER TABLE competitors RENAME TO competitors_legacy');
}

export function initializeDatabase() {
  database.execSync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  migrateLegacySchema();
  database.execSync(`
    CREATE TABLE IF NOT EXISTS products (
      category TEXT NOT NULL,
      code INTEGER PRIMARY KEY NOT NULL,
      description TEXT NOT NULL,
      provider TEXT NOT NULL,
      cod_ext TEXT
    );
    CREATE TABLE IF NOT EXISTS competitors (
      nombre TEXT PRIMARY KEY NOT NULL
    );
    CREATE TABLE IF NOT EXISTS register (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_code INTEGER NOT NULL,
      competitor TEXT NOT NULL,
      price REAL NOT NULL,
      brand TEXT,
      status TEXT NOT NULL CHECK (status IN ('Igual', 'Similar')),
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_code) REFERENCES products(code) ON DELETE CASCADE
    );
  `);

  if (hasColumn('products_legacy', 'id')) {
    database.execSync(`
      INSERT OR IGNORE INTO products (category, code, description, provider, cod_ext)
      SELECT category, CAST(id AS INTEGER), description, provider, NULL FROM products_legacy;
      DROP TABLE products_legacy;
    `);
  }
  if (hasColumn('competitors_legacy', 'name')) {
    database.execSync(`
      INSERT OR IGNORE INTO competitors (nombre) SELECT name FROM competitors_legacy;
      DROP TABLE competitors_legacy;
    `);
  }
  if (hasColumn('register_legacy', 'product_id')) {
    database.execSync(`
      INSERT INTO register (product_code, competitor, price, brand, status, notes, created_at)
      SELECT CAST(product_id AS INTEGER), competitor, price, brand, status, notes, created_at
      FROM register_legacy
      WHERE CAST(product_id AS INTEGER) IN (SELECT code FROM products);
      DROP TABLE register_legacy;
    `);
  }
}

export function clearDatabase() {
  database.withTransactionSync(() => {
    database.execSync(`
      DELETE FROM register;
      DELETE FROM products;
      DELETE FROM competitors;
      DELETE FROM sqlite_sequence WHERE name = 'register';
    `);
  });
}

export function replaceProducts(products: Product[]) {
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
  database.withTransactionSync(() => {
    database.runSync('DELETE FROM competitors');
    for (const name of names) database.runSync('INSERT INTO competitors (nombre) VALUES (?)', name);
  });
}

export function listProducts(): Product[] {
  return database.getAllSync<Product>('SELECT category, code, description AS desc, provider AS prov, cod_ext AS codExt FROM products ORDER BY code');
}

export function savePriceCheck(check: Omit<PriceCheck, 'id' | 'createdAt'>) {
  const createdAt = new Date().toISOString();
  const result = database.runSync(
    `INSERT INTO register (product_code, competitor, price, brand, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    check.productCode, check.competitor, check.price, check.brand ?? null, check.status, check.notes ?? null, createdAt,
  );
  return { ...check, id: result.lastInsertRowId, createdAt };
}

export function updatePriceCheck(check: PriceCheck) {
  database.runSync(
    `UPDATE register SET competitor = ?, price = ?, brand = ?, status = ?, notes = ? WHERE id = ?`,
    check.competitor, check.price, check.brand ?? null, check.status, check.notes ?? null, check.id,
  );
}

export function listPriceChecks(): PriceCheck[] {
  return database.getAllSync<PriceCheck>('SELECT id, product_code AS productCode, competitor, price, brand, status, notes, created_at AS createdAt FROM register ORDER BY id DESC');
}

export function listPriceChecksForProduct(productCode: number) {
  return listPriceChecks().filter((check) => check.productCode === productCode);
}
