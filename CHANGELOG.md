# Historial de versiones

Cada versión publicada tiene su etiqueta (`vX.Y.Z`) y su release en GitHub con el paquete del sitio. Para regresar a una versión anterior, ver **README → Versiones y rollback**.

Formato: la sección de cada versión empieza con `## [X.Y.Z] - AAAA-MM-DD`. El texto de esa sección se usa como notas del release.

## [1.2.0] - 2026-11-23

Responsables por área, check list de Ejecución Comercial, edición y navegación más sencillas, y avance enfocado en TI y Comercial.

- Check list de **Ejecución Comercial** (8 pasos con su plazo N-# y responsable de cada paso).
- Cada subdepartamento tiene **a quién le pertenece**: nombre y, si se quiere, correo y teléfono (se pueden tocar para escribir o llamar). Lo agrega cada área con “Agregar responsable”.
- El **último comentario** de cada paso pendiente se ve en la lista sin abrirlo, para que todos sepan qué falta y qué se va a hacer.
- Ya no se pide el nombre al abrir la app; se pide solo al comentar.
- Tarjeta **Responsable** en cada subdepartamento: botón “Asignar responsable”, sugerencias de personas ya usadas y opción de asignarlo en las demás tiendas de una vez.
- **Editar un paso es más directo**: lápiz en cada paso, responsable y fecha arriba al abrirlo (se tocan para cambiarlos), y ventana ordenada en 3 preguntas con botones rápidos de plazo (N-30 … día de apertura).
- **Navegación de la tienda más clara**: botón “Volver a …” arriba, ruta Tiendas › Tienda › Plataforma y pestañas fijas con Resumen y cada plataforma (ícono y avance) para cambiar de sección sin perderse.
- **Barra lateral más limpia**: ya no muestra todas las tiendas; cuando estás en una tienda aparece “Estás en” con acceso a cada plataforma, y la lista de tiendas queda en una pestaña plegable con buscador.
- **Por ahora solo cuentan TI y Comercial**: Conservación (Mtto) y Administrativo aparecen en gris con candado (“Próximamente”) en todas las aperturas y no influyen en el % de la tienda, los bloqueos, el resumen ni el correo. Sus pasos se conservan para cuando se habiliten.
- Las plataformas **sin subdepartamentos** (como TI) también tienen su tarjeta de **Responsable** (nombre, correo y teléfono opcionales), con sugerencias y opción de asignarlo en las demás tiendas. La celda “Responsable” de cada plataforma se toca para asignarlo.

## [1.1.0] - 2026-11-23

Versión para pruebas con usuarios de la Región Tijuana: 4 plazas y 24 tiendas, check lists reales de TI, Precios y Promociones, Seguimiento Abasto, Procesos Comerciales y Food Service, nuevo diseño, resumen por correo y sitio publicado en GitHub Pages.

- Tiendas en **Tarjetas o Lista** (la lista muestra plaza, apertura, avance y bloqueos en una fila; la elección se recuerda).
- **Seleccionar varios pasos** y marcarlos juntos como completados, en proceso, pendientes o no aplica.
- Las ayudas en pantalla se ocultan solas después de verlas en 3 sesiones.
- Auditoría UI/UX (docs/auditoria-ui-ux.md) y sus correcciones: contraste AA en textos secundarios en ambos temas, check list de plataforma más arriba en celular (de 1,582 a 919 px), tiendas abiertas sin alarma falsa, animaciones que no se repiten al buscar, ventanas tipo hoja en celular, áreas táctiles mínimas de 28 px y barra lateral con fecha y color de plaza.
- Animaciones y efectos en toda la app: entrada escalonada al cambiar de pantalla, porcentajes que suben desde 0, barras que se llenan, efectos al pasar el cursor y al presionar, paso completado con destello y palomita animada, detalle del paso que se despliega suave, confeti al completar una plataforma o la tienda, encabezado de tienda con el color de su plaza, menús y ventanas con transición y avisos con ícono. Respeta la opción de reducir movimiento.
- Check list de **Procesos Comerciales** (9 pasos de aperturas POS con su detalle).
- Inicio con un panel de filtros: fila de **Plaza** y fila de **Mes de apertura** (meses seguidos con su conteo y marca de "Hoy"), buscador y resumen de lo que se está viendo con opción de restablecer. Abre en el mes actual.
- Check list de **Seguimiento Abasto** con las 7 actividades del proceso de aperturas de la región donde Abasto es responsable (cambio a tienda operativa, formato de comunicación, pedido inicial, catálogo vs sembrado, carga de constantes, validación de transferencia y programación de entrega), con fecha límite en N-# y detalle. Las plantillas conservan el detalle de cada paso.
- Botón **Resumen por correo** en cada tienda: avance por plataforma y subdepartamento, bloqueos con su último comentario, pasos vencidos, próximas fechas clave y pendientes. Se puede copiar con formato, abrir en Outlook (.eml), abrir en el correo o copiar como texto.
- Check list real de **Precios y Promociones** (5 pasos); reemplaza los pasos de ejemplo que no se habían tocado.
- Color por plaza en el brillo de las tarjetas y en los filtros: Tijuana Este rojo, Tijuana Centro verde, Playas azul y Ensenada amarillo.
- Se suma **Plaza Playas**: Paseo Chapultepec (16 oct), Emeterio (16 nov), Astoria (17 nov) y Altaplus (27 nov), con sus fechas clave.
- Se suma **Plaza Ensenada**: Tuxtla Gutiérrez (9 oct), Gamiz (31 oct), Elpidio (9 nov), Avenida B (11 nov), Piñas (13 nov), Minas de Sabino (16 nov), Plaza Mare (30 nov), Oslo (4 ene 2027) y Tixkokob (15 feb 2027), con sus fechas clave.
- Se suma **Plaza Tijuana Centro**: Tutuli (13 oct), Termales (9 nov), Food Court (16 nov), Stryker (30 nov) y Prologis Fase II (11 ene 2027), con sus fechas clave. Filtro por plaza en el inicio.
- Inicio por mes: se elige el mes con flechas; las tiendas que abren ese mes se resaltan y las demás quedan en gris (se pueden seguir abriendo). Filtros "Todas", "Solo este mes" y "Solo el mes anterior".
- Cada tarjeta muestra su plaza; la plaza se elige al dar de alta la tienda.
- Se agregaron las aperturas recientes de Tijuana Este desde octubre: City Point, Papaloapan, Ameyalli y Alegranza.
- El cronograma de la tienda ahora es un calendario mensual con la apertura, las fechas clave y el ingreso de cada plataforma.
- Base del equipo de **Plaza Tijuana Este** con las fechas de la junta semanal (10 nov 2026): Mallorca (apertura 30 nov 2026) y Prologis Alamar (apertura 4 ene 2027), con fechas clave e ingreso de cada plataforma.
- Comercial: nuevo subdepartamento **Food Service** (Equipo FV) con 3 pasos y plazos N-5, N-2 y N-10.
- Plantillas con responsable y plazo relativo a la apertura (`Paso | Responsable | N-5`); la fecha límite se calcula sola.
- Plazos **N-#** en toda la app: N es el día de apertura (N-5 = 5 días antes, N+2 = 2 después). Se pueden capturar en el paso, en la captura rápida (`Paso | Responsable | N-5`) y en el ingreso de cada plataforma; la tienda muestra "Hoy es N-18" y el cronograma marca semanas en N.
- En plataformas con subdepartamentos, cada uno abre su propio check list (se elige en sus cuadros) para no mezclar pasos.
- Tiendas y plataformas en cuadros con icono; cronograma en su propia pestaña; inicio más compacto.

## [1.0.0] - 2026-11-11

Primera versión para pruebas con usuarios.

- Tiendas como raíz: nombre, CR, fecha de apertura y fecha de ingreso de cada plataforma.
- Plataformas: Conservación (Mtto), Administrativo, Comercial y TI.
- Comercial con subdepartamentos y su rol: Precios y Promociones, Seguimiento Abasto, Ejecución Comercial, Mercadeo y Procesos Comerciales.
- Check list de TI con 17 pasos.
- Avance por subdepartamento, por plataforma y general de la tienda; cronograma de ingreso de plataformas hasta la apertura.
- Estatus por paso (pendiente, en proceso, bloqueado, completado, no aplica), comentarios con autor, fotos y fecha límite.
- Lista de plataformas desplegable en la tienda y ventana de check list por plataforma.
- Plantillas editables por plataforma y subdepartamento.
- Copiar resumen, descarga a Excel (CSV), envío y combinación de avances entre personas.
- Guía de uso, tema claro y oscuro, diseño para celular.
