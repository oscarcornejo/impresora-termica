const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/** Código compartido con la web: carrito, comprobante, codificación de la impresora, acceso a Supabase. */
const CORE_DIR = path.resolve(__dirname, '../client/src/lib');
const APP_ENTRY = path.resolve(__dirname, 'index.js');

const isPackageImport = (name) => !name.startsWith('.') && !path.isAbsolute(name);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [CORE_DIR],
  resolver: {
    // Los paquetes que importa el código compartido (zod, react, supabase…) se toman de mobile/node_modules,
    // como si los importara la app: así no se mezclan dos copias de React o de Supabase.
    resolveRequest: (context, moduleName, platform) => {
      const isFromCore = context.originModulePath.startsWith(CORE_DIR + path.sep);
      const origin = isFromCore && isPackageImport(moduleName) ? APP_ENTRY : context.originModulePath;
      return context.resolveRequest({ ...context, originModulePath: origin }, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
