-- =========================================================
-- Aperturas · Check list de plataformas
-- Base de datos para Supabase (PostgreSQL)
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pega TODO este archivo → Run.
-- Después importa los CSV de la carpeta "plantillas" en este orden:
--   1) tiendas  2) plataformas  3) subdepartamentos  4) pasos  5) actividad (vacío por ahora)
-- =========================================================

-- 1) Tiendas (una fila por apertura). El CR es la llave.
create table if not exists public.tiendas (
  cr          text primary key,
  nombre      text not null,
  plaza       text,
  formato     text,
  apertura    date,
  notas       text,
  hitos       jsonb,                       -- fechas clave de la junta semanal
  actualizado timestamptz not null default now()
);

-- 2) Plataformas de cada tienda (Conservación, Administrativo, Comercial, TI)
create table if not exists public.plataformas (
  id          text primary key,            -- CR-pid, ej. 507OA-ti
  tienda_cr   text not null references public.tiendas(cr) on delete cascade,
  pid         text not null,               -- mtto | adm | com | ti
  nombre      text not null,
  color       text,
  ingreso     date,
  responsable text,
  correo      text,
  telefono    text,
  bloqueada   boolean not null default false, -- true = "Próximamente" (no cuenta en el avance)
  actualizado timestamptz not null default now(),
  unique (tienda_cr, pid)
);

-- 3) Subdepartamentos (por ahora solo Comercial)
create table if not exists public.subdepartamentos (
  id          text primary key,            -- CR-pid-sub, ej. 507OA-com-com-abasto
  tienda_cr   text not null references public.tiendas(cr) on delete cascade,
  pid         text not null,
  sub_id      text not null,
  nombre      text not null,
  rol         text,
  responsable text,
  correo      text,
  telefono    text,
  actualizado timestamptz not null default now()
);

-- 4) Pasos del check list
create table if not exists public.pasos (
  id          text primary key,
  tienda_cr   text not null references public.tiendas(cr) on delete cascade,
  pid         text not null,
  sub_id      text,                        -- vacío = pasos generales de la plataforma
  orden       int  not null default 0,
  titulo      text not null,
  descripcion text,
  responsable text,
  dias_n      int,                         -- N-#: días antes de la apertura
  limite      date,
  estado      text not null default 'pendiente'
              check (estado in ('pendiente','proceso','bloqueado','completado','na')),
  actualizado timestamptz not null default now(),
  actualizado_por text
);
create index if not exists pasos_tienda_idx on public.pasos (tienda_cr, pid);

-- 5) Actividad: comentarios y cambios de estatus de cada paso
create table if not exists public.actividad (
  id          text primary key default gen_random_uuid()::text,
  paso_id     text not null references public.pasos(id) on delete cascade,
  tienda_cr   text not null references public.tiendas(cr) on delete cascade,
  tipo        text not null check (tipo in ('comentario','estado')),
  autor       text,
  texto       text,
  estado_de   text,
  estado_a    text,
  fecha       timestamptz not null default now()
);
create index if not exists actividad_paso_idx on public.actividad (paso_id);

-- ---------------------------------------------------------
-- Fecha de "actualizado" automática en cada cambio
-- ---------------------------------------------------------
create or replace function public.tocar_actualizado() returns trigger
language plpgsql as $$ begin new.actualizado := now(); return new; end $$;

do $$ declare t text; begin
  foreach t in array array['tiendas','plataformas','subdepartamentos','pasos'] loop
    execute format('drop trigger if exists %I_actualizado on public.%I', t, t);
    execute format('create trigger %I_actualizado before update on public.%I for each row execute function public.tocar_actualizado()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------
-- Seguridad (RLS): solo usuarios que iniciaron sesión pueden ver y editar.
-- La llave pública (anon) del sitio NO puede leer ni escribir sin sesión.
-- ---------------------------------------------------------
do $$ declare t text; begin
  foreach t in array array['tiendas','plataformas','subdepartamentos','pasos','actividad'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "leer con sesion" on public.%I', t);
    execute format('drop policy if exists "editar con sesion" on public.%I', t);
    execute format('create policy "leer con sesion" on public.%I for select to authenticated using (true)', t);
    execute format('create policy "editar con sesion" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ---------------------------------------------------------
-- Tiempo real: avisar a todos cuando algo cambia
-- ---------------------------------------------------------
do $$ declare t text; begin
  foreach t in array array['tiendas','plataformas','subdepartamentos','pasos','actividad'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
