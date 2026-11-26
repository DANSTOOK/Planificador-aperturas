-- =========================================================
-- Cerrar el acceso abierto: a partir de aquí solo usuarios con sesión (correo).
-- Antes de correrlo, la app debe tener activado el inicio de sesión por correo.
-- =========================================================
do $$ declare t text; begin
  foreach t in array array['tiendas','plataformas','subdepartamentos','pasos','actividad'] loop
    execute format('drop policy if exists "acceso abierto" on public.%I', t);
  end loop;
end $$;
revoke insert, update, delete on
  public.tiendas, public.plataformas, public.subdepartamentos, public.pasos, public.actividad
  from anon;
