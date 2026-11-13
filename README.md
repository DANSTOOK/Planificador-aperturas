# Aperturas · Check list por plataforma

Aplicación web para dar seguimiento a la apertura de tiendas nuevas. Cada tienda es la raíz y dentro de ella cada plataforma (**Conservación (Mtto), Administrativo, Comercial y TI**) tiene su propio check list. Una plataforma puede tener **subdepartamentos** (por ejemplo, dentro de Comercial: Precios y Promociones, Seguimiento Abasto, Ejecución Comercial, Mercadeo y Procesos Comerciales), cada uno con su rol, su check list y su avance.

Está pensada para personas con poca experiencia en portales: la primera vez muestra una guía de 5 pasos (*¿Cómo se usa?*, siempre disponible en el menú), cada pantalla tiene un consejo que se puede ocultar con *Entendido* y los estatus se eligen con botones grandes con ícono.

Funciona sin instalar nada: abre `index.html` con doble clic.

## Cómo está organizada

```
Tiendas
└── OXXO Ameyalli · CR 50AME · apertura 5 dic
    ├── Conservación (Mtto) ··· ingreso 22 oct · 60 %
    ├── Administrativo ········ ingreso 30 oct · 25 %
    ├── Comercial ············· ingreso 16 nov
    │   ├── General de Comercial (pasos de la plataforma)
    │   ├── Precios y Promociones · Analista Precios y Promociones
    │   ├── Seguimiento Abasto ···· Analista Seguimiento Abasto
    │   ├── Ejecución Comercial ··· Coordinador Ejecución Comercial
    │   ├── Mercadeo ·············· Practicante Mercadeo
    │   └── Procesos Comerciales
    └── TI ···················· ingreso 7 nov · 16 %
```

- **Tiendas**: tarjetas con el % general, la cuenta regresiva a la apertura y el % de cada plataforma. Buscador por nombre o CR y filtros (en curso, en riesgo, completas).
- **Tienda**: nombre, CR, fecha de apertura y notas; anillo de avance general; una tarjeta por plataforma con su %, fecha de ingreso y responsable; **cronograma** de ingreso de cada plataforma hasta la apertura con la línea de *Hoy*; y la **actividad reciente** de todas las plataformas.
- **Plataforma**: su propia ventana con el check list. Pestañas para saltar entre plataformas de la misma tienda, fecha de ingreso y responsable editables, y barra de avance.

## Subdepartamentos

- En la ventana de la plataforma, **＋ Subdepartamento** pide el nombre, el **rol** que lo atiende y el responsable. Si el nombre coincide con uno de la plantilla, ofrece cargar sus pasos.
- Al crear uno nuevo se puede guardar en la plantilla de la plataforma para que aparezca en las próximas tiendas.
- Cada subdepartamento se muestra como un bloque con su propio porcentaje, sus pasos y su cuadro para agregar pasos. Los pasos sin subdepartamento quedan en *General de la plataforma*.
- **✎ Editar** cambia nombre, rol o responsable; **✕** lo elimina y permite mover sus pasos a General o borrarlos.
- En la tarjeta de la plataforma (vista de tienda), en el resumen y en Excel se ve el avance de cada subdepartamento.
- En *Mi plataforma* (tu nombre, abajo a la izquierda) puedes elegir también tu subdepartamento; así aparece en tus comentarios.

## Base del equipo (Plazas Tijuana Este, Tijuana Centro y Ensenada)

`data/base.js` trae las tiendas en apertura de **Plaza Tijuana Este**, **Plaza Tijuana Centro** y **Plaza Ensenada** con sus fechas clave, tomadas de la tabla *Tiendas en construcción* de la junta semanal de aperturas. Al abrir la app:

- La tienda con el mismo CR recibe su fecha de apertura, sus fechas clave (inicio y fin de obra, sembrado, puesta operativa, entrada de Mercadeo y Sistemas, entrega de Mantenimiento, RH y CEDIS, plaqueo y fondo fijo…) y el ingreso de cada plataforma. Si no existe, se crea con las plantillas.
- Ingreso por plataforma: **Conservación** = Entrega Mantenimiento; **TI** y **Comercial** = Entrada Mercadeo y Sistemas; **Administrativo** = Plaqueo y fondo fijo.
- Se aplica una vez por versión de la base; para actualizar fechas, edita el archivo, cambia `version` y publica.

