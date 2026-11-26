// Restaura un respaldo en la base de Supabase.
// Uso: node scripts/restaurar.mjs <carpeta-del-respaldo>
// Vuelve a subir cada fila del respaldo tal como estaba (lo que exista se sobrescribe).
// Lo que se haya creado DESPUÉS del respaldo no se borra.
import fs from 'node:fs';
import path from 'node:path';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_KEY;
const dir = process.argv[2];
if (!URL || !KEY || !dir) { console.error('Faltan SUPABASE_URL, SUPABASE_KEY o la carpeta del respaldo'); process.exit(1); }

const TABLES = ['tiendas', 'plataformas', 'subdepartamentos', 'pasos', 'actividad']; // orden de dependencias
const PK = { tiendas: 'cr', plataformas: 'id', subdepartamentos: 'id', pasos: 'id', actividad: 'id' };

for (const t of TABLES) {
  const file = path.join(dir, `${t}.json`);
  if (!fs.existsSync(file)) { console.log(`${t}: no está en el respaldo`); continue; }
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (let i = 0; i < rows.length; i += 500) {
    const part = rows.slice(i, i + 500);
    const res = await fetch(`${URL}/rest/v1/${t}?on_conflict=${PK[t]}`, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(part),
    });
    if (!res.ok) throw new Error(`${t}: ${res.status} ${await res.text()}`);
  }
  console.log(`${t}: ${rows.length} restaurados`);
}
