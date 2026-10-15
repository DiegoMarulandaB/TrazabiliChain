# Aprendizajes y ajustes priorizados

El principal aprendizaje es que la inmutabilidad no resuelve por sí sola la confianza de una cadena física: TrazabiliChain puede preservar una huella, pero no demostrar que el lote descrito corresponde al producto transportado. También comprobamos que el QR necesita una ficha pública alojada fuera del navegador y que los datos públicos deben separarse del registro privado.

Antes del cierre, por impacto y esfuerzo, priorizamos: 1) habilitar acceso por correo/contraseña y verificar RLS por usuario; 2) validar persistencia y QR público opt-in con un lote real; 3) conservar los campos públicos permitidos; 4) mantener actor/organización declarados y hashes en cronología; 5) publicar el WASM Soroban actualizado tras revisar la transacción. Anonymous Sign-Ins permanece apagado. La migración actualizada ya se ejecutó; el TTL nuevo no está desplegado. Los archivos siguen locales y el escrow sigue opcional.

# Riesgos y pendientes

El repositorio contiene `supabase/migrations/202610150001_traceability_lots.sql`, con políticas RLS por `owner_id = auth.uid()` y una vista pública de campos permitidos. La migración actualizada se ejecutó: la vista responde HTTP 200 sin filas y el acceso anónimo a la tabla devuelve HTTP 401. `/registros` requiere cuenta de correo/contraseña, pero no Anonymous Sign-Ins. Confirm Email está desactivado. Supabase Auth guarda el email y un hash de contraseña; la aplicación no guarda contraseñas. Nunca incluyas `service_role` en el navegador.

Los lotes, eventos y metadatos de certificados quedan preparados para persistencia remota, pero los PDF/imágenes y el directorio de miembros siguen en IndexedDB/localStorage. La migración define RLS por propietario, pero hasta aplicarla no se debe asumir que el proyecto remoto protege filas. Los perfiles de trabajo son declaraciones, no roles verificados ni límites de autorización por organización. El dueño debe publicar cada ficha expresamente; al hacerlo, detalles, organizaciones, certificados y hashes serán públicos, aunque se excluyen nombres personales y archivos. No deben incluir datos sensibles.

El contrato desplegado en Stellar Testnet es anterior al WASM local que extiende TTL; no se publicó la versión nueva. Las entradas persistentes pueden archivarse si quedan inactivas y el cliente no implementa restauración. La wallet firma anclajes, pero no autentica Supabase ni certifica el origen físico. Los hashes no prueban que el dato inicial sea cierto. CSP mantiene `unsafe-inline`; faltan bitácora, alertas y pruebas de penetración. El audit corrigió los avisos altos de Axios, pero mantiene cuatro moderados en `uuid`/`stream-json` y uno bajo en `elliptic`, dependencias transitivas del wallet kit. OWASP Top 10:2025 es una guía de riesgos, no una certificación.

No hay una URL pública del producto ni un hash de transacción de esta revisión para enlazar. La carga en Apex y el video público de máximo tres minutos quedan a cargo de Diego, según su instrucción; no se grabaron ni publicaron en esta tarea.

# Plan de validación con usuarios

La validación futura se hará primero con directores de sostenibilidad y responsables de marca de empresas B2C de café, cacao o algodón orgánico, que son los usuarios principales del Problem Brief. Se invitará además a productores o cooperativas, una persona certificadora, un transportista y consumidores para cubrir los distintos puntos de la cadena. Se propone una ronda inicial de seis a ocho entrevistas semiestructuradas, seguida por pruebas moderadas del prototipo con al menos cinco participantes del grupo principal y dos productores.

Cada participante recibirá tareas concretas: registrar un lote, añadir un evento, asociar los datos de una certificación, publicar o retirar el QR y consultar la ficha desde otro dispositivo. Se medirá tiempo por tarea, éxito sin ayuda, errores de formulario, comprensión de qué campos son públicos y capacidad para distinguir un dato declarado de un dato verificado o anclado. También se preguntará si el historial y la evidencia reducen esfuerzo de conciliación y si la ficha responde preguntas relevantes para una decisión de compra.

