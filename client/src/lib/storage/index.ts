// Repositorios sobre el almacenamiento del navegador. Se crean en cada uso: si el navegador
// bloquea localStorage, el error llega a quien llamó y se muestra en pantalla.
import { createBusinessRepository } from './business';
import { createProductRepository } from './products';
import { browserStorage } from './store';

export const productRepository = () => createProductRepository(browserStorage());
export const businessRepository = () => createBusinessRepository(browserStorage());
