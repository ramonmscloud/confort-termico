-- Script para crear Aulas de la 1 a la 50
-- Esto soluciona el error de "foreign key constraint" al votar en un aula que no existe.

DO $$
BEGIN
   FOR i IN 1..50 LOOP
      INSERT INTO public.aulas (id, nombre, descripcion)
      VALUES (i, 'Aula ' || i, 'Espacio docente número ' || i)
      ON CONFLICT (id) DO NOTHING; -- Si ya existe (como la 1), no hace nada
   END LOOP;
   
   -- Ajustar el contador automático para que el siguiente insert sea el 51
   PERFORM setval('public.aulas_id_seq', 50, true);
END $$;
