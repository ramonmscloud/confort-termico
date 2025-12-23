# Plan de Desarrollo Incremental: Sistema de Monitoreo de Confort Térmico

Este plan detalla las fases para construir el sistema, comenzando por la base de datos en Supabase como se solicitó.

## Fase 1: Diseño y Configuración de Base de Datos (Supabase)
**Objetivo:** Establecer el esquema de datos, seguridad y lógica base.
1.  **Diseño del Esquema SQL:**
    *   Tabla `aulas`: Para identificar los espacios monitoreados.
    *   Tabla `mediciones`: Para registrar datos de sensores (hardware).
    *   Tabla `feedback`: Para almacenar los votos de confort de los usuarios.
    *   Tabla `perfiles` (o `users` extendido): Para gestionar puntos y recompensas de usuarios autenticados.
2.  **Seguridad (RLS):** Configurar Row Level Security para asegurar que los usuarios anónimos solo puedan insertar votos y no leer datos sensibles.
3.  **Funciones/Triggers:** Automatización básica (ej. evitar duplicados, asignar puntos).

## Fase 2: Estructura del Proyecto y Repositorio
**Objetivo:** Preparar el entorno de desarrollo colaborativo.
1.  Crear estructura de carpetas: `/src`, `/supabase`, `/docs`.
2.  Inicializar repositorio Git.
3.  Crear `README.md` con documentación inicial.

## Fase 3: Frontend - Interfaz de Votación (Mobile First)
**Objetivo:** Permitir a los usuarios enviar feedback rápidamente.
1.  Configurar HTML5 + Tailwind CSS (vía CDN para simplicidad o build process).
2.  Implementar UI de votación (ej. caras triste/neutra/feliz o escala térmica).
3.  Integrar cliente Supabase JS.
4.  Lógica de usuario anónimo (localStorage para `session_id`).

## Fase 4: Sistema de Usuarios y Recompensas
**Objetivo:** Incentivar la participación.
1.  Implementar Login con Supabase Auth (Google/Email).
2.  Lógica de asignación de puntos al votar (solo autenticados).
3.  Validación para evitar spam de votos (rate limiting por IP/Sesión).

## Fase 5: Dashboard Administrativo y Real-time
**Objetivo:** Visualización de datos para gestores.
1.  Panel de control protegido (solo admins).
2.  Gráficos de confort por aula.
3.  Suscripciones Real-time de Supabase para ver votos/mediciones en vivo.

## Fase 6: Integración Hardware y Despliegue
**Objetivo:** Conectar el mundo físico y publicar.
1.  Endpoint o Edge Function para recibir datos del dispositivo "Master".
2.  Documentación final en `/docs`.
3.  Despliegue (ej. GitHub Pages, Vercel o Netlify).

---

## Acción Inmediata: Fase 1 - Script de Base de Datos
A continuación, se generará el archivo `supabase/schema.sql` con las tablas y políticas necesarias.
