/* ==========================================================================
   Aperturas · Check list por plataforma
   Tienda (raíz) → plataformas → pasos del check list.
   Todo se guarda en el navegador (IndexedDB). Para compartir entre
   plataformas se exporta un respaldo y se combina en la otra computadora.
   ========================================================================== */
'use strict';

/* ---------- Utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => String(n).padStart(2, '0');
const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => toISO(new Date());
const parseISO = iso => { if (!iso) return null; const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
const daysFrom = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 864e5); // b − a
const fmtDate = (iso, o = { day: 'numeric', month: 'short', year: 'numeric' }) => iso ? parseISO(iso).toLocaleDateString('es-MX', o) : '—';
const fmtShort = iso => fmtDate(iso, { day: 'numeric', month: 'short' });
const fmtDateTime = ts => { const d = new Date(ts); return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }); };
const rel = ts => { const s = (Date.now() - ts) / 1000; if (s < 60) return 'hace un momento'; if (s < 3600) return `hace ${Math.floor(s / 60)} min`; if (s < 86400) return `hace ${Math.floor(s / 3600)} h`; if (s < 604800) return `hace ${Math.floor(s / 86400)} d`; return fmtDateTime(ts); };
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
const trunc = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;
const safeColor = c => /^#[0-9a-f]{6}$/i.test(c || '') ? c : '#137b5f';
const Pref = {
  get(k, f = '') { try { return localStorage.getItem(k) ?? f; } catch { return f; } },
  set(k, v) { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch { /* sin almacenamiento */ } },
};

const STATUS = {
  pendiente: { label: 'Pendiente', hint: 'Aún no se empieza' },
  proceso: { label: 'En proceso', hint: 'Ya se está trabajando' },
  bloqueado: { label: 'Bloqueado', hint: 'No se puede avanzar' },
  completado: { label: 'Completado', hint: 'Terminado' },
  na: { label: 'No aplica', hint: 'No aplica en esta tienda' },
};
const stLabel = k => STATUS[k].label;
const STATUS_KEYS = Object.keys(STATUS);
const PALETTE = ['#137b5f', '#2563eb', '#c2410c', '#7c3aed', '#0891b2', '#b91c1c', '#a16207', '#be185d', '#4d7c0f', '#475569'];

/* Plantillas de ejemplo: se editan en la vista Plantillas */
/* Cada plataforma tiene pasos generales (plantilla) y, si se requiere,
   subdepartamentos con su rol y su propio check list (subs). */
const CATALOG_VERSION = 7;
/* Check list de Seguimiento Abasto (Comercial). Fuente: "Proceso Completo Aperturas",
   hoja Actividades Región TIJ. dias = fecha límite (N-#); la descripción indica desde cuándo se ejecuta. */
const ABASTO_STEPS = [
  { titulo: 'Tienda notificada: colocar la tienda como "Notificada" en CNT', responsable: 'Jefe Administrativo Plaza', dias: 25, descripcion: 'Se ejecuta desde N-40. El jefe administrativo coloca el estatus Notificada en CNT.' },
  { titulo: 'Asignación de segmento: asignar el segmento de la tienda según sus características (ej. entorno)', responsable: 'C. Ejecución C. / Variedad OS', dias: 24, descripcion: 'Se ejecuta desde N-35. Enviar por correo a OS el CR y el segmento a asignar (respuesta máx. 2 días hábiles).' },
  { titulo: 'Captura de mobiliario y equipo', responsable: 'C. Ejecución C.', dias: 19, descripcion: 'Se ejecuta desde N-35. Se puede hacer en cuanto se tenga la asignación de segmento.' },
  { titulo: 'Sembrado: realizar el sembrado de la tienda nueva', responsable: 'C. Ejecución C. / Variedad OS', dias: 11, descripcion: 'Se ejecuta desde N-30. Sembrar de acuerdo al espacio del Mapa Legos (5 días hábiles para recibir retroalimentación). Lo que se siembre después de esta fecha debe esperar 21 días en artículos de CEDIS. Límite N-11.' },
  { titulo: 'Cambio de estatus a tienda operativa: gestionar que la tienda quede Operativa y Autorizada', responsable: 'A. Abasto / Jefe Administrativo Plaza', dias: 10, descripcion: 'Se ejecuta desde N-25. El área administrativa coloca la tienda como operativa en RMS (validar con administrativo).' },
  { titulo: 'Formato de comunicación de apertura: llenar el formato inicial de CEDIS y proveedores (incluye tienda espejo)', responsable: 'C. Ejecución C. / A. Abasto', dias: 10, descripcion: 'Se ejecuta desde N-25. Incluye datos técnicos de la tienda, dirección, fechas de apertura, ubicación y si abre o no con permiso de alcohol.' },
  { titulo: 'Alta en RDM / flexibilidad CEDIS: solicitar y validar el alta de la tienda en RDM de CEDIS', responsable: 'Sistemas CEDIS / A. Solistica', dias: 10, descripcion: 'Se ejecuta desde N-25. Validar el alta en RDM y la alineación de PMO; sin esto no se genera el pedido inicial (de RMS V16 a RDM). Validar también la flexibilidad de CEDIS si la tienda aplica.' },
  { titulo: 'Tienda enviada: validar que la tienda esté enviada en el sembrado', responsable: 'C. Ejecución C. / C. Procesos Comerciales', dias: 15, descripcion: 'Se ejecuta desde N-20. Verificar que la tienda esté enviada y sembrada según el lineamiento (archivo Planogramas Sembrados y Sembrado en Excel).' },
  { titulo: 'Pedido inicial: generar el pedido inicial / catálogo', responsable: 'Abasto OS / A. Abasto', dias: 7, descripcion: 'Se ejecuta desde N-10. Se genera el catálogo con la carga inicial de constantes de la tienda (actividad exclusiva de Región).' },
  { titulo: 'Catálogo vs sembrado: revisar el pedido inicial contra el sembrado', responsable: 'C. Ejecución C. / Procesos Comerciales / A. Abasto', dias: 7, descripcion: 'Se ejecuta desde N-8. Que la variedad del pedido sea la misma que la sembrada, para detectar a tiempo productos que no llegarían para la apertura.' },
  { titulo: 'Carga de constantes del pedido inicial', responsable: 'A. Abasto / Abasto OS', dias: 7, descripcion: 'Se ejecuta en N-7. Solicitar la carga de las constantes iniciales según el pedido tipo de la región; Abasto OS genera el primer pedido.' },
  { titulo: 'Validación de transferencia: validar las cantidades cargadas en la primera transferencia', responsable: 'Abasto OS', dias: 5, descripcion: 'Se ejecuta desde N-6. Revisar que la carga de constantes coincida con lo solicitado por Abasto Región.' },
  { titulo: 'Programación de entrega: programar el recordatorio del aviso de entrega a la tienda', responsable: 'A. Abasto', dias: 6, descripcion: 'Se ejecuta desde N-7. Correo a todos los involucrados con la fecha de recepción del pedido inicial.' },
  { titulo: 'Entrega del pedido inicial de CEDIS a la tienda', responsable: 'CEDIS / Solistica', dias: 4, descripcion: 'Se ejecuta desde N-5. Día de recepción del pedido inicial por parte del equipo de tienda.' },
];
/* Check list de Precios y Promociones (Comercial) */
const PP_STEPS = [
  'Confirmación de TI: TI nos indica cuándo realizar el reenvío de catálogos de P&P',
  'Envío de catálogos: enviar los catálogos correspondientes de precios y promociones',
  'Validación de promociones: TI confirma el consumo correcto y se revisan 5 promociones de diferentes categorías (banner, cabecera, comida rápida, CF y local)',
  'Comunicación de vigencia: compartir la fecha de inicio del siguiente periodo promocional',
  'Validación en punto de venta: comprobar en las cajas de venta que pasen las promociones',
];
const PP_OLD = ['Precios cargados en el sistema', 'Promociones de apertura cargadas', 'Etiquetas de precio colocadas'];
const TI_STEPS = [
  'Alta de tienda en la plataforma ServiceNow (se requiere el número de Retek; solicitarlo a Sadot o Admin)',
  'Alta de los equipos de comunicación (switch, router y AP) y alta de la segmentación de la tienda',
  'Transición y planchado una vez recibido el equipo POS por parte de Aperturas',
  'Asignación de red y nombre de caja para empezar el check list de xPOS',
  'Check list / configuración de xPOS hasta el paso donde se deja escuchando DS50 para recepción de catálogos',
  'Asegurar precios, promociones y catálogos con Galeana y Abril; solicitar reenvío en caso de requerir',
  'Alta de teléfono IP (teléfono negro)',
  'Planchado de caja de ventas 1',
  'Validación física en tienda de la instalación de muebles e infraestructura de red',
  'Instalación de servicios de internet (Telnor, Totalplay)',
  'Instalación de equipos en tienda',
  'Alta de equipos de movilidad',
  'Alta de OXXO Top con EXO, cuenta Microsoft para Teams y cuenta de Tableau',
  'Migración de servicios de la tienda espejo o de la última apertura',
  'Validación de retiros sin tarjeta Spin',
  'Validación de activaciones Spin',
  'Validación y reenvío de promociones y precios'
];
/* Food Service (Comercial). dias = días antes de la apertura (N-5 = 5 días antes). */
const FV_SUB = { id: 'com-fv', nombre: 'Food Service', rol: 'Equipo FV', plantilla: [
  { titulo: 'Habilitación de termos y utensilios FV (membranas, condimenteros, portavasos, etc.)', responsable: 'Equipo FV', dias: 5 },
  { titulo: 'Validar que las recetas de las bebidas estén activas y descarguen el agua que utiliza la tienda para evitar merma de agua en tienda', responsable: 'Equipo FV', dias: 2 },
  { titulo: 'Validar con Caffenio las máquinas con las que empezará la tienda a vender', responsable: 'Equipo FV/Caffenio', dias: 10 },
] };
const DEFAULT_CATALOG = [
  { id: 'mtto', nombre: 'Conservación (Mtto)', color: '#a16207', plantilla: ['Refrigeradores y enfriadores instalados y probados', 'Aire acondicionado funcionando', 'Iluminación interior y exterior', 'Instalación eléctrica y regulador revisados', 'Instalación hidráulica sin fugas'], subs: [] },
  { id: 'adm', nombre: 'Administrativo', color: '#7c3aed', plantilla: ['Alta de la tienda (CR) en sistemas administrativos', 'Fondo de caja asignado', 'Alta del personal en nómina', 'Documentación y permisos en tienda'], subs: [] },
  { id: 'com', nombre: 'Comercial', color: '#be185d', plantilla: ['Surtido inicial definido para la tienda'], subs: [
    { id: 'com-precios', nombre: 'Precios y Promociones', rol: 'Analista Precios y Promociones', plantilla: PP_STEPS },
    { id: 'com-abasto', nombre: 'Seguimiento Abasto', rol: 'Analista Seguimiento Abasto', plantilla: ABASTO_STEPS },
    { id: 'com-ejecucion', nombre: 'Ejecución Comercial', rol: 'Coordinador Ejecución Comercial', plantilla: [] },
    { id: 'com-mercadeo', nombre: 'Mercadeo', rol: 'Practicante Mercadeo', plantilla: [] },
    { id: 'com-procesos', nombre: 'Procesos Comerciales', rol: '', plantilla: [] },
    FV_SUB,
  ] },
  { id: 'ti', nombre: 'TI', color: '#2563eb', plantilla: TI_STEPS, subs: [] },
];

/* ---------- Almacenamiento (IndexedDB, con respaldo en memoria) ---------- */
const DB = (() => {
  let db = null;
  const mem = { kv: new Map(), img: new Map() };
  const open = () => new Promise(res => {
    if (!('indexedDB' in window)) return res(null);
    let req;
    try { req = indexedDB.open('aperturas-checklist', 1); } catch { return res(null); }
    req.onupgradeneeded = () => { req.result.createObjectStore('kv'); req.result.createObjectStore('img'); };
    req.onsuccess = () => res(req.result);
    req.onerror = () => res(null);
    req.onblocked = () => res(null);
  });
  const tx = (name, mode, fn) => new Promise((res, rej) => {
    const t = db.transaction(name, mode); const r = fn(t.objectStore(name));
    t.oncomplete = () => res(r.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
  });
  return {
    async init() { db = await open(); return !!db; },
    get persistent() { return !!db; },
    async get(name, key) {
      if (db) return tx(name, 'readonly', s => s.get(key));
      if (name === 'kv') { try { return JSON.parse(localStorage.getItem('ap-' + key)); } catch { return null; } }
      return mem[name].get(key);
    },
    async set(name, key, val) {
      if (db) return tx(name, 'readwrite', s => s.put(val, key));
      if (name === 'kv') { try { localStorage.setItem('ap-' + key, JSON.stringify(val)); } catch { /* lleno */ } return; }
      mem[name].set(key, val);
    },
    async del(name, key) { if (db) return tx(name, 'readwrite', s => s.delete(key)); mem[name].delete(key); },
  };
})();

const imgCache = new Map();
async function imgData(id) {
  if (imgCache.has(id)) return imgCache.get(id);
  const d = await DB.get('img', id).catch(() => null);
  if (d) imgCache.set(id, d);
  return d;
}
async function putImg(id, data) { imgCache.set(id, data); await DB.set('img', id, data); }
function dropImgs(ids) { ids.forEach(id => { imgCache.delete(id); DB.del('img', id).catch(() => {}); }); }
function hydrate(root) {
  $$('img[data-img]', root).forEach(async im => {
    const d = await imgData(im.dataset.img);
    if (d) im.src = d; else im.closest('.thumb, .task-thumb')?.classList.add('missing');
  });
}
async function compressImage(file, max = 1600) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    let out = c.toDataURL('image/webp', 0.82);
    if (!out.startsWith('data:image/webp')) out = c.toDataURL('image/jpeg', 0.82);
    return out;
  } finally { URL.revokeObjectURL(url); }
}
async function filesToImgs(files) {
  const out = [];
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue;
    try { out.push({ id: uid('i'), data: await compressImage(f) }); } catch { toast(`No se pudo leer ${f.name || 'la imagen'}`, true); }
  }
  return out;
}

/* ---------- Estado ---------- */
let S = null;
const ui = { plaza: '', homeMonth: '', monthScope: 'todas', calMonth: {}, openCrono: false, openActs: false, subSel: {}, curSub: '', selPlat: null, storeTab: 'plats', editPlat: false, nextTask: null, q: '', homeFilter: 'todas', taskFilter: 'todos', open: new Set(), drafts: {}, pending: {}, focusComposer: null };

let saveTimer = 0;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => DB.set('kv', 'state', S).catch(() => toast('No se pudieron guardar los cambios', true)), 60);
}
function commit() { save(); render(); }

function me() {
  const n = Pref.get('ap-user').trim(); if (!n) return '';
  const area = userArea();
  return area ? `${n} · ${area}` : n;
}
function userArea() {
  const [pid, sid] = Pref.get('ap-user-plat').split(':');
  const c = S?.catalogo.find(x => x.id === pid); if (!c) return '';
  const s = sid && c.subs?.find(x => x.id === sid);
  return s ? `${c.nombre} › ${s.nombre}` : c.nombre;
}
const author = () => me() || 'Sin nombre';

function newTask(titulo, extra = {}) {
  const now = Date.now();
  return { id: uid('k'), sub: '', titulo, descripcion: '', responsable: '', limite: '', estado: 'pendiente', imagenes: [], historial: [], creado: now, actualizado: now, ...extra };
}
/* Días respecto a la apertura (N): N-5 = 5 días antes, N = día de apertura,
   N+2 = 2 días después. Internamente: número de días ANTES de la apertura. */
const nTxt = d => d == null ? '' : d > 0 ? `N-${d}` : d === 0 ? 'N' : `N+${-d}`;
function parseN(v) {
  const m = /^\s*N\s*(?:([-+])\s*(\d+))?\s*$/i.exec(v || '');
  if (!m) return null;
  return m[1] ? (m[1] === '-' ? Number(m[2]) : -Number(m[2])) : 0;
}
const nOf = (iso, apertura) => iso && apertura ? daysFrom(iso, apertura) : null;
const nChip = (iso, apertura) => { const d = nOf(iso, apertura); return d == null ? '' : `<span class="n-chip" title="${d > 0 ? `${plural(d, 'día', 'días')} antes de la apertura` : d === 0 ? 'Día de la apertura' : `${plural(-d, 'día', 'días')} después de la apertura`}">${nTxt(d)}</span>`; };

/* Paso de plantilla: texto simple o { titulo, responsable, dias }.
   dias = días antes de la apertura ("N-5"); la fecha límite se calcula sola. */
