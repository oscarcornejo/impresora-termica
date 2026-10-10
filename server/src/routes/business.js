import { Router } from 'express';
import { ok, fail, validate } from '../http.js';
import { businessSchema } from '../schema.js';

/** @param {ReturnType<import('../repositories/business.js').createBusinessRepository>} business */
export function businessRoutes(business) {
  const router = Router();

  router.get('/', (_req, res) => ok(res, business.get()));

  router.put('/', (req, res) => {
    const { data, error } = validate(businessSchema, req.body);
    if (error) return fail(res, 400, error);
    ok(res, business.update(data));
  });

  return router;
}