Las fechas clave se ven en la tienda, en el *Calendario de la apertura*, junto con el ingreso de cada plataforma y su N-#. La base incluye las aperturas de ambas plazas desde el mes anterior (octubre 2026) para no saturar la vista.

En **Tiendas** se navega por mes: las tiendas que abren en el mes elegido se resaltan y las demás quedan en gris, pero se pueden abrir y seguir avanzando. Los filtros permiten ver solo las del mes o solo las del mes anterior, y arriba se elige la plaza.

## Plazos N-#

**N** es el día de apertura de la tienda. **N-5** son 5 días antes y **N+2**, 2 días después. Se puede usar en:

- **Ingreso de cada plataforma** al dar de alta o editar la tienda (casilla N-# junto a la fecha).
- **Plazo de cada paso** en la ventana del paso, o en la captura rápida escribiendo `Paso | Responsable | N-5`.
- **Plantillas**, para que cada tienda nueva calcule sus fechas.

La tienda muestra en qué día N va ("Hoy es N-18"), cada fecha aparece con su N y el cronograma marca las semanas en N. Si cambia la fecha de apertura, las fechas capturadas en N se recalculan.

## Cada paso del check list

- **Estatus**: ⏳ Pendiente, 🔄 En proceso, ⛔ Bloqueado, ✅ Completado o ➖ No aplica. La casilla lo marca como completado de un clic; al abrir el paso aparecen botones grandes con cada estatus y su significado.
- **Imágenes**: se agregan al crear o editar el paso (arrastrar, pegar con `Ctrl+V` o elegir) o desde el paso abierto. Se comprimen antes de guardarse. Clic para verlas en grande.
- **Comentarios**: para dejar lo que está pendiente, lo que se hizo o a quién se escaló. Pueden llevar imágenes (se pegan directo en el cuadro). `Ctrl+Enter` envía.
- **Seguimiento**: cada cambio de estatus y comentario queda con autor, plataforma y hora.
- **Responsable y fecha límite**: los pasos vencidos se marcan en rojo.
- Al poner un paso en **Bloqueado** se abre el cuadro de comentario para explicar qué lo bloquea.
- Se pueden reordenar (subir / bajar), editar y eliminar. En el cuadro rápido se pueden pegar varias líneas para crear varios pasos de una vez.

## Cómo se calcula el avance

- **Subdepartamento** = sus pasos completados ÷ sus pasos que aplican (los marcados *No aplica* no cuentan).
- **Plataforma** = todos sus pasos (generales y de subdepartamentos) completados ÷ los que aplican.
- **Tienda** = todos los pasos completados de todas las plataformas ÷ todos los pasos que aplican.

La barra muestra además lo que está en proceso (azul) y bloqueado (rojo).

## Plantillas

En **Plantillas** se define el check list base de cada plataforma (un paso por línea), su nombre, su color y sus subdepartamentos con su rol y sus pasos. Al dar de alta una tienda se cargan esos pasos en cada plataforma seleccionada. Los pasos que trae de fábrica son **ejemplos**: ajústalos a lo que maneja cada área. Cambiar una plantilla no modifica las tiendas ya creadas.

Cada línea puede llevar responsable y plazo separados por `|`, contando días antes de la apertura: `Validar recetas de bebidas | Equipo FV | N-2`. Al crear la tienda, la fecha límite se calcula sola (apertura menos 2 días) y se recalcula si cambia la fecha de apertura, salvo que alguien la haya ajustado a mano.

## Trabajo entre plataformas (sinergia)

- **Tu nombre y plataforma** (abajo a la izquierda) aparecen en cada comentario y cambio.
- **Copiar resumen** arma un texto con el avance por plataforma y los bloqueos con su último comentario, listo para pegar en Teams, correo o WhatsApp.
- **Excel (CSV)** descarga todos los pasos de la tienda con estatus, responsable, fecha límite y último comentario.
- **Enviar avance (archivo)** descarga un archivo `.json` de la tienda (con imágenes). Quien lo recibe usa **Recibir avance de otra persona** → *Combinar*: cada paso se queda con su versión más reciente, los comentarios de ambos lados se suman y los pasos eliminados no reaparecen. Así cada plataforma puede avanzar en su computadora y juntar el avance.

## Dónde se guardan los datos

En el navegador de cada persona (IndexedDB), en esa computadora. **No hay servidor**, así que los cambios no se ven en tiempo real en otras computadoras: se comparten con *Enviar avance (archivo)* / *Recibir avance de otra persona*. Usa *Guardar copia de todo* de vez en cuando; si se borran los datos del navegador se pierde lo que no esté respaldado.

La primera vez aparece una tienda de ejemplo (*OXXO Ameyalli*) que puedes editar o eliminar.

## Atajos

| Tecla | Acción |
| --- | --- |
| `/` | Buscar tienda |
| `N` | Nueva tienda (en Tiendas) o nuevo paso (en una plataforma) |
| `Ctrl+Enter` | Enviar comentario |
| `Esc` | Cerrar ventana |
| `←` `→` | Cambiar de imagen en el visor |

## Sitio de pruebas (GitHub Pages)

**https://danstook.github.io/Planificador-aperturas/**

Cada push a `main` publica el sitio automáticamente (flujo *Publicar en GitHub Pages*). Tarda uno o dos minutos. Abajo a la izquierda la app muestra la versión y el commit publicados, por ejemplo `Versión 1.0.0 · a1b2c3d`, para saber qué está viendo cada usuario.

Los datos de cada usuario se guardan en su navegador, así que publicar una versión nueva **no borra** lo que ya capturaron.

## Versiones y rollback

Cada versión estable lleva una etiqueta `vX.Y.Z` y un **release** en GitHub con sus notas y un `.zip` del sitio.

**Publicar una versión nueva**

1. Sube los cambios a `main` (se publican solos en el sitio de pruebas).
2. Cuando la versión esté lista para quedar como estable, cambia el número en `version.js` y agrega su sección en `CHANGELOG.md` (`## [1.1.0] - AAAA-MM-DD`).
3. Crea y sube la etiqueta:

   ```bash
   git tag -a v1.1.0 -m "Versión 1.1.0"
   ```

   ```bash
   git push origin main --tags
   ```

   El flujo *Crear release* valida que `version.js` coincida con la etiqueta y crea el release con las notas del CHANGELOG.

**Regresar a una versión anterior (rollback)**

- **Rápido, sin tocar el código:** en GitHub ve a *Actions → Rollback a una versión → Run workflow* y escribe la versión (por ejemplo `v1.0.0`). En un par de minutos el sitio vuelve a esa versión. Es temporal: el siguiente push a `main` publica lo más reciente.
- **Permanente:** revierte en `main` los commits problemáticos (`git revert <commit>`) y haz push; el sitio se publica con la corrección.
- **Sin GitHub Actions:** cada release incluye `aperturas-vX.Y.Z.zip`; descomprímelo y abre `index.html`.

Las versiones disponibles están en la pestaña **Releases** del repositorio.

## Archivos

| Archivo | Contenido |
| --- | --- |
| `index.html` | Estructura y ventanas (tienda, paso, perfil, visor) |
| `styles.css` | Estilos, tema claro/oscuro y diseño para celular |
| `app.js` | Datos, avance, cronograma, comentarios, imágenes y respaldos |
| `version.js` | Número de versión publicado |
| `CHANGELOG.md` | Historial de versiones (notas de cada release) |
| `scripts/build-site.sh` | Arma la carpeta que se publica en GitHub Pages |
| `.github/workflows/` | Publicación automática, releases y rollback |

Sin dependencias ni compilación; solo carga las tipografías IBM Plex Sans e IBM Plex Mono de Google Fonts (sin conexión usa las del sistema). Para probar con servidor local: `node .claude/serve.js` y abrir http://localhost:5174.