const tplStep = x => typeof x === 'string' ? { titulo: x, responsable: '', dias: null, descripcion: '' } : { titulo: x.titulo || '', responsable: x.responsable || '', dias: Number.isFinite(x.dias) ? x.dias : null, descripcion: x.descripcion || '' };
function taskFromTpl(x, apertura, extra = {}) {
  const t = tplStep(x);
  return newTask(t.titulo, { descripcion: t.descripcion, responsable: t.responsable, diasN: t.dias, limite: apertura && t.dias != null ? addDays(apertura, -t.dias) : '', ...extra });
}
const tplToLine = x => { const t = tplStep(x); if (!t.responsable && t.dias == null) return t.titulo; return `${t.titulo} | ${t.responsable} | ${nTxt(t.dias)}`.replace(/\s*\|\s*$/, ''); };
function lineToTpl(line) {
  const [titulo, responsable = '', plazo = ''] = line.split('|').map(x => x.trim());
  const dias = parseN(plazo);
  return responsable || dias != null ? { titulo, responsable, dias } : titulo;
}
function newSub(cs, plantilla = true) {
  return { id: cs.id || uid('s'), nombre: cs.nombre, rol: cs.rol || '', responsable: cs.responsable || '', editado: Date.now(), _tasks: plantilla ? (cs.plantilla || []) : [] };
}
function newStorePlat(cat, { ingreso = '', responsable = '', plantilla = true, apertura = '' } = {}) {
  const p = { pid: cat.id, nombre: cat.nombre, color: cat.color, ingreso, responsable, editado: Date.now(), subs: [], tasks: plantilla ? (cat.plantilla || []).map(t => taskFromTpl(t, apertura)) : [] };
  (cat.subs || []).forEach(cs => addSubTo(p, cs, plantilla, apertura));
  return p;
}
function addSubTo(p, cs, plantilla = true, apertura = '') {
  const s = newSub(cs, plantilla);
  if (p.subs.some(x => x.id === s.id)) s.id = uid('s');
  const steps = s._tasks; delete s._tasks;
  p.subs.push(s);
  p.tasks.push(...steps.map(t => taskFromTpl(t, apertura, { sub: s.id })));
  return s;
}
function normalizeStore(st) {
  st.plataformas ||= []; st.actividad ||= []; st.borrados ||= [];
  st.plataformas.forEach(p => {
    p.tasks ||= []; p.subs ||= [];
    const ids = new Set(p.subs.map(s => s.id));
    p.tasks.forEach(k => { k.imagenes ||= []; k.historial ||= []; if (!STATUS[k.estado]) k.estado = 'pendiente'; if (k.sub && !ids.has(k.sub)) k.sub = ''; k.sub ||= ''; });
  });
}
function normalizeCatalog(c) { c.plantilla ||= []; c.subs ||= []; c.subs.forEach(s => { s.id ||= uid('s'); s.rol ||= ''; s.plantilla ||= []; }); return c; }
/* ---------- Base del equipo (data/base.js) ---------- */
// Fechas clave del cronograma de cada tienda, en el orden en que suelen ocurrir
const HITOS = [
  ['inicioObra', 'Inicio de obra'], ['sembrado', 'Sembrado'], ['finObra', 'Fin de obra'], ['contratoLuz', 'Contrato de luz'],
  ['puestaOperativa', 'Puesta operativa'], ['mercadeoSistemas', 'Entrada Mercadeo y Sistemas'], ['carpetaPermisos', 'Carpeta de permisos'],
  ['entregaMtto', 'Entrega Mantenimiento'], ['rhCedis', 'Entrega RH y CEDIS'], ['plaqueoFondo', 'Plaqueo y fondo fijo'],
];
// Qué fecha clave marca el ingreso de cada plataforma
const PLAT_HITO = { mtto: 'entregaMtto', ti: 'mercadeoSistemas', com: 'mercadeoSistemas', adm: 'plaqueoFondo' };
const crKey = c => norm(c).replace(/o/g, '0');
function setApertura(st, nueva) {
  if (!nueva || st.apertura === nueva) return;
  allTasks(st).forEach(k => {
    if (k.diasN == null) return;
    if (!k.limite || (st.apertura && k.limite === addDays(st.apertura, -k.diasN))) k.limite = addDays(nueva, -k.diasN);
  });
  log(st, null, `Cambió la apertura: ${fmtDate(st.apertura)} → ${fmtDate(nueva)}`);
  st.apertura = nueva;
}
/* Aplica las fechas de la base del equipo a las tiendas locales (por CR).
   Solo corre una vez por versión de la base; lo que cada quien capture
   después en su navegador no se pisa hasta la siguiente versión. */
function applyBase() {
  const B = window.AP_BASE;
  if (!B || !Array.isArray(B.tiendas) || S.baseVersion === B.version) return;
  B.tiendas.forEach(b => {
    let st = S.tiendas.find(t => crKey(t.cr) === crKey(b.cr));
    if (!st) {
      st = { id: uid('t'), nombre: b.nombre, cr: b.cr, apertura: b.apertura, notas: '', creado: Date.now(), editado: Date.now(), plataformas: [], actividad: [], borrados: [] };
      st.plataformas = S.catalogo.map(c => newStorePlat(c, { apertura: b.apertura }));
      S.tiendas.push(st);
      log(st, null, `Se dio de alta desde el cronograma (${B.fuente})`);
    } else setApertura(st, b.apertura);
    st.plaza = b.plaza || B.plaza || st.plaza || '';
    st.formato = b.formato || st.formato || '';
    st.hitos = { ...(st.hitos || {}), ...b.hitos };
    st.fuente = B.fuente;
    Object.entries(PLAT_HITO).forEach(([pid, h]) => {
      const p = getPlat(st, pid);
      if (p && b.hitos?.[h] && p.ingreso !== b.hitos[h]) { p.ingreso = b.hitos[h]; p.editado = Date.now(); }
    });
    log(st, null, `Fechas clave actualizadas (${B.fuente})`);
  });
  S.baseVersion = B.version;
}
function hitosList(st) {
  const h = st.hitos || {};
  const t = todayISO();
  const rows = HITOS.filter(([k]) => h[k]).map(([k, l]) => ({ k, l, d: h[k] }));
  if (st.apertura) rows.push({ k: 'apertura', l: 'Apertura', d: st.apertura });
  if (!rows.length) return '';
  rows.sort((a, b) => a.d.localeCompare(b.d));
  return `<div class="hitos">
    <p class="hitos-h"><b>Fechas clave</b>${st.fuente ? `<span>Fuente: ${esc(st.fuente)}</span>` : ''}</p>
    <ol>${rows.map(x => { const st8 = x.d < t ? 'past' : x.d === t ? 'today' : 'next'; return `<li class="hito is-${st8} ${x.k === 'apertura' ? 'is-open' : ''}"><span class="hito-dot"></span><span class="hito-l">${esc(x.l)}</span><span class="hito-d">${fmtDate(x.d, { weekday: 'short', day: 'numeric', month: 'short' })}</span>${nChip(x.d, st.apertura) || ''}</li>`; }).join('')}</ol>
  </div>`;
}

function seedState() {
  const t = todayISO();
  const st = { id: uid('t'), nombre: 'OXXO Ameyalli', cr: '50AME', apertura: addDays(t, 24), notas: 'Tienda de ejemplo: edítala o elimínala', creado: Date.now(), editado: Date.now(), plataformas: [], actividad: [], borrados: [] };
  const off = { mtto: -20, adm: -12, ti: -4, com: 5 };
  st.plataformas = DEFAULT_CATALOG.map(c => newStorePlat(c, { ingreso: addDays(t, off[c.id] ?? 0), apertura: st.apertura }));
  const mark = (pid, states, sub = '') => st.plataformas.find(p => p.pid === pid).tasks.filter(k => k.sub === sub).forEach((k, i) => { if (states[i]) k.estado = states[i]; });
  mark('mtto', ['completado', 'completado', 'completado', 'proceso']);
  mark('adm', ['completado', 'proceso']);
  mark('ti', ['completado', 'completado', 'completado', 'proceso', 'bloqueado']);
  mark('com', ['completado']);
  mark('com', ['completado', 'proceso'], 'com-precios');
  const k = st.plataformas.find(p => p.pid === 'ti').tasks[4];
  k.historial.push({ id: uid('h'), tipo: 'estado', autor: 'Ejemplo · TI', de: 'pendiente', a: 'bloqueado', fecha: Date.now() - 36e5 });
  k.historial.push({ id: uid('h'), tipo: 'comentario', autor: 'Ejemplo · TI', texto: 'No están llegando los catálogos al DS50. Se solicitó el reenvío con Galeana.', imagenes: [], fecha: Date.now() - 35e5 });
  st.actividad.unshift({ fecha: Date.now() - 35e5, autor: 'Ejemplo · TI', pid: 'ti', texto: `Bloqueó “${k.titulo}”` });
  st.actividad.push({ fecha: Date.now() - 864e5, autor: 'Sistema', pid: null, texto: 'Creó la tienda de ejemplo' });
  return { version: CATALOG_VERSION, catalogo: structuredClone(DEFAULT_CATALOG), tiendas: [st] };
}
const subTasks = (p, sid) => p.tasks.filter(k => (k.sub || '') === sid);
const subName = (p, sid) => p.subs.find(s => s.id === sid)?.nombre || '';

const getStore = id => S.tiendas.find(t => t.id === id);
const getPlat = (st, pid) => st.plataformas.find(p => p.pid === pid);
const allTasks = st => st.plataformas.flatMap(p => p.tasks);
function log(st, pid, texto) {
  st.actividad.unshift({ fecha: Date.now(), autor: author(), pid, texto });
  if (st.actividad.length > 400) st.actividad.length = 400;
}

/* ---------- Avance ---------- */
function stats(tasks) {
  const r = { total: tasks.length, pendiente: 0, proceso: 0, bloqueado: 0, completado: 0, na: 0, vencidas: 0 };
  const t = todayISO();
  tasks.forEach(k => {
    r[k.estado]++;
    if (k.limite && k.limite < t && k.estado !== 'completado' && k.estado !== 'na') r.vencidas++;
  });
  r.aplic = r.total - r.na;
  r.pct = r.aplic ? Math.floor(r.completado / r.aplic * 100) : 0;
  return r;
}
function platState(st, p) {
  const s = stats(p.tasks); const t = todayISO();
  if (!s.aplic) return { label: 'Sin pasos', cls: '' };
  if (s.pct === 100) return { label: 'Completa', cls: 'done' };
  if (p.ingreso && p.ingreso > t) return { label: `Ingresa en ${plural(daysFrom(t, p.ingreso), 'día', 'días')}`, cls: 'info' };
  if (s.bloqueado) return { label: 'Con bloqueos', cls: 'danger' };
  if (st.apertura && daysFrom(t, st.apertura) <= 7) return { label: 'En riesgo', cls: 'warn' };
  return { label: 'En curso', cls: 'brand' };
}
function countdown(st) {
  const pct = stats(allTasks(st)).pct;
  if (!st.apertura) return { label: 'Sin fecha', cls: '' };
  const d = daysFrom(todayISO(), st.apertura); const ok = pct === 100;
  if (d > 7) return { label: `Faltan ${d} días`, cls: ok ? 'done' : '' };
  if (d > 1) return { label: `Faltan ${d} días`, cls: ok ? 'done' : 'warn' };
  if (d === 1) return { label: 'Abre mañana', cls: ok ? 'done' : 'warn' };
  if (d === 0) return { label: 'Abre hoy', cls: ok ? 'done' : 'danger' };
  return ok ? { label: `Abrió hace ${plural(-d, 'día', 'días')}`, cls: 'done' } : { label: 'Abrió con pendientes', cls: 'danger' };
}
const bar = (pct, cls = '') => `<div class="bar ${cls} ${pct === 100 ? 'is-full' : ''}" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>`;
function stackBar(s, cls = '') {
  const w = n => s.aplic ? (n / s.aplic * 100).toFixed(2) : 0;
  return `<div class="bar stack ${cls}" role="progressbar" aria-valuenow="${s.pct}" aria-valuemin="0" aria-valuemax="100"><span class="s-done" style="width:${w(s.completado)}%"></span><span class="s-proc" style="width:${w(s.proceso)}%"></span><span class="s-block" style="width:${w(s.bloqueado)}%"></span></div>`;
}
const legend = s => `<div class="legend"><span><i class="l-done"></i>${plural(s.completado, "terminado", "terminados")}</span><span><i class="l-proc"></i>${s.proceso} en proceso</span><span><i class="l-block"></i>${plural(s.bloqueado, "bloqueado", "bloqueados")}</span><span><i class="l-pend"></i>${plural(s.pendiente, "pendiente", "pendientes")}</span>${s.na ? `<span><i class="l-na"></i>${s.na} no aplica${s.na > 1 ? "n" : ""}</span>` : ""}</div>`;

/* ---------- Rutas ---------- */
function route() {
  const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (p[0] === 't' && p[1]) return p[2] === 'p' && p[3] ? { view: 'plat', tid: p[1], pid: p[3] } : { view: 'store', tid: p[1] };
  if (p[0] === 'plantillas') return { view: 'tpl' };
  return { view: 'home' };
}
const storeHref = st => `#/t/${encodeURIComponent(st.id)}`;
const platHref = (st, p) => `${storeHref(st)}/p/${encodeURIComponent(p.pid)}`;

