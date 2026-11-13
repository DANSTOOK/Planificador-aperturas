/* Base del equipo: tiendas de Plaza Tijuana Este y Plaza Tijuana Centro
   con sus fechas clave, desde el mes anterior.
   Fuente: "Conexión junta semanal aperturas", Región Tijuana, 10 nov 2026
   (tablas "Tiendas en construcción" y aperturas del mes).

   Al abrir la app, estas fechas se aplican a la tienda con el mismo CR
   (o se crea si no existe). Para actualizar: cambia las fechas, sube
   "version" y publica. Cada hito usa el formato AAAA-MM-DD. */
window.AP_BASE = {
  version: '2026-11-10c',
  fuente: 'Conexión junta semanal aperturas · 10 nov 2026',
  plazas: ['Tijuana Este', 'Tijuana Centro'],
  tiendas: [
    /* ---------- Plaza Tijuana Este ---------- */
    // Aperturas recientes, solo con su fecha de apertura
    { plaza: 'Tijuana Este', cr: '502I8', nombre: 'OXXO City Point', formato: 'Nicho', apertura: '2026-10-05' },
    { plaza: 'Tijuana Este', cr: '503IQ', nombre: 'OXXO Papaloapan', formato: 'i78', apertura: '2026-10-27' },
    { plaza: 'Tijuana Este', cr: '50D2U', nombre: 'OXXO Ameyalli', formato: 'i78', apertura: '2026-10-31' },
    { plaza: 'Tijuana Este', cr: '50CS9', nombre: 'OXXO Alegranza', formato: 'i78', apertura: '2026-11-02' },
    // En construcción, con todas sus fechas clave
    {
      plaza: 'Tijuana Este', cr: '507OA', nombre: 'OXXO Mallorca', formato: 'Nicho', apertura: '2026-11-30',
      hitos: {
        inicioObra: '2026-08-10', sembrado: '2026-10-26', finObra: '2026-11-08', contratoLuz: '2026-11-09',
        puestaOperativa: '2026-11-10', mercadeoSistemas: '2026-11-12', carpetaPermisos: '2026-11-23',
        entregaMtto: '2026-11-23', rhCedis: '2026-11-26', plaqueoFondo: '2026-11-27',
      },
    },
    {
      plaza: 'Tijuana Este', cr: '500FJ', nombre: 'OXXO Prologis Alamar', formato: 'Nicho', apertura: '2027-01-04',
      hitos: {
        inicioObra: '2026-09-28', sembrado: '2026-11-30', puestaOperativa: '2026-12-15', mercadeoSistemas: '2026-12-16',
        finObra: '2026-12-17', entregaMtto: '2026-12-18', contratoLuz: '2026-12-25', carpetaPermisos: '2026-12-28',
        rhCedis: '2026-12-28', plaqueoFondo: '2027-01-01',
      },
    },

    /* ---------- Plaza Tijuana Centro ---------- */
    { plaza: 'Tijuana Centro', cr: '5020N', nombre: 'OXXO Tutuli', formato: 'i78', apertura: '2026-10-13' },
    {
      plaza: 'Tijuana Centro', cr: '502A7', nombre: 'OXXO Termales', formato: 'Tradicional', apertura: '2026-11-09',
      hitos: {
        inicioObra: '2026-09-01', sembrado: '2026-10-05', puestaOperativa: '2026-10-22', mercadeoSistemas: '2026-10-28',
        contratoLuz: '2026-10-29', finObra: '2026-10-31', carpetaPermisos: '2026-11-02', entregaMtto: '2026-11-02',
        rhCedis: '2026-11-03', plaqueoFondo: '2026-11-06',
      },
    },
    {
      plaza: 'Tijuana Centro', cr: '506V9', nombre: 'OXXO Food Court', formato: 'Nicho', apertura: '2026-11-16',
      hitos: {
        inicioObra: '2026-09-18', sembrado: '2026-10-12', puestaOperativa: '2026-10-27', contratoLuz: '2026-11-05',
        finObra: '2026-11-07', mercadeoSistemas: '2026-11-07', carpetaPermisos: '2026-11-09', entregaMtto: '2026-11-09',
        rhCedis: '2026-11-11', plaqueoFondo: '2026-11-15',
      },
    },
    {
      plaza: 'Tijuana Centro', cr: '500Y6', nombre: 'OXXO Stryker', formato: 'Nicho', apertura: '2026-11-30',
      hitos: {
        inicioObra: '2026-10-06', sembrado: '2026-10-26', puestaOperativa: '2026-11-10', contratoLuz: '2026-11-20',
        carpetaPermisos: '2026-11-23', mercadeoSistemas: '2026-11-23', finObra: '2026-11-24', entregaMtto: '2026-11-25',
        rhCedis: '2026-11-26', plaqueoFondo: '2026-11-27',
      },
    },
    {
      plaza: 'Tijuana Centro', cr: '50Z45', nombre: 'OXXO Prologis Fase II', formato: 'Nicho', apertura: '2027-01-11',
      hitos: {
        inicioObra: '2026-09-04', sembrado: '2026-12-07', puestaOperativa: '2026-12-22', mercadeoSistemas: '2026-12-30',
        contratoLuz: '2027-01-01', finObra: '2027-01-03', carpetaPermisos: '2027-01-04', entregaMtto: '2027-01-04',
        rhCedis: '2027-01-06', plaqueoFondo: '2027-01-08',
      },
    },
  ],
};
