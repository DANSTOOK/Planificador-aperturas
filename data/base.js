/* Base del equipo: tiendas de las plazas Tijuana Este, Tijuana Centro, Ensenada y Playas
   con sus fechas clave, desde el mes anterior.
   Fuente: "Conexión junta semanal aperturas", Región Tijuana, 10 nov 2026
   (tablas "Tiendas en construcción" y aperturas del mes).

   Al abrir la app, estas fechas se aplican a la tienda con el mismo CR
   (o se crea si no existe). Para actualizar: cambia las fechas, sube
   "version" y publica. Cada hito usa el formato AAAA-MM-DD. */
window.AP_BASE = {
  version: '2026-11-10e',
  fuente: 'Conexión junta semanal aperturas · 10 nov 2026',
  plazas: ['Tijuana Este', 'Tijuana Centro', 'Ensenada', 'Playas'],
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

    /* ---------- Plaza Ensenada ---------- */
    { plaza: 'Ensenada', cr: '50W65', nombre: 'OXXO Tuxtla Gutiérrez', formato: 'Tradicional', apertura: '2026-10-09' },
    { plaza: 'Ensenada', cr: '50OD3', nombre: 'OXXO Gamiz', formato: 'Tradicional', apertura: '2026-10-31' },
    {
      plaza: 'Ensenada', cr: '5086T', nombre: 'OXXO Elpidio', formato: 'Tradicional', apertura: '2026-11-09',
      hitos: {
        inicioObra: '2026-08-06', sembrado: '2026-10-05', puestaOperativa: '2026-10-20', finObra: '2026-10-27',
        contratoLuz: '2026-10-29', carpetaPermisos: '2026-11-02', mercadeoSistemas: '2026-11-02', entregaMtto: '2026-11-03',
        rhCedis: '2026-11-05', plaqueoFondo: '2026-11-08',
      },
    },
    {
      plaza: 'Ensenada', cr: '502FA', nombre: 'OXXO Avenida B', formato: 'Tradicional', apertura: '2026-11-11',
      hitos: {
        inicioObra: '2026-08-06', sembrado: '2026-10-07', puestaOperativa: '2026-10-22', finObra: '2026-10-28',
        contratoLuz: '2026-10-31', carpetaPermisos: '2026-11-04', mercadeoSistemas: '2026-11-04', entregaMtto: '2026-11-06',
        rhCedis: '2026-11-07', plaqueoFondo: '2026-11-10',
      },
    },
    {
      plaza: 'Ensenada', cr: '509F6', nombre: 'OXXO Piñas', formato: 'Tradicional', apertura: '2026-11-13',
      hitos: {
        inicioObra: '2026-07-15', sembrado: '2026-10-09', finObra: '2026-10-23', contratoLuz: '2026-11-03',
        mercadeoSistemas: '2026-11-03', carpetaPermisos: '2026-11-06', entregaMtto: '2026-11-06', rhCedis: '2026-11-09',
        plaqueoFondo: '2026-11-10',
      },
    },
    {
      plaza: 'Ensenada', cr: '50N0Z', nombre: 'OXXO Minas de Sabino', formato: 'Tradicional', apertura: '2026-11-16',
      hitos: {
        inicioObra: '2026-05-21', sembrado: '2026-10-12', finObra: '2026-10-28', puestaOperativa: '2026-10-29',
        contratoLuz: '2026-11-04', mercadeoSistemas: '2026-11-07', carpetaPermisos: '2026-11-09', entregaMtto: '2026-11-10',
        rhCedis: '2026-11-12', plaqueoFondo: '2026-11-15',
      },
    },
    {
      plaza: 'Ensenada', cr: '50G4Z', nombre: 'OXXO Plaza Mare', formato: 'Nicho', apertura: '2026-11-30',
      hitos: {
        inicioObra: '2026-08-31', sembrado: '2026-10-26', puestaOperativa: '2026-11-10', contratoLuz: '2026-11-19',
        finObra: '2026-11-20', mercadeoSistemas: '2026-11-20', carpetaPermisos: '2026-11-23', entregaMtto: '2026-11-23',
        rhCedis: '2026-11-25', plaqueoFondo: '2026-11-27',
      },
    },
    {
      plaza: 'Ensenada', cr: '5056M', nombre: 'OXXO Oslo', formato: 'Tradicional', apertura: '2027-01-04',
      hitos: {
        inicioObra: '2026-09-23', finObra: '2026-11-27', mercadeoSistemas: '2026-11-27', sembrado: '2026-11-30',
        entregaMtto: '2026-11-30', puestaOperativa: '2026-12-15', contratoLuz: '2026-12-25', carpetaPermisos: '2026-12-28',
        rhCedis: '2026-12-28', plaqueoFondo: '2027-01-01',
      },
    },
    {
      plaza: 'Ensenada', cr: '5039V', nombre: 'OXXO Tixkokob', formato: 'i78', apertura: '2027-02-15',
      hitos: {
        inicioObra: '2026-10-28', sembrado: '2027-01-11', puestaOperativa: '2027-01-26', mercadeoSistemas: '2027-02-04',
        contratoLuz: '2027-02-05', finObra: '2027-02-05', entregaMtto: '2027-02-06', carpetaPermisos: '2027-02-08',
        rhCedis: '2027-02-08', plaqueoFondo: '2027-02-12',
      },
    },
    /* ---------- Plaza Playas ---------- */
    { plaza: 'Playas', cr: '50A1I', nombre: 'OXXO Paseo Chapultepec', formato: 'Nicho', apertura: '2026-10-16' },
    {
      plaza: 'Playas', cr: '50GK6', nombre: 'OXXO Emeterio', formato: 'Tradicional', apertura: '2026-11-16',
      hitos: {
        inicioObra: '2026-08-24', mercadeoSistemas: '2026-10-12', sembrado: '2026-10-17', finObra: '2026-10-23',
        puestaOperativa: '2026-10-28', contratoLuz: '2026-11-04', carpetaPermisos: '2026-11-08', entregaMtto: '2026-11-10',
        rhCedis: '2026-11-12', plaqueoFondo: '2026-11-15',
      },
    },
    {
      plaza: 'Playas', cr: '50T1O', nombre: 'OXXO Astoria', formato: 'Tradicional', apertura: '2026-11-17',
      hitos: {
        inicioObra: '2026-08-26', sembrado: '2026-10-27', puestaOperativa: '2026-10-28', finObra: '2026-11-05',
        contratoLuz: '2026-11-06', mercadeoSistemas: '2026-11-08', carpetaPermisos: '2026-11-10', entregaMtto: '2026-11-11',
        rhCedis: '2026-11-13', plaqueoFondo: '2026-11-16',
      },
    },
    {
      plaza: 'Playas', cr: '50P6K', nombre: 'OXXO Altaplus', formato: 'Tradicional', apertura: '2026-11-27',
      hitos: {
        inicioObra: '2026-08-26', sembrado: '2026-10-23', puestaOperativa: '2026-11-07', finObra: '2026-11-11',
        contratoLuz: '2026-11-17', mercadeoSistemas: '2026-11-17', carpetaPermisos: '2026-11-20', entregaMtto: '2026-11-20',
        rhCedis: '2026-11-23', plaqueoFondo: '2026-11-24',
      },
    },
  ],
};
