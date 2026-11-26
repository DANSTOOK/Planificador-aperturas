// Respaldo de la base de Supabase: descarga las 5 tablas a archivos JSON.
// Uso: node scripts/respaldo.mjs <carpeta-destino>
// Variables: SUPABASE_URL y SUPABASE_KEY (llave pública o, si el acceso se cierra, una llave con lectura).
import fs from 'node:fs';
import path from 'node:path';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_KEY;
const out = process.argv[2];
if (!URL || !KEY || !out) { console.error('Faltan SUPABASE_URL, SUPABASE_KEY o la carpeta destino'); process.exit(1); }

const TABLES = ['tiendas', 'plataformas', 'subdepartamentos', 'pasos', 'actividad'];
const ORDER = { tiendas: 'cr', plataformas: 'id', subdepartamentos: 'id', pasos: 'id', actividad: 'id' };

async function all(table) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${URL}/rest/v1/${table}?select=*&order=${ORDER[table]}`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Range: `${from}-${from + 999}`, 'Range-Unit': 'items' },
    });
    if (!res.ok && res.status !== 206) throw new Error(`${table}: ${res.status} ${await res.text()}`);
    const part = await res.json();
    rows.push(...part);
    if (part.length < 1000) break;
  }
  return rows;
}

fs.mkdirSync(out, { recursive: true });
const resumen = { fecha: new Date().toISOString(), tablas: {} };
for (const t of TABLES) {
  const rows = await all(t);
  fs.writeFileSync(path.join(out, `${t}.json`), JSON.stringify(rows, null, 1));
  resumen.tablas[t] = rows.length;
  console.log(`${t}: ${rows.length}`);
}
if (!resumen.tablas.tiendas) { console.error('La base regresó 0 tiendas: no se guarda el respaldo'); process.exit(2); }
fs.writeFileSync(path.join(out, 'resumen.json'), JSON.stringify(resumen, null, 1));
