/* =========================================================
   Sincronización con Supabase (avance compartido en tiempo real)
   ---------------------------------------------------------
   - La base es la fuente de verdad: al abrir, se descargan tiendas, plataformas,
     subdepartamentos, pasos y actividad, y se arma el estado de la app.
   - Cada vez que la app guarda (save), se comparan los datos con lo último que
     se sincronizó y solo se suben los cambios. Si no hay señal, se reintenta.
   - Los cambios de otras personas llegan por tiempo real y se pintan al momento.
   - La primera vez en cada navegador, el avance que ya existía aquí se junta
     con la base (por tienda, plataforma, subdepartamento y nombre del paso).
   - Las fotos y las plantillas siguen guardándose solo en este navegador.
   ========================================================= */
(function () {
  const CFG = {
    url: 'https://ccdjdbxlazypcbxzniqn.supabase.co',
    key: 'sb_publishable_3myypMHc2f9Dl8hlI_1Ung_z4AqH2KJ', // llave pública (hecha para ir en el sitio)
  };
  const TABLES = ['tiendas', 'plataformas', 'subdepartamentos', 'pasos', 'actividad'];
  const PK = { tiendas: 'cr', plataformas: 'id', subdepartamentos: 'id', pasos: 'id', actividad: 'id' };
  const PLAT_ORDER = ['mtto', 'adm', 'com', 'ti'];
  const MERGED_KEY = 'ap-sync-merged-' + CFG.url.split('//')[1].split('.')[0];

  let db = null;          // cliente de Supabase
  let ready = false;      // ya se cargó la base
  let pushing = false, again = false;
  const snap = Object.fromEntries(TABLES.map(t => [t, new Map()])); // última versión sincronizada (id → JSON)
  let estado = 'local';   // local | conectando | en-linea | sin-conexion | error

  /* ---------- Filas de la base a partir del estado de la app ---------- */
  const nz = v => (v === '' || v == null ? null : v);
  const rowTienda = t => ({ cr: t.cr, nombre: t.nombre, plaza: nz(t.plaza), formato: nz(t.formato), apertura: nz(t.apertura), notas: nz(t.notas), hitos: t.hitos && Object.keys(t.hitos).length ? t.hitos : null });
  const rowPlat = (t, p) => ({ id: `${t.cr}-${p.pid}`, tienda_cr: t.cr, pid: p.pid, nombre: p.nombre, color: nz(p.color), ingreso: nz(p.ingreso), responsable: nz(p.responsable), correo: nz(p.correo), telefono: nz(p.telefono), bloqueada: typeof isLocked === 'function' ? isLocked(p) : false });
  const rowSub = (t, p, s) => ({ id: `${t.cr}-${p.pid}-${s.id}`, tienda_cr: t.cr, pid: p.pid, sub_id: s.id, nombre: s.nombre, rol: nz(s.rol), responsable: nz(s.responsable), correo: nz(s.correo), telefono: nz(s.telefono) });
  const rowPaso = (t, p, k, i) => ({ id: k.id, tienda_cr: t.cr, pid: p.pid, sub_id: nz(k.sub), orden: i + 1, titulo: k.titulo, descripcion: nz(k.descripcion), responsable: nz(k.responsable), dias_n: k.diasN ?? null, limite: nz(k.limite), estado: k.estado });
  const rowAct = (t, k, h) => ({ id: h.id, paso_id: k.id, tienda_cr: t.cr, tipo: h.tipo === 'estado' ? 'estado' : 'comentario', autor: nz(h.autor), texto: nz(h.texto), estado_de: nz(h.de), estado_a: nz(h.a), fecha: new Date(h.fecha || Date.now()).toISOString() });

  function rowsFromState() {
    const out = Object.fromEntries(TABLES.map(t => [t, new Map()]));
    for (const t of S.tiendas) {
      if (!t.cr) continue;
      out.tiendas.set(t.cr, rowTienda(t));
      for (const p of t.plataformas) {
        out.plataformas.set(`${t.cr}-${p.pid}`, rowPlat(t, p));
        for (const s of p.subs) out.subdepartamentos.set(`${t.cr}-${p.pid}-${s.id}`, rowSub(t, p, s));
        p.tasks.forEach((k, i) => {
          out.pasos.set(k.id, rowPaso(t, p, k, i));
          for (const h of k.historial) { if (!h.id) h.id = uid('h'); out.actividad.set(h.id, rowAct(t, k, h)); }
        });
      }
    }
    return out;
  }
  // Para comparar: sin campos que pone la base sola
  const sig = r => JSON.stringify(r);

  /* ---------- Estado de la app a partir de la base ---------- */
  function buildState(data, local) {
    const localStores = new Map(local.map(t => [t.cr, t]));
    const localTasks = new Map(); local.forEach(t => everyTask(t).forEach(k => localTasks.set(k.id, k)));
    const hist = new Map();
    data.actividad.sort((a, b) => Date.parse(a.fecha) - Date.parse(b.fecha)).forEach(a => {
      (hist.get(a.paso_id) || hist.set(a.paso_id, []).get(a.paso_id)).push(a);
    });
    const tiendas = data.tiendas.map(r => {
      const old = localStores.get(r.cr);
      const t = {
        id: old?.id || r.cr, nombre: r.nombre, cr: r.cr, apertura: r.apertura || '', notas: r.notas || '', plaza: r.plaza || '', formato: r.formato || '',
        hitos: r.hitos || {}, fuente: old?.fuente || 'base', creado: old?.creado || Date.now(), editado: Date.parse(r.actualizado) || Date.now(),
        actividad: old?.actividad || [], borrados: [], plataformas: [],
      };
      const plats = data.plataformas.filter(p => p.tienda_cr === r.cr).sort((a, b) => PLAT_ORDER.indexOf(a.pid) - PLAT_ORDER.indexOf(b.pid));
      for (const pr of plats) {
        const cat = S.catalogo.find(c => c.id === pr.pid);
        const p = { pid: pr.pid, nombre: pr.nombre, color: pr.color || '#137b5f', ingreso: pr.ingreso || '', responsable: pr.responsable || '', correo: pr.correo || '', telefono: pr.telefono || '', editado: Date.now(), subs: [], tasks: [] };
        const subs = data.subdepartamentos.filter(s => s.tienda_cr === r.cr && s.pid === pr.pid);
        const order = (cat?.subs || []).map(s => s.id);
        subs.sort((a, b) => (order.indexOf(a.sub_id) + 1 || 99) - (order.indexOf(b.sub_id) + 1 || 99));
        p.subs = subs.map(s => ({ id: s.sub_id, nombre: s.nombre, rol: s.rol || '', responsable: s.responsable || '', correo: s.correo || '', telefono: s.telefono || '', editado: Date.now() }));
        p.tasks = data.pasos.filter(k => k.tienda_cr === r.cr && k.pid === pr.pid).sort((a, b) => a.orden - b.orden).map(k => {
          const lk = localTasks.get(k.id);
          return {
            id: k.id, sub: k.sub_id || '', titulo: k.titulo, descripcion: k.descripcion || '', responsable: k.responsable || '', limite: k.limite || '',
            estado: k.estado, diasN: k.dias_n, imagenes: lk?.imagenes || [], creado: lk?.creado || Date.now(), actualizado: Date.parse(k.actualizado) || Date.now(),
            historial: (hist.get(k.id) || []).map(a => {
              const lh = lk?.historial.find(h => h.id === a.id);
              return a.tipo === 'estado'
                ? { id: a.id, tipo: 'estado', autor: a.autor || '', de: a.estado_de, a: a.estado_a, fecha: Date.parse(a.fecha) }
                : { id: a.id, tipo: 'comentario', autor: a.autor || '', texto: a.texto || '', imagenes: lh?.imagenes || [], fecha: Date.parse(a.fecha) };
            }),
          };
        });
        t.plataformas.push(p);
      }
      normalizeStore(t);
      return t;
    });
    return tiendas;
  }

  /* ---------- Juntar el avance que ya había en este navegador (solo la primera vez) ---------- */
  function mergeLocal(remote, local) {
    const key = (cr, pid, sub, titulo) => `${cr}|${pid}|${sub || ''}|${norm(titulo)}`;
    const idx = new Map();
    remote.forEach(t => t.plataformas.forEach(p => p.tasks.forEach(k => idx.set(key(t.cr, p.pid, k.sub, k.titulo), { t, p, k }))));
    let n = 0;
    for (const lt of local) {
      const rt = remote.find(t => t.cr === lt.cr);
      if (!rt) { remote.push(lt); n++; continue; } // tienda que solo existía aquí: se sube completa
      for (const lp of lt.plataformas) {
        const rp = rt.plataformas.find(p => p.pid === lp.pid);
        if (!rp) { rt.plataformas.push(lp); n++; continue; }
        ['responsable', 'correo', 'telefono', 'ingreso'].forEach(f => { if (!rp[f] && lp[f]) { rp[f] = lp[f]; n++; } });
        for (const ls of lp.subs) {
          const rs = rp.subs.find(s => s.id === ls.id);
          if (!rs) { rp.subs.push(ls); continue; }
          ['responsable', 'correo', 'telefono'].forEach(f => { if (!rs[f] && ls[f]) { rs[f] = ls[f]; n++; } });
        }
        for (const lk of lp.tasks) {
          const hit = idx.get(key(lt.cr, lp.pid, lk.sub, lk.titulo));
          if (!hit) { rp.tasks.push(lk); n++; continue; } // paso agregado aquí
          const rk = hit.k;
          const tocado = lk.estado !== 'pendiente' || lk.historial.length || lk.imagenes.length;
          if (!tocado) continue;
          if (rk.estado === 'pendiente' && lk.estado !== 'pendiente') { rk.estado = lk.estado; n++; }
          const ids = new Set(rk.historial.map(h => h.id));
          lk.historial.forEach(h => { if (!h.id) h.id = uid('h'); if (!ids.has(h.id)) { rk.historial.push(h); n++; } });
          rk.historial.sort((a, b) => a.fecha - b.fecha);
          rk.imagenes = [...new Set([...rk.imagenes, ...lk.imagenes])];
        }
      }
    }
    return n;
  }

  /* ---------- Subir cambios ---------- */
  async function push() {
    if (!ready || !db) return;
    if (pushing) { again = true; return; }
    pushing = true;
    try {
      const rows = rowsFromState();
      // Altas y cambios, en orden de dependencia
      for (const t of TABLES) {
        const changed = [];
        for (const [id, r] of rows[t]) if (snap[t].get(id) !== sig(r)) changed.push(r);
        for (let i = 0; i < changed.length; i += 500) {
          const part = changed.slice(i, i + 500);
          const { error } = await db.from(t).upsert(part, { onConflict: PK[t] });
          if (error) throw error;
          part.forEach(r => snap[t].set(r[PK[t]], sig(r)));
        }
      }
      // Bajas, en orden inverso (las tiendas borran en cascada lo demás)
      for (const t of [...TABLES].reverse()) {
        const gone = [...snap[t].keys()].filter(id => !rows[t].has(id));
        for (let i = 0; i < gone.length; i += 200) {
          const part = gone.slice(i, i + 200);
          const { error } = await db.from(t).delete().in(PK[t], part);
          if (error) throw error;
          part.forEach(id => snap[t].delete(id));
        }
      }
      setEstado('en-linea');
    } catch (e) {
      setEstado(navigator.onLine ? 'error' : 'sin-conexion', e);
    } finally {
      pushing = false;
      if (again) { again = false; setTimeout(push, 50); }
    }
  }

  /* ---------- Cambios que llegan de otras personas ---------- */
  let paintTimer = 0;
  function paint() {
    clearTimeout(paintTimer);
    paintTimer = setTimeout(() => {
      const a = document.activeElement;
      // No repintar mientras alguien escribe en la pantalla; se pinta al salir del campo
      if (a && a.closest && a.closest('#main') && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) { a.addEventListener('blur', paint, { once: true }); return; }
      if (typeof DB !== 'undefined') DB.set('kv', 'state', S).catch(() => {});
      render();
    }, 120);
  }
  const findStore = cr => S.tiendas.find(t => t.cr === cr);
  function findTask(id) { for (const t of S.tiendas) for (const p of t.plataformas) { const k = p.tasks.find(x => x.id === id); if (k) return { t, p, k }; } return null; }

  function onRemote(table, ev, row, old) {
    const id = (row || old)?.[PK[table]];
    if (ev === 'DELETE') {
      snap[table].delete(id);
      if (table === 'tiendas') S.tiendas = S.tiendas.filter(t => t.cr !== id);
      if (table === 'pasos') { const f = findTask(id); if (f) f.p.tasks = f.p.tasks.filter(k => k.id !== id); }
      if (table === 'subdepartamentos') S.tiendas.forEach(t => t.plataformas.forEach(p => { p.subs = p.subs.filter(s => `${t.cr}-${p.pid}-${s.id}` !== id); }));
      if (table === 'actividad') S.tiendas.forEach(t => everyTask(t).forEach(k => { k.historial = k.historial.filter(h => h.id !== id); }));
      return paint();
    }
    if (snap[table].get(id) === sig(stripServer(table, row))) return; // es mi propio cambio de regreso
    if (table === 'tiendas') {
      let t = findStore(row.cr);
      if (!t) { t = { id: row.cr, cr: row.cr, plataformas: [], actividad: [], borrados: [], creado: Date.now() }; S.tiendas.push(t); }
      Object.assign(t, { nombre: row.nombre, plaza: row.plaza || '', formato: row.formato || '', apertura: row.apertura || '', notas: row.notas || '', hitos: row.hitos || {} });
      normalizeStore(t);
    }
    if (table === 'plataformas') {
      const t = findStore(row.tienda_cr); if (!t) return;
      let p = t.plataformas.find(x => x.pid === row.pid);
      if (!p) { p = { pid: row.pid, subs: [], tasks: [] }; t.plataformas.push(p); t.plataformas.sort((a, b) => PLAT_ORDER.indexOf(a.pid) - PLAT_ORDER.indexOf(b.pid)); }
      Object.assign(p, { nombre: row.nombre, color: row.color || p.color, ingreso: row.ingreso || '', responsable: row.responsable || '', correo: row.correo || '', telefono: row.telefono || '' });
    }
    if (table === 'subdepartamentos') {
      const p = findStore(row.tienda_cr)?.plataformas.find(x => x.pid === row.pid); if (!p) return;
      let s = p.subs.find(x => x.id === row.sub_id);
      if (!s) { s = { id: row.sub_id }; p.subs.push(s); }
      Object.assign(s, { nombre: row.nombre, rol: row.rol || '', responsable: row.responsable || '', correo: row.correo || '', telefono: row.telefono || '' });
    }
    if (table === 'pasos') {
      const p = findStore(row.tienda_cr)?.plataformas.find(x => x.pid === row.pid); if (!p) return;
      let k = p.tasks.find(x => x.id === row.id);
      if (!k) { k = { id: row.id, imagenes: [], historial: [], creado: Date.now() }; p.tasks.splice(Math.max(0, row.orden - 1), 0, k); }
      Object.assign(k, { sub: row.sub_id || '', titulo: row.titulo, descripcion: row.descripcion || '', responsable: row.responsable || '', limite: row.limite || '', estado: row.estado, diasN: row.dias_n, actualizado: Date.parse(row.actualizado) || Date.now() });
    }
    if (table === 'actividad') {
      const f = findTask(row.paso_id); if (!f) return;
      if (!f.k.historial.some(h => h.id === row.id)) {
        f.k.historial.push(row.tipo === 'estado'
          ? { id: row.id, tipo: 'estado', autor: row.autor || '', de: row.estado_de, a: row.estado_a, fecha: Date.parse(row.fecha) }
          : { id: row.id, tipo: 'comentario', autor: row.autor || '', texto: row.texto || '', imagenes: [], fecha: Date.parse(row.fecha) });
        f.k.historial.sort((a, b) => a.fecha - b.fecha);
      }
    }
    // Lo que llegó ya está sincronizado: se guarda su firma para no volver a subirlo
    const now = rowsFromState();
    for (const t of TABLES) { const r = now[t].get(id); if (r && t === table) snap[t].set(id, sig(r)); }
    if (table === 'pasos' || table === 'actividad') { // el orden de los pasos de esa plataforma también cambia de firma
      now.pasos.forEach((r, k) => { if (r.tienda_cr === (row.tienda_cr) && snap.pasos.has(k)) snap.pasos.set(k, sig(r)); });
    }
    paint();
  }
  // Quita lo que solo pone la base (actualizado, actualizado_por) para comparar con mis firmas
  function stripServer(table, row) {
    const r = { ...row }; delete r.actualizado; delete r.actualizado_por;
    if (table === 'actividad' && r.fecha) r.fecha = new Date(r.fecha).toISOString();
    return r;
  }

  /* ---------- Indicador de conexión ---------- */
  function setEstado(e, err) {
    estado = e;
    const el = document.getElementById('syncPill'); if (!el) return;
    const txt = { conectando: 'Conectando…', 'en-linea': 'En línea · compartido', 'sin-conexion': 'Sin señal · se guarda al volver', error: 'Error al guardar en la nube', local: 'Solo en este equipo' }[e];
    el.dataset.state = e; el.querySelector('span').textContent = txt;
    el.title = err ? String(err.message || err) : txt;
    if (err) console.warn('[sync]', err);
  }

  /* ---------- Arranque ---------- */
  async function fetchAll() {
    const out = {};
    for (const t of TABLES) {
      out[t] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await db.from(t).select('*').range(from, from + 999);
        if (error) throw error;
        out[t].push(...data);
        if (data.length < 1000) break;
      }
    }
    return out;
  }
  async function start() {
    if (!window.supabase?.createClient) { setEstado('local'); return; }
    setEstado('conectando');
    db = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: false }, realtime: { params: { eventsPerSecond: 20 } } });
    try {
      const data = await fetchAll();
      const local = S.tiendas;
      const remote = buildState(data, local);
      // Firmas de lo que ya está en la base, antes de juntar lo local
      S.tiendas = remote;
      const base = rowsFromState();
      TABLES.forEach(t => base[t].forEach((r, id) => snap[t].set(id, sig(r))));
      let merged = 0;
      if (!localStorage.getItem(MERGED_KEY)) {
        merged = mergeLocal(S.tiendas, local);
        try { localStorage.setItem(MERGED_KEY, '1'); } catch { /* sin almacenamiento */ }
      }
      S.tiendas.forEach(normalizeStore);
      ready = true;
      await DB.set('kv', 'state', S).catch(() => {});
      render();
      await push();
      if (merged) toast(`Se subió a la nube tu avance de este equipo (${merged} ${merged === 1 ? 'cambio' : 'cambios'})`);
      // Tiempo real
      const ch = db.channel('aperturas');
      TABLES.forEach(t => ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, p => onRemote(t, p.eventType, p.new && Object.keys(p.new).length ? p.new : null, p.old)));
      ch.subscribe(st => { if (st === 'SUBSCRIBED') setEstado('en-linea'); if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') setEstado('sin-conexion'); });
      window.addEventListener('online', () => { setEstado('conectando'); push(); });
      window.addEventListener('offline', () => setEstado('sin-conexion'));
      // Al volver a la pestaña, traer lo que haya cambiado mientras no se veía
      document.addEventListener('visibilitychange', () => { if (!document.hidden && navigator.onLine) refresh(); });
    } catch (e) {
      setEstado(navigator.onLine ? 'error' : 'sin-conexion', e);
      // Sin la base, la app sigue funcionando con lo de este equipo y reintenta después
      setTimeout(() => { if (!ready) start(); }, 20000);
    }
  }
  let lastRefresh = 0;
  async function refresh() {
    if (!ready || Date.now() - lastRefresh < 15000) return;
    lastRefresh = Date.now();
    try {
      await push(); // primero lo pendiente de aquí
      const data = await fetchAll();
      S.tiendas = buildState(data, S.tiendas);
      TABLES.forEach(t => snap[t].clear());
      const base = rowsFromState();
      TABLES.forEach(t => base[t].forEach((r, id) => snap[t].set(id, sig(r))));
      paint();
    } catch (e) { setEstado(navigator.onLine ? 'error' : 'sin-conexion', e); }
  }

  window.APSync = { start, push, refresh, get estado() { return estado; } };
})();
