# Impresora térmica Bluetooth

App web para vender e imprimir comprobantes en una impresora térmica Bluetooth (BLE): impresoras
**ESC/POS** de 58 y 80 mm y "cat printers" como la **YT01**. Corre entera en el navegador y se publica
como sitio estático (Netlify).

- **Vender:** eliges productos, ajustas cantidades y se arma el comprobante con total, listo para imprimir.
- **Productos:** mantenedor (agregar, editar, eliminar, buscar) y datos del negocio que encabezan el comprobante.
- **Diseñador:** editor libre por bloques (texto, separador, QR, imagen, espacio) con vista previa.

## Uso

```bash
npm install
npm run dev        # http://localhost:5173
npm test
npm run build      # client/dist
```

## Cómo funciona

- **Impresión:** Chrome/Edge se conecta a la impresora por Web Bluetooth y el navegador arma los bytes
  (`client/src/lib/encoding/`: ESC/POS y protocolo cat). Web Bluetooth exige HTTPS (o `localhost`) y no
  existe en iPhone/iPad ni en Safari.
- **Datos:** productos y datos del negocio se guardan en el navegador de cada dispositivo (`localStorage`,
  validados con zod en `client/src/lib/storage/`). Cada celular o computador tiene su propio catálogo, y
  borrar los datos del sitio en el navegador los borra.
- **Sin internet:** un service worker (vite-plugin-pwa) guarda la app; después de abrirla una vez, abre sin
  conexión. En Android se puede instalar en la pantalla de inicio.

## Publicar en Netlify

`netlify.toml` define el build (`npm run build -w client`, publica `client/dist`) y los encabezados de
seguridad. Desde la carpeta del proyecto:

```bash
npm run build
npx netlify-cli deploy --dir client/dist          # borrador para revisar
npx netlify-cli deploy --dir client/dist --prod   # publicar
```

## Notas

- Los acentos y la ñ se envían en la tabla de caracteres PC850.
- El QR usa el comando nativo `GS ( k`; algunas impresoras muy baratas no lo soportan.
- Las "cat printers" (**YT01**, GB01, GB02, GB03, GT01, MX05…) no usan ESC/POS sino un protocolo propio que solo
  imprime imágenes de 384 puntos. Se detectan por su nombre: la app dibuja el ticket completo como imagen
  (texto, QR, logos) y lo codifica con el protocolo cat. En este modo el papel queda fijo en 58 mm. No tienen
  cortador: la opción de corte imprime una línea `- - ✂ - -` y avanza papel extra para rasgar el ticket.
- `server/` es el servidor Node anterior (SQLite, impresión por puerto serie). La app ya no lo usa.
