import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { createPrinterManager } from './printer.js';
import { openDatabase } from './db.js';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '127.0.0.1';
const DB_PATH = process.env.DB_PATH ?? fileURLToPath(new URL('../data/tienda.db', import.meta.url));

const printer = createPrinterManager();
const db = openDatabase(DB_PATH);
const app = createApp({ printer, db });

const server = app.listen(PORT, HOST, () => {
  console.info(`Servidor de impresión en http://${HOST}:${PORT}`);
});

async function shutdown() {
  await printer.disconnect();
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