const main = $('#main');
let lastHash = null;
function render() {
  if (!S) return;
  const r = route();
  const st = r.tid ? getStore(r.tid) : null;
  const p = st && r.pid ? getPlat(st, r.pid) : null;
  // conserva borradores de comentarios antes de redibujar
  $$('.composer textarea', main).forEach(t => { const id = t.closest('[data-task]')?.dataset.task; if (id) ui.drafts[id] = t.value; });
  let html, title = 'Aperturas';
  if (r.view === 'tpl') { html = viewTemplates(); title = 'Plantillas · Aperturas'; }
  else if (r.view === 'plat' && p) { html = viewPlat(st, p); title = `${p.nombre} · ${st.nombre}`; }
  else if (r.view === 'store' && st) { html = viewStore(st); title = `${st.nombre} · Aperturas`; }
  else if (r.view !== 'home') { location.replace('#/'); return; }
  else html = viewHome();
  const y = window.scrollY;
  main.innerHTML = html;
  document.title = title;
  renderSidebar(r);
  hydrate(main);
  if (location.hash !== lastHash) { window.scrollTo(0, 0); lastHash = location.hash; } else window.scrollTo(0, y);
  if (ui.focusComposer) {
    const ta = $(`[data-task="${CSS.escape(ui.focusComposer)}"] .composer textarea`, main);
    if (ta) { ta.placeholder = '¿Qué lo está bloqueando y quién debe resolverlo?'; ta.focus(); ta.closest('.task').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    ui.focusComposer = null;
  }
}

function renderSidebar(r) {
  $$('.nav').forEach(n => n.classList.toggle('is-active', (n.dataset.nav === 'tpl' && r.view === 'tpl') || (n.dataset.nav === 'home' && r.view === 'home')));
  $('#countStores').textContent = S.tiendas.length;
  const list = sortedStores();
  $('#sideStores').innerHTML = list.length ? list.map(st => {
    const s = stats(allTasks(st));
    return `<a class="side-store ${r.tid === st.id ? 'is-active' : ''}" href="${storeHref(st)}"><span class="ss-ring" style="--p:${s.pct}"></span><span class="ss-name">${esc(st.nombre)}</span><span class="ss-pct">${s.pct}%</span></a>`;
  }).join('') : '<p class="side-empty">Sin tiendas todavía</p>';
  const n = Pref.get('ap-user').trim();
  const area = userArea();
  $('#userBtn').innerHTML = `<span class="avatar">${esc(n ? initials(n) : '?')}</span><span class="u-txt"><b>${n ? esc(n) : 'Configura tu nombre'}</b><small>${area ? esc(area) : 'Sin plataforma'}</small></span>`;
  const th = Pref.get('ap-theme');
  $('#themeBtn').innerHTML = `${ic(th === 'dark' ? 'moon' : th === 'light' ? 'sun' : 'auto')}<span>Tema ${th === 'dark' ? 'oscuro' : th === 'light' ? 'claro' : 'automático'}</span>`;
}
const sortedStores = () => S.tiendas.slice().sort((a, b) => (a.apertura || '9999').localeCompare(b.apertura || '9999') || a.nombre.localeCompare(b.nombre));

/* ---------- Íconos (trazo de 24px, sin emojis) ---------- */
const ICONS = {
  store: '<path d="M3.5 9.5 5 4.5h14l1.5 5"/><path d="M4.5 9.5V20h15V9.5"/><path d="M3.5 9.5h17"/><path d="M9.5 20v-5.5h5V20"/>',
  template: '<rect x="4.5" y="3.5" width="15" height="17" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.4 2.4 0 1 1 3.3 2.2c-.6.3-.9.8-.9 1.5"/><path d="M12 16.6h.01"/>',
  download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19.5h14"/>',
  upload: '<path d="M12 19.5V9M7.5 13.5 12 9l4.5 4.5"/><path d="M5 4.5h14"/>',
  sun: '<circle cx="12" cy="12" r="3.8"/><path d="M12 2.8v2M12 19.2v2M4.6 4.6 6 6M18 18l1.4 1.4M2.8 12h2M19.2 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  moon: '<path d="M19.5 14.6A7.6 7.6 0 0 1 9.4 4.5a7.6 7.6 0 1 0 10.1 10.1z"/>',
  auto: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  user: '<circle cx="12" cy="8.5" r="3.7"/><path d="M5 20c1.3-3.4 3.9-5.2 7-5.2s5.7 1.8 7 5.2"/>',
  comment: '<path d="M4.5 5.5h15v10.5H10l-5.5 4z"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m20.5 16-4.8-4.8L7 19.5"/>',
  edit: '<path d="M4.5 19.5h4l10-10-4-4-10 10z"/><path d="m13.5 6.5 4 4"/>',
  trash: '<path d="M4.5 7h15M10 11v6M14 11v6"/><path d="m6.5 7 .9 12.5h9.2L17.5 7M9.5 7V4.5h5V7"/>',
  up: '<path d="M12 19V5M6.5 10.5 12 5l5.5 5.5"/>',
  down: '<path d="M12 5v14M6.5 13.5 12 19l5.5-5.5"/>',
  chevron: '<path d="m9.5 6 6 6-6 6"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5v-3a1 1 0 0 0-1-1h-9a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3"/>',
  table: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M3.5 14.5h17M9.5 4.5v15"/>',
  send: '<path d="M20 4 9.8 14.2M20 4l-6.5 16-3.7-5.8L4 10.5z"/>',
  more: '<circle cx="5.5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="18.5" cy="12" r="1.2" fill="currentColor"/>',
  alert: '<path d="M12 4 21 19.5H3z"/><path d="M12 10v4.5M12 17.2h.01"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8h.01"/>',
  x: '<path d="m6.5 6.5 11 11M17.5 6.5l-11 11"/>',
  layers: '<path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L4 17l3 3 5.5-5.5a4 4 0 0 0 5.2-5.2l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  briefcase: '<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V5.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3.5 12.5h17"/>',
  tag: '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1 1 0 0 1 0 1.4l-7.4 7.4a1 1 0 0 1-1.4 0z"/><circle cx="8" cy="8" r="1.4"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M9 20h6M12 16v4"/>',
  truck: '<path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.7"/><circle cx="17" cy="17.5" r="1.7"/>',
  clip: '<path d="m19.5 11.5-7.6 7.6a4.6 4.6 0 0 1-6.5-6.5l7.6-7.6a3.1 3.1 0 0 1 4.4 4.4l-7.6 7.6a1.5 1.5 0 0 1-2.2-2.2l7-7"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4.5 7 7.5 6 7.5-6"/>',
  list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.8" cy="6.5" r=".9" fill="currentColor"/><circle cx="4.8" cy="12" r=".9" fill="currentColor"/><circle cx="4.8" cy="17.5" r=".9" fill="currentColor"/>',
  expand: '<path d="M8 9.5 12 5.5l4 4M8 14.5l4 4 4-4"/>',
  collapse: '<path d="m8 5.5 4 4 4-4M8 18.5l4-4 4 4"/>',
};
const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
function stIcon(e) {
  const body = {
    completado: '<circle cx="10" cy="10" r="8.5" fill="var(--st-done)"/><path d="m6.3 10.2 2.5 2.5 4.9-5.2" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
    proceso: '<circle cx="10" cy="10" r="7.6" fill="none" stroke="var(--st-proc)" stroke-width="1.8"/><path d="M10 5.2a4.8 4.8 0 0 1 0 9.6z" fill="var(--st-proc)"/>',
    bloqueado: '<circle cx="10" cy="10" r="8.5" fill="var(--st-block)"/><path d="M6.4 10h7.2" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
    na: '<circle cx="10" cy="10" r="7.6" fill="none" stroke="var(--st-na)" stroke-width="1.8" stroke-dasharray="2.6 2.4"/>',
    pendiente: '<circle cx="10" cy="10" r="7.6" fill="none" stroke="var(--st-pend)" stroke-width="1.8"/>',
  }[e] || '';
  return `<svg class="st-ic" viewBox="0 0 20 20" aria-hidden="true">${body}</svg>`;
}
const stTag = e => `<span class="st-tag st-${e}">${stIcon(e)}${STATUS[e].label}</span>`;
const sw = (c, cls = '') => `<i class="sw ${cls}" style="--c:${safeColor(c)}"></i>`;

/* ---------- Estructura común ---------- */
function tip(key, html) {
  if (Pref.get('ap-tip-' + key)) return '';
  return `<div class="hint" role="note">${ic('info')}<p>${html}</p><button class="icon-btn" type="button" data-action="hide-tip" data-v="${key}" aria-label="Ocultar esta ayuda" title="Ocultar">${ic('x')}</button></div>`;
}
function openHelp() { $('#helpDlg').showModal(); }
function pageHead({ crumbs = [], title, sub = '', actions = '' }) {
  return `<header class="page-head">
    ${crumbs.length ? `<nav class="crumbs" aria-label="Ruta">${crumbs.map(([l, h]) => h ? `<a href="${h}">${esc(l)}</a>` : `<span aria-current="page">${esc(l)}</span>`).join(`<span class="sep">${ic('chevron')}</span>`)}</nav>` : ''}
    <div class="page-row">
      <div class="page-text"><h1>${title}</h1>${sub ? `<p class="page-sub">${sub}</p>` : ''}</div>
      ${actions ? `<div class="page-actions">${actions}</div>` : ''}
    </div>
  </header>`;
}
function menu(items, label = 'Más acciones') {
  return `<details class="menu"><summary class="btn btn-icon" aria-label="${label}" title="${label}">${ic('more')}</summary>
    <div class="menu-pop" role="menu">${items.map(([a, icn, l, cls]) => a === '-' ? '<hr>' : `<button type="button" role="menuitem" class="menu-item ${cls || ''}" data-action="${a}">${ic(icn)}<span>${l}</span></button>`).join('')}</div></details>`;
}
const dayTxt = st => { const c = countdown(st); return `<span class="days ${c.cls}">${c.label}</span>`; };

/* ---------- Vista: Tiendas ---------- */
/* ---------- Meses ---------- */
const monthKey = iso => (iso || '').slice(0, 7);
const addMonths = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const monthName = (ym, year = true) => { const [y, m] = ym.split('-').map(Number); const s = new Date(y, m - 1, 1).toLocaleDateString('es-MX', year ? { month: 'long', year: 'numeric' } : { month: 'long' }); return s.charAt(0).toUpperCase() + s.slice(1); };

function viewHome() {
  const t = todayISO();
  const rows = sortedStores().map(st => ({ st, s: stats(allTasks(st)) }));
  const curso = rows.filter(x => !(x.s.aplic && x.s.pct === 100));
  const prox = rows.filter(x => x.st.apertura && x.st.apertura >= t && x.s.pct < 100)[0];
  const bloq = rows.reduce((n, x) => n + x.s.bloqueado, 0);
  const dProx = prox ? daysFrom(t, prox.st.apertura) : null;
  const mes = ui.homeMonth || monthKey(t);
  const plazas = [...new Set(S.tiendas.map(x => x.plaza).filter(Boolean))].sort();
  if (ui.plaza && !plazas.includes(ui.plaza)) ui.plaza = '';
  const enMes = rows.filter(x => monthKey(x.st.apertura) === mes && (!ui.plaza || x.st.plaza === ui.plaza)).length;
  const plazaTitulo = ui.plaza || (plazas.length === 1 ? plazas[0] : '');
  return `
  <header class="home-head">
    <h1>Aperturas${plazaTitulo ? ` <span class="hh-plaza">Plaza ${esc(plazaTitulo)}</span>` : ''}</h1>
    <div class="hh-stats" aria-label="Resumen">
      <span class="hs" title="Tiendas con pasos pendientes"><b>${curso.length}</b>en curso</span>
      <span class="hs" title="${prox ? `${esc(prox.st.nombre)} · ${fmtDate(prox.st.apertura)}` : 'Sin aperturas próximas'}"><b>${prox ? (dProx === 0 ? 'Hoy' : `${dProx} d`) : '—'}</b>próxima apertura</span>
      <span class="hs ${bloq ? 'is-alert' : ''}"><b>${bloq}</b>${bloq === 1 ? 'paso bloqueado' : 'pasos bloqueados'}</span>
    </div>
    <button class="btn btn-primary btn-sm" data-action="new-store" type="button">${ic('plus')}Nueva tienda</button>
  </header>
  ${plazas.length > 1 ? `<div class="plaza-bar" role="group" aria-label="Plaza">${[['', 'Todas las plazas'], ...plazas.map(p => [p, `Plaza ${p}`])].map(([k, l]) => { const n = S.tiendas.filter(t => !k || t.plaza === k).length; return `<button type="button" class="plaza-btn ${(ui.plaza || '') === k ? 'is-active' : ''}" ${k ? `data-plaza="${esc(k)}"` : ''} data-action="plaza-filter" data-v="${esc(k)}">${k ? ic('store') : ''}${esc(l)}<span>${n}</span></button>`; }).join('')}</div>` : ''}
  <div class="month-bar">
    <div class="month-nav" role="group" aria-label="Mes de apertura">
      <button class="icon-btn" type="button" data-action="home-month" data-d="-1" aria-label="Mes anterior" title="Mes anterior">${ic('chevron', 'flip')}</button>
      <div class="mn-label"><b>${monthName(mes)}</b><span>${enMes ? plural(enMes, 'apertura', 'aperturas') : 'Sin aperturas'}</span></div>
      <button class="icon-btn" type="button" data-action="home-month" data-d="1" aria-label="Mes siguiente" title="Mes siguiente">${ic('chevron')}</button>
      ${mes !== monthKey(t) ? `<button class="link-btn" type="button" data-action="home-month" data-d="0">Ir a este mes</button>` : ''}
    </div>
    <div class="seg" role="group" aria-label="Mostrar">${[['todas', 'Todas'], ['mes', `Solo ${monthName(mes, false).toLowerCase()}`], ['anterior', `Solo ${monthName(addMonths(mes, -1), false).toLowerCase()}`]].map(([k, l]) => `<button type="button" class="${(ui.monthScope || 'todas') === k ? 'is-active' : ''}" data-action="month-scope" data-v="${k}">${l}</button>`).join('')}</div>
    <label class="search">${ic('search')}<input id="q" type="search" placeholder="Buscar por nombre o CR" value="${esc(ui.q)}" autocomplete="off" aria-label="Buscar tienda"></label>
  </div>
  <div id="homeCards">${homeCards()}</div>`;
}
function homeCards() {
  const q = norm(ui.q);
  const mes = ui.homeMonth || monthKey(todayISO());
  const scope = ui.monthScope || 'todas';
  const rows = sortedStores().map(st => ({ st, s: stats(allTasks(st)) })).filter(({ st }) => {
    if (q && !norm(`${st.nombre} ${st.cr} ${st.plaza || ''}`).includes(q)) return false;
    if (ui.plaza && st.plaza !== ui.plaza) return false;
    if (scope === 'mes') return monthKey(st.apertura) === mes;
    if (scope === 'anterior') return monthKey(st.apertura) === addMonths(mes, -1);
    return true;
  });
  if (S.tiendas.length && !rows.length) return `<div class="panel empty">${ic('calendar', 'empty-ic')}<h3>Sin aperturas</h3><p>No hay tiendas que abran en ${scope === 'anterior' ? monthName(addMonths(mes, -1)) : monthName(mes)}${q ? ' con esa búsqueda' : ''}.</p></div>`;
  return `<div class="store-grid">
    ${rows.map(({ st, s }, i) => { const off = monthKey(st.apertura) !== mes; return `<a class="store-tile ${off ? 'is-off' : 'is-month'}" href="${storeHref(st)}" data-plaza="${esc(st.plaza || '')}" title="Abrir ${esc(st.nombre)}" style="--i:${i}">
      ${s.bloqueado ? `<span class="flag tile-flag" title="${plural(s.bloqueado, 'paso bloqueado', 'pasos bloqueados')}">${ic('alert')}${s.bloqueado}</span>` : ''}
      ${st.plaza ? `<span class="tile-plaza">${ic('store')}Plaza ${esc(st.plaza)}</span>` : ''}
      <div class="tile-top"><span class="tile-ic"><img src="assets/tienda.png" alt=""></span></div>
      <div class="tile-id"><h3 class="tile-name">${esc(st.nombre)}</h3><span class="tile-cr">CR ${esc(st.cr)}</span></div>
      <div class="tile-stats">
        <div class="ts"><span class="ts-l">Avance</span><span class="ts-v ${s.aplic && s.pct === 100 ? 'is-done' : ''}">${s.pct}<small>%</small></span></div>
        <div class="ts ts-date"><span class="ts-l">Apertura</span><span class="ts-v">${st.apertura ? fmtShort(st.apertura) : '—'}</span>${dayTxt(st)}</div>
      </div>
    </a>`; }).join('')}
    <button class="store-tile tile-new" data-action="new-store" type="button" style="--i:${rows.length}">${ic('plus')}<span>Nueva tienda</span></button>
  </div>`;
}

/* Vista de la tienda, pensada para quien la abre por primera vez:
   1) cómo va la tienda en una frase, 2) elige tu plataforma,
   3) cronograma y movimientos guardados en secciones plegables. */
function viewStore(st) {
  const s = stats(allTasks(st));
  const plats = st.plataformas.slice().sort((a, b) => (a.ingreso || '9999').localeCompare(b.ingreso || '9999'));
  const dA = st.apertura ? daysFrom(todayISO(), st.apertura) : null;
  const cuando = dA == null ? 'Sin fecha de apertura' : dA > 1 ? `Abre en <b>${dA} días</b>` : dA === 1 ? 'Abre <b>mañana</b>' : dA === 0 ? 'Abre <b>hoy</b>' : `Abrió hace ${plural(-dA, 'día', 'días')}`;
  const bloqTasks = st.plataformas.flatMap(p => p.tasks.filter(k => k.estado === 'bloqueado').map(k => ({ p, k })));
  const acts = st.actividad.slice(0, 12);
  return `
  <nav class="crumbs" aria-label="Ruta"><a href="#/">Aperturas</a><span class="sep">${ic('chevron')}</span><span aria-current="page">${esc(st.nombre)}</span></nav>
  <section class="sv-hero">
    <img class="sv-img" src="assets/tienda.png" alt="">
    <div class="sv-main">
      <div class="sv-title">
        <h1>${esc(st.nombre)}</h1><span class="cr-chip">CR ${esc(st.cr)}</span>${st.plaza ? `<span class="plaza-chip">Plaza ${esc(st.plaza)}${st.formato ? ` · ${esc(st.formato)}` : ''}</span>` : ''}
      </div>
      <p class="sv-when">${ic('calendar')}<span>${cuando}</span>${st.apertura ? `<span class="muted">· ${fmtDate(st.apertura, { weekday: 'long', day: 'numeric', month: 'long' })}</span><span class="n-chip today" title="Día de hoy respecto a la apertura">Hoy es ${nTxt(nOf(todayISO(), st.apertura))}</span>` : ''}</p>
      <div class="sv-prog">
        <span class="sv-pct">${s.pct}<small>%</small></span>
        <div class="sv-bar">${stackBar(s, 'lg')}<p>${s.aplic ? `<b>${s.completado} de ${s.aplic}</b> pasos terminados en toda la tienda` : 'Aún no hay pasos'}</p></div>
      </div>
      ${bloqTasks.length ? `<button class="sv-alert" type="button" data-action="goto-blocked" data-pid="${esc(bloqTasks[0].p.pid)}" data-id="${esc(bloqTasks[0].k.id)}">${ic('alert')}<span><b>${bloqTasks.length === 1 ? 'Hay 1 paso bloqueado' : `Hay ${bloqTasks.length} pasos bloqueados`}</b> en ${[...new Set(bloqTasks.map(x => x.p.nombre))].join(', ')}</span><span class="sv-alert-go">Ver${ic('chevron')}</span></button>` : ''}
    </div>
    <div class="sv-actions">
      <button class="btn btn-primary" data-action="mail-summary" type="button" title="Resumen del avance por plataforma, bloqueos y pendientes, listo para enviar por correo">${ic('mail')}Resumen por correo</button>
      ${menu([['copy-summary', 'copy', 'Copiar resumen corto (Teams/WhatsApp)'], ['edit-store', 'edit', 'Editar datos de la tienda'], ['export-store', 'send', 'Enviar avance (archivo)'], ['csv-store', 'table', 'Descargar en Excel'], ['-'], ['del-store', 'trash', 'Eliminar tienda', 'danger']])}
    </div>
  </section>

  <section class="sv-step">
    <div class="sv-step-head">
      <span class="sv-num">1</span>
      <div><h2>Elige tu plataforma</h2><p>Toca la tuya para ver sus pasos y marcar lo que ya terminaste.</p></div>
      <button class="link-btn push" data-action="edit-store" type="button">${ic('plus')}Agregar o quitar</button>
    </div>
    ${plats.length ? `<div class="plat-tiles">${plats.map(p => platTile(st, p)).join('')}</div>` : '<div class="panel empty sm"><p>Esta tienda aún no tiene plataformas. Usa “Agregar o quitar”.</p></div>'}
  </section>

  <details class="sv-more" ${ui.openCrono ? 'open' : ''} data-toggle="openCrono">
    <summary>${ic('calendar')}<span><b>Calendario de la apertura</b><small>Calendario con la apertura, las fechas clave y el ingreso de cada plataforma</small></span>${ic('chevron', 'chev')}</summary>
    <div class="sv-more-body">${calendarView(st)}</div>
  </details>
  <details class="sv-more" ${ui.openActs ? 'open' : ''} data-toggle="openActs">
    <summary>${ic('clock')}<span><b>Últimos movimientos</b><small>${st.actividad.length ? `Lo más reciente: ${esc(trunc(st.actividad[0].texto, 70))}` : 'Sin movimientos todavía'}</small></span>${ic('chevron', 'chev')}</summary>
    <div class="sv-more-body"><ul class="acts">${acts.map(a => { const p = a.pid && getPlat(st, a.pid); const who = a.autor.split(' · ')[0]; return `<li>${p ? sw(p.color) : '<i class="sw" style="--c:var(--faint)"></i>'}<span class="act-txt"><b>${esc(who)}</b> ${esc(trunc(a.texto, 90))}</span><time title="${fmtDateTime(a.fecha)}">${rel(a.fecha)}</time></li>`; }).join('') || '<li class="muted">Sin movimientos todavía.</li>'}</ul></div>
  </details>`;
}
const initials = n => String(n || '?').replace(/\(.*?\)/g, '').trim().split(/\s+/).map(w => w[0] || '').slice(0, 2).join('').toUpperCase() || '?';

/* Ícono que representa a cada plataforma (por id o por nombre) */
function platIcon(p) {
  const k = norm(`${p.pid} ${p.nombre}`);
  const name = /mtto|conserv|manten/.test(k) ? 'wrench' : /\badm|administ/.test(k) ? 'briefcase'
    : /\bcom\b|comerc|mercad/.test(k) ? 'tag' : /\bti\b|sistem|tecnolog/.test(k) ? 'monitor'
    : /cedis|logist|abasto/.test(k) ? 'truck' : 'layers';
  return ic(name, 'pt-svg');
}

/* Cada plataforma es un cuadro que abre directo su check list. */
function platTile(st, p) {
  const s = stats(p.tasks); const ps = platState(st, p);
  const showState = ['danger', 'info', 'warn', 'done'].includes(ps.cls);
  return `<a class="plat-tile" href="${platHref(st, p)}" style="--c:${safeColor(p.color)}" title="Abrir el check list de ${esc(p.nombre)}">
    <span class="pt-ic">${platIcon(p)}</span>
    <span class="pt-name">${esc(p.nombre)}</span>
    <span class="pt-pct">${s.pct}<small>%</small></span>
    ${bar(s.pct)}
    <span class="pt-count">${s.aplic ? `${s.completado} de ${s.aplic} pasos` : 'Sin pasos'}</span>
    ${showState ? `<span class="state ${ps.cls}">${ps.cls === 'danger' ? `${ic('alert')}${plural(s.bloqueado, 'bloqueado', 'bloqueados')}` : ps.label}</span>` : '<span class="pt-open">Abrir</span>'}
  </a>`;
}
/* Cronograma de la tienda en forma de calendario mensual */
function calendarView(st) {
  const ev = {};
  const add = (d, t, cls, c) => { if (d) (ev[d] ||= []).push({ t, cls, c }); };
  HITOS.forEach(([k, l]) => add(st.hitos?.[k], l, 'hito'));
  st.plataformas.forEach(p => add(p.ingreso, `Ingresa ${p.nombre}`, 'plat', p.color));
  add(st.apertura, 'Apertura', 'open');
  const t = todayISO();
  const mes = ui.calMonth[st.id] || monthKey(st.apertura) || monthKey(t);
  const [y, m] = mes.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const lead = (first.getDay() + 6) % 7; // semana inicia en lunes
  const daysIn = new Date(y, m, 0).getDate();
  const weeks = Math.ceil((lead + daysIn) / 7);
  const cells = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(y, m - 1, 1 - lead + i); const iso = toISO(d);
    const evs = (ev[iso] || []).sort((a, b) => (a.cls === 'open' ? -1 : b.cls === 'open' ? 1 : 0));
    const n = st.apertura ? nTxt(nOf(iso, st.apertura)) : '';
    cells.push(`<div class="cal-cell ${monthKey(iso) !== mes ? 'is-out' : ''} ${iso === t ? 'is-today' : ''} ${iso === st.apertura ? 'is-open' : ''} ${evs.length ? 'has-ev' : ''}">
      <div class="cal-top"><span class="cal-n">${d.getDate()}</span>${evs.length && n ? `<span class="cal-nn">${n}</span>` : ''}</div>
      ${evs.map(e => `<span class="cal-ev ev-${e.cls}" ${e.c ? `style="--c:${safeColor(e.c)}"` : ''} title="${esc(e.t)} · ${fmtDate(iso)}${n ? ` (${n})` : ''}">${esc(e.t)}</span>`).join('')}
    </div>`);
  }
  const months = [...new Set(Object.keys(ev).map(monthKey))].sort();
  return `<div class="cal">
    <div class="cal-head">
      <button class="icon-btn" type="button" data-action="cal-nav" data-d="-1" aria-label="Mes anterior">${ic('chevron', 'flip')}</button>
      <b>${monthName(mes)}</b>
      <button class="icon-btn" type="button" data-action="cal-nav" data-d="1" aria-label="Mes siguiente">${ic('chevron')}</button>
      ${st.apertura && monthKey(st.apertura) !== mes ? `<button class="link-btn" type="button" data-action="cal-nav" data-d="open">Ir al mes de apertura</button>` : ''}
      <span class="cal-legend"><span class="ev-open">Apertura</span><span class="ev-hito">Fecha clave</span><span class="ev-plat" style="--c:var(--accent)">Ingreso de plataforma</span></span>
    </div>
    <div class="cal-grid">${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => `<span class="cal-dow">${d}</span>`).join('')}${cells.join('')}</div>
    ${months.length > 1 ? `<p class="cal-foot">Hay fechas en ${months.map(x => monthName(x, false).toLowerCase()).join(', ')}.</p>` : ''}
  </div>`;
}

