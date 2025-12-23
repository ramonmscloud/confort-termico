-- Actualización de Políticas para Dashboard (Demo)

-- Permitir que CUALQUIER usuario (incluso anónimo) pueda leer los datos de feedback
-- Esto es necesario para que el Dashboard funcione sin login de administrador complejo en esta fase.
-- ADVERTENCIA: En producción, esto debería restringirse a usuarios con rol 'admin'.

DROP POLICY IF EXISTS "Usuarios ven su propio feedback" ON public.feedback;

CREATE POLICY "Lectura pública para Dashboard"
ON public.feedback
FOR SELECT
USING (true);

-- Habilitar Realtime para la tabla feedback (si no estaba ya)
alter publication supabase_realtime add table feedback;
