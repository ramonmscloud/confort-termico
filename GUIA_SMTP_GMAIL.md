# Cómo usar tu Gmail como servidor de correo (SMTP) en Supabase

Sí, puedes usar tu cuenta de Gmail para enviar los correos de tu aplicación. Esto es **muy recomendable** porque elimina los límites de envío de la versión gratuita de Supabase (3 correos/hora) y usa los límites de Gmail (500 correos/día).

Sin embargo, por seguridad, Google ya no permite usar tu contraseña normal. Debes crear una **Contraseña de Aplicación**.

Sigue estos pasos exactos:

## Paso 1: Generar Contraseña de Aplicación en Google

1.  Ve a tu cuenta de Google: [https://myaccount.google.com/](https://myaccount.google.com/)
2.  En el menú de la izquierda, ve a **Seguridad**.
3.  Busca la sección "Cómo inicias sesión en Google".
4.  Asegúrate de que la **Verificación en 2 pasos** esté **ACTIVADA**. (Es obligatorio).
5.  Una vez activada, busca la opción **Contraseñas de aplicaciones** (puedes usar el buscador de arriba si no la ves).
6.  Te pedirá tu contraseña de nuevo.
7.  En "Seleccionar aplicación", elige **Otra (nombre personalizado)**.
8.  Escribe "Supabase Confort" y dale a **Generar**.
9.  Te dará una contraseña de 16 letras (ej: `abcd efgh ijkl mnop`). **Cópiala y no la pierdas**, no podrás verla de nuevo.

## Paso 2: Configurar Supabase

1.  Ve a tu proyecto en **Supabase**.
2.  En el menú lateral, ve a **Project Settings** (icono de engranaje abajo del todo).
3.  Ve a la pestaña **Authentication**.
4.  Baja hasta encontrar **SMTP Settings** y actívalo (**Enable Custom SMTP**).
5.  Rellena los datos así:

    *   **Sender Email:** `tu_correo@gmail.com` (Tu dirección de Gmail)
    *   **Sender Name:** `Confort Térmico` (El nombre que verán los usuarios)
    *   **Host:** `smtp.gmail.com`
    *   **Port:** `465`
    *   **User:** `tu_correo@gmail.com` (Tu dirección de Gmail otra vez)
    *   **Password:** `pegatucontraseñadeaplicacionaqui` (La de 16 letras, SIN espacios)
    *   **SSL:** Actívalo (ON)

6.  Dale a **Save**.

## ¡Listo!
Ahora Supabase enviará todos los correos (recuperación de contraseña, confirmaciones, etc.) usando tu Gmail. Ya no tendrás el límite de 3 correos por hora.
