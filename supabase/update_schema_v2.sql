-- Actualización del esquema para configuración y gestión de aulas

-- 1. Añadir estado activo/inactivo a las aulas
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Crear tabla de configuración global
CREATE TABLE IF NOT EXISTS public.config (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT
);

-- Insertar configuración por defecto si no existe
INSERT INTO public.config (key, value, description)
VALUES ('min_vote_interval_minutes', '5', 'Tiempo mínimo en minutos entre votos de un mismo usuario')
ON CONFLICT (key) DO NOTHING;

-- Habilitar RLS en config
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;

-- Política para config: Lectura pública, Escritura solo admin (simulado por ahora pública para demo, o restringida)
-- Para simplificar en este prototipo, permitiremos lectura pública y escritura pública (ya que el admin usa cliente anon key)
-- En producción, esto debería estar protegido.
CREATE POLICY "Configuración pública para lectura" ON public.config FOR SELECT USING (true);
CREATE POLICY "Configuración editable" ON public.config FOR ALL USING (true);

-- 3. Función para validar el intervalo de votos antes de insertar
CREATE OR REPLACE FUNCTION public.check_vote_interval()
RETURNS TRIGGER AS $$
DECLARE
    min_interval INT;
    last_vote_time TIMESTAMP;
    user_identifier TEXT;
BEGIN
    -- Obtener el intervalo configurado
    SELECT value::INT INTO min_interval FROM public.config WHERE key = 'min_vote_interval_minutes';
    
    -- Si no hay configuración, usar 5 por defecto
    IF min_interval IS NULL THEN
        min_interval := 5;
    END IF;

    -- Determinar identificador del usuario (user_id o session_id)
    IF NEW.user_id IS NOT NULL THEN
        -- Usuario autenticado
        SELECT created_at INTO last_vote_time
        FROM public.feedback
        WHERE user_id = NEW.user_id
        ORDER BY created_at DESC
        LIMIT 1;
    ELSE
        -- Usuario anónimo
        SELECT created_at INTO last_vote_time
        FROM public.feedback
        WHERE session_id = NEW.session_id
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    -- Verificar tiempo transcurrido
    IF last_vote_time IS NOT NULL THEN
        IF EXTRACT(EPOCH FROM (NOW() - last_vote_time)) / 60 < min_interval THEN
            RAISE EXCEPTION 'Debes esperar % minutos entre votos.', min_interval;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS check_vote_interval_trigger ON public.feedback;
CREATE TRIGGER check_vote_interval_trigger
    BEFORE INSERT ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.check_vote_interval();

-- 4. Función para validar que el aula está activa
CREATE OR REPLACE FUNCTION public.check_aula_active()
RETURNS TRIGGER AS $$
DECLARE
    aula_active BOOLEAN;
BEGIN
    SELECT is_active INTO aula_active FROM public.aulas WHERE id = NEW.aula_id;
    
    IF aula_active IS FALSE THEN
        RAISE EXCEPTION 'Esta aula no está habilitada para votación en este momento.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS check_aula_active_trigger ON public.feedback;
CREATE TRIGGER check_aula_active_trigger
    BEFORE INSERT ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.check_aula_active();
