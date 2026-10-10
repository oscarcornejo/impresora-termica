import { Router } from 'express';
import { ok, fail, validate } from '../http.js';
import { productSchema, productIdSchema, productQuerySchema } from '../schema.js';
import { isUniqueViolation } from '../repositories/products.js';

const DUPLICATE_CODE = 'Ya existe un producto con ese código';
const NOT_FOUND = 'Producto no encontrado';

/** @param {ReturnType<import('../repositories/products.js').createProductRepository>} products */
export function productRoutes(products) {
  const router = Router();

  // Ejecuta una escritura traduciendo el código duplicado a un 409 legible.
  const write = (res, action, onSuccess) => {
    try {
      return onSuccess(action());
    } catch (err) {
      if (isUniqueViolation(err)) return fail(res, 409, DUPLICATE_CODE);
      throw err;
    }
  };

  router.get('/', (req, res) => {
    const { data, error } = validate(productQuerySchema, req.query);
    if (error) return fail(res, 400, error);
    ok(res, products.findAll(data));
  });

  router.post('/', (req, res) => {
    const { data, error } = validate(productSchema, req.body);
    if (error) return fail(res, 400, error);
    write(res, () => products.create(data), (created) => ok(res, created, 201));
  });

  router.put('/:id', (req, res) => {
    const id = validate(productIdSchema, req.params.id);
    if (id.error) return fail(res, 400, 'id inválido');
    const { data, error } = validate(productSchema, req.body);
    if (error) return fail(res, 400, error);
    write(res, () => products.update(id.data, data), (updated) =>
      updated ? ok(res, updated) : fail(res, 404, NOT_FOUND),
    );
  });

  router.delete('/:id', (req, res) => {
    const id = validate(productIdSchema, req.params.id);
    if (id.error) return fail(res, 400, 'id inválido');
    if (!products.remove(id.data)) return fail(res, 404, NOT_FOUND);
    ok(res, { id: id.data });
  });

  return router;
}
