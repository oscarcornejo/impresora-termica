---
target: client/src/pages/SalePage.tsx
total_score: 19
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 3
target_identity: "file:/Users/admin/impresora-termica/client/src/pages/SalePage.tsx"
target_fingerprint: "sha256:5ac20e687c2fa84613a32de2ec3164a458d0c6c4061bc2f7fcc38017283b31d5"
target_path: /Users/admin/impresora-termica/client/src/pages/SalePage.tsx
timestamp: 2026-10-09T03-59-33Z
slug: src-pages-salepage-tsx
closed: true
---
# Crítica: pantalla Vender (client/src/pages/SalePage.tsx)

Método: dual-agent (A: revisión de diseño · B: detector + navegador). Total 19/40 (Pobre).

## Heurísticas
| # | Heurística | Nota | Problema principal |
|---|---|---|---|
| 1 | Estado del sistema visible | 2 | Estado de impresora lejos del botón en móvil; éxito = "Enviado (N bytes)". |
| 2 | Lenguaje del mundo real | 2 | "Imprimir boleta" vs comprobante interno; jerga Node.js/BLE/ESC/POS; errores crudos. |
| 3 | Control y libertad | 2 | "Nueva venta" borra sin deshacer. |
| 4 | Consistencia | 3 | Acción destructiva con estilo neutro; −/+ como íconos tenues. |
| 5 | Prevención de errores | 1 | Grilla se mueve bajo el dedo; carrito no se vacía al imprimir; búsqueda vacía sin mensaje. |
| 6 | Reconocer vs recordar | 3 | En móvil total y botón nunca visibles juntos. |
| 7 | Flexibilidad y eficiencia | 1 | Sin cantidad escrita, reimpresión ni atajos. |
| 8 | Estético y mínimo | 2 | 60% de la primera pantalla móvil es configuración; total sin jerarquía. |
| 9 | Recuperación de errores | 1 | Toast técnico que tapa el botón, sin indicar qué hacer. |
| 10 | Ayuda | 2 | "Conecta una impresora" no es accionable. |

## Especificidad
Solo la vista previa del comprobante es propia del producto; el resto es panel admin genérico, organizado en torno a la impresora y no al cobro.
Detector: CLI 0 hallazgos; navegador 3 (vacío) / 7 (con carrito). Reales: contraste botón principal 3.7:1 (2.4:1 deshabilitado), placeholder 3.2:1, interlineado 1.25 en nombres. Falsos positivos: sombra/padding de div.paper, pre.p-text, em-dash (separadores del comprobante).

## Problemas prioritarios
1. [P0] Móvil: venta enterrada bajo configuración; total y)~1300 e Imprimir y~1790 en viewport 844. Fix: indicador de impresora en barra superior + barra inferior fija "Total · Imprimir" + vista previa plegable. (adapt, layout)
2. [P0] Carrito no se vacía tras imprimir; "Nueva venta" arriba a la derecha y sin deshacer. Fix: tras imprimir, botón principal pasa a "Nueva venta" + "Reimprimir"; deshacer temporal. (harden)
3. [P1] Escritorio ≥1281px: columna de vista previa crece 320→384px al primer producto y la grilla pasa de 4 a 3 columnas bajo el dedo. Fix: ancho fijo de la columna de vista previa. (layout)
4. [P1] Errores de impresión técnicos en toast que tapa el botón y persiste. Fix: mensajes de terreno junto al botón + Reintentar; hint "Conecta una impresora" accionable. (clarify)
5. [P1] "Boleta" en UI y comprobante sin leyenda. Fix: "Imprimir comprobante" + línea "Comprobante interno - sin valor tributario" (PC850). (clarify)
- [P2] Objetivos táctiles: −/+ 31x26, ✕ 29x26, pestañas 36 alto, enlace 20 alto, checkbox 13x13.
- [P2] Contraste botón principal 3.7:1 / 2.4:1 deshabilitado; total no dominante (18px).

## Personas
- Casey (móvil, una mano): ~560px de configuración antes de productos; catálogo con scroll interno (max-height 340); −/+ y ✕ de 26px pegados; "Nueva venta" fuera del pulgar.
- Jordan (ayudante): elección "Vía Node.js / Vía navegador" como primera tarea; "Conecta una impresora" no accionable; no sabe que debe pulsar "Nueva venta"; error "ETIMEDOUT"; "Editar en el diseñador" bajo Imprimir.
- Vendedor al sol con fila: grises 12–13px ilegibles; tema oscuro sigue al sistema sin opción; >20 líneas empuja Imprimir fuera de pantalla; búsqueda sin resultados vacía; sin reimpresión ni registro.

## Menores
- Éxito en bytes; bug latente de estado obsoleto en onCartChange(addProduct(cart, p)); truncado distinto en carrito y papel; orden alfabético; sin cantidad escrita; título nombra el aparato.

## Preguntas
1. ¿Por qué la impresora es lo primero en pantalla si el principio es cobrar primero?
2. ¿Dónde termina una venta?
3. ¿Hace falta la vista previa completa en cada venta?
