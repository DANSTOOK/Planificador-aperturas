# Auditoría UI / UX — Aperturas · Check list de plataformas

Fecha: 16 nov 2026 · Versión revisada: 1.0.0 + cambios sin publicar

## Cómo se revisó

- **Pantallas:** Tiendas (inicio), Tienda, Plataforma con subdepartamentos, paso abierto, calendario, resumen por correo, ventanas (alta de tienda, paso, perfil) y Plantillas.
- **Condiciones:** escritorio (1366 px), celular (375 px), tema claro y tema oscuro.
- **Pruebas automáticas** en el navegador, sobre cada texto visible:
  - contraste contra su fondo real (criterio WCAG AA: 4.5:1 en texto normal y 3:1 en texto grande o negrita);
  - tamaño de letra mínimo;
  - áreas táctiles menores a 28 px;
  - botones sin nombre accesible;
  - desbordes horizontales.
- **Medición del recorrido:** cuántos píxeles hay que bajar hasta el primer paso del check list.

## Resumen

| Área | Antes | Después |
|---|---|---|
| Contraste de textos secundarios (claro) | 3.3–3.8 : 1 ❌ | ≥ 4.6 : 1 ✅ |
| Contraste de textos secundarios (oscuro) | 2.5–4.4 : 1 ❌ | ≥ 4.6 : 1 ✅ |
| Primer paso visible en celular (plataforma) | a 1,582 px (≈ 2 pantallas) | a 919 px (≈ 1 pantalla) |
| Letra más chica | 10.5 px | 11 px |
| Botones sin nombre accesible | 0 | 0 |
| Desborde horizontal en celular | 0 | 0 |
| Animaciones que se repiten sin motivo | Sí (al escribir en el buscador) | No |

## Hallazgos y estado

### Prioridad alta

| # | Hallazgo | Impacto | Estado |
|---|---|---|---|
| A1 | En celular, el check list de una plataforma empezaba a 1,582 px: encabezado, pestañas, datos, aviso, subdepartamentos en 2 filas y banda grande antes del primer paso. | La tarea principal (marcar pasos) quedaba escondida. | ✅ Subdepartamentos en una fila deslizable, datos de la plataforma en una franja deslizable y banda más compacta. Ahora empieza a 919 px. |
| A2 | Textos secundarios (gris) con contraste insuficiente: fechas, conteos, etiquetas, roles, número de paso. | Difíciles de leer, sobre todo en pantallas con brillo bajo o al sol. | ✅ Grises ajustados en ambos temas; el número de paso usa gris legible. |
| A3 | Las tiendas que ya abrieron salían en rojo "Abrió con pendientes", aunque nadie les hubiera dado seguimiento. | Alarma falsa: el rojo pierde valor cuando todo está en rojo. | ✅ Ahora dice "Abrió hace N días" en gris. Solo sale en rojo ("Abrió con bloqueos") si tiene pasos bloqueados. |
| A4 | Al escribir en el buscador, todas las tarjetas volvían a hacer la animación de entrada, y las 13 imágenes flotaban al mismo tiempo. | Movimiento constante que distrae y cansa. | ✅ La entrada se anima solo al llegar a la pantalla. La imagen flota solo al pasar el cursor. |

### Prioridad media

| # | Hallazgo | Estado |
|---|---|---|
| M1 | En celular, "Nueva tienda" aparecía dos veces (barra superior y encabezado). | ✅ Se deja solo en el encabezado. |
| M2 | Las ventanas en celular se abrían centradas y cortadas. | ✅ En celular ahora son hojas que suben desde abajo, respetando el área segura del teléfono. |
| M3 | Migas de pan y enlaces de texto con áreas táctiles de 19–20 px. | ✅ Mínimo de 28 px. |
| M4 | La barra lateral mostraba 24 tiendas con "0%" (información repetida). | ✅ Muestra la fecha de apertura; el anillo usa el color de la plaza y el % aparece al pasar el cursor. |
| M5 | En el calendario y en el cuadro "Abrir" (tema oscuro), algunos textos de color tenían poco contraste. | ✅ Ajustado. |
| M6 | Letras de 10.5 px en etiquetas (AVANCE, APERTURA, año del mes, "VIENDO"). | ✅ Mínimo 11 px. |

### Para considerar después

| # | Idea | Por qué |
|---|---|---|
| D1 | ✅ Hecho: vista en Lista en Tiendas además de las tarjetas. | Con 13 aperturas en un mes, las tarjetas grandes obligan a bajar mucho; una lista ayuda a quien revisa todo. |
| D2 | ✅ Hecho: las ayudas se ocultan solas tras verlas en 3 sesiones. | Se puede ocultar con "x", pero podría mostrarse solo la primera vez que se abre la app. |
| D3 | ✅ Hecho: “Seleccionar varios” para cambiar el estatus de varios pasos juntos. | Útil cuando un área termina varios pasos juntos. |
| D4 | Datos compartidos en tiempo real. | Hoy el avance vive en el navegador de cada persona; es la mayor limitante de uso entre plataformas (no es visual, pero afecta toda la experiencia). |

## Lo que ya estaba bien

- Ningún botón sin nombre accesible; la navegación funciona con teclado y tiene foco visible.
- Respeta la opción del sistema de **reducir movimiento**: sin animaciones para quien lo pide.
- No hay desbordes horizontales en celular.
- Estructura clara: Tiendas → Tienda → Plataforma → Subdepartamento → Paso. Cada nivel indica dónde estás (migas, pestañas y la banda "Estás viendo el check list de…").
- Colores con significado constante: verde terminado, ámbar en proceso, rojo bloqueado; un color por plaza y por plataforma.
- Efectos con propósito: la celebración solo aparece al completar una plataforma, y el destello solo al terminar un paso.
