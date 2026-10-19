# Aprendizajes y ajustes priorizados

El principal aprendizaje es que la inmutabilidad no resuelve por sí sola la confianza de una cadena física: TrazabiliChain puede preservar una huella, pero no demostrar que el lote descrito corresponde al producto transportado. También comprobamos que el QR necesita una ficha pública alojada fuera del navegador y que los datos públicos deben separarse del registro privado.

Antes del cierre, por impacto y esfuerzo, priorizamos: 1) habilitar acceso por correo/contraseña y verificar RLS por usuario; 2) validar persistencia y QR público opt-in con un lote real; 3) conservar los campos públicos permitidos; 4) mantener actor/organización declarados y hashes en cronología; 5) publicar el WASM Soroban actualizado tras revisar la transacción. Anonymous Sign-Ins permanece apagado. La migración actualizada ya se ejecutó; el TTL nuevo no está desplegado. Los archivos siguen locales y el escrow sigue opcional.

# Mejoras de interfaz implementadas

El acceso ofrece una guía Driver.js de tres pasos: perfil de trabajo con una descripción del rol seleccionado, producto o lote, y correo/contraseña de Supabase. La guía de cada perfil se abre con el botón **Ver guía paso a paso** dentro del bloque de perfil; nunca se inicia automáticamente. El primer paso ofrece conectar la wallet y explica que su red se detecta al conectar; Auditor y Consumidor pueden continuar sin wallet. Los pasos siguientes explican cada campo disponible del perfil. Se define **actor declarado** como el nombre informado para atribuir un registro y **organización declarada** como la organización que la persona dice representar; ninguno verifica identidad o pertenencia ni concede permisos. **Organización responsable** es la organización que se informa como responsable del lote, no una afiliación comprobada. Los recorridos admiten teclado, cierre y movimiento reducido, y omiten campos que no están visibles. Crear lotes, eventos, certificados, autorizaciones y preparar un escrow requiere confirmación; antes de firmar, el escrow presenta red, lote, activo, tarifa y direcciones para revisión. La cámara muestra su aviso antes del permiso del navegador.

El productor elige café, cacao o algodón orgánicos y registra atributos, ubicación y foto opcional. El control de archivo permite cambiar o quitar la imagen y muestra su nombre y vista previa. La foto es privada salvo que el dueño publique el lote y esté aplicada la migración de proyección pública. Los errores obligatorios aparecen junto al campo.

El historial presenta las características del lote debajo de sus datos principales con una lista accesible: cantidad y unidad (por ejemplo, `5 kilogramos`), valor y símbolo de moneda, y los demás datos ingresados. Cuando un perfil interno abre un lote por prefijo QR, el contexto muestra el actor y la organización declarados al crearlo y la organización responsable. Estos valores no reemplazan la atribución del actor y organización que registra un evento o certificado. Consumidor queda fuera de este contexto interno.

Los formularios de texto guardan borradores en Supabase privados por cuenta, perfil y producto, para continuar en otro navegador con la misma sesión. Los archivos de evidencia/fotos y la conexión Freighter no se sincronizan; deben volver a seleccionarse o conectarse en el otro navegador. La selección de lote se restaura como prefijo y se vuelve a consultar bajo RLS. Este flujo requiere `202610170001_traceability_work_drafts.sql`.

El historial del Productor muestra métricas distintas de lotes activos y retirados; los retirados aparecen en una sección plegable y no incrementan el conteo activo. Productor recibe avisos de anclaje en la campana del header; la campana de suscripciones por cultivo se oculta en este perfil. Los demás perfiles reciben notificaciones privadas del cultivo elegido cuando se publica un lote del mismo cultivo. Para esos avisos deben aplicarse `202610160003_product_notifications.sql` y `202610160004_cleanup_product_notifications.sql`.

