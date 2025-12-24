# Solución al error "Error sending magic link email"

El error que ves en la captura de pantalla indica que Supabase no puede enviar el correo electrónico de inicio de sesión ("Magic Link"). Esto suele deberse a restricciones de seguridad o configuración en el panel de Supabase, no a un error en el código de la página.

Sigue estos pasos en tu panel de control de Supabase para solucionarlo:

## 1. Configurar URLs de Redirección (Muy Importante)
Para que el enlace mágico funcione, Supabase debe saber que tu sitio web es seguro.

1. Ve a tu proyecto en **Supabase**.
2. En el menú lateral, ve a **Authentication** > **URL Configuration**.
3. En **Site URL**, asegúrate de poner tu URL principal: `https://control-termico.netlify.app`
4. En **Redirect URLs**, añade también:
   - `https://control-termico.netlify.app`
   - `https://control-termico.netlify.app/` (con la barra al final)
   - `http://localhost:5500` (si pruebas en local)
5. Guarda los cambios.

## 2. Verificar Límites de Envío (Rate Limits)
El plan gratuito de Supabase tiene un límite de correos por hora (generalmente 3 o 4 por hora para evitar spam).

1. Ve a **Authentication** > **Rate Limits**.
2. Si has estado probando mucho, es posible que hayas alcanzado el límite.
3. Puedes aumentar temporalmente el **Email Rate Limit** o esperar una hora.
4. **Consejo:** Para pruebas, puedes usar un servidor SMTP propio (como Resend o SendGrid) en **Settings** > **SMTP Settings** para quitar estos límites, pero para empezar basta con esperar un poco.

## 3. Verificar Proveedor de Email
1. Ve a **Authentication** > **Providers**.
2. Haz clic en **Email**.
3. Asegúrate de que **Enable Email provider** esté activado.
4. Asegúrate de que **Confirm email** esté activado (generalmente es necesario para Magic Links).

## 4. Alternativa: Desactivar confirmación de email (Solo desarrollo)
Si solo estás probando tú mismo, puedes desactivar la confirmación de email para que los usuarios se creen automáticamente, aunque para "Magic Link" el correo ES necesario sí o sí.

---

### Resumen
Lo más probable es que falte añadir `https://control-termico.netlify.app` en la lista de **Redirect URLs** o que hayas superado el límite de correos por hora de la versión gratuita.
