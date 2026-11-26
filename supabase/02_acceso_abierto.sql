-- =========================================================
-- Acceso ABIERTO con el enlace del sitio (para pruebas con el equipo)
-- Cualquiera que abra el sitio puede ver y editar el avance.
-- Para cerrarlo después (solo con correo), corre 03_cerrar_acceso.sql.
-- Cómo usarlo: SQL Editor → New query → pega todo → Run.
-- =========================================================

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.tiendas, public.plataformas, public.subdepartamentos, public.pasos, public.actividad
  to anon, authenticated;

do $$ declare t text; begin
  foreach t in array array['tiendas','plataformas','subdepartamentos','pasos','actividad'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "acceso abierto" on public.%I', t);
    execute format('create policy "acceso abierto" on public.%I for all to anon using (true) with check (true)', t);
  end loop;
end $$;

-- Revisión: debe decir 5
select count(*) as reglas_abiertas from pg_policies where policyname = 'acceso abierto';
