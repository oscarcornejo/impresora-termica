import express from 'express';
import cors from 'cors';
import { buildDocument } from './escpos.js';
import { buildCatDocument } from './catprinter.js';
import { documentSchema, connectSchema } from './schema.js';
import { listDevices } from './printer.js';
import { ok, fail, validate } from './http.js';
import { createProductRepository } from './repositories/products.js';
import { createBusinessRepository } from './repositories/business.js';
import { productRoutes } from './routes/products.js';
import { businessRoutes } from './routes/business.js';

const JSON_LIMIT = '5mb'; // Las imágenes llegan en base64.

const ENCODERS = { escpos: buildDocument, cat: buildCatDocument };
const encode = (doc) => ENCODERS[doc.protocol](doc);

/**
 * @param {{
 *   printer: ReturnType<import('./printer.js').createPrinterManager>,
 *   db: import('node:sqlite').DatabaseSync,
 *   list?: typeof listDevices,
 *   logger?: Pick<Console, 'error'>,
 * }} deps
 */
export function createApp({ printer, db, list = listDevices, logger = console }) {
  const app = express();
  app.use(cors({ origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/] }));
  app.use(express.json({ limit: JSON_LIMIT }));

  app.use('/api/products', productRoutes(createProductRepository(db)));
  app.use('/api/business', businessRoutes(createBusinessRepository(db)));

  app.get('/api/status', (_req, res) => ok(res, printer.status()));

  app.get('/api/devices', async (req, res) => {
    ok(res, await list({ ble: req.query.ble === '1' }));
  });

  app.post('/api/connect', async (req, res) => {
    const { data, error } = validate(connectSchema, req.body);
    if (error) return fail(res, 400, error);
    ok(res, await printer.connect(data.transport, data.id));
  });

  app.post('/api/disconnect', async (_req, res) => {
    await printer.disconnect();
    ok(res, printer.status());
  });

  app.post('/api/print', async (req, res) => {
    const { data, error } = validate(documentSchema, req.body);
    if (error) return fail(res, 400, error);
    const bytes = encode(data);
    await printer.print(bytes);
    ok(res, { bytes: bytes.length });
  });

  // Devuelve los bytes para la impresora (ESC/POS o cat) para enviarlos por Web Bluetooth.
  app.post('/api/render', (req, res) => {
    const { data, error } = validate(documentSchema, req.body);
    if (error) return fail(res, 400, error);
    res.type('application/octet-stream').send(encode(data));
  });

  // Express 5 propaga los errores de handlers async hasta aquí.
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.too.large') return fail(res, 413, 'La petición es demasiado grande');
    if (err.type === 'entity.parse.failed') return fail(res, 400, 'JSON inválido');
    if (err.status === 400) return fail(res, 400, err.message);
    logger.error('[api]', err);
    fail(res, 500, err.message ?? 'Error inesperado');
  });

  return app;
}
