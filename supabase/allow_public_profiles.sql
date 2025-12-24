-- Permitir lectura pública de la tabla perfiles para el Dashboard
-- Esto es necesario para mostrar el ranking de usuarios y puntos en admin.html

DROP POLICY IF EXISTS "Usuarios pueden ver sus propios puntos" ON public.perfiles;

-- Opción A: Permitir a cualquiera leer perfiles (necesario para admin.js con anon key)
CREATE POLICY "Lectura pública de perfiles"
ON public.perfiles
FOR SELECT
USING (true);

-- Habilitar Realtime para perfiles (para ver puntos subir en vivo)
alter publication supabase_realtime add table perfiles;
