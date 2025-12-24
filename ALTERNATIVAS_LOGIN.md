# Alternativas al Magic Link (Gratuitas)

Si los "Magic Links" te dan problemas por los límites de envío de correos, estas son las mejores alternativas gratuitas:

## 1. Email y Contraseña (Recomendada ⭐️)
Es el método clásico. El usuario introduce su email y crea una contraseña.

*   **Ventaja:** Si desactivas la confirmación de email en Supabase, **no se envía ningún correo**. El registro es instantáneo y nunca falla por límites de cuota.
*   **Configuración en Supabase:**
    1.  Ve a **Authentication** > **Providers** > **Email**.
    2.  Desactiva **Confirm email**.
    3.  Guarda los cambios.
*   **Cambios en el código:** Necesitas añadir un campo de contraseña en tu web.

## 2. Login con Google (Social Auth)
Permite entrar con la cuenta de Google.

*   **Ventaja:** Muy rápido para el usuario. No gestionas contraseñas.
*   **Desventaja:** Requiere crear un proyecto en Google Cloud Console y obtener claves API (Client ID y Secret), lo cual lleva unos 15 minutos de configuración.

## 3. Login Anónimo (Ya lo usas)
Actualmente tus usuarios pueden votar sin loguearse.
*   **Limitación:** Si borran las cookies o cambian de dispositivo, pierden sus puntos. Por eso es mejor el registro.

---

### ¿Qué hago ahora?
Si quieres solucionar el error ya mismo, te recomiendo la **Opción 1 (Email + Contraseña)**.

Si me das permiso, puedo modificar tu archivo `index.html` y `app.js` para:
1.  Añadir un campo de contraseña.
2.  Cambiar la lógica para que use `signUp` (registro) y `signIn` (login) con contraseña en lugar de enviar correos.
