# Sistema de Monitoreo de Confort Térmico 🌡️

Una plataforma moderna, escalable y de código abierto para monitorear y mejorar el confort térmico en aulas y espacios compartidos. Este sistema permite a los usuarios reportar su sensación térmica en tiempo real, visualizando los datos agregados para la toma de decisiones.

## 🚀 Características Principales

*   **Votación Rápida**: Interfaz optimizada para móviles ("Mobile First") accesible vía código QR.
*   **Tiempo Real**: Dashboard administrativo que se actualiza instantáneamente gracias a Supabase Realtime.
*   **Sistema de Recompensas**: Gamificación integrada donde los usuarios autenticados ganan puntos por su participación.
*   **Híbrido**: Soporte para votos anónimos (invitados) y autenticados (estudiantes/personal).
*   **Análisis de Datos**: Visualización gráfica de la distribución de confort y evolución temporal.

## 🛠️ Stack Tecnológico

*   **Frontend**: HTML5, Tailwind CSS, JavaScript (Vanilla).
*   **Backend & Base de Datos**: [Supabase](https://supabase.com) (PostgreSQL).
*   **Autenticación**: Supabase Auth (Magic Links).
*   **Gráficos**: Chart.js.

## 📂 Estructura del Proyecto

```
/
├── src/                # Código fuente de la aplicación web
│   ├── index.html      # Interfaz de votación (Usuario)
│   ├── admin.html      # Dashboard de resultados (Administrador)
│   ├── app.js          # Lógica de votación y autenticación
│   └── admin.js        # Lógica de gráficos y tiempo real
├── supabase/           # Configuración de Base de Datos
│   ├── schema.sql      # Script de inicialización de tablas y triggers
│   └── update_policies.sql # Políticas de seguridad (RLS)
├── docs/               # Documentación adicional
└── README.md           # Este archivo
```

## ⚙️ Configuración e Instalación

### 1. Requisitos Previos
*   Una cuenta en [Supabase](https://supabase.com).
*   Un servidor web local (ej. Python, Node.js, VS Code Live Server) para probar la autenticación.

### 2. Configuración de Supabase
1.  Crea un nuevo proyecto en Supabase.
2.  Ve al **SQL Editor** y ejecuta el contenido de `supabase/schema.sql`.
3.  Ejecuta también `supabase/update_policies.sql` para habilitar el acceso al dashboard.
4.  En **Authentication > URL Configuration**, añade tu URL local (ej. `http://localhost:8000`) en "Site URL".

### 3. Configuración del Cliente
1.  Abre `src/app.js` y `src/admin.js`.
2.  Reemplaza las constantes `SUPABASE_URL` y `SUPABASE_ANON_KEY` con las credenciales de tu proyecto (disponibles en *Project Settings > API*).

### 4. Ejecución Local
Debido a las políticas de seguridad de los navegadores y la autenticación, no abras los archivos `.html` directamente. Usa un servidor local:

```bash
# Opción con Python (desde la carpeta raíz)
python3 -m http.server 8000 --directory src
```
Luego accede a:
*   Votación: [http://localhost:8000](http://localhost:8000)
*   Dashboard: [http://localhost:8000/admin.html](http://localhost:8000/admin.html)

## 🏆 Sistema de Recompensas

El sistema incentiva la participación continua mediante puntos:
*   **Usuarios Anónimos**: Pueden votar libremente, pero no acumulan historial ni puntos.
*   **Usuarios Registrados**:
    *   Reciben **10 puntos** automáticamente por cada voto registrado.
    *   La asignación se realiza mediante un *Database Trigger* (`sumar_puntos_feedback`) en PostgreSQL, asegurando la integridad de los datos.
    *   Los puntos son visibles en la esquina superior derecha de la interfaz de votación.

## 📄 Licencia
Este proyecto es de código abierto y está disponible para fines educativos y de investigación.