Las hipótesis se considerarán apoyadas si al menos cuatro de cinco responsables de marca completan la consulta por QR en menos de 90 segundos, al menos cuatro de cinco productores registran un lote sin ayuda en menos de cuatro minutos y todos identifican qué información se hará pública antes de activarla. Se revisarán fallos de uso y expectativas de confianza en cada sesión; una percepción de “certificación garantizada” cuando solo hay hashes será criterio para corregir la interfaz, no un éxito. Los resultados y cambios se documentarán antes de ampliar el piloto; estas pruebas aún no se han realizado.

## Evidencia

- Despliegue anterior del contrato en Stellar Testnet: [CBOJPR4LUMXN3YMO5QAM76XPIMYHFL23OYBGB5HHYSS45WCIXREQETNZ](https://stellar.expert/explorer/testnet/contract/CBOJPR4LUMXN3YMO5QAM76XPIMYHFL23OYBGB5HHYSS45WCIXREQETNZ). El WASM actual, pendiente de despliegue, tiene SHA-256 `6a187a5f796587465015cef2ea9e5a544e4d9dbf6306496c1796e904d30f9154`.
- Enlace público del producto: pendiente de despliegue. La ejecución local se inicia siguiendo el [README](../../README.md).
- Transacción de anclaje de esta iteración: pendiente de generar y enlazar desde una wallet autorizada en Testnet.
- Video público de máximo tres minutos: pendiente de publicación por Diego Marulanda.
- Entrega en Apex: pendiente; la realizará Diego Marulanda.

## Configuración de Supabase

Las variables públicas locales están configuradas. `/registros` muestra el login de correo/contraseña y recuperación por enlace. Supabase reporta Email autoconfirmado y registros habilitados; Anonymous Sign-Ins sigue apagado. La migración está aplicada; hay dos fichas públicas y falta probar el guardado autenticado y la recuperación de una contraseña.

1. Crea o abre el proyecto en [Supabase Dashboard](https://supabase.com/dashboard). En el selector del proyecto abre **Connect** y elige el framework Next.js, o entra en **Project Settings > API Keys**.
2. Copia **Project URL**. Es una URL como `https://<project-ref>.supabase.co`; el `<project-ref>` también aparece en la URL del dashboard.
3. Copia la clave pública **Publishable** (`sb_publishable_...`). Si el panel solo muestra las claves heredadas, usa la clave `anon` pública. Nunca uses `service_role` ni `sb_secret_` en el navegador, en `.env.local` o en Git.
4. Comprueba en `frontend/soroban-TrazabiliChain/.env.local` que estén asignados los valores, sin comillas:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_<clave-publica>
   ```

   El nombre `ANON_KEY` se conserva por compatibilidad con el proyecto; acepta la clave publishable nueva o la clave anon heredada. Reinicia Next.js después de editar el archivo.

5. Si preparas otro proyecto, abre **SQL Editor > New query**, pega el script completo `supabase/migrations/202610150001_traceability_lots.sql` y selecciona **Run**. Para este proyecto ya se ejecutó: la tabla privada rechaza acceso `anon` y `public_traceability_lots` responde HTTP 200. La tabla solo concede operaciones a `authenticated` y compara `owner_id` con `auth.uid()`; la vista pública entrega lotes con `is_public = true` y campos permitidos.
6. En **Authentication > Sign In / Providers > Email**, activa Email y desactiva **Confirm Email**. Esto evita el mensaje de confirmación/código al registrarse; el login usa `signInWithPassword` y no envía OTP. Configura el mínimo de contraseña de Supabase en 15 caracteres. Mantén **Anonymous Sign-Ins** apagado. Permite la URL `/registros` en **Authentication > URL Configuration > Redirect URLs** para que el enlace de recuperación vuelva a la aplicación.
7. Configura `NEXT_PUBLIC_SITE_URL` como `http://localhost:3000` en pruebas desde el mismo equipo. Para escanear con un teléfono usa `http://<IP-LAN-del-equipo>:3000`; en producción usa el dominio HTTPS. Autoriza la URL en Supabase y reinicia Next.js después del cambio.
8. Crea una cuenta y verifica que entra sin correo de confirmación. Guarda un lote, confirma que la misma cuenta lo lee y que una segunda cuenta no accede. Publica su QR y ábrelo en ventana privada; desde un teléfono local, comprueba que el QR apunta al host LAN y muestra la ficha. Usa **¿Olvidaste tu contraseña?**, solicita un enlace, abre el correo y cambia la contraseña desde la pantalla de restablecimiento. No compartas contraseñas ni uses datos sensibles.

## Revisión Stellar y OWASP

**Stellar.** El flujo de wallet sigue el patrón de la [guía oficial de frontend dapps](https://developers.stellar.org/docs/build/guides/dapps/frontend-guide#interacting-with-the-stellar-network): prepara/simula la transacción, solicita firma local con el network passphrase correcto y envía la transacción a Testnet. El contrato limita la escritura con `require_auth` y autorización de admin/actores. La wallet sirve para anclar hashes y administrar actores; no es el login de Supabase. El producto es híbrido, no totalmente descentralizado: datos y autenticación de aplicación dependen de Supabase. El contrato enlazado es anterior al WASM con extensión de TTL, que sigue sin desplegarse.

**OWASP Top 10:2025.** Esta es una revisión de riesgos aplicables, no una certificación:

- **A01 Broken Access Control:** `/registros` requiere cuenta. RLS restringe filas con `auth.uid() = owner_id`; Supabase rechaza acceso `anon` a la tabla y la vista pública entrega solo lotes opt-in. La migración está ejecutada; falta probar aislamiento entre cuentas. Los perfiles no son roles de organización.
- **A02 Security Misconfiguration:** CSP y cabeceras de seguridad están configuradas; CSP conserva `unsafe-inline` y requiere revisión para producción.
- **A03 Software Supply Chain Failures:** lockfile y Axios 1.20.0 fijados; audit mantiene cuatro avisos moderados y uno bajo en dependencias transitivas.
- **A04 Cryptographic Failures:** SHA-256 protege integridad posterior, no autoría ni veracidad; no anclar secretos o datos personales.
- **A05 Injection:** PostgREST usa consultas parametrizadas, la migración es SQL estático y React escapa contenido. No hay IA/LLM en el producto actual, por lo que prompt injection no aplica al flujo existente.
- **A06 Insecure Design:** QR opt-in, pero permanece el riesgo de oráculo físico y certificadores no verificados.
- **A07 Authentication Failures:** Supabase Auth gestiona correo/contraseña, hash y recuperación por enlace; el mensaje de recuperación no revela si el correo está registrado. Confirm Email se desactiva para evitar códigos en el alta. Las contraseñas aceptan 15–64 caracteres; limita las URL de redirección y mantén límites antiabuso.
- **A08 Software or Data Integrity Failures:** `require_auth` y hashes append-only están implementados; el WASM actualizado no está desplegado y la cadena no verifica los datos físicos.
- **A09 Security Logging and Alerting Failures:** no existe bitácora de auditoría de aplicación ni alertas propias.
- **A10 Mishandling of Exceptional Conditions:** validación y avisos Sonner están presentes; faltan pruebas integradas de fallos y recuperación.

Conclusión: Stellar se usa de forma coherente para firma y anclaje, pero el MVP no es completamente descentralizado ni puede considerarse certificado OWASP. La migración está aplicada; aún falta validar guardado y QR con un usuario y lote de prueba, y desplegar el nuevo contrato.