La escritura del hash se limita al Productor, al Administrador y a un Actor de cadena o Certificador que haya contribuido al lote; todos siguen sujetos a la autorización de su wallet en Soroban. El orden operativo recomendado es Productor primero, después el Actor de cadena o Certificador que aportó al lote, y Administrador como respaldo. Antes de mostrar el botón se consulta el último hash: si coincide con la ficha actual, la acción se oculta; al enviar, el cliente vuelve a comprobar para evitar una firma redundante. Comprador, Auditor y Consumidor conservan consulta de solo lectura. La red configurada se muestra en el header y en el panel; la aplicación compara la passphrase de la wallet y bloquea la firma si no coincide. Tras cualquier anclaje confirmado se intenta enviar al dueño Supabase del lote un aviso privado con la transacción; la RPC solo acepta como destinatario al usuario autenticado que sea dueño. En la demo los perfiles comparten esa cuenta Supabase. El aviso no sustituye la verificación del hash ni concede acceso al lote. Requiere aplicar `202610170002_lot_anchor_notifications.sql`.

Cuando el Administrador autoriza o revoca una wallet, una transacción confirmada genera un aviso privado para la cuenta Supabase que inició la acción. Al cambiar a Productor con esa misma cuenta, aparece en la campana junto con la dirección y el enlace de transacción. No existe asociación verificada entre una wallet Stellar y cuentas Supabase distintas; por seguridad el aviso no se entrega a otro usuario. Requiere aplicar `202610190001_wallet_authorization_notifications.sql`.

## Autenticación y perfiles

En la demo, una cuenta de correo/contraseña puede elegir cualquiera de los perfiles disponibles. El selector cambia la interfaz, pero no concede permisos; Supabase RLS limita los lotes privados al `auth.uid()` de la cuenta. Para producción se requiere una identidad y un rol verificado por perfil, credenciales no compartidas entre perfiles y políticas RLS por organización. Esa autenticación independiente todavía no está implementada.

Las ediciones de demo se limitan a registros propios: Productor gestiona lotes; Actor de cadena, sus eventos; Certificador, sus certificados; Administrador gestiona miembros del directorio local y revisa los lotes de la misma cuenta Supabase, incluyendo una consulta de solo lectura del último hash de Stellar en la red configurada; Auditor gestiona sus notas privadas, no los datos fuente. El Administrador no recibe acceso a lotes de otras cuentas aunque declaren la misma organización. Comprador solo cambia el borrador de escrow antes de la firma; un contrato desplegado no se edita desde el formulario. El directorio local persiste en el navegador al cerrar sesión, se filtra por organización y permite consultar otras organizaciones guardadas; no sincroniza entre dispositivos ni es un control de autorización.

La migración `202610160001_public_lot_prefix_lookup.sql` ya está aplicada. Consumidor busca solo fichas publicadas por producto; los perfiles internos consultan lotes propios bajo RLS.

## Criterios de revisión

- Verificar los pasos de guía y las acciones de los diálogos con teclado; `Escape`, cerrar y cancelar no deben ejecutar la operación.
- Recorrer la guía del login y la de cada perfil con teclado y lector de pantalla; confirmar que el perfil explica su propósito y que la wallet no se presenta como requisito para consultar.
- Registrar cada cultivo, seleccionar sus atributos y probar ubicaciones de distintos países y una localidad ingresada manualmente.
- Añadir, cambiar y quitar la foto opcional; comprobar que la evidencia de evento se puede omitir y que el archivo de certificado no.
- Enviar cada formulario con campos vacíos y confirmar que el mensaje aparece junto al control faltante y desaparece al corregirlo.
- Publicar un lote con foto y comprobar que la imagen no aparece en su ficha QR pública.
- Confirmar que una contraseña incorrecta no altera el lote; comprobar que editar registra motivo y que retirar despublica el QR sin borrar el historial.
- Verificar que los lotes retirados no se cuentan como activos y que solo el perfil Productor ve su sección plegable de retirados.
- Cambiar el cultivo de interés y comprobar que esa campana muestra solo avisos de publicación; en Productor, verificar la campana de anclajes del header.
- Probar que el selector de perfil no concede autorización y que RLS impide ver lotes de otro propietario.
- Como Administrador, comprobar que aparecen todos y solo los lotes de la cuenta Supabase activa; consultar una sola vez su contador y última huella en la red configurada, sin conectar wallet, y contrastar si el hash coincide con la ficha actual.
- Aplicar `202610170001_traceability_work_drafts.sql`; iniciar un draft con una cuenta, abrir la misma cuenta en otro navegador y comprobar que se restaura sin mostrar drafts de otro usuario. Confirmar que archivos y wallet no se copian.
- Aplicar `202610170002_lot_anchor_notifications.sql` y `202610190001_wallet_authorization_notifications.sql`; autorizar y revocar una wallet como Administrador, cambiar a Productor con la misma cuenta Supabase y comprobar el aviso. Anclar desde cada perfil habilitado y verificar que el dueño ve el enlace de transacción y que otra cuenta no puede leer sus avisos.
- Revisar el formulario en móvil/tablet: sin desbordamiento horizontal, valores de fecha visibles, etiquetas legibles y lector de pantalla.
- Abrir el directorio del Administrador en ancho móvil y comprobar que las tarjetas permiten leer y operar sobre cada miembro sin scroll horizontal.
- Escanear un QR con el logo central en varios tamaños y confirmar que sigue abriendo la misma ficha pública del lote.
- Confirmar que todos los recorridos muestran el registro inicial, eventos y certificados con perfil, fecha y organización.
- Intentar anclar desde Comprador, Auditor y Consumidor; comprobar que solo pueden consultar, no firmar.
- Anclar como Administrador del contrato y confirmar que el aviso llega solo a Productor de la cuenta dueña.
- Sincronizar drafts con `202610170001_traceability_work_drafts.sql` entre dos navegadores con la misma cuenta y confirmar que otro usuario no puede leerlos.

