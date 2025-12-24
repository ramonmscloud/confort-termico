# Solución de Problemas SMTP con Gmail

Si te sale "Error sending recovery email" usando Gmail, el 99% de las veces es por uno de estos 3 detalles en la configuración de Supabase:

## 1. El "Sender Email" debe ser IDÉNTICO al "User"
Google es muy estricto. No puedes enviar correos como "no-reply@tuapp.com" si te autenticas con "pepe@gmail.com".

*   **Sender Email:** `tu_correo@gmail.com` (Exactamente el mismo que usas para entrar)
*   **User:** `tu_correo@gmail.com`

## 2. La Contraseña de Aplicación NO debe tener espacios
Cuando Google te da la contraseña, te la muestra así: `abcd efgh ijkl mnop`.
En Supabase debes pegarla **toda junta**: `abcdefghijklmnop`.

## 3. Prueba cambiar el Puerto (La solución mágica)
A veces el puerto 465 da problemas de conexión. Prueba esta configuración alternativa que suele ser más estable:

*   **Host:** `smtp.gmail.com`
*   **Port:** `587` (En lugar de 465)
*   **SSL:** Desactívalo (**OFF**)
    *   *Nota: Aunque pongas SSL OFF, el puerto 587 usa un protocolo llamado STARTTLS que es seguro igual. Supabase lo maneja automáticamente.*

## Resumen de la configuración alternativa (Recomendada si falla la otra):
*   **Host:** `smtp.gmail.com`
*   **Port:** `587`
*   **User:** `tu_correo@gmail.com`
*   **Password:** `tucontraseñadeaplicacionsinespacios`
*   **Sender Email:** `tu_correo@gmail.com`
*   **Sender Name:** `Confort Térmico`
*   **SSL:** **OFF** (Desactivado)

Guarda y prueba de nuevo. ¡Suele funcionar a la primera con el puerto 587!
