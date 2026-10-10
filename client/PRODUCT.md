# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Varias personas de un mismo negocio de **venta en feria / venta móvil** en Chile: el dueño y ayudantes
(empleados o familia). Cobran en terreno, de pie, con el cliente esperando, y entregan un comprobante impreso
en una impresora térmica portátil Bluetooth. Usan distintos equipos: un Mac, celulares y posiblemente tablets.

El trabajo principal es **cobrar rápido**: elegir productos, ajustar cantidades, ver el total e imprimir
el comprobante. El trabajo secundario es mantener el catálogo de productos y los datos del negocio.

## Product Purpose

Herramienta propia del negocio (no un producto comercial) para vender e imprimir comprobantes desde
cualquier equipo del equipo de venta, usando impresoras térmicas baratas y portátiles sin depender de apps
del fabricante. El éxito es que una venta se cobre e imprima en segundos, sin errores en el total, aunque la
persona que cobra no sea quien configuró la app.

## Positioning

Funciona con impresoras térmicas de bajo costo que las apps de punto de venta comunes no soportan, incluidas
las "cat printers" BLE como la **YT01** (protocolo propio, solo imprimen imágenes), además de impresoras
ESC/POS estándar. El ticket se arma y previsualiza en la app y se imprime tal cual se ve.

## Operating Context

- **Lugar:** feria o venta en terreno. Probablemente al aire libre (sol directo sobre la pantalla), de pie,
  con una mano ocupada y el cliente esperando. *(Inferido del tipo de negocio; confirmar.)*
- **Impresora actual:** YT01 (cat printer BLE, papel de 58 mm / 384 puntos, sin cortador; se rasga a mano en
  el borde dentado). Funciona con batería; con poca carga imprime pálido.
- **Conexión:** la impresora se conecta por Web Bluetooth desde Chrome/Edge, y el navegador arma los datos de
  impresión. La app es un sitio estático en Netlify (HTTPS); productos y datos del negocio están en Supabase,
  compartidos entre dispositivos, con una cuenta compartida del negocio. Cada dispositivo guarda una copia del
  catálogo para vender sin señal; editar productos requiere conexión.
- **Flujo de venta:** pestaña *Vender* → tocar productos → ajustar cantidades → *Imprimir comprobante* →
  *Nueva venta*. Catálogo y datos del negocio en *Productos*. Editor libre en *Diseñador*.

## Capabilities and Constraints

**Confirmado:**
- Catálogo de productos (nombre, precio entero en pesos chilenos, código opcional) con búsqueda.
- Datos del negocio para el encabezado del comprobante (nombre, dirección, teléfono, mensaje final).
- Carrito con cantidades y total; comprobante armado automáticamente.
- Impresión por Web Bluetooth (BLE): ESC/POS y protocolo "cat" (YT01).
- Intensidad de impresión ajustable y línea de corte para impresoras sin cortador.

**Restricciones técnicas:**
- Web Bluetooth exige contexto seguro (HTTPS) y Chrome/Edge. No existe en Safari ni en los navegadores comunes de
  iPhone/iPad: en iOS se imprime desde **Bluefy** (navegador gratuito con Web Bluetooth); la app lo indica.
- Una sola cuenta del negocio (Supabase Auth); solo las cuentas en la tabla `members` acceden a los datos.
- Impresoras Bluetooth clásico (SPP) no se pueden usar desde el navegador.
- Las impresoras ESC/POS usan la tabla de caracteres PC850: el texto del comprobante debe limitarse a
  caracteres representables (acentos y ñ sí; `…`, espacios especiales de `Intl`, emojis no).
- Precios en CLP, sin decimales.

**Decisiones abiertas (no inventar):**
- **Registro de ventas / cierre del día:** hoy las ventas no se guardan.
- **App nativa para iPhone:** si Bluefy no basta, empaquetar con Capacitor y un plugin BLE nativo.

## Brand Commitments

Ninguno definido. "Impresora térmica" es un nombre provisional de la app; el nombre real del negocio se
configura en *Datos del comprobante* y aún no se ha entregado.

## Evidence on Hand

No hay nombre de negocio, logo, productos reales ni fotos todavía. Los productos "Café americano",
"Medialuna", etc. y "CAFÉ DEL BARRIO" usados en pruebas son ficticios y **no** representan al negocio.
No inventar nombre, logo, rubro específico ni productos.

## Product Principles

1. **Cobrar primero.** La venta (elegir, total, imprimir) debe ser la ruta más corta y la más a mano; todo
   lo demás es secundario.
2. **Lo que ves es lo que se imprime.** La vista previa debe corresponder al papel real, incluidos ancho,
   cortes de línea y caracteres que la impresora no puede imprimir.
3. **Cualquiera del equipo puede usarla.** Sin pasos ocultos ni configuración que solo entienda quien la
   instaló; los errores de impresión se explican con lenguaje de terreno (batería, papel, Bluetooth).
4. **Resistente al terreno.** Pensada para condiciones de feria: conexiones que se caen, impresora que se
   apaga, pantalla al sol, uso con una mano.
5. **Comprobante interno, no documento tributario.** Lo impreso es un comprobante de venta sin valor ante el
   SII; la app no debe presentarlo como boleta electrónica.

## Accessibility & Inclusion

Uso en exteriores y por personas con distinto manejo tecnológico: priorizar contraste alto legible a pleno
sol, objetivos táctiles grandes para uso con una mano y textos simples en español. *(Derivado del contexto
de feria; no hay un estándar formal exigido.)*
