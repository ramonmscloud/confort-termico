-- Corrección para el error al votar con usuario logueado
-- Este script asegura que la función trigger tenga los permisos correctos para actualizar los puntos.

-- 0. Asegurar que la tabla perfiles existe (por si el script inicial falló)
CREATE TABLE IF NOT EXISTS public.perfiles (
  id uuid references auth.users not null primary key,
  email text,
  puntos int default 0,
  updated_at timestamp with time zone
);

-- Habilitar RLS en perfiles si no estaba
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- Política de lectura para perfiles (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'perfiles' AND policyname = 'Usuarios pueden ver sus propios puntos'
    ) THEN
        CREATE POLICY "Usuarios pueden ver sus propios puntos" 
        ON public.perfiles FOR SELECT USING (auth.uid() = id);
    END IF;
END
$$;

-- 1. Aseguramos que la función se ejecute con privilegios de seguridad (SECURITY DEFINER)
-- y definimos el search_path para evitar problemas de resolución de nombres.
CREATE OR REPLACE FUNCTION public.sumar_puntos_feedback()
RETURNS trigger AS $$
BEGIN
  IF new.user_id IS NOT NULL THEN
    UPDATE public.perfiles
    SET puntos = puntos + 10,
        updated_at = now()
    WHERE id = new.user_id;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Aseguramos que el trigger esté correctamente asociado
DROP TRIGGER IF EXISTS on_feedback_insert ON public.feedback;
CREATE TRIGGER on_feedback_insert
  AFTER INSERT ON public.feedback
  FOR EACH ROW EXECUTE PROCEDURE public.sumar_puntos_feedback();

-- 3. Verificación de permisos (opcional pero recomendado)
-- Asegura que el rol autenticado pueda insertar en feedback
GRANT INSERT ON public.feedback TO authenticated;
GRANT INSERT ON public.feedback TO anon;

-- Asegura que la secuencia (si existe) sea accesible, aunque aquí es identity
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
