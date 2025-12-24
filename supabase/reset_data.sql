-- Script para resetear datos de prueba en Supabase

-- 1. Borrar todos los votos (feedback)
TRUNCATE TABLE public.feedback RESTART IDENTITY CASCADE;

-- 2. Resetear los puntos de todos los usuarios a 0
UPDATE public.perfiles SET puntos = 0;

-- 3. (Opcional) Borrar mediciones de sensores si las hubiera
TRUNCATE TABLE public.mediciones RESTART IDENTITY CASCADE;

-- Nota: No borramos los usuarios ni las aulas para no tener que configurarlos de nuevo.