# Riesgos y pendientes

El repositorio contiene `supabase/migrations/202610150001_traceability_lots.sql`, con políticas RLS por `owner_id = auth.uid()` y una vista pública de campos permitidos. La migración actualizada se ejecutó: la vista responde HTTP 200 sin filas y el acceso anónimo a la tabla devuelve HTTP 401. `/registros` requiere cuenta de correo/contraseña, pero no Anonymous Sign-Ins. Confirm Email está desactivado. Supabase Auth guarda el email y un hash de contraseña; la aplicación no guarda contraseñas. Nunca incluyas `service_role` en el navegador.

Los lotes, eventos y metadatos de certificados quedan preparados para persistencia remota, pero los PDF/imágenes y el directorio de miembros siguen en IndexedDB/localStorage. La migración define RLS por propietario, pero hasta aplicarla no se debe asumir que el proyecto remoto protege filas. Los perfiles de trabajo son declaraciones, no roles verificados ni límites de autorización por organización. El dueño debe publicar cada ficha expresamente; al hacerlo, detalles, organizaciones, certificados y hashes serán públicos, aunque se excluyen nombres personales y archivos. No deben incluir datos sensibles.

El contrato desplegado documentado es de Stellar Testnet y es anterior al WASM local que extiende TTL; no se publicó la versión nueva. La interfaz admite seleccionar Testnet o Mainnet por entorno, pero Mainnet requiere una RPC y un contrato desplegado/configurado para esa red; Trustless Work escrow permanece bloqueado en Mainnet hasta verificar el enrutamiento del proveedor. Las entradas persistentes pueden archivarse si quedan inactivas y el cliente no implementa restauración. La wallet firma anclajes, pero no autentica Supabase ni certifica el origen físico. Los hashes no prueban que el dato inicial sea cierto. CSP mantiene `unsafe-inline`; faltan bitácora, alertas y pruebas de penetración. El audit corrigió los avisos altos de Axios, pero mantiene cuatro moderados en `uuid`/`stream-json` y uno bajo en `elliptic`, dependencias transitivas del wallet kit. OWASP Top 10:2025 es una guía de riesgos, no una certificación.

No hay una URL pública del producto ni un hash de transacción de esta revisión para enlazar.

# Plan de validación con usuarios

La validación futura se hará primero con directores de sostenibilidad y responsables de marca de empresas B2C de café, cacao o algodón orgánico, que son los usuarios principales del Problem Brief. Se invitará además a productores o cooperativas, una persona certificadora, un transportista y consumidores para cubrir los distintos puntos de la cadena. Se propone una ronda inicial de seis a ocho entrevistas semiestructuradas, seguida por pruebas moderadas del prototipo con al menos cinco participantes del grupo principal y dos productores.