function gantt(st) {
  const t = todayISO();
  const dated = st.plataformas.filter(p => p.ingreso);
  const all = [...dated.map(p => p.ingreso), t, st.apertura].filter(Boolean).sort();
  if (!st.plataformas.length) return '<div class="empty sm"><p>Agrega plataformas para ver el cronograma.</p></div>';
  const start = addDays(all[0], -2), end = addDays(all[all.length - 1], 3);
  const span = Math.max(1, daysFrom(start, end));
  const pos = iso => Math.max(0, Math.min(100, daysFrom(start, iso) / span * 100));
  const rows = st.plataformas.slice().sort((a, b) => (a.ingreso || '9999').localeCompare(b.ingreso || '9999')).map(p => {
    const s = stats(p.tasks);
    let track;
    if (!p.ingreso) track = '<span class="g-nodate">Sin fecha de ingreso</span>';
    else {
      const l = pos(p.ingreso); const r = st.apertura && st.apertura > p.ingreso ? pos(st.apertura) : l + 2;
      const w = Math.max(r - l, 1.5);
      track = `<div class="g-bar" style="left:${l}%;width:${w}%" title="${esc(p.nombre)}: ingreso ${fmtDate(p.ingreso)}${st.apertura ? ` (${nTxt(nOf(p.ingreso, st.apertura))})` : ''} · ${s.pct}%"><span style="width:${s.pct}%"></span><em>${s.pct}%</em></div>`;
    }
    return `<a class="g-row" href="${platHref(st, p)}" style="--c:${safeColor(p.color)}"><span class="g-label">${sw(p.color)}${esc(p.nombre)}</span><div class="g-track">${track}</div></a>`;
  }).join('');
  const stepDays = Math.max(1, Math.ceil(span / 7 / 7) * 7);
  const ticks = [];
  if (st.apertura) {
    // Marcas cada semana contadas desde la apertura (N, N-7, N-14…)
    for (let d = st.apertura; d >= start; d = addDays(d, -stepDays)) if (d <= end) ticks.push(`<span style="left:${pos(d)}%"><b>${nTxt(nOf(d, st.apertura))}</b>${fmtShort(d)}</span>`);
  } else for (let i = 0; i <= span; i += stepDays) { const d = addDays(start, i); ticks.push(`<span style="left:${pos(d)}%">${fmtShort(d)}</span>`); }
  return `<div class="gantt"><div class="gantt-inner">
    <div class="g-lines">
      ${t >= start && t <= end ? `<div class="g-line today" style="left:${pos(t)}%"><span>Hoy${st.apertura ? ` · ${nTxt(nOf(t, st.apertura))}` : ''}</span></div>` : ''}
      ${st.apertura ? `<div class="g-line open" style="left:${pos(st.apertura)}%"><span>Apertura</span></div>` : ''}
    </div>
    ${rows}
    <div class="g-axis"><span></span><div class="g-ticks">${ticks.join('')}</div></div>
  </div></div>`;
}

/* ---------- Vista: Plataforma ---------- */
function viewPlat(st, p) {
  const s = stats(p.tasks);
  const f = ['todos', 'pendientes', 'terminados'].includes(ui.taskFilter) ? ui.taskFilter : 'todos';
  const done = k => k.estado === 'completado' || k.estado === 'na';
  const items = p.tasks.map(k => [k]).filter(([k]) => f === 'todos' || (f === 'terminados' ? done(k) : !done(k)));
  const faltan = s.aplic - s.completado;
  const dA = st.apertura ? daysFrom(todayISO(), st.apertura) : null;
  const abre = dA == null ? '' : dA > 1 ? `; la tienda abre en ${dA} días` : dA === 1 ? '; la tienda abre mañana' : dA === 0 ? '; la tienda abre hoy' : '';
  const sentence = !s.aplic ? 'Aún no hay pasos en esta plataforma.'
    : faltan === 0 ? `Los ${s.aplic} pasos están terminados.`
    : `${s.completado} de ${s.aplic} pasos terminados. ${faltan === 1 ? 'Falta 1' : `Faltan ${faltan}`}${abre}.`;
  const bloq = p.tasks.filter(k => k.estado === 'bloqueado');
  const groups = (!p.subs.length || subTasks(p, '').length ? [''] : []).concat(p.subs.map(x => x.id));
  // Con subdepartamentos se muestra solo el check list del que se elija
  const multi = groups.length > 1;
  const selSid = multi && groups.includes(ui.subSel[p.pid]) ? ui.subSel[p.pid] : groups[0];
  ui.curSub = selSid;
  const scope = multi ? subTasks(p, selSid) : p.tasks;
  ui.nextTask = scope.find(k => k.estado === 'proceso') || scope.find(k => k.estado === 'pendiente');
  const cnt = { todos: scope.length, pendientes: scope.filter(k => !done(k)).length, terminados: scope.filter(done).length };
  return pageHead({
    crumbs: [['Aperturas', '#/'], [st.nombre, storeHref(st)], [p.nombre]],
    title: `${sw(p.color, 'lg')}${esc(p.nombre)}`,
    sub: sentence,
    actions: `<button class="btn" data-action="new-sub" type="button">${ic('layers')}Subdepartamento</button><button class="btn btn-primary" data-action="new-task-full" type="button">${ic('plus')}Agregar paso</button>`,
  }) + `
  <nav class="tabs" aria-label="Plataformas de la tienda">${st.plataformas.map(x => { const y = stats(x.tasks); return `<a class="tab ${x === p ? 'is-active' : ''}" href="${platHref(st, x)}" style="--c:${safeColor(x.color)}" ${x === p ? 'aria-current="page"' : ''}>${sw(x.color)}${esc(x.nombre)}<span class="tab-n">${y.pct}%</span></a>`; }).join('')}</nav>
  <section class="meta-strip" style="--c:${safeColor(p.color)}">
    <div class="ms-prog"><span class="kpi-l">Avance</span><div class="ms-prog-row"><span class="num-lg">${s.pct}%</span>${stackBar(s)}</div></div>
    ${ui.editPlat ? `
      <label class="ms-cell ms-edit"><span class="kpi-l">Fecha de ingreso</span><input type="date" data-change="plat-field" data-field="ingreso" value="${esc(p.ingreso)}"></label>
      <label class="ms-cell ms-edit"><span class="kpi-l">Responsable</span><input data-change="plat-field" data-field="responsable" value="${esc(p.responsable)}" placeholder="Nombre" autocomplete="off"></label>
      <div class="ms-cell ms-act"><button class="btn btn-primary btn-sm" type="button" data-action="edit-plat">Listo</button></div>`
    : `
      <div class="ms-cell"><span class="kpi-l">Ingreso</span><span class="ms-v">${p.ingreso ? `${fmtDate(p.ingreso)} ${nChip(p.ingreso, st.apertura)}` : '—'}</span></div>
      <div class="ms-cell"><span class="kpi-l">Responsable</span><span class="ms-v">${esc(p.responsable) || '—'}</span></div>
      <div class="ms-cell"><span class="kpi-l">Apertura</span><span class="ms-v">${fmtDate(st.apertura)}${st.apertura ? ` <span class="n-chip today">Hoy ${nTxt(nOf(todayISO(), st.apertura))}</span>` : ''}</span></div>
      <div class="ms-cell ms-act"><button class="btn btn-ghost btn-sm" type="button" data-action="edit-plat">${ic('edit')}Editar</button></div>`}
  </section>
  ${bloq.length ? `<section class="callout">
    <div class="callout-head">${ic('alert')}<b>${bloq.length === 1 ? '1 paso bloqueado' : `${bloq.length} pasos bloqueados`}</b><span>Necesitan apoyo para avanzar</span></div>
    <ul>${bloq.map(k => { const c = [...k.historial].reverse().find(h => h.tipo === 'comentario' && h.texto); return `<li><button type="button" data-action="goto-task" data-id="${esc(k.id)}"><span class="cl-title">${esc(k.titulo)}</span><span class="cl-note">${c ? `${esc(c.autor.split(' · ')[0])}: ${esc(trunc(c.texto, 150))}` : 'Sin comentario: ábrelo y explica qué falta.'}</span>${ic('chevron', 'chev')}</button></li>`; }).join('')}</ul>
  </section>` : ''}
  ${tip('plat3', 'Toca el círculo de un paso para marcarlo como terminado. Toca el texto del paso para cambiar su estatus, comentar o subir fotos.')}
  ${multi ? `<section class="sub-pick" style="--c:${safeColor(p.color)}">
    <p class="sp-h"><b>Subdepartamentos</b><span>Elige uno para ver solo su check list</span></p>
    <div class="sub-tiles" role="tablist" aria-label="Subdepartamentos">${groups.map(sid => {
      const sb = p.subs.find(x => x.id === sid); const x = stats(subTasks(p, sid)); const on = sid === selSid;
      return `<button type="button" role="tab" aria-selected="${on}" class="sub-tile ${on ? 'is-sel' : ''}" data-action="sel-sub" data-sid="${esc(sid)}">
        <span class="sbt-name">${sb ? esc(sb.nombre) : 'Pasos generales'}</span>
        <span class="sbt-rol">${sb ? (sb.rol ? esc(sb.rol) : '&nbsp;') : 'Toda la plataforma'}</span>
        <span class="sbt-prog">${x.aplic ? `<span class="num">${x.pct}%</span>${bar(x.pct)}` : '<span class="muted">Sin pasos</span>'}</span>
        <span class="sbt-count">${x.aplic ? `${x.completado} de ${plural(x.aplic, 'paso', 'pasos')}` : ''}${on ? '<b class="sbt-on">Viendo</b>' : ''}</span>
        ${x.bloqueado ? `<span class="flag sbt-flag">${ic('alert')}${x.bloqueado}</span>` : ''}
      </button>`; }).join('')}</div>
  </section>
  ${(() => { const sb = p.subs.find(x => x.id === selSid); const x = stats(subTasks(p, selSid)); return `<section class="sub-banner" data-sub="${esc(selSid)}" style="--c:${safeColor(p.color)}">
    <div class="sbn-text">
      <span class="sbn-kicker">${ic('list')}Estás viendo el check list de</span>
      <h2>${sb ? esc(sb.nombre) : `Pasos generales de ${esc(p.nombre)}`}</h2>
      <p>${sb ? (sb.rol ? `${ic('user')}${esc(sb.rol)}` : 'Sin rol asignado') : 'Pasos de toda la plataforma'}${sb?.responsable ? ` · ${esc(sb.responsable)}` : ''}</p>
    </div>
    <div class="sbn-prog"><span class="sbn-pct">${x.pct}<small>%</small></span><div>${bar(x.pct)}<span>${x.completado} de ${plural(x.aplic, 'paso terminado', 'pasos terminados')}</span></div></div>
    ${sb ? `<div class="grp-actions"><button class="icon-btn" type="button" data-action="edit-sub" data-sub-id="${esc(sb.id)}" title="Editar subdepartamento" aria-label="Editar subdepartamento">${ic('edit')}</button><button class="icon-btn danger" type="button" data-action="del-sub" title="Eliminar subdepartamento" aria-label="Eliminar subdepartamento">${ic('trash')}</button></div>` : ''}
  </section>`; })()}` : ''}
  <div class="list-bar">
    <div class="seg" role="tablist" aria-label="Mostrar">${[['todos', 'Todos'], ['pendientes', 'Por hacer'], ['terminados', 'Terminados']].map(([k, l]) => `<button type="button" role="tab" aria-selected="${f === k}" class="${f === k ? 'is-active' : ''}" data-action="task-filter" data-v="${k}">${l}<span class="seg-n">${cnt[k]}</span></button>`).join('')}</div>
    ${p.tasks.length ? `<button class="btn btn-ghost btn-sm" type="button" data-action="${ui.open.size ? 'collapse-all' : 'expand-all'}">${ic(ui.open.size ? 'collapse' : 'expand')}${ui.open.size ? 'Contraer' : 'Expandir'}</button>` : ''}
  </div>
  ${!p.tasks.length && !p.subs.length && canLoadTpl(p) ? `<div class="panel empty">${ic('list', 'empty-ic')}<h3>Esta plataforma aún no tiene pasos</h3><p>Agrégalos con el botón Agregar paso o carga la plantilla de ${esc(p.nombre)}.</p><button class="btn btn-primary" type="button" data-action="load-tpl">Cargar plantilla</button></div>` : ''}
  <div class="task-list ${multi ? 'is-sub' : ''}" style="--c:${safeColor(p.color)}">${multi ? taskGroup(st, p, selSid, items, true, true) : groups.map(sid => taskGroup(st, p, sid, items, false)).join('')}</div>`;
}
function canLoadTpl(p) { const c = S.catalogo.find(x => x.id === p.pid); return !!c && (c.plantilla.length || c.subs.length); }
function taskGroup(st, p, sid, items, multi, noHead = false) {
  const sb = p.subs.find(x => x.id === sid);
  const all = subTasks(p, sid); const s = stats(all);
  const list = items.filter(([k]) => (k.sub || '') === sid);
  let n = 0; const num = new Map(all.map(k => [k.id, ++n]));
  const head = !noHead && (sb || multi) ? `<header class="grp-head">
      <div class="grp-title"><b>${sb ? esc(sb.nombre) : 'Pasos generales'}</b>${sb ? (sb.rol ? `<span>${ic('user')}${esc(sb.rol)}</span>` : '') : `<span>Toda la plataforma</span>`}${sb?.responsable ? `<span>${esc(sb.responsable)}</span>` : ''}</div>
      <div class="grp-prog"><span class="c-count">${s.completado}/${s.aplic}</span>${bar(s.pct)}<span class="num">${s.pct}%</span></div>
      ${sb ? `<div class="grp-actions"><button class="icon-btn" type="button" data-action="edit-sub" title="Editar subdepartamento" aria-label="Editar subdepartamento">${ic('edit')}</button><button class="icon-btn danger" type="button" data-action="del-sub" title="Eliminar subdepartamento" aria-label="Eliminar subdepartamento">${ic('trash')}</button></div>` : '<div class="grp-actions"></div>'}
    </header>` : '';
  return `<section class="group" data-sub="${esc(sid)}" style="--c:${safeColor(p.color)}">
    ${head}
    ${list.length ? `<div class="tasks">${list.map(([k]) => taskItem(st, p, k, num.get(k.id))).join('')}</div>` : `<p class="group-empty">${all.length ? (ui.taskFilter === 'terminados' ? 'Aún no hay pasos terminados aquí.' : 'No queda nada por hacer aquí.') : 'Sin pasos todavía.'}</p>`}
    <form class="add-row" data-form="quick-add" autocomplete="off">
      ${ic('plus')}<input name="titulo" placeholder="Agregar un paso${sb ? ` a ${esc(sb.nombre)}` : ''}…   (opcional: Paso | Responsable | N-5)" aria-label="Nuevo paso${sb ? ` en ${esc(sb.nombre)}` : ''}">
      <button class="btn btn-sm" type="submit">Agregar</button>
    </form>
  </section>`;
}
function taskItem(st, p, k, n) {
  const open = ui.open.has(k.id);
  const comments = k.historial.filter(h => h.tipo === 'comentario');
  const late = k.limite && k.limite < todayISO() && k.estado !== 'completado' && k.estado !== 'na';
  const nImgs = k.imagenes.length + comments.reduce((a, h) => a + (h.imagenes?.length || 0), 0);
  const last = comments[comments.length - 1];
  const doneBy = k.estado === 'completado' ? [...k.historial].reverse().find(h => h.tipo === 'estado' && h.a === 'completado') : null;
  const meta = [
    doneBy && `<span class="ok">${ic('check')}${esc(doneBy.autor.split(' · ')[0])}, ${fmtShort(toISO(new Date(doneBy.fecha)))}</span>`,
    k.responsable && `<span>${ic('user')}${esc(k.responsable)}</span>`,
    k.limite && k.estado !== 'completado' && `<span class="${late ? 'late' : ''}">${ic('calendar')}${late ? 'Venció ' : ''}${fmtShort(k.limite)}${st.apertura ? ` · ${nTxt(nOf(k.limite, st.apertura))}` : ''}</span>`,
  ].filter(Boolean).join('');
  const isNext = ui.nextTask === k && ui.taskFilter !== 'terminados';
  const tickLabel = k.estado === 'completado' ? 'Quitar la marca de terminado' : 'Marcar como terminado';
  return `<article class="task is-${k.estado} ${open ? 'is-open' : ''}" data-task="${esc(k.id)}">
    <div class="task-row">
      <button class="st-btn" type="button" data-action="toggle-done" aria-pressed="${k.estado === 'completado'}" title="${tickLabel}" aria-label="${tickLabel}: ${esc(k.titulo)}">${stIcon(k.estado)}</button>
      <button class="task-main" type="button" data-action="toggle-open" aria-expanded="${open}">
        <span class="task-n">${pad(n)}</span>
        <span class="task-text">
          <span class="task-title">${esc(k.titulo)}</span>
          ${meta ? `<span class="task-meta">${meta}</span>` : ''}
          ${!open && last && k.estado === 'bloqueado' ? `<span class="task-last">${esc(last.autor.split(' · ')[0])}: ${esc(trunc(last.texto || 'adjuntó una foto', 120))}</span>` : ''}
        </span>
        <span class="task-side">
          ${isNext ? '<span class="next">Siguiente</span>' : ''}
          ${['proceso', 'bloqueado', 'na'].includes(k.estado) ? stTag(k.estado) : ''}
          ${comments.length ? `<span class="count" title="${plural(comments.length, 'comentario', 'comentarios')}">${ic('comment')}${comments.length}</span>` : ''}
          ${nImgs ? `<span class="count" title="${plural(nImgs, 'foto', 'fotos')}">${ic('image')}${nImgs}</span>` : ''}
          ${ic('chevron', 'chev')}
        </span>
      </button>
    </div>
    ${open ? taskBody(k) : ''}
  </article>`;
}
function taskBody(k) {
  const ap = getStore(route().tid)?.apertura;
  let imgIdx = k.imagenes.length;
  const hist = k.historial.map(h => {
    const who = h.autor.split(' · ');
    if (h.tipo === 'estado') return `<li class="h-event">${stIcon(h.a)}<span><b>${esc(who[0])}</b> cambió el estatus a <b>${STATUS[h.a]?.label || esc(h.a)}</b></span><time title="${fmtDateTime(h.fecha)}">${rel(h.fecha)}</time></li>`;
    const imgs = (h.imagenes || []).map(id => `<button class="thumb sm" type="button" data-action="view-img" data-i="${imgIdx++}"><img data-img="${esc(id)}" alt=""></button>`).join('');
    return `<li class="h-comment"><span class="avatar sm">${esc(initials(who[0]))}</span><div class="h-bubble"><div class="h-top"><b>${esc(who[0])}</b>${who[1] ? `<span>${esc(who.slice(1).join(' · '))}</span>` : ''}<time title="${fmtDateTime(h.fecha)}">${rel(h.fecha)}</time></div>${h.texto ? `<p>${esc(h.texto)}</p>` : ''}${imgs ? `<div class="gallery">${imgs}</div>` : ''}</div></li>`;
  }).join('');
  const pend = ui.pending[k.id] || [];
  return `<div class="task-body">
    ${k.descripcion ? `<p class="task-desc">${esc(k.descripcion)}</p>` : ''}
    <div class="tb-sec">
      <span class="tb-label">Estatus</span>
      <div class="st-seg" role="group" aria-label="Cambiar estatus">${STATUS_KEYS.map(s => `<button type="button" class="st-opt ${k.estado === s ? 'is-on' : ''}" data-action="set-status" data-v="${s}" aria-pressed="${k.estado === s}" title="${STATUS[s].hint}">${stIcon(s)}<span>${STATUS[s].label}</span></button>`).join('')}</div>
    </div>
    <div class="tb-sec">
      <span class="tb-label">Seguimiento</span>
      <div class="tb-col">
        ${hist ? `<ol class="history">${hist}</ol>` : ''}
        <form class="composer" data-form="comment">
          <textarea name="texto" rows="2" placeholder="Escribe un comentario: qué falta, qué se hizo o a quién se escaló">${esc(ui.drafts[k.id] || '')}</textarea>
          ${pend.length ? `<div class="thumbs">${pend.map(x => `<div class="thumb sm"><img src="${x.data}" alt=""><button class="rm" type="button" data-action="rm-pending" data-id="${x.id}" aria-label="Quitar">${ic('x')}</button></div>`).join('')}</div>` : ''}
          <div class="composer-foot">
            <label class="btn btn-ghost btn-sm" title="Adjuntar foto (también puedes pegarla con Ctrl+V)">${ic('clip')}Adjuntar<input type="file" accept="image/*" multiple data-change="comment-img" hidden></label>
            <span class="as">Como ${esc(author())}</span>
            <button class="btn btn-primary btn-sm" type="submit">Comentar</button>
          </div>
        </form>
      </div>
    </div>
    <div class="tb-sec">
      <span class="tb-label">Fotos</span>
      <div class="gallery">${k.imagenes.map((id, i) => `<div class="thumb"><button class="thumb-btn" type="button" data-action="view-img" data-i="${i}" aria-label="Ver foto ${i + 1}"><img data-img="${esc(id)}" alt=""></button><button class="rm" type="button" data-action="rm-task-img" data-id="${esc(id)}" aria-label="Quitar foto">${ic('x')}</button></div>`).join('')}
        <label class="thumb add" title="Subir foto">${ic('image')}<span>Subir</span><input type="file" accept="image/*" multiple data-change="task-img" hidden></label></div>
    </div>
    <div class="tb-foot">
      <span class="tb-facts"><span>${ic('user')}${esc(k.responsable) || 'Sin responsable'}</span><span>${ic('calendar')}${k.limite ? `${fmtDate(k.limite)}${ap ? ` · ${nTxt(nOf(k.limite, ap))}` : ''}` : 'Sin fecha límite'}</span><span>${ic('clock')}Actualizado ${rel(k.actualizado)}</span></span>
      <span class="tb-actions">
        <button class="icon-btn" type="button" data-action="move" data-d="-1" title="Subir" aria-label="Subir paso">${ic('up')}</button>
        <button class="icon-btn" type="button" data-action="move" data-d="1" title="Bajar" aria-label="Bajar paso">${ic('down')}</button>
        <button class="btn btn-ghost btn-sm" type="button" data-action="edit-task">${ic('edit')}Editar</button>
        <button class="btn btn-ghost btn-sm danger" type="button" data-action="del-task">${ic('trash')}Eliminar</button>
      </span>
    </div>
  </div>`;
}
const pillCls = e => ({ proceso: 'info', bloqueado: 'danger', completado: 'done', na: '' }[e] ?? '');
const taskImages = k => [...k.imagenes, ...k.historial.flatMap(h => h.imagenes || [])];

