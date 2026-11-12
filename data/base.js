/* Base del equipo: tiendas de Plaza Tijuana Este y sus fechas clave.
   Fuente: "Conexión junta semanal aperturas", Región Tijuana, 10 nov 2026
   (tabla "Tiendas en construcción").

   Al abrir la app, estas fechas se aplican a la tienda con el mismo CR
   (o se crea si no existe). Para actualizar: cambia las fechas, sube
   "version" y publica. Cada hito usa el formato AAAA-MM-DD. */
window.AP_BASE = {
  version: '2026-11-10',
  fuente: 'Conexión junta semanal aperturas · 10 nov 2026',
  plaza: 'Tijuana Este',
  tiendas: [
    {
      cr: '507OA', nombre: 'OXXO Mallorca', formato: 'Nicho', apertura: '2026-11-30',
      hitos: {
        inicioObra: '2026-08-10', sembrado: '2026-10-26', finObra: '2026-11-08', contratoLuz: '2026-11-09',
        puestaOperativa: '2026-11-10', mercadeoSistemas: '2026-11-12', carpetaPermisos: '2026-11-23',
        entregaMtto: '2026-11-23', rhCedis: '2026-11-26', plaqueoFondo: '2026-11-27',
      },
    },
    {
      cr: '500FJ', nombre: 'OXXO Prologis Alamar', formato: 'Nicho', apertura: '2027-01-04',
      hitos: {
        inicioObra: '2026-09-28', sembrado: '2026-11-30', puestaOperativa: '2026-12-15', mercadeoSistemas: '2026-12-16',
        finObra: '2026-12-17', entregaMtto: '2026-12-18', contratoLuz: '2026-12-25', carpetaPermisos: '2026-12-28',
        rhCedis: '2026-12-28', plaqueoFondo: '2027-01-01',
      },
    },
  ],
};
