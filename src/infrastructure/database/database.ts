import * as SQLite from "expo-sqlite";

export interface SupplierRecord {
  id: number;
  name: string;
  whatsapp: string;
}

export interface ProductRecord {
  id: number;
  name: string;
  category: string;
  allows_box: number;
  allows_unit: number;
}

const databasePromise = SQLite.openDatabaseAsync("pedido-carnes.db");

export async function initializeDatabase(): Promise<void> {
  const database = await databasePromise;

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      allows_box INTEGER NOT NULL DEFAULT 1,
      allows_unit INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function listSuppliers(): Promise<SupplierRecord[]> {
  const database = await databasePromise;
  return database.getAllAsync<SupplierRecord>(
    "SELECT id, name, whatsapp FROM suppliers ORDER BY name COLLATE NOCASE",
  );
}

export async function createSupplier(name: string, whatsapp: string): Promise<void> {
  const database = await databasePromise;
  await database.runAsync(
    "INSERT INTO suppliers (name, whatsapp) VALUES (?, ?)",
    name.trim(),
    whatsapp.replace(/\D/g, ""),
  );
}

export async function listProducts(): Promise<ProductRecord[]> {
  const database = await databasePromise;
  return database.getAllAsync<ProductRecord>(
    `SELECT id, name, category, allows_box, allows_unit
     FROM products
     ORDER BY category COLLATE NOCASE, name COLLATE NOCASE`,
  );
}

export async function createProduct(input: {
  name: string;
  category: string;
  allowsBox: boolean;
  allowsUnit: boolean;
}): Promise<void> {
  const database = await databasePromise;
  await database.runAsync(
    `INSERT INTO products (name, category, allows_box, allows_unit)
     VALUES (?, ?, ?, ?)`,
    input.name.trim(),
    input.category.trim(),
    input.allowsBox ? 1 : 0,
    input.allowsUnit ? 1 : 0,
  );
}