/* ---------- Vista: Plantillas ---------- */
function viewTemplates() {
  return pageHead({
    title: 'Plantillas',
    sub: 'El check list base de cada plataforma. Se carga al dar de alta una tienda; cambiarlo no modifica las tiendas ya creadas.',
    actions: `<button class="btn btn-primary" type="button" data-action="add-cat">${ic('plus')}Nueva plataforma</button>`,
  }) + `
  <div class="tpl-grid">${S.catalogo.map(c => `
    <section class="panel tpl-card" data-cat="${esc(c.id)}" style="--c:${safeColor(c.color)}">
      <div class="tpl-head">
        <label class="color-pick" title="Color de la plataforma">${sw(c.color, 'lg')}<input type="color" value="${safeColor(c.color)}" data-change="cat-color" aria-label="Color"></label>
        <input class="tpl-name" value="${esc(c.nombre)}" data-change="cat-name" aria-label="Nombre de la plataforma">
        <span class="muted tpl-uses">${plural(S.tiendas.filter(t => getPlat(t, c.id)).length, 'tienda', 'tiendas')}</span>
        <button class="icon-btn danger" type="button" data-action="del-cat" title="Eliminar plataforma" aria-label="Eliminar plataforma">${ic('trash')}</button>
      </div>
      <div class="tpl-body">
        <label class="tpl-block"><span class="tb-label">Pasos generales <em>${(c.plantilla || []).length}</em></span>
          <textarea data-change="cat-steps" rows="5" placeholder="Un paso por línea">${esc((c.plantilla || []).map(tplToLine).join('\n'))}</textarea></label>
        <div class="tpl-block"><span class="tb-label">Subdepartamentos <em>${(c.subs || []).length}</em></span>
          ${(c.subs || []).map(s => `<div class="tpl-sub" data-tsub="${esc(s.id)}">
            <div class="tpl-sub-head">
              <input class="tpl-sub-name" value="${esc(s.nombre)}" data-change="tsub-name" aria-label="Nombre del subdepartamento" placeholder="Nombre">
              <input class="tpl-sub-rol" value="${esc(s.rol)}" data-change="tsub-rol" aria-label="Rol" placeholder="Rol que lo atiende">
              <button class="icon-btn danger" type="button" data-action="del-tsub" title="Quitar subdepartamento" aria-label="Quitar subdepartamento">${ic('x')}</button>
            </div>
            <textarea data-change="tsub-steps" rows="3" placeholder="Pasos de ${esc(s.nombre)}, uno por línea" aria-label="Pasos de ${esc(s.nombre)}">${esc(s.plantilla.map(tplToLine).join('\n'))}</textarea>
          </div>`).join('')}
          <button class="link-btn" type="button" data-action="add-tsub">${ic('plus')}Agregar subdepartamento</button>
        </div>
      </div>
    </section>`).join('')}
  </div>`;
}

/* ---------- Acciones ---------- */
function ctx(el) {
  const r = route();
  const st = r.tid ? getStore(r.tid) : null;
  const p = st && r.pid ? getPlat(st, r.pid) : null;
  const li = el.closest('[data-task]');
  const k = p && li ? p.tasks.find(t => t.id === li.dataset.task) : null;
  const sid = el.closest('[data-sub]')?.dataset.sub ?? '';
  const sb = p ? p.subs.find(x => x.id === sid) : null;
  return { r, st, p, k, li, sid, sb };
}

function setStatus(st, p, k, estado) {
  if (!STATUS[estado] || k.estado === estado) return;
  const before = stats(p.tasks).pct;
  k.historial.push({ id: uid('h'), tipo: 'estado', autor: author(), de: k.estado, a: estado, fecha: Date.now() });
  k.estado = estado; k.actualizado = Date.now();
  log(st, p.pid, `“${trunc(k.titulo, 60)}” → ${STATUS[estado].label}`);
  if (estado === 'bloqueado') { ui.open.add(k.id); ui.focusComposer = k.id; toast('Deja un comentario con lo que lo bloquea'); }
  const after = stats(p.tasks).pct;
  if (after === 100 && before < 100) { log(st, p.pid, `${p.nombre} completó su check list`); toast(`${p.nombre} completó su check list`); }
  if (stats(allTasks(st)).pct === 100 && before < 100) toast(`${st.nombre} tiene su check list completo`);
  commit();
}

main.addEventListener('click', async e => {
  const el = e.target.closest('[data-action]'); if (!el) return;
  const a = el.dataset.action; const { st, p, k, sb } = ctx(el);
  switch (a) {
    case 'new-sub': return openSubDlg(st, p);
    case 'edit-sub': return openSubDlg(st, p, sb);
    case 'del-sub': {
      const ks = subTasks(p, sb.id);
      const v = await ask('Eliminar subdepartamento', `${sb.nombre} tiene ${plural(ks.length, 'paso', 'pasos')}. Puedes mover sus pasos a “General de ${p.nombre}” o eliminarlos junto con sus comentarios e imágenes.`,
        [{ label: 'Cancelar' }, ...(ks.length ? [{ label: 'Eliminar con sus pasos', value: 'all', cls: 'danger' }, { label: 'Mover pasos a General', value: 'move', cls: 'primary' }] : [{ label: 'Eliminar', value: 'all', cls: 'danger' }])]);
      if (!v) return;
      if (v === 'move') ks.forEach(x => { x.sub = ''; x.actualizado = Date.now(); });
      else { dropImgs(ks.flatMap(taskImages)); st.borrados.push(...ks.map(x => x.id)); p.tasks = p.tasks.filter(x => !ks.includes(x)); }
      p.subs = p.subs.filter(x => x !== sb); p.editado = Date.now();
      log(st, p.pid, `Quitó el subdepartamento ${sb.nombre}`); return commit();
    }
    case 'new-store': return openStoreDlg();
    case 'edit-store': return openStoreDlg(st);
    case 'home-filter': ui.homeFilter = el.dataset.v; return render();
    case 'home-month': { const cur = ui.homeMonth || monthKey(todayISO()); ui.homeMonth = el.dataset.d === '0' ? '' : addMonths(cur, Number(el.dataset.d)); return render(); }
    case 'month-scope': ui.monthScope = el.dataset.v; return render();
    case 'plaza-filter': ui.plaza = el.dataset.v; return render();
    case 'cal-nav': {
      const cur = ui.calMonth[st.id] || monthKey(st.apertura) || monthKey(todayISO());
      ui.calMonth[st.id] = el.dataset.d === 'open' ? monthKey(st.apertura) : addMonths(cur, Number(el.dataset.d)); return render();
    }
    case 'task-filter': ui.taskFilter = el.dataset.v; return render();
    case 'expand-all': p.tasks.forEach(t => ui.open.add(t.id)); return render();
    case 'collapse-all': ui.open.clear(); return render();
    case 'mail-summary': return openMailDlg(st);
    case 'copy-summary': return copyText(summary(st), 'Resumen copiado: pégalo en Teams, correo o WhatsApp');
    case 'export-store': return exportData([st], `apertura_${st.cr}_${todayISO()}.json`);
    case 'csv-store': return exportCSV(st);
    case 'del-store': {
      const ok = await ask('Eliminar tienda', `Se eliminará ${st.nombre} (CR ${st.cr}) con todos sus pasos, comentarios e imágenes. No se puede deshacer; exporta un respaldo antes si lo necesitas.`, [{ label: 'Cancelar' }, { label: 'Eliminar tienda', value: true, cls: 'danger' }]);
      if (!ok) return;
      dropImgs(allTasks(st).flatMap(taskImages));
      S.tiendas = S.tiendas.filter(t => t !== st); save(); location.hash = '#/'; return toast('Tienda eliminada');
    }
    case 'load-tpl': {
      const c = S.catalogo.find(x => x.id === p.pid);
      p.tasks.push(...c.plantilla.map(t => taskFromTpl(t, st.apertura)));
      c.subs.filter(cs => !p.subs.some(x => x.id === cs.id)).forEach(cs => addSubTo(p, cs, true, st.apertura));
      log(st, p.pid, `Cargó la plantilla de ${p.nombre}`); return commit();
    }
    case 'new-task-full': return openTaskDlg(st, p, null, ui.curSub || '');
    case 'toggle-open': ui.open.has(k.id) ? ui.open.delete(k.id) : ui.open.add(k.id); return render();
    case 'set-status': return setStatus(st, p, k, el.dataset.v);
    case 'edit-plat': ui.editPlat = !ui.editPlat; return render();
    case 'toggle-plat': ui.selPlat = ui.selPlat === el.dataset.pid ? null : el.dataset.pid; render(); $('.pl-detail', main)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return;
    case 'goto-blocked': { const gp = getPlat(st, el.dataset.pid); const gk = gp?.tasks.find(x => x.id === el.dataset.id); if (gk) { ui.subSel[gp.pid] = gk.sub || ''; ui.open.add(gk.id); ui.taskFilter = 'todos'; } location.hash = platHref(st, gp); return; }
    case 'sel-sub': ui.subSel[p.pid] = el.dataset.sid; ui.open.clear(); ui.taskFilter = 'todos'; return render();
    case 'goto-task': {
      const gk = p.tasks.find(x => x.id === el.dataset.id); if (gk) ui.subSel[p.pid] = gk.sub || '';
      ui.taskFilter = 'todos'; ui.open.add(el.dataset.id); render();
      const li = $(`[data-task="${CSS.escape(el.dataset.id)}"]`, main); li?.scrollIntoView({ block: 'center', behavior: 'smooth' }); return;
    }
    case 'help': return openHelp();
    case 'hide-tip': Pref.set('ap-tip-' + el.dataset.v, '1'); return render();
    case 'toggle-done': return setStatus(st, p, k, k.estado === 'completado' ? 'pendiente' : 'completado');
    case 'edit-task': return openTaskDlg(st, p, k);
    case 'move': {
      const i = p.tasks.indexOf(k); const j = i + Number(el.dataset.d);
      if (j < 0 || j >= p.tasks.length) return;
      [p.tasks[i], p.tasks[j]] = [p.tasks[j], p.tasks[i]]; k.actualizado = Date.now(); return commit();
    }
    case 'del-task': {
      const ok = await ask('Eliminar paso', `“${k.titulo}” se eliminará junto con sus comentarios e imágenes.`, [{ label: 'Cancelar' }, { label: 'Eliminar', value: true, cls: 'danger' }]);
      if (!ok) return;
      dropImgs(taskImages(k)); p.tasks.splice(p.tasks.indexOf(k), 1); st.borrados.push(k.id);
      log(st, p.pid, `Eliminó el paso “${trunc(k.titulo, 60)}”`); return commit();
    }
    case 'view-img': return openLightbox(taskImages(k), Number(el.dataset.i) || 0);
    case 'rm-task-img': {
      const id = el.dataset.id; k.imagenes = k.imagenes.filter(x => x !== id); dropImgs([id]); k.actualizado = Date.now(); return commit();
    }
    case 'rm-pending': ui.pending[k.id] = (ui.pending[k.id] || []).filter(x => x.id !== el.dataset.id); return render();
    case 'add-tsub': {
      const c = S.catalogo.find(x => x.id === el.closest('[data-cat]').dataset.cat);
      const s = { id: uid('s'), nombre: 'Nuevo subdepartamento', rol: '', plantilla: [] };
      c.subs.push(s); commit(); const inp = $(`[data-tsub="${s.id}"] .tpl-sub-name`); inp?.focus(); inp?.select(); return;
    }
    case 'del-tsub': {
      const c = S.catalogo.find(x => x.id === el.closest('[data-cat]').dataset.cat);
      c.subs = c.subs.filter(x => x.id !== el.closest('[data-tsub]').dataset.tsub); return commit();
    }
    case 'add-cat': {
      const c = { id: uid('p'), nombre: 'Nueva plataforma', color: PALETTE[S.catalogo.length % PALETTE.length], plantilla: [], subs: [] };
      S.catalogo.push(c); commit(); const inp = $(`[data-cat="${c.id}"] .tpl-name`); inp?.focus(); inp?.select(); return;
    }
    case 'del-cat': {
      const c = S.catalogo.find(x => x.id === el.closest('[data-cat]').dataset.cat);
      const ok = await ask('Eliminar plantilla', `Se quitará ${c.nombre} del catálogo. Las tiendas que ya la tienen la conservan con sus pasos.`, [{ label: 'Cancelar' }, { label: 'Eliminar', value: true, cls: 'danger' }]);
      if (!ok) return; S.catalogo = S.catalogo.filter(x => x !== c); return commit();
    }
  }
});

