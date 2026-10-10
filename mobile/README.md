# Impresora térmica — app de iPhone

App nativa en React Native 0.87 para vender e imprimir desde iPhone por Bluetooth, sin Bluefy. Usa la misma
base de datos (Supabase) y la misma lógica que la web: carrito, comprobante, búsqueda, copia sin conexión y los
protocolos de impresión ESC/POS y "cat" (YT01) viven en `client/src/lib/` y se importan como `@core/...`.

Lo propio de la app:

- `src/printer/`: Bluetooth nativo (`react-native-ble-manager`), lista de impresoras cercanas, reconexión
  automática a la última impresora y dibujo del ticket con Skia para las impresoras "cat".
- `src/data/`: cliente de Supabase con la sesión guardada en el teléfono y copia sin conexión en AsyncStorage.
- `src/screens/`: Vender, Productos y Ajustes (impresora, papel, datos del comprobante y cuenta).

## Configurar (una vez)

1. Datos de Supabase: copia `src/config.local.example.ts` como `src/config.local.ts` y completa la URL y la
   clave pública (los mismos valores de `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Netlify). Este archivo
   no se sube a git.
2. Dependencias:
   ```sh
   cd mobile
   npm install
   cd ios && pod install
   ```
   En este Mac, CocoaPods es el de Homebrew ARM y rvm interfiere: usa
   `env -u GEM_PATH -u GEM_HOME /opt/homebrew/bin/pod install`.

## Instalar en el iPhone (por cable)

1. Conecta el iPhone al Mac y acepta "Confiar en este computador". En el iPhone activa
   Ajustes › Privacidad y seguridad › Modo de desarrollador (pide reiniciar).
2. Abre `mobile/ios/ImpresoraTermica.xcworkspace` en Xcode.
3. En el proyecto ImpresoraTermica › Signing & Capabilities: marca "Automatically manage signing" y elige tu
   Team (tu Apple ID; agrégalo en Xcode › Settings › Accounts). Si el identificador
   `com.oscarcornejo.impresoratermica` está tomado, cámbialo por otro único.
4. Arriba elige tu iPhone como destino y el esquema en **Release** (Product › Scheme › Edit Scheme › Run ›
   Build Configuration) para que la app funcione sin el Mac. Presiona ▶︎.
5. La primera vez, en el iPhone: Ajustes › General › VPN y gestión de dispositivos › confía en tu Apple ID.

Con un Apple ID gratis la app deja de abrir a los 7 días y hay que repetir el paso 4. Con una cuenta Apple
Developer (USD 99/año) se distribuye por TestFlight o App Store y no caduca.

## Desarrollo

```sh
npm start          # Metro
npm run ios        # simulador (el Bluetooth no funciona en el simulador)
npm test           # pruebas de la app (el código compartido se prueba con `npm test` en client/)
npx tsc --noEmit   # tipos, incluido el código compartido
```
