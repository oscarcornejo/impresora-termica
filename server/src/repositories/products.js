import { toPlain } from '../db.js';

const MAX_RESULTS = 500;
const COLUMNS = 'id, name, price, code, created_at AS createdAt, updated_at AS updatedAt';

// Escapa los comodines de LIKE para que "%" o "_" se busquen literalmente.
const likePattern = (text) => `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

export function isUniqueViolation(err) {
  return /UNIQUE constraint failed/.test(err?.message ?? '');
}

/** @param {import('node:sqlite').DatabaseSync} db */
export function createProductRepository(db) {
  const statements = {
    all: db.prepare(`SELECT ${COLUMNS} FROM products ORDER BY name COLLATE NOCASE LIMIT ${MAX_RESULTS}`),
    search: db.prepare(
      `SELECT ${COLUMNS} FROM products
       WHERE name LIKE ? ESCAPE '\\' OR code LIKE ? ESCAPE '\\'
       ORDER BY name COLLATE NOCASE LIMIT ${MAX_RESULTS}`,
    ),
    byId: db.prepare(`SELECT ${COLUMNS} FROM products WHERE id = ?`),
    insert: db.prepare('INSERT INTO products (name, price, code) VALUES (?, ?, ?)'),
    update: db.prepare(
      `UPDATE products SET name = ?, price = ?, code = ?, updated_at = datetime('now') WHERE id = ?`,
    ),
    remove: db.prepare('DELETE FROM products WHERE id = ?'),
  };

  const findById = (id) => toPlain(statements.byId.get(id));

  return {
    findAll({ search } = {}) {
      const rows = search
        ? statements.search.all(likePattern(search), likePattern(search))
        : statements.all.all();
      return rows.map(toPlain);
    },
    findById,
    create({ name, price, code }) {
      const { lastInsertRowid } = statements.insert.run(name, price, code ?? null);
      return findById(lastInsertRowid);
    },
    update(id, { name, price, code }) {
      const { changes } = statements.update.run(name, price, code ?? null, id);
      return changes > 0 ? findById(id) : null;
    },
    remove(id) {
      return statements.remove.run(id).changes > 0;
    },
  };
}