main.addEventListener('toggle', e => { const d = e.target; if (d.matches?.('details[data-toggle]')) ui[d.dataset.toggle] = d.open; }, true);
main.addEventListener('change', async e => {
  const el = e.target.closest('[data-change]'); if (!el) return;
  const a = el.dataset.change; const { st, p, k } = ctx(el);
  if (a === 'status') return setStatus(st, p, k, el.value);
  if (a === 'plat-field') {
    const f = el.dataset.field; const v = el.value.trim();
    if (p[f] === v) return;
    p[f] = v; p.editado = Date.now();
    log(st, p.pid, f === 'ingreso' ? `Fecha de ingreso de ${p.nombre}: ${fmtDate(v)}` : `Responsable de ${p.nombre}: ${v || '—'}`);
    return commit();
  }
  if (a === 'task-img' || a === 'comment-img') {
    const imgs = await filesToImgs(el.files); el.value = '';
    if (!imgs.length) return;
    if (a === 'comment-img') { (ui.pending[k.id] ||= []).push(...imgs); return render(); }
    for (const x of imgs) { await putImg(x.id, x.data); k.imagenes.push(x.id); }
    k.actualizado = Date.now(); log(st, p.pid, `Agregó ${plural(imgs.length, 'imagen', 'imágenes')} a “${trunc(k.titulo, 50)}”`);
    return commit();
  }
  const c = S.catalogo.find(x => x.id === el.closest('[data-cat]')?.dataset.cat);
  if (!c) return;
  if (a === 'cat-color') { c.color = safeColor(el.value); }
  if (a === 'cat-name') { const v = el.value.trim(); if (!v) { el.value = c.nombre; return; } c.nombre = v; }
  const lines = v => v.split('\n').map(s => s.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, '').trim()).filter(Boolean);
  const keepDesc = (prev, next) => next.map(n => { const t = tplStep(n); const old = (prev || []).map(tplStep).find(o => o.titulo === t.titulo && o.descripcion); return old ? { titulo: t.titulo, responsable: t.responsable, dias: t.dias, descripcion: old.descripcion } : n; });
  if (a === 'cat-steps') c.plantilla = keepDesc(c.plantilla, lines(el.value).map(lineToTpl));
  const ts = c.subs?.find(x => x.id === el.closest('[data-tsub]')?.dataset.tsub);
  if (ts) {
    if (a === 'tsub-name') { const v = el.value.trim(); if (!v) { el.value = ts.nombre; return; } ts.nombre = v; }
    if (a === 'tsub-rol') ts.rol = el.value.trim();
    if (a === 'tsub-steps') ts.plantilla = keepDesc(ts.plantilla, lines(el.value).map(lineToTpl));
  }
  commit();
});

main.addEventListener('submit', async e => {
  const f = e.target.closest('[data-form]'); if (!f) return;
  e.preventDefault();
  const { st, p, k, sid, sb } = ctx(f);
  if (f.dataset.form === 'quick-add') {
    const titles = f.titulo.value.split('\n').map(s => s.trim()).filter(Boolean);
    if (!titles.length) return f.titulo.focus();
    titles.forEach(line => { const t = lineToTpl(line); p.tasks.push(taskFromTpl(t, st.apertura, { sub: sid })); });
    titles.forEach((line, i) => { titles[i] = tplStep(lineToTpl(line)).titulo; });
    const where = sb ? ` en ${sb.nombre}` : '';
    log(st, p.pid, titles.length > 1 ? `Agregó ${titles.length} pasos${where}` : `Agregó el paso “${trunc(titles[0], 60)}”${where}`);
    if (ui.taskFilter !== 'todos' && ui.taskFilter !== 'pendiente') ui.taskFilter = 'todos';
    commit(); $(`.group[data-sub="${CSS.escape(sid)}"] .add-row input`, main)?.focus(); return;
  }
  if (f.dataset.form === 'comment') {
    const texto = f.texto.value.trim(); const pend = ui.pending[k.id] || [];
    if (!texto && !pend.length) return f.texto.focus();
    if (!Pref.get('ap-user').trim()) { ui.drafts[k.id] = f.texto.value; return openUserDlg('Antes de comentar, dinos quién eres para que tu equipo sepa quién dejó el comentario.'); }
    for (const x of pend) await putImg(x.id, x.data);
    k.historial.push({ id: uid('h'), tipo: 'comentario', autor: author(), texto, imagenes: pend.map(x => x.id), fecha: Date.now() });
    k.actualizado = Date.now(); delete ui.pending[k.id]; delete ui.drafts[k.id]; f.texto.value = '';
    log(st, p.pid, `Comentó en “${trunc(k.titulo, 50)}”${texto ? `: ${trunc(texto, 80)}` : ''}`);
    commit(); toast('Comentario agregado');
  }
});

main.addEventListener('input', e => {
  if (e.target.id === 'q') { ui.q = e.target.value; $('#homeCards').innerHTML = homeCards(); }
});
main.addEventListener('paste', async e => {
  const ta = e.target.closest('.composer textarea'); if (!ta) return;
  const files = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith('image/'));
  if (!files.length) return;
  e.preventDefault();
  const { k } = ctx(ta); ui.drafts[k.id] = ta.value;
  (ui.pending[k.id] ||= []).push(...await filesToImgs(files)); render();
  $(`[data-task="${CSS.escape(k.id)}"] .composer textarea`, main)?.focus();
});
main.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.target.closest('.composer textarea')) { e.preventDefault(); e.target.form.requestSubmit(); }
});

/* ---------- Diálogo: tienda ---------- */
let editingStore = null;
function ppRow(r) {
  return `<div class="pp-row ${r.on ? '' : 'is-off'}" data-pid="${esc(r.pid)}" data-nombre="${esc(r.nombre)}" data-color="${safeColor(r.color)}">
    <label class="pp-name"><input type="checkbox" class="pp-on" ${r.on ? 'checked' : ''}><i class="dot" style="--c:${safeColor(r.color)}"></i><span>${esc(r.nombre)}${r.n ? ` <em>· ${plural(r.n, 'paso', 'pasos')}</em>` : ''}</span></label>
    <input type="date" class="pp-date" value="${esc(r.ingreso)}" aria-label="Fecha de ingreso de ${esc(r.nombre)}">
    <input class="pp-n" value="${esc(nTxt(nOf(r.ingreso, r.apertura)))}" placeholder="N-#" title="Días antes de la apertura, por ejemplo N-30" aria-label="Ingreso de ${esc(r.nombre)} en días antes de la apertura" autocomplete="off">
    <input class="pp-resp" value="${esc(r.responsable)}" placeholder="Responsable" aria-label="Responsable de ${esc(r.nombre)}" autocomplete="off">
  </div>`;
}
function openStoreDlg(st = null) {
  editingStore = st;
  const f = $('#storeForm'); f.reset();
  $('#storeDlgTitle').textContent = st ? `Editar ${st.nombre}` : 'Nueva tienda';
  f.nombre.value = st?.nombre || ''; f.cr.value = st?.cr || ''; f.apertura.value = st?.apertura || ''; f.notas.value = st?.notas || '';
  f.plaza.value = st?.plaza || ui.plaza || 'Tijuana Este';
  $('#tplLabel').textContent = st ? 'Cargar los pasos de la plantilla en las plataformas que agregues' : 'Cargar los pasos de la plantilla de cada plataforma';
  const rows = S.catalogo.map(c => {
    const sp = st && getPlat(st, c.id);
    return { pid: c.id, nombre: sp?.nombre || c.nombre, color: sp?.color || c.color, on: st ? !!sp : true, ingreso: sp?.ingreso || '', responsable: sp?.responsable || '', n: sp?.tasks.length || 0, apertura: st?.apertura || '' };
  });
  st?.plataformas.filter(p => !S.catalogo.some(c => c.id === p.pid)).forEach(p => rows.push({ ...p, on: true, n: p.tasks.length }));
  $('#storePlats').innerHTML = rows.map(ppRow).join('');
  $('#storeDlg').showModal();
  if (!st) f.nombre.focus();
}
/* Ingreso de cada plataforma: se puede capturar como fecha o como N-# */
$('#storePlats').addEventListener('input', e => {
  const row = e.target.closest('.pp-row'); if (!row) return;
  const ap = $('#storeForm').apertura.value;
  if (e.target.classList.contains('pp-n')) {
    const d = parseN(e.target.value);
    e.target.classList.toggle('is-bad', !!e.target.value.trim() && d == null);
    if (d != null && ap) row.querySelector('.pp-date').value = addDays(ap, -d);
  }
  if (e.target.classList.contains('pp-date')) row.querySelector('.pp-n').value = nTxt(nOf(e.target.value, ap));
});
$('#storeForm').apertura.addEventListener('input', e => {
  const ap = e.target.value; if (!ap) return;
  // Con la apertura definida, el N-# capturado manda: se recalculan las fechas
  $$('#storePlats .pp-row').forEach(row => {
    const n = row.querySelector('.pp-n'); const dt = row.querySelector('.pp-date');
    const d = parseN(n.value);
    if (d != null) dt.value = addDays(ap, -d); else if (dt.value) n.value = nTxt(nOf(dt.value, ap));
  });
});
$('#storePlats').addEventListener('change', e => {
  if (e.target.classList.contains('pp-on')) e.target.closest('.pp-row').classList.toggle('is-off', !e.target.checked);
});
function addPlatFromDialog() {
  const inp = $('#ppNew'); const nombre = inp.value.trim(); if (!nombre) return inp.focus();
  let c = S.catalogo.find(x => norm(x.nombre) === norm(nombre));
  if (!c) { c = { id: uid('p'), nombre, color: PALETTE[S.catalogo.length % PALETTE.length], plantilla: [] }; S.catalogo.push(c); save(); }
  const ex = $(`#storePlats [data-pid="${CSS.escape(c.id)}"]`);
  if (ex) { ex.querySelector('.pp-on').checked = true; ex.classList.remove('is-off'); }
  else $('#storePlats').insertAdjacentHTML('beforeend', ppRow({ pid: c.id, nombre: c.nombre, color: c.color, on: true, ingreso: '', responsable: '', apertura: '' }));
  inp.value = ''; $(`#storePlats [data-pid="${CSS.escape(c.id)}"] .pp-date`).focus();
}
$('#ppAddBtn').addEventListener('click', addPlatFromDialog);
$('#ppNew').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addPlatFromDialog(); } });

$('#storeForm').addEventListener('submit', e => {
  if (e.submitter?.value !== 'ok') return;
  const f = e.target;
  const data = { nombre: f.nombre.value.trim(), cr: f.cr.value.trim().toUpperCase(), apertura: f.apertura.value, notas: f.notas.value.trim(), plaza: f.plaza.value };
  if (S.tiendas.some(t => t !== editingStore && norm(t.cr) === norm(data.cr))) { e.preventDefault(); toast(`Ya existe una tienda con el CR ${data.cr}`, true); f.cr.focus(); return; }
  const rows = $$('#storePlats .pp-row').map(r => ({ pid: r.dataset.pid, nombre: r.dataset.nombre, color: r.dataset.color, on: r.querySelector('.pp-on').checked, ingreso: r.querySelector('.pp-date').value, responsable: r.querySelector('.pp-resp').value.trim() }));
  let st = editingStore;
  if (st) {
    const removed = st.plataformas.filter(p => !rows.some(r => r.on && r.pid === p.pid));
    const withTasks = removed.filter(p => p.tasks.length);
    if (withTasks.length && !confirm(`Se quitarán ${withTasks.map(p => p.nombre).join(', ')} con todos sus pasos y comentarios. ¿Continuar?`)) { e.preventDefault(); return; }
    removed.forEach(p => { dropImgs(p.tasks.flatMap(taskImages)); log(st, null, `Quitó la plataforma ${p.nombre}`); });
    if (st.apertura !== data.apertura) {
      log(st, null, `Cambió la apertura: ${fmtDate(st.apertura)} → ${fmtDate(data.apertura)}`);
      allTasks(st).forEach(k => {
        if (k.diasN == null || !data.apertura) return;
        if (!k.limite || (st.apertura && k.limite === addDays(st.apertura, -k.diasN))) k.limite = addDays(data.apertura, -k.diasN);
      });
    }
    Object.assign(st, data, { editado: Date.now() });
  } else {
    st = { id: uid('t'), ...data, creado: Date.now(), editado: Date.now(), plataformas: [], actividad: [], borrados: [] };
    S.tiendas.push(st); log(st, null, `Creó la tienda ${st.nombre}`);
  }
  const loadTpl = f.plantilla.checked;
  st.plataformas = rows.filter(r => r.on).map(r => {
    let p = getPlat(st, r.pid);
    if (p) {
      if (p.ingreso !== r.ingreso) log(st, p.pid, `Fecha de ingreso de ${p.nombre}: ${fmtDate(r.ingreso)}`);
      if (p.ingreso !== r.ingreso || p.responsable !== r.responsable) p.editado = Date.now();
      p.ingreso = r.ingreso; p.responsable = r.responsable; return p;
    }
    const cat = S.catalogo.find(c => c.id === r.pid) || { id: r.pid, nombre: r.nombre, color: r.color, plantilla: [] };
    p = newStorePlat(cat, { ingreso: r.ingreso, responsable: r.responsable, plantilla: loadTpl, apertura: st.apertura });
    if (editingStore) log(st, p.pid, `Agregó la plataforma ${p.nombre}`);
    return p;
  });
  save();
  const target = storeHref(st);
  if (location.hash !== target && !location.hash.startsWith(target + '/')) location.hash = target; else render();
  toast(editingStore ? 'Tienda actualizada' : 'Tienda creada');
});

/* ---------- Diálogo: paso ---------- */
let taskCtx = null;
$('#taskForm').estado.innerHTML = STATUS_KEYS.map(s => `<option value="${s}">${stLabel(s)}</option>`).join('');
function openTaskDlg(st, p, k = null, sid = '') {
  taskCtx = { st, p, k, imgs: (k?.imagenes || []).map(id => ({ id, data: imgCache.get(id) || '', old: true })), removed: [] };
  const f = $('#taskForm'); f.reset();
  f.sub.innerHTML = `<option value="">General de ${esc(p.nombre)}</option>` + p.subs.map(s => `<option value="${esc(s.id)}">${esc(s.nombre)}${s.rol ? ` · ${esc(s.rol)}` : ''}</option>`).join('');
  f.sub.value = k ? (k.sub || '') : sid;
  $('#taskSubField').hidden = !p.subs.length;
  $('#taskDlgTitle').textContent = k ? 'Editar paso' : `Nuevo paso · ${p.nombre}`;
  f.titulo.value = k?.titulo || ''; f.descripcion.value = k?.descripcion || ''; f.responsable.value = k?.responsable || '';
  f.limite.value = k?.limite || ''; f.estado.value = k?.estado || 'pendiente';
  f.plazo.value = k ? nTxt(k.diasN ?? nOf(k.limite, st.apertura)) : '';
  f.plazo.disabled = !st.apertura;
  f.plazo.classList.remove('is-bad');
  $('#plazoHint').textContent = st.apertura ? `La tienda abre el ${fmtDate(st.apertura)}. Escribe N-5 para 5 días antes.` : 'Define la fecha de apertura de la tienda para usar N-#.';
  renderTaskThumbs();
  taskCtx.imgs.forEach(async x => { if (!x.data) { x.data = await imgData(x.id) || ''; renderTaskThumbs(); } });
  $('#taskDlg').showModal(); f.titulo.focus();
}
function renderTaskThumbs() {
  $('#taskThumbs').innerHTML = taskCtx.imgs.map(x => `<div class="thumb sm">${x.data ? `<img src="${x.data}" alt="">` : ''}<button class="rm" type="button" data-rm="${x.id}" aria-label="Quitar imagen">${ic('x')}</button></div>`).join('');
}
$('#taskThumbs').addEventListener('click', e => {
  const id = e.target.closest('[data-rm]')?.dataset.rm; if (!id) return;
  const x = taskCtx.imgs.find(i => i.id === id); taskCtx.imgs = taskCtx.imgs.filter(i => i !== x);
  if (x?.old) taskCtx.removed.push(id);
  renderTaskThumbs();
});
async function addTaskDlgFiles(files) { taskCtx.imgs.push(...await filesToImgs(files)); renderTaskThumbs(); }
$('#taskFiles').addEventListener('change', e => { addTaskDlgFiles(e.target.files); e.target.value = ''; });
const drop = $('#taskDrop');
drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('is-over'); });
drop.addEventListener('dragleave', () => drop.classList.remove('is-over'));
drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('is-over'); addTaskDlgFiles(e.dataTransfer.files); });
$('#taskDlg').addEventListener('paste', e => {
  const files = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith('image/'));
  if (files.length) { e.preventDefault(); addTaskDlgFiles(files); }
});
$('#taskForm').plazo.addEventListener('input', e => {
  const ap = taskCtx?.st.apertura; const d = parseN(e.target.value);
  e.target.classList.toggle('is-bad', !!e.target.value.trim() && d == null);
  if (d != null && ap) $('#taskForm').limite.value = addDays(ap, -d);
});
$('#taskForm').limite.addEventListener('input', e => {
  const ap = taskCtx?.st.apertura; if (ap) $('#taskForm').plazo.value = nTxt(nOf(e.target.value, ap));
});
$('#taskForm').addEventListener('submit', async e => {
  if (e.submitter?.value !== 'ok') return;
  const f = e.target; const { st, p } = taskCtx; let { k } = taskCtx;
  const data = { titulo: f.titulo.value.trim(), descripcion: f.descripcion.value.trim(), responsable: f.responsable.value.trim(), limite: f.limite.value, sub: f.sub.value };
  const estado = f.estado.value;
  const dN = parseN(f.plazo.value);
  if (f.plazo.value.trim() && dN == null) { e.preventDefault(); toast('El plazo debe escribirse como N-5, N o N+2', true); f.plazo.focus(); return; }
  if (dN != null && st.apertura) { data.diasN = dN; data.limite = addDays(st.apertura, -dN); } else data.diasN = null;
  for (const x of taskCtx.imgs) if (!x.old) await putImg(x.id, x.data);
  dropImgs(taskCtx.removed);
  if (k) {
    Object.assign(k, data, { imagenes: taskCtx.imgs.map(x => x.id), actualizado: Date.now() });
    log(st, p.pid, `Editó el paso “${trunc(k.titulo, 60)}”`);
  } else {
    k = newTask(data.titulo, { ...data, imagenes: taskCtx.imgs.map(x => x.id) });
    p.tasks.push(k); ui.open.add(k.id);
    log(st, p.pid, `Agregó el paso “${trunc(k.titulo, 60)}”`);
  }
  if (estado !== k.estado) return setStatus(st, p, k, estado);
  commit();
});

