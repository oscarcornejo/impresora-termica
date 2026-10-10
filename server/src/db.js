// Base de datos SQLite incorporada en Node (sin dependencias nativas que compilar).
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// Cada migración se aplica una sola vez, en orden; PRAGMA user_version guarda la última aplicada.
const MIGRATIONS = [
  `CREATE TABLE products (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     price INTEGER NOT NULL CHECK (price >= 0),
     code TEXT,
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   );
   CREATE UNIQUE INDEX products_code_unique ON products(code) WHERE code IS NOT NULL;`,
  `CREATE TABLE business (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     name TEXT NOT NULL DEFAULT 'MI NEGOCIO',
     address TEXT NOT NULL DEFAULT '',
     phone TEXT NOT NULL DEFAULT '',
     footer TEXT NOT NULL DEFAULT '¡Gracias por su compra!'
   );
   INSERT INTO business (id) VALUES (1);`,
];

function migrate(db) {
  const { user_version: current } = db.prepare('PRAGMA user_version').get();
  MIGRATIONS.slice(current).forEach((sql, i) => {
    db.exec('BEGIN');
    try {
      db.exec(sql);
      db.exec(`PRAGMA user_version = ${current + i + 1}`);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw new Error(`Falló la migración ${current + i + 1}: ${err.message}`);
    }
  });
}

/** @param {string} path Ruta del archivo, o ':memory:' para tests. */
export function openDatabase(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL');
  migrate(db);
  return db;
}

/** SQLite devuelve objetos sin prototipo; los convertimos a objetos normales. */
export const toPlain = (row) => (row ? { ...row } : null);
