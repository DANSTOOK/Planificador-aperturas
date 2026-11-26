# Base de datos en Supabase

Carpeta para crear la base compartida de **Aperturas · Check list de plataformas**.

## Archivos

| Archivo | Qué es |
|---|---|
| `01_crear_tablas.sql` | Crea las 5 tablas, las reglas de acceso (solo con sesión) y el tiempo real |
| `plantillas/tiendas.csv` | 24 tiendas (CR, nombre, plaza, formato, apertura, fechas clave) |
| `plantillas/plataformas.csv` | 96 plataformas (4 por tienda; Conservación y Administrativo con `bloqueada = true`) |
| `plantillas/subdepartamentos.csv` | 144 subdepartamentos de Comercial (6 por tienda) |
| `plantillas/pasos.csv` | 1,416 pasos con su N-#, fecha límite y estatus |
| `plantillas/actividad.csv` | Solo encabezados: aquí se irán guardando comentarios y cambios de estatus |

## Pasos

1. **Crear las tablas**: Supabase → *SQL Editor* → *New query* → pega todo `01_crear_tablas.sql` → **Run**.
   - No crees las tablas a mano en el *Table Editor*: el SQL ya las crea con sus tipos y relaciones.
2. **Importar los CSV en este orden** (las relaciones lo exigen):
   1. `tiendas` 2. `plataformas` 3. `subdepartamentos` 4. `pasos`
   - *Table Editor* → abre la tabla → **Insert → Import data from CSV** → elige el archivo → **Import**.
   - Las columnas del CSV tienen el mismo nombre que las de la tabla; no hay que mapear nada.
   - `actividad.csv` no se importa por ahora (va vacía).
3. **Revisar**: en *Table Editor* deben verse 24 tiendas, 96 plataformas, 144 subdepartamentos y 1,416 pasos.
4. **Datos para conectar la app**: *Project Settings → API* → copia **Project URL** y **anon public key**.
   - No compartas la `service_role` ni la contraseña de la base.

## Notas

- Las columnas vacías del CSV se guardan como `NULL` (sin dato).
- `sub_id` vacío en `pasos` = pasos generales de la plataforma.
- `estado` acepta: `pendiente`, `proceso`, `bloqueado`, `completado`, `na`.
- Los CSV salen de los datos base del equipo; el avance que cada persona marcó en su navegador se subirá cuando la app se conecte.