/* ---------- Diálogo: subdepartamento ---------- */
let subCtx = null;
function openSubDlg(st, p, sb = null) {
  const cat = S.catalogo.find(c => c.id === p.pid);
  subCtx = { st, p, sb, cat };
  const f = $('#subForm'); f.reset();
  $('#subDlgTitle').textContent = sb ? `Editar ${sb.nombre}` : `Nuevo subdepartamento en ${p.nombre}`;
  f.nombre.value = sb?.nombre || ''; f.rol.value = sb?.rol || ''; f.responsable.value = sb?.responsable || '';
  $('#subOptions').innerHTML = (cat?.subs || []).filter(cs => !p.subs.some(x => x.id === cs.id)).map(cs => `<option value="${esc(cs.nombre)}">`).join('');
  $('#subSaveLabel').textContent = `Guardarlo en la plantilla de ${p.nombre} para las próximas tiendas`;
  $('#subSaveLine').hidden = !!sb || !cat;
  syncSubTpl();
  $('#subDlg').showModal(); f.nombre.focus();
}
function subTplMatch() {
  const { cat, p } = subCtx; const n = norm($('#subForm').nombre.value);
  return n && cat ? cat.subs.find(cs => norm(cs.nombre) === n && !p.subs.some(x => x.id === cs.id)) : null;
}
function syncSubTpl() {
  const m = !subCtx.sb && subTplMatch();
  $('#subTplLine').hidden = !(m && m.plantilla.length);
  if (m) {
    $('#subTplLabel').textContent = `Cargar sus ${plural(m.plantilla.length, 'paso', 'pasos')} de la plantilla`;
    const f = $('#subForm'); if (!f.rol.value) f.rol.value = m.rol || '';
    $('#subSaveLine').hidden = true;
  } else if (!subCtx.sb && subCtx.cat) $('#subSaveLine').hidden = false;
}
$('#subForm').nombre.addEventListener('input', syncSubTpl);
$('#subForm').addEventListener('submit', e => {
  if (e.submitter?.value !== 'ok') return;
  const f = e.target; const { st, p, sb, cat } = subCtx;
  const data = { nombre: f.nombre.value.trim(), rol: f.rol.value.trim(), responsable: f.responsable.value.trim() };
  if (p.subs.some(x => x !== sb && norm(x.nombre) === norm(data.nombre))) { e.preventDefault(); toast(`${p.nombre} ya tiene un subdepartamento llamado ${data.nombre}`, true); return; }
  if (sb) {
    Object.assign(sb, data, { editado: Date.now() });
    log(st, p.pid, `Editó el subdepartamento ${sb.nombre}`);
  } else {
    const m = subTplMatch();
    let cs;
    if (m) cs = { ...m, rol: data.rol, responsable: data.responsable };
    else {
      cs = { id: uid('s'), ...data, plantilla: [] };
      if (cat && f.guardar.checked) { cat.subs.push({ id: cs.id, nombre: cs.nombre, rol: cs.rol, plantilla: [] }); }
    }
    const s = addSubTo(p, cs, !!m && f.cargar.checked, st.apertura);
    p.editado = Date.now();
    log(st, p.pid, `Agregó el subdepartamento ${s.nombre}${s.rol ? ` (${s.rol})` : ''}`);
    toast(`${s.nombre} agregado. Escribe sus pasos en su cuadro “Agrega un paso”.`);
  }
  commit();
});

/* ---------- Diálogo: usuario ---------- */
function openUserDlg(note) {
  const f = $('#userForm');
  f.nombre.value = Pref.get('ap-user');
  f.plataforma.innerHTML = '<option value="">— Sin plataforma —</option>' + S.catalogo.map(c => `<option value="${esc(c.id)}">${esc(c.nombre)}</option>` +
    (c.subs || []).map(s => `<option value="${esc(c.id)}:${esc(s.id)}">&nbsp;&nbsp;${esc(c.nombre)} › ${esc(s.nombre)}</option>`).join('')).join('');
  f.plataforma.value = Pref.get('ap-user-plat');
  $('#userNote').textContent = note || 'Tu nombre y plataforma aparecen en los comentarios y cambios de estatus para que todos sepan quién avanzó cada paso.';
  $('#userDlg').showModal(); f.nombre.focus();
}
$('#userForm').addEventListener('submit', e => {
  if (e.submitter?.value !== 'ok') return;
  Pref.set('ap-user', e.target.nombre.value.trim()); Pref.set('ap-user-plat', e.target.plataforma.value);
  render(); toast('Listo, ya puedes comentar');
});

/* ---------- Confirmación, visor y avisos ---------- */
function ask(title, msg, buttons) {
  return new Promise(res => {
    const d = $('#askDlg'); $('#askTitle').textContent = title; $('#askMsg').textContent = msg;
    const foot = $('#askFoot'); foot.innerHTML = '';
    buttons.forEach(b => {
      const btn = document.createElement('button'); btn.type = 'button';
      btn.className = 'btn' + (b.cls === 'primary' ? ' btn-primary' : b.cls === 'danger' ? ' btn-danger' : '');
      btn.textContent = b.label; btn.onclick = () => { res(b.value ?? null); d.close(); };
      foot.append(btn);
    });
    d.onclose = () => res(null);
    d.showModal(); foot.lastChild?.focus();
  });
}
const lb = { ids: [], i: 0 };
async function showLb() {
  const id = lb.ids[lb.i]; $('#lbImg').src = (await imgData(id)) || '';
  $('#lbCount').textContent = lb.ids.length > 1 ? `${lb.i + 1} / ${lb.ids.length}` : '';
  $$('.lb-prev, .lb-next').forEach(b => b.hidden = lb.ids.length < 2);
}
function openLightbox(ids, i) { if (!ids.length) return; lb.ids = ids; lb.i = Math.min(i, ids.length - 1); showLb(); $('#lightbox').showModal(); }
$('#lightbox').addEventListener('click', e => {
  const a = e.target.closest('[data-lb]')?.dataset.lb;
  if (a === 'close' || e.target.id === 'lightbox') return $('#lightbox').close();
  if (a) { lb.i = (lb.i + (a === 'next' ? 1 : -1) + lb.ids.length) % lb.ids.length; showLb(); }
});
$('#lightbox').addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { lb.i = (lb.i + (e.key === 'ArrowRight' ? 1 : -1) + lb.ids.length) % lb.ids.length; showLb(); }
});
let toastTimer = 0;
function toast(msg, err = false) {
  const t = $('#toast'); t.textContent = msg; t.classList.toggle('is-error', err); t.classList.add('is-on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('is-on'), 3200);
}

/* ---------- Resumen, CSV y respaldos ---------- */
function summary(st) {
  const s = stats(allTasks(st)); const cd = countdown(st);
  const lines = [`${st.nombre} (CR ${st.cr})`, `Apertura: ${fmtDate(st.apertura)} · ${cd.label}`, `Avance general: ${s.pct}% (${s.completado}/${s.aplic} pasos)`, '', 'Por plataforma:'];
  st.plataformas.forEach(p => {
    const x = stats(p.tasks);
    lines.push(`• ${p.nombre}: ${x.pct}% (${x.completado}/${x.aplic})${x.bloqueado ? ` · ${x.bloqueado} bloqueado(s)` : ''}${p.ingreso ? ` · ingreso ${fmtShort(p.ingreso)}` : ''}`);
    p.subs.forEach(sb => { const y = stats(subTasks(p, sb.id)); lines.push(`    ◦ ${sb.nombre}${sb.rol ? ` (${sb.rol})` : ''}: ${y.pct}% (${y.completado}/${y.aplic})${y.bloqueado ? ` · ${y.bloqueado} bloqueado(s)` : ''}`); });
  });
  const bloq = st.plataformas.flatMap(p => p.tasks.filter(k => k.estado === 'bloqueado').map(k => ({ p, k })));
  if (bloq.length) {
    lines.push('', 'Bloqueos:');
    bloq.forEach(({ p, k }) => { const c = [...k.historial].reverse().find(h => h.tipo === 'comentario' && h.texto); lines.push(`- [${p.nombre}${k.sub ? ` › ${subName(p, k.sub)}` : ''}] ${k.titulo}${c ? ` — ${c.texto} (${c.autor})` : ''}`); });
  }
  return lines.join('\n');
}
async function copyText(text, okMsg) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove();
  }
  toast(okMsg);
}
function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function exportCSV(st) {
  const rows = [['Tienda', 'CR', 'Apertura', 'Plataforma', 'Ingreso plataforma', 'Subdepartamento', 'Rol', '#', 'Paso', 'Estatus', 'Responsable', 'Fecha límite', 'Imágenes', 'Último comentario', 'Actualizado']];
  st.plataformas.forEach(p => ['', ...p.subs.map(s => s.id)].forEach(sid => {
    const sb = p.subs.find(s => s.id === sid);
    subTasks(p, sid).forEach((k, i) => {
      const c = [...k.historial].reverse().find(h => h.tipo === 'comentario');
      rows.push([st.nombre, st.cr, st.apertura, p.nombre, p.ingreso, sb?.nombre || 'General', sb?.rol || '', i + 1, k.titulo, STATUS[k.estado].label, k.responsable || sb?.responsable || '', k.limite, taskImages(k).length, c ? `${c.autor}: ${c.texto}` : '', fmtDateTime(k.actualizado)]);
    });
  }));
  const csv = '﻿' + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  download(`checklist_${st.cr}_${todayISO()}.csv`, csv, 'text/csv;charset=utf-8');
  toast('Archivo CSV descargado (se abre en Excel)');
}
async function exportData(tiendas, name) {
  const images = {};
  for (const id of new Set(tiendas.flatMap(st => allTasks(st).flatMap(taskImages)))) { const d = await imgData(id); if (d) images[id] = d; }
  const payload = { app: 'aperturas-checklist', version: 1, exportado: new Date().toISOString(), autor: author(), catalogo: S.catalogo, tiendas, images };
  download(name, JSON.stringify(payload), 'application/json');
  toast(tiendas.length === 1 ? 'Respaldo descargado: compártelo para que lo combinen' : 'Respaldo completo descargado');
}

/* Combina una tienda importada con la local sin perder el avance de nadie:
   cada paso conserva la versión más reciente y los comentarios se suman. */
function mergeStore(a, b) {
  normalizeStore(b);
  const borrados = new Set([...a.borrados, ...b.borrados]);
  if ((b.editado || 0) > (a.editado || 0)) Object.assign(a, { nombre: b.nombre, cr: b.cr, apertura: b.apertura, notas: b.notas, editado: b.editado });
  b.plataformas.forEach(pb => {
    const pa = getPlat(a, pb.pid);
    if (!pa) { pb.tasks = pb.tasks.filter(k => !borrados.has(k.id)); a.plataformas.push(pb); return; }
    if ((pb.editado || 0) > (pa.editado || 0)) Object.assign(pa, { ingreso: pb.ingreso, responsable: pb.responsable, editado: pb.editado });
    pb.subs.forEach(sb => {
      const sa = pa.subs.find(x => x.id === sb.id);
      if (!sa) pa.subs.push(sb); else if ((sb.editado || 0) > (sa.editado || 0)) Object.assign(sa, sb);
    });
    pb.tasks.forEach((kb, idx) => {
      if (borrados.has(kb.id)) return;
      const ka = pa.tasks.find(x => x.id === kb.id);
      if (!ka) { pa.tasks.splice(Math.min(idx, pa.tasks.length), 0, kb); return; }
      const hist = [...new Map([...ka.historial, ...kb.historial].map(h => [h.id, h])).values()].sort((x, y) => x.fecha - y.fecha);
      const imgs = [...new Set([...ka.imagenes, ...kb.imagenes])];
      if ((kb.actualizado || 0) > (ka.actualizado || 0)) Object.assign(ka, kb);
      ka.historial = hist; ka.imagenes = imgs;
    });
    pa.tasks = pa.tasks.filter(k => !borrados.has(k.id));
  });
  a.plataformas.forEach(p => { p.tasks = p.tasks.filter(k => !borrados.has(k.id)); });
  a.borrados = [...borrados];
  const seen = new Set();
  a.actividad = [...a.actividad, ...b.actividad].filter(x => { const key = `${x.fecha}|${x.texto}`; if (seen.has(key)) return false; seen.add(key); return true; })
    .sort((x, y) => y.fecha - x.fecha).slice(0, 400);
}
async function importFile(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { return toast('El archivo no es un respaldo válido', true); }
  if (data?.app !== 'aperturas-checklist' || !Array.isArray(data.tiendas)) return toast('El archivo no es un respaldo de Aperturas', true);
  const names = data.tiendas.map(t => t.nombre).slice(0, 4).join(', ') + (data.tiendas.length > 4 ? '…' : '');
  const mode = await ask('Importar respaldo', `El archivo trae ${plural(data.tiendas.length, 'tienda', 'tiendas')} (${names})${data.autor ? `, exportado por ${data.autor}` : ''}. “Combinar” suma el avance de ambos lados: cada paso conserva su versión más reciente y no se pierden comentarios. “Reemplazar todo” borra lo que tienes y deja solo el archivo.`,
    [{ label: 'Cancelar' }, { label: 'Reemplazar todo', value: 'replace', cls: 'danger' }, { label: 'Combinar', value: 'merge', cls: 'primary' }]);
  if (!mode) return;
  for (const [id, d] of Object.entries(data.images || {})) await putImg(id, d);
  if (mode === 'replace') {
    S.tiendas = data.tiendas; if (Array.isArray(data.catalogo)) S.catalogo = data.catalogo.map(normalizeCatalog);
    S.tiendas.forEach(normalizeStore);
  } else {
    data.tiendas.forEach(t => {
      const local = S.tiendas.find(x => x.id === t.id) || S.tiendas.find(x => norm(x.cr) === norm(t.cr));
      if (local) { mergeStore(local, t); normalizeStore(local); } else { normalizeStore(t); S.tiendas.push(t); }
    });
    (data.catalogo || []).forEach(c => { normalizeCatalog(c); const mine = S.catalogo.find(x => x.id === c.id); if (!mine) S.catalogo.push(c); else c.subs.forEach(cs => { if (!mine.subs.some(x => x.id === cs.id)) mine.subs.push(cs); }); });
  }
  commit(); toast(mode === 'merge' ? 'Respaldo combinado' : 'Datos reemplazados');
}

/* ---------- Resumen por correo ---------- */
/* Arma el resumen de la tienda listo para correo: asunto, HTML con estilos
   en línea (Outlook y Gmail los respetan) y una versión en texto. */
