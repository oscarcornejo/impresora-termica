const path = require('path');

const CORE_DIR = path.resolve(__dirname, '../client/src/lib');

module.exports = {
  preset: '@react-native/jest-preset',
  // El código compartido con la web se prueba con vitest en client/; aquí solo lo que es propio de la app.
  testPathIgnorePatterns: ['/node_modules/', CORE_DIR],
  moduleNameMapper: {
    '^@core/(.*)$': `${CORE_DIR}/$1`,
    '^zod$': '<rootDir>/node_modules/zod',
  },
};
