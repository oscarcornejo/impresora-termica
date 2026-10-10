// Datos del negocio que encabezan el comprobante, guardados en el dispositivo.
import type { Business } from '../types';
import { businessSchema, parseOrThrow } from './schemas';
import { readJson, writeJson } from './store';

export const BUSINESS_KEY = 'impresora-termica:business:v1';

export const DEFAULT_BUSINESS: Business = Object.freeze({
  name: 'MI NEGOCIO',
  address: '',
  phone: '',
  footer: '¡Gracias por su compra!',
});

export interface BusinessRepository {
  get(): Promise<Business>;
  update(input: Business): Promise<Business>;
}

export function createBusinessRepository(storage: Storage): BusinessRepository {
  return {
    async get() {
      return readJson(storage, BUSINESS_KEY, businessSchema, DEFAULT_BUSINESS);
    },
    async update(input) {
      const data = parseOrThrow(businessSchema, input);
      writeJson(storage, BUSINESS_KEY, data);
      return data;
    },
  };
}