function emailSummary(st) {
  const t = todayISO();
  const s = stats(allTasks(st));
  const dA = st.apertura ? daysFrom(t, st.apertura) : null;
  const cuando = dA == null ? 'sin fecha de apertura' : dA > 1 ? `faltan ${dA} días` : dA === 1 ? 'abre mañana' : dA === 0 ? 'abre hoy' : `abrió hace ${plural(-dA, 'día', 'días')}`;
  const nHoy = st.apertura ? nTxt(nOf(t, st.apertura)) : '';
  const plats = st.plataformas.slice().sort((a, b) => (a.ingreso || '9999').localeCompare(b.ingreso || '9999'));
  const done = k => k.estado === 'completado' || k.estado === 'na';
  const lastNote = k => [...k.historial].reverse().find(h => h.tipo === 'comentario' && h.texto);
  const where = (p, k) => `${p.nombre}${k.sub ? ` › ${subName(p, k.sub)}` : ''}`;
  const dateTxt = k => k.limite ? `${fmtShort(k.limite)}${st.apertura ? ` (${nTxt(nOf(k.limite, st.apertura))})` : ''}` : '';
  const bloq = plats.flatMap(p => p.tasks.filter(k => k.estado === 'bloqueado').map(k => ({ p, k })));
  const vencidos = plats.flatMap(p => p.tasks.filter(k => !done(k) && k.limite && k.limite < t && k.estado !== 'bloqueado').map(k => ({ p, k })));
  const proximos = HITOS.filter(([k]) => st.hitos?.[k] && st.hitos[k] >= t).map(([k, l]) => ({ l, d: st.hitos[k] }))
    .concat(st.apertura && st.apertura >= t ? [{ l: 'Apertura', d: st.apertura }] : []).sort((a, b) => a.d.localeCompare(b.d)).slice(0, 6);
  const subject = `Avance apertura ${st.nombre} (CR ${st.cr}) · ${s.pct}% · ${st.apertura ? `abre ${fmtShort(st.apertura)}` : 'sin fecha'}`;

  // ---- HTML (estilos en línea) ----
  const F = "font-family:Segoe UI,Arial,sans-serif;";
  const C = { ink: '#1c1b18', muted: '#6b6a64', line: '#e5e3dc', soft: '#f6f5f2', ok: '#2f7d56', warn: '#b07a0c', bad: '#c0392b' };
  const pctColor = p => p === 100 ? C.ok : p >= 50 ? C.ink : p > 0 ? C.warn : C.muted;
  const barH = (pct, color) => `<table role="presentation" cellpadding="0" cellspacing="0" style="width:120px;border-collapse:collapse;background:${C.line};border-radius:4px"><tr><td style="height:7px;width:${Math.max(pct, 0)}%;background:${color};border-radius:4px"></td><td style="height:7px"></td></tr></table>`;
  const th = `style="${F}text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:${C.muted};padding:8px 10px;border-bottom:2px solid ${C.line}"`;
  const td = (extra = '') => `style="${F}font-size:13px;color:${C.ink};padding:8px 10px;border-bottom:1px solid ${C.line};${extra}"`;
  const h2 = txt => `<h2 style="${F}font-size:15px;color:${C.ink};margin:22px 0 8px">${txt}</h2>`;
  const platRows = plats.map(p => {
    const x = stats(p.tasks);
    const main = `<tr>
      <td ${td('font-weight:600')}><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${safeColor(p.color)};margin-right:7px"></span>${esc(p.nombre)}</td>
      <td ${td(`font-weight:700;color:${pctColor(x.pct)}`)}>${x.pct}%</td>
      <td ${td()}>${barH(x.pct, safeColor(p.color))}</td>
      <td ${td()}>${x.completado} de ${x.aplic}</td>
      <td ${td(x.proceso ? `color:${C.warn}` : `color:${C.muted}`)}>${x.proceso}</td>
      <td ${td(x.bloqueado ? `color:${C.bad};font-weight:700` : `color:${C.muted}`)}>${x.bloqueado}</td>
      <td ${td(`color:${C.muted}`)}>${p.ingreso ? `${fmtShort(p.ingreso)}${st.apertura ? ` · ${nTxt(nOf(p.ingreso, st.apertura))}` : ''}` : '—'}</td>
    </tr>`;
    const subs = p.subs.map(sb => { const y = stats(subTasks(p, sb.id)); return `<tr>
      <td ${td(`padding-left:28px;color:${C.muted}`)}>↳ ${esc(sb.nombre)}</td>
      <td ${td(`color:${pctColor(y.pct)}`)}>${y.aplic ? `${y.pct}%` : '—'}</td><td ${td()}>${y.aplic ? barH(y.pct, safeColor(p.color)) : ''}</td>
      <td ${td(`color:${C.muted}`)}>${y.aplic ? `${y.completado} de ${y.aplic}` : 'Sin pasos'}</td><td ${td(`color:${C.muted}`)}>${y.proceso || ''}</td><td ${td(y.bloqueado ? `color:${C.bad}` : `color:${C.muted}`)}>${y.bloqueado || ''}</td><td ${td()}></td>
    </tr>`; }).join('');
    return main + subs;
  }).join('');
  const pendHtml = plats.map(p => {
    const list = p.tasks.filter(k => !done(k)).sort((a, b) => (a.limite || '9999').localeCompare(b.limite || '9999'));
    if (!list.length) return `<p style="${F}font-size:13px;margin:10px 0 2px"><b style="color:${C.ink}">${esc(p.nombre)}</b> <span style="color:${C.ok}">· sin pendientes ✓</span></p>`;
    const shown = list.slice(0, 12);
    return `<p style="${F}font-size:13px;margin:12px 0 4px"><b style="color:${C.ink}">${esc(p.nombre)}</b> <span style="color:${C.muted}">· ${plural(list.length, 'pendiente', 'pendientes')}</span></p>
      <ul style="${F}font-size:13px;color:${C.ink};margin:0;padding-left:20px">${shown.map(k => {
        const late = k.limite && k.limite < t;
        const tag = k.estado === 'bloqueado' ? `<span style="color:${C.bad};font-weight:700">[Bloqueado]</span> ` : k.estado === 'proceso' ? `<span style="color:${C.warn}">[En proceso]</span> ` : '';
        return `<li style="margin:3px 0">${tag}${esc(k.titulo)}${k.sub ? ` <span style="color:${C.muted}">(${esc(subName(p, k.sub))})</span>` : ''}${k.limite ? ` <span style="color:${late ? C.bad : C.muted}">— ${late ? 'venció ' : ''}${dateTxt(k)}</span>` : ''}${k.responsable ? ` <span style="color:${C.muted}">· ${esc(k.responsable)}</span>` : ''}</li>`;
      }).join('')}${list.length > shown.length ? `<li style="color:${C.muted};list-style:none;margin-left:-20px">…y ${list.length - shown.length} más</li>` : ''}</ul>`;
  }).join('');
  const html = `<div style="${F}color:${C.ink};max-width:760px">
    <p style="${F}font-size:14px;margin:0 0 14px">Hola equipo, comparto el avance de la apertura:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:${C.soft};border:1px solid ${C.line};border-radius:8px">
      <tr><td style="${F}padding:16px 18px">
        <div style="font-size:20px;font-weight:700">${esc(st.nombre)} <span style="font-size:13px;font-weight:500;color:${C.muted}">CR ${esc(st.cr)}${st.plaza ? ` · Plaza ${esc(st.plaza)}` : ''}${st.formato ? ` · ${esc(st.formato)}` : ''}</span></div>
        <div style="font-size:13px;color:${C.muted};margin-top:4px">Apertura: <b style="color:${C.ink}">${st.apertura ? fmtDate(st.apertura, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'sin fecha'}</b> · ${cuando}${nHoy ? ` · hoy es ${nHoy}` : ''}</div>
      </td>
      <td style="${F}padding:16px 18px;text-align:right;white-space:nowrap">
        <div style="font-size:30px;font-weight:700;color:${pctColor(s.pct)}">${s.pct}%</div>
        <div style="font-size:12px;color:${C.muted}">${s.completado} de ${s.aplic} pasos</div>
      </td></tr>
    </table>
    ${bloq.length || vencidos.length ? `<div style="${F}margin-top:14px;padding:10px 14px;border-left:4px solid ${C.bad};background:#fdf0ee;font-size:13px">
      ${bloq.length ? `<b style="color:${C.bad}">${bloq.length === 1 ? '1 paso bloqueado' : `${bloq.length} pasos bloqueados`}</b><ul style="margin:6px 0 4px;padding-left:20px">${bloq.map(({ p, k }) => { const c = lastNote(k); return `<li style="margin:3px 0"><b>${esc(where(p, k))}:</b> ${esc(k.titulo)}${c ? `<br><span style="color:${C.muted}">“${esc(c.texto)}” — ${esc(c.autor.split(' · ')[0])}</span>` : ''}</li>`; }).join('')}</ul>` : ''}
      ${vencidos.length ? `<b style="color:${C.bad}">${vencidos.length === 1 ? '1 paso vencido' : `${vencidos.length} pasos vencidos`}</b><ul style="margin:6px 0 0;padding-left:20px">${vencidos.map(({ p, k }) => `<li style="margin:3px 0"><b>${esc(where(p, k))}:</b> ${esc(k.titulo)} <span style="color:${C.muted}">— era para el ${dateTxt(k)}</span></li>`).join('')}</ul>` : ''}
    </div>` : ''}
    ${h2('Avance por plataforma')}
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
      <tr><th ${th}>Plataforma</th><th ${th}>Avance</th><th ${th}></th><th ${th}>Terminados</th><th ${th}>En proceso</th><th ${th}>Bloqueados</th><th ${th}>Ingreso</th></tr>
      ${platRows}
    </table>
    ${proximos.length ? `${h2('Próximas fechas clave')}<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${proximos.map(x => `<tr><td ${td(`color:${C.muted};white-space:nowrap`)}>${fmtDate(x.d, { weekday: 'short', day: 'numeric', month: 'short' })}${st.apertura ? ` · ${nTxt(nOf(x.d, st.apertura))}` : ''}</td><td ${td(x.l === 'Apertura' ? `font-weight:700;color:${C.bad}` : '')}>${esc(x.l)}</td></tr>`).join('')}</table>` : ''}
    ${h2('Pendientes por plataforma')}
    ${pendHtml}
    <p style="${F}font-size:11.5px;color:${C.muted};margin-top:24px;border-top:1px solid ${C.line};padding-top:10px">Resumen generado desde Aperturas · Check list de plataformas · ${fmtDateTime(Date.now())}${me() ? ` · ${esc(me())}` : ''}</p>
  </div>`;

  // ---- Texto plano ----
  const L = [];
  L.push(`${st.nombre} · CR ${st.cr}${st.plaza ? ` · Plaza ${st.plaza}` : ''}`);
  L.push(`Apertura: ${st.apertura ? fmtDate(st.apertura) : 'sin fecha'} (${cuando}${nHoy ? `; hoy es ${nHoy}` : ''})`);
  L.push(`Avance general: ${s.pct}% (${s.completado} de ${s.aplic} pasos)`, '');
  if (bloq.length) { L.push('BLOQUEOS'); bloq.forEach(({ p, k }) => { const c = lastNote(k); L.push(`- [${where(p, k)}] ${k.titulo}${c ? ` — "${c.texto}" (${c.autor.split(' · ')[0]})` : ''}`); }); L.push(''); }
  if (vencidos.length) { L.push('VENCIDOS'); vencidos.forEach(({ p, k }) => L.push(`- [${where(p, k)}] ${k.titulo} — era para el ${dateTxt(k)}`)); L.push(''); }
  L.push('AVANCE POR PLATAFORMA');
  plats.forEach(p => { const x = stats(p.tasks); L.push(`- ${p.nombre}: ${x.pct}% (${x.completado}/${x.aplic})${x.proceso ? ` · ${x.proceso} en proceso` : ''}${x.bloqueado ? ` · ${x.bloqueado} bloqueado(s)` : ''}${p.ingreso ? ` · ingreso ${fmtShort(p.ingreso)}` : ''}`); p.subs.forEach(sb => { const y = stats(subTasks(p, sb.id)); L.push(`    ${sb.nombre}: ${y.aplic ? `${y.pct}% (${y.completado}/${y.aplic})` : 'sin pasos'}`); }); });
  if (proximos.length) { L.push('', 'PRÓXIMAS FECHAS CLAVE'); proximos.forEach(x => L.push(`- ${fmtShort(x.d)}${st.apertura ? ` (${nTxt(nOf(x.d, st.apertura))})` : ''}: ${x.l}`)); }
  L.push('', 'PENDIENTES');
  plats.forEach(p => { const list = p.tasks.filter(k => !done(k)); L.push(`${p.nombre}: ${list.length ? '' : 'sin pendientes'}`); list.slice(0, 12).forEach(k => L.push(`  - ${k.estado === 'bloqueado' ? '[Bloqueado] ' : k.estado === 'proceso' ? '[En proceso] ' : ''}${k.titulo}${k.limite ? ` — ${dateTxt(k)}` : ''}`)); if (list.length > 12) L.push(`  …y ${list.length - 12} más`); });
  return { subject, html, text: L.join('\n') };
}

let mailCtx = null;
function openMailDlg(st) {
  mailCtx = emailSummary(st);
  $('#mailSubject').value = mailCtx.subject;
  $('#mailPreview').innerHTML = mailCtx.html;
  $('#mailDlg').showModal();
}
async function copyMailHtml() {
  const { html, text } = mailCtx;
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })]);
  } catch {
    const range = document.createRange(); range.selectNodeContents($('#mailPreview'));
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range); document.execCommand('copy'); sel.removeAllRanges();
  }
  toast('Resumen copiado: pégalo en el cuerpo de tu correo');
}
const b64utf8 = s => btoa(unescape(encodeURIComponent(s)));
function downloadEml() {
  const subject = $('#mailSubject').value.trim() || mailCtx.subject;
  const body = `<!doctype html><html><head><meta charset="utf-8"></head><body>${mailCtx.html}</body></html>`;
  const eml = [
    'To: ', `Subject: =?UTF-8?B?${b64utf8(subject)}?=`, 'X-Unsent: 1', 'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '',
    b64utf8(body).replace(/.{1,76}/g, '$&\r\n'),
  ].join('\r\n');
  const name = subject.replace(/[\\/:*?"<>|]+/g, '').slice(0, 80);
  download(`${name}.eml`, eml, 'message/rfc822');
  toast('Ábrelo con Outlook: queda listo como correo nuevo para enviar');
}
function openMailto() {
  const subject = $('#mailSubject').value.trim() || mailCtx.subject;
  let body = mailCtx.text;
  if (body.length > 1700) body = body.slice(0, 1700) + '\n…\n(El resumen completo está en la app; usa "Copiar" para pegarlo con formato.)';
  location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
$('#mailCopy').addEventListener('click', copyMailHtml);
$('#mailEml').addEventListener('click', downloadEml);
$('#mailTo').addEventListener('click', openMailto);
$('#mailText').addEventListener('click', () => copyText(mailCtx.text, 'Resumen en texto copiado'));

/* ---------- Menús desplegables ---------- */
document.addEventListener('click', e => {
  $$('details.menu[open]').forEach(d => { if (!d.contains(e.target) || e.target.closest('.menu-item')) d.open = false; });
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('details.menu[open]').forEach(d => { d.open = false; }); });

/* ---------- Barra lateral ---------- */
$('#newStoreSide').addEventListener('click', () => openStoreDlg());
$('#helpBtn').addEventListener('click', openHelp);
$('#helpDlg').addEventListener('close', () => {
  if (!Pref.get('ap-help-seen')) { Pref.set('ap-help-seen', '1'); if (!Pref.get('ap-user').trim()) openUserDlg('Para empezar, escribe tu nombre y elige tu plataforma. Así tu equipo sabrá quién marcó o comentó cada paso.'); }
});
$('#userBtn').addEventListener('click', () => openUserDlg());
$('#exportAll').addEventListener('click', () => exportData(S.tiendas, `aperturas_respaldo_${todayISO()}.json`));
$('#importInput').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) importFile(f); });
$('#themeBtn').addEventListener('click', () => {
  const next = { '': 'light', light: 'dark', dark: '' }[Pref.get('ap-theme')] ?? '';
  Pref.set('ap-theme', next);
  if (next) document.documentElement.dataset.theme = next; else delete document.documentElement.dataset.theme;
  renderSidebar(route());
});
document.addEventListener('keydown', e => {
  if (e.target.closest('input, textarea, select, [contenteditable]') || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
  if (e.key === '/' && $('#q')) { e.preventDefault(); $('#q').focus(); }
  else if (e.key.toLowerCase() === 'n' && route().view === 'home') { e.preventDefault(); openStoreDlg(); }
  else if (e.key.toLowerCase() === 'n' && route().view === 'plat') { e.preventDefault(); $('.quick-add input')?.focus(); }
});
window.addEventListener('hashchange', () => { ui.taskFilter = 'todos'; ui.editPlat = false; ui.selPlat = null; render(); });
window.addEventListener('pagehide', () => { clearTimeout(saveTimer); if (S) DB.set('kv', 'state', S).catch(() => {}); });

/* ---------- Inicio ---------- */
(async function init() {
  await DB.init();
  let s = await DB.get('kv', 'state').catch(() => null);
  if (!s || !Array.isArray(s.tiendas)) s = window.AP_BASE ? { version: CATALOG_VERSION, catalogo: structuredClone(DEFAULT_CATALOG), tiendas: [] } : seedState();
  const soloEjemplo = s.tiendas.every(t => (t.notas || '').startsWith('Tienda de ejemplo') && t.cr === '50AME' && t.nombre === 'OXXO Ameyalli');
  if ((s.version || 1) < CATALOG_VERSION && soloEjemplo) s = seedState();
  if ((s.version || 1) < 3) {
    // Plataformas: Conservación, Administrativo, Comercial (con sus subdepartamentos) y TI
    const old = ['exp', 'con', 'mto', 'ti', 'tel', 'seg', 'ope', 'log', 'com', 'cedis', 'mtto', 'adm'];
    s.catalogo = [...structuredClone(DEFAULT_CATALOG), ...(s.catalogo || []).filter(c => !old.includes(c.id))]; s.version = 3;
  }
  if ((s.version || 1) < 4) {
    // Check list real de TI (solo la plantilla; las tiendas ya creadas conservan sus pasos)
    const ti = (s.catalogo || []).find(c => c.id === 'ti'); if (ti) ti.plantilla = [...TI_STEPS];
    s.version = 4;
  }
  if ((s.version || 1) < 5) {
    // Food Service en Comercial: plantilla y tiendas existentes
    const com = (s.catalogo || []).find(c => c.id === 'com');
    if (com) { com.subs ||= []; if (!com.subs.some(x => x.id === FV_SUB.id)) com.subs.push(structuredClone(FV_SUB)); }
    (s.tiendas || []).forEach(t => {
      normalizeStore(t);
      const p = t.plataformas.find(x => x.pid === 'com');
      if (p && !p.subs.some(x => x.id === FV_SUB.id)) {
        addSubTo(p, FV_SUB, true, t.apertura);
        t.actividad.unshift({ fecha: Date.now(), autor: 'Sistema', pid: 'com', texto: 'Agregó el subdepartamento Food Service con su check list' });
      }
    });
    s.version = 5;
  }
  if ((s.version || 1) < 6) {
    const pp = (s.catalogo || []).find(c => c.id === 'com')?.subs?.find(x => x.id === 'com-precios');
    if (pp) pp.plantilla = [...PP_STEPS];
    (s.tiendas || []).forEach(t => {
      normalizeStore(t);
      const p = t.plataformas.find(x => x.pid === 'com');
      if (!p || !p.subs.some(x => x.id === 'com-precios')) return;
      const untouched = k => k.sub === 'com-precios' && PP_OLD.includes(k.titulo) && k.estado === 'pendiente' && !k.historial.length && !k.imagenes.length;
      p.tasks = p.tasks.filter(k => !untouched(k));
      const have = new Set(subTasks(p, 'com-precios').map(k => k.titulo));
      PP_STEPS.filter(x => !have.has(x)).forEach(x => p.tasks.push(taskFromTpl(x, t.apertura, { sub: 'com-precios' })));
      t.actividad.unshift({ fecha: Date.now(), autor: 'Sistema', pid: 'com', texto: 'Cargó el check list de Precios y Promociones' });
    });
    s.version = 6;
  }
  if ((s.version || 1) < 7) {
    const ab = (s.catalogo || []).find(c => c.id === 'com')?.subs?.find(x => x.id === 'com-abasto');
    if (ab) ab.plantilla = structuredClone(ABASTO_STEPS);
    (s.tiendas || []).forEach(t => {
      normalizeStore(t);
      const p = t.plataformas.find(x => x.pid === 'com');
      if (!p || !p.subs.some(x => x.id === 'com-abasto')) return;
      const have = new Set(subTasks(p, 'com-abasto').map(k => k.titulo));
      const nuevos = ABASTO_STEPS.filter(x => !have.has(x.titulo));
      nuevos.forEach(x => p.tasks.push(taskFromTpl(x, t.apertura, { sub: 'com-abasto' })));
      if (nuevos.length) t.actividad.unshift({ fecha: Date.now(), autor: 'Sistema', pid: 'com', texto: 'Cargó el check list de Seguimiento Abasto' });
    });
    s.version = 7;
  }
  S = s;
  if (!Array.isArray(S.catalogo)) S.catalogo = structuredClone(DEFAULT_CATALOG);
  S.catalogo.forEach(normalizeCatalog);
  S.tiendas.forEach(normalizeStore);
  applyBase();
  $$('[data-ic]').forEach(el => { el.innerHTML = ic(el.dataset.ic); });
  const ver = window.APP_VERSION ? `Versión ${window.APP_VERSION}${window.APP_BUILD ? ` · ${window.APP_BUILD}` : ''}` : '';
  $('#appVersion').textContent = ver;
  $('#helpLegend').innerHTML = STATUS_KEYS.map(k => `<li>${stTag(k)}<span>${({ pendiente: 'Aún no se empieza.', proceso: 'Ya se está trabajando.', bloqueado: 'No se puede avanzar; deja un comentario con lo que falta.', completado: 'Terminado.', na: 'No aplica en esta tienda; no cuenta en el porcentaje.' })[k]}</span></li>`).join('');
  save(); render();
  if (!Pref.get('ap-help-seen')) openHelp();
  if (!DB.persistent) toast('Este navegador no permite guardar imágenes; exporta un respaldo antes de cerrar.', true);
  navigator.storage?.persist?.().catch(() => {});
})();
