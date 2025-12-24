-- ⚠️ PELIGRO: ESTE SCRIPT BORRA ABSOLUTAMENTE TODO ⚠️
-- Elimina usuarios, aulas, votos, mediciones y perfiles.
-- Úsalo solo si quieres reiniciar el proyecto desde cero absoluto.

-- 1. Borrar tablas de datos (Votos y Mediciones)
TRUNCATE TABLE public.feedback RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.mediciones RESTART IDENTITY CASCADE;

-- 2. Borrar Aulas
TRUNCATE TABLE public.aulas RESTART IDENTITY CASCADE;

-- 3. Borrar Perfiles (Datos públicos de usuarios)
TRUNCATE TABLE public.perfiles RESTART IDENTITY CASCADE;

-- 4. Borrar Usuarios de Autenticación (Cuentas de correo y contraseñas)
-- Nota: Esto requiere privilegios elevados (el editor SQL de Supabase suele tenerlos).
DELETE FROM auth.users;

-- 5. Reiniciar contadores de IDs (para que el próximo sea el 1)
ALTER SEQUENCE IF EXISTS public.aulas_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.feedback_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.mediciones_id_seq RESTART WITH 1;

-- 6. Crear un Aula por defecto (Necesario para que la app funcione)
INSERT INTO public.aulas (nombre, descripcion) 
VALUES ('Aula General', 'Espacio principal de monitoreo');
