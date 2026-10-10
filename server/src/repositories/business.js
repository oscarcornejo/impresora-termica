import { toPlain } from '../db.js';

/** Datos del negocio que encabezan el ticket (una sola fila, id = 1). */
export function createBusinessRepository(db) {
  const get = db.prepare('SELECT name, address, phone, footer FROM business WHERE id = 1');
  const update = db.prepare('UPDATE business SET name = ?, address = ?, phone = ?, footer = ? WHERE id = 1');

  return {
    get: () => toPlain(get.get()),
    update({ name, address, phone, footer }) {
      update.run(name, address, phone, footer);
      return toPlain(get.get());
    },
  };
}