Cada participante recibirá tareas concretas: registrar un lote, añadir un evento, asociar los datos de una certificación, publicar o retirar el QR y consultar la ficha desde otro dispositivo. Se medirá tiempo por tarea, éxito sin ayuda, errores de formulario, comprensión de qué campos son públicos y capacidad para distinguir un dato declarado de un dato verificado o anclado. También se preguntará si el historial y la evidencia reducen esfuerzo de conciliación y si la ficha responde preguntas relevantes para una decisión de compra.

Las hipótesis se considerarán apoyadas si al menos cuatro de cinco responsables de marca completan la consulta por QR en menos de 90 segundos, al menos cuatro de cinco productores registran un lote sin ayuda en menos de cuatro minutos y todos identifican qué información se hará pública antes de activarla. Se revisarán fallos de uso y expectativas de confianza en cada sesión; una percepción de “certificación garantizada” cuando solo hay hashes será criterio para corregir la interfaz, no un éxito. Los resultados y cambios se documentarán antes de ampliar el piloto; estas pruebas aún no se han realizado.

## Evidencia

- Despliegue anterior del contrato en Stellar Testnet: [CBOJPR4LUMXN3YMO5QAM76XPIMYHFL23OYBGB5HHYSS45WCIXREQETNZ](https://stellar.expert/explorer/testnet/contract/CBOJPR4LUMXN3YMO5QAM76XPIMYHFL23OYBGB5HHYSS45WCIXREQETNZ). El WASM actual, pendiente de despliegue, tiene SHA-256 `6a187a5f796587465015cef2ea9e5a544e4d9dbf6306496c1796e904d30f9154`. SHA-256 es la huella criptográfica de los bytes exactos del archivo WASM: permite comprobar que el artefacto revisado no cambió, pero no es el ID del contrato ni una transacción de despliegue. Desplegar no es una acción inocua: publica el binario en una red y crea una instancia/ID de contrato que después debe configurarse en la aplicación; requiere revisar red, bytecode, cuenta administradora y tarifas. No se realizó ningún despliegue.
- Enlace público del producto: [dominio](https://trazabilichain.vercel.app/)
- Transacción de anclaje de esta iteración: pendiente de generar y enlazar desde una wallet autorizada en Testnet.
- Video público [link](https://youtu.be/Irx8uoWZcgA)
- Entrega en Apex: realizada

## Contrato de trazabilidad

El MVP incluye el contrato propio `traceability-registry`, escrito en Rust con Soroban. Almacena los hashes de eventos asociados a lotes, mantiene el historial append-only y permite al administrador autorizar o revocar actores. Este contrato no implementa pagos ni escrow. El contrato de Testnet desplegado y sus limitaciones se documentan en [Documentacion.md](../semana3/Documentacion.md#contrato-de-trazabilidad).

## Tecnología del track de integración del SCF

El escrow B2B no usa un contrato de pagos creado por TrazabiliChain. Es una integración con Trustless Work Core API V2 y sus contratos Soroban de escrow, asociada al SCF Integration Track. La API key es una credencial secreta de servidor: en Vercel se configura como **Sensitive/Secret**, nunca como Config/Plain ni con prefijo `NEXT_PUBLIC_`. El flujo habilitado es Testnet; Mainnet permanece bloqueado porque el SDK/API utilizado no permite verificar el enrutamiento de red. Detalles en [Documentacion.md](../semana3/Documentacion.md#escrow-de-pagos).

## Proyectos similares

Ver carpeta semana3 archivo [Documentación.md], apartado proyectos similares.

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

**Stellar.** El flujo de wallet sigue el patrón de la [guía oficial de frontend dapps](https://developers.stellar.org/docs/build/guides/dapps/frontend-guide#interacting-with-the-stellar-network): prepara/simula la transacción, solicita firma local con el network passphrase correcto y envía la transacción a la red configurada. La aplicación detecta la passphrase de la wallet y bloquea la firma si no coincide. El contrato limita la escritura con `require_auth` y autorización de admin/actores. La wallet sirve para anclar hashes y administrar actores; no es el login de Supabase. El producto es híbrido, no totalmente descentralizado: datos y autenticación de aplicación dependen de Supabase. El contrato enlazado es anterior al WASM con extensión de TTL, que sigue sin desplegarse; Mainnet no se ha validado.

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