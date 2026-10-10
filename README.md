# Impresora térmica Bluetooth

App web para vender e imprimir comprobantes en una impresora térmica Bluetooth (BLE): impresoras
**ESC/POS** de 58 y 80 mm y "cat printers" como la **YT01**. Sitio estático en Netlify; los datos viven en
**Supabase** (Postgres) y se entra con la cuenta del negocio.

- **Vender:** eliges productos, ajustas cantidades y se arma el comprobante con total, listo para imprimir.
- **Productos:** mantenedor (agregar, editar, eliminar, buscar) y datos del negocio que encabezan el comprobante.
- **Diseñador:** editor libre por bloques (texto, separador, QR, imagen, espacio) con vista previa.

## Uso

```bash
npm install
cp client/.env.example client/.env.local   # y completa VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev        # http://localhost:5173
npm test
npm run build      # client/dist
```

## Cómo funciona

- **Impresión:** Chrome/Edge se conecta a la impresora por Web Bluetooth y el navegador arma los bytes
  (`client/src/lib/encoding/`: ESC/POS y protocolo cat). Web Bluetooth exige HTTPS (o `localhost`) y no
  existe en iPhone/iPad ni en Safari.
- **Datos:** productos y datos del negocio en Supabase (`client/src/lib/supabase/`), compartidos por todos los
  dispositivos. Solo las cuentas registradas en la tabla `members` pueden leer y escribir (Row Level Security).
- **Sin internet:** un service worker (vite-plugin-pwa) guarda la app, y cada dispositivo guarda una copia del
  último catálogo y de los datos del negocio: se puede seguir vendiendo e imprimiendo sin señal. Cargar o
  editar productos requiere conexión. Cerrar sesión borra esa copia. En Android se puede instalar en la
  pantalla de inicio.

## Configurar Supabase (una vez)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. *SQL Editor*: ejecuta `supabase/migrations/20261009000000_init.sql`.
3. *Authentication → Users → Add user*: crea la cuenta del negocio (correo y contraseña, marcando *Auto Confirm*).
4. *SQL Editor*: autoriza esa cuenta:
   `insert into public.members (user_id) select id from auth.users where email = 'correo@del-negocio.cl';`
5. *Authentication → Sign In / Providers*: desactiva *Allow new users to sign up*.
6. *Project Settings → API*: copia la URL y la clave pública (anon/publishable) en `client/.env.local` y en
   Netlify (*Site configuration → Environment variables*) como `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

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
- `supabase/*.local.sql` son datos reales para cargar a mano: no se suben al repositorio.
