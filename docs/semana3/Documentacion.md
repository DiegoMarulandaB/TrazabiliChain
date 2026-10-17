# Documentación del frontend de TrazabiliChain

## 1. Propósito

El frontend contiene el flujo MVP para registrar lotes, eventos y certificados, consultar fichas QR y anclar huellas SHA-256 en Stellar Testnet. `/registros` solicita cuenta Supabase con correo y contraseña, sin Google ni OTP de inicio de sesión; incluye recuperación mediante enlace de Supabase. Las contraseñas admiten de 15 a 64 caracteres. Supabase Auth guarda el correo y un hash de la contraseña; el frontend nunca persiste la contraseña. Confirm Email está desactivado. En la demo, la misma cuenta autenticada puede seleccionar cualquiera de los perfiles desde la interfaz; el perfil no es una identidad ni una autorización. RLS limita los datos privados al propietario de la cuenta. La migración base está aplicada; la vista QR responde HTTP 200 con fichas públicas y la tabla privada rechaza consultas `anon` con HTTP 401. Aún falta una prueba completa de roles y notificaciones con cuentas autenticadas.

La aplicación está en `frontend/soroban-TrazabiliChain`. El crate `traceability-registry` guarda hashes append-only y emite eventos; el frontend lo invoca mediante Stellar RPC. Trustless Work se integra de forma opcional para pagos B2B por hitos, fuera del flujo principal de trazabilidad.

## 2. Tecnologías

- Next.js 16 con App Router.
- React 19 y TypeScript.
- Tailwind CSS 4 mediante el plugin PostCSS.
- Driver.js para recorridos accesibles de inicio de sesión y guías por perfil.
- GSAP y `@gsap/react` para animaciones.
- `qrcode.react` para generar los códigos QR en el navegador.
- `@zxing/browser` para escanear códigos QR con la cámara.
- `country-state-city` para catálogos de regiones y ciudades según el país seleccionado.
- `driver.js` para recorridos interactivos en el login y los perfiles.
- Phosphor Icons para los iconos de redes y acciones.
- `@creit.tech/stellar-wallets-kit` para conectar wallets y solicitar firmas.
- `@stellar/stellar-sdk` para RPC Soroban, simulación, tarifas y envío de transacciones.
- `@trustless-work/escrow-js` para el flujo opcional de escrow en Core API V2 de Testnet.
- Sonner para confirmar operaciones y anunciar errores.
- `border-beam` para el borde animado del dashboard.
- pnpm 8.15.9 como gestor de paquetes y workspace.

## 3. Instalación y ejecución

Desde la raíz del frontend:

```sh
cd frontend/soroban-TrazabiliChain
corepack pnpm install
corepack pnpm dev
```

La aplicación se abre normalmente en `http://localhost:3000`.

Comandos disponibles:

| Comando                      | Uso                                                           |
| ---------------------------- | ------------------------------------------------------------- |
| `corepack pnpm dev`          | Inicia el servidor de desarrollo.                             |
| `corepack pnpm build`        | Genera la compilación de producción.                          |
| `corepack pnpm start`        | Sirve la compilación de producción.                           |
| `corepack pnpm lint`         | Ejecuta ESLint.                                               |
| `corepack pnpm typecheck`    | Verifica los tipos de TypeScript.                             |
| `corepack pnpm format`       | Aplica Prettier a los archivos incluidos en su configuración. |
| `corepack pnpm format:check` | Comprueba el formato sin modificar archivos.                  |

El repositorio fija pnpm `8.15.9`, compatible con el lockfile v6. No instales con pnpm 9 o superior sin migrar el lockfile deliberadamente.

### Variables y servicios

1. Desde `frontend/soroban-TrazabiliChain`, crea tu archivo local: `cp .env.example .env.local`. `.env.local` está excluido por `.gitignore`. El archivo local de este entorno ya contiene el ID público del contrato Testnet; no contiene secretos.
2. Crea un proyecto Supabase y aplica `202610150001_traceability_lots.sql`, `202610170001_traceability_work_drafts.sql` y `202610170002_lot_anchor_notifications.sql` desde su SQL Editor. Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` desde **Project Settings > API**. Nunca uses la `service_role` key en el navegador.
3. Mantén **Anonymous Sign-Ins** desactivado y habilita **Email**. En **Authentication > Sign In / Providers > Email**, desactiva **Confirm Email** para que el registro cree una sesión sin enviar un código. Habilita el envío de correo de recuperación y permite `http://localhost:3000/registros` (y la URL de producción) en **Authentication > URL Configuration > Redirect URLs**. El acceso usa `signUp` y `signInWithPassword`; recuperar contraseña envía un enlace, no un OTP de login. La tabla de lotes guarda solo `owner_id = auth.uid()`, no email ni contraseña. RLS limita cada fila a su dueño.
4. `NEXT_PUBLIC_SITE_URL` define el host que se codifica en el QR. Usa `http://localhost:3000` para escanear desde el mismo equipo; para probar con un teléfono usa `http://<IP-LAN-del-equipo>:3000`, y en producción el dominio HTTPS. Autoriza esa URL en Supabase y reinicia Next.js tras cambiar una variable `NEXT_PUBLIC_*`. Un teléfono no puede resolver el `localhost` de otro equipo.
5. Para anclar hashes no hace falta desplegar otra vez en este entorno: el contrato ya está desplegado en Testnet y su ID está en `.env.local`/`.env.example`. Revisa **Contrato de trazabilidad**.
6. Trustless Work tampoco está habilitado: falta `TRUSTLESS_WORK_API_KEY` y acordar qué emails autorizar en `TRUSTLESS_WORK_ALLOWED_EMAILS`. Ambas son variables de servidor; la API key no debe compartirse ni subirse al repositorio.

`.env.example` contiene el contrato público de Testnet y placeholders para las llaves ausentes. En Vercel u otro hosting configura las variables desde el panel del entorno; no subas `.env.local`, `.env.production` ni archivos con valores reales. La key pública de Supabase no reemplaza Row Level Security: la migración crea políticas por propietario y una vista separada para fichas que su autor publica.

Dominio público de ejemplo:

`NEXT_PUBLIC_SITE_URL=https://trazabilichain.vercel.app/`

El valor por defecto es `http://localhost:3000`, útil solo durante el desarrollo local.

## 4. Rutas y composición

El árbol actual ya separa responsabilidades por capas: `src/app` contiene rutas y composición Next.js; `src/components` agrupa componentes por flujo de producto; `src/hooks` encapsula estado React reutilizable; `src/lib` contiene adaptadores de Supabase, almacenamiento y Stellar; `contracts` y `packages` mantienen el contrato Soroban y sus bindings fuera de la UI. Las migraciones SQL viven en `supabase/migrations`. Se mantiene esta organización feature-oriented, sin mover archivos que ya tienen límites claros ni introducir aliases adicionales.

| Ruta o archivo                                                    | Responsabilidad                                                                 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/app/api/stellar/escrow/route.ts`                             | Valida sesión y allowlist Supabase en servidor; la API key no sale del backend. |
| `src/app/page.tsx`                                                | Página principal; compone header, hero, sección Sobre y footer.                 |
| `src/app/registros/page.tsx`                                      | Ruta con acceso por correo/contraseña antes del dashboard.                      |
| `src/app/lote/[id]/page.tsx`                                      | Ruta dinámica de consulta de un lote por identificador.                         |
| `src/app/layout.tsx`                                              | Layout raíz, idioma, metadata general y SplashScreen.                           |
| `src/app/opengraph-image.tsx`                                     | Genera una imagen social de 1200 × 630 píxeles mediante `next/og`.              |
| `src/components/header/Header.tsx`                                | Navegación adaptable y enlace para saltar al contenido.                         |
| `src/components/records-panel/RecordsPanel.tsx`                   | Dashboard, validación, historial y creación de lotes.                           |
| `src/components/records-panel/RoleGuide.tsx`                      | Tour Driver.js con wallet, contexto y tarea de cada perfil.                     |
| `src/components/records-panel/LotManagement.tsx`                  | Edición, baja lógica y registro de cambios por lote.                            |
| `src/components/records-auth/RecordsAuth.tsx`                     | Registro y acceso por correo/contraseña, con guía Driver.js de tres pasos.       |
| `src/components/records-auth/AnonymousRecordsSession.tsx`         | Componente legado; no se monta en `/registros`.                                 |
| `src/components/organization-members/TraceabilityActorAccess.tsx` | Autoriza o revoca direcciones on-chain desde la wallet administradora.          |
| `src/components/providers/StellarWalletProvider.tsx`              | Inicializa Stellar Wallets Kit en Testnet y expone firma de XDR.                |
| `src/components/wallet/WalletConnect.tsx`                         | Conexión y desconexión de wallet Stellar.                                       |
| `src/components/traceability-anchor/TraceabilityAnchor.tsx`       | Ancla la huella del lote y enlaza la transacción confirmada.                    |
| `src/components/escrow/TrustlessWorkEscrow.tsx`                   | Flujo opcional B2B de escrow por hitos en Testnet.                              |
| `src/components/ui/feedback/Toaster.tsx`                          | Toaster global de Sonner.                                                       |
| `src/components/ui/ConfirmDialog.tsx`                             | Diálogo nativo reutilizable para confirmar acciones.                            |
| `src/components/ui/FileUploadField.tsx`                           | Selector de archivos accesible con nombre, cambio y eliminación.                |
| `src/components/ui/FormFieldError.tsx`                            | Mensaje inline enlazado al campo inválido.                                      |
| `src/components/ui/motion/BorderBeamFrame.tsx`                    | Efecto de borde del dashboard respetando movimiento reducido.                   |
| `src/components/lot-sharing/LotSharing.tsx`                       | QR y opciones para compartir el enlace.                                         |
| `src/components/public-lot/PublicLotPage.tsx`                     | Consulta pública desde la vista permitida de Supabase.                          |
| `src/components/event-form/EventForm.tsx`                         | Registro de hitos por parte de actores de la cadena.                            |
| `src/components/certificate-form/CertificateForm.tsx`             | Asociación de datos de certificado y huella de evidencia.                       |
| `src/components/consumer-scanner/ConsumerScanner.tsx`             | Escaneo de QR con cámara y consulta manual.                                     |
| `src/components/organization-members/OrganizationMembers.tsx`     | Directorio local de miembros y roles de demo.                                   |
| `src/components/buyer-dashboard/BuyerDashboard.tsx`               | Búsqueda de lotes y filtro por evidencia asociada.                              |
| `src/components/audit-dashboard/AuditDashboard.tsx`               | Cronología global y alertas básicas de consistencia.                            |
| `src/components/evidence-file/EvidenceFileLink.tsx`               | Descarga local de archivos de evidencia asociados a lotes o eventos.            |
| `src/lib/lots/lot-storage.ts`                                     | Persistencia Supabase de lotes y metadatos; miembros de demostración locales.   |
| `src/lib/lots/country-options.ts`                                 | Opciones de países con nombres en español y códigos ISO.                        |
| `src/lib/lots/evidence-storage.ts`                                | Archivos de evidencia locales en IndexedDB.                                     |
| `src/lib/stellar/read.ts`                                         | Lecturas RPC de conteo y hashes del contrato de trazabilidad.                   |
| `src/lib/stellar/write.ts`                                        | Construcción, simulación, firma, envío y confirmación Soroban.                  |
| `src/lib/stellar/trustless-work.ts`                               | Construye escrows y envía XDR firmado a la ruta servidor.                       |
| `src/lib/supabase/client.ts`                                      | Cliente Supabase singleton para autenticación del navegador.                    |
| `src/hooks/useStellarWallet.ts`                                   | Hook para leer el contexto de wallet.                                           |
| `src/hooks/useLotAnchor.ts`                                       | Calcula, consulta y escribe hashes del lote; Admin puede notificar al Productor. |
| `src/hooks/useWorkDraft.ts`                                       | Restaura y sincroniza borradores JSON privados por cuenta, perfil y producto.   |
| `src/components/about-section/AboutSection.tsx`                   | Explica el propósito del producto y los límites de verificación.                |
| `src/components/site-footer/SiteFooter.tsx`                       | Footer y enlaces de demostración a redes sociales.                              |
| `src/components/splash-screen/SplashScreen.tsx`                   | Pantalla inicial, progreso y animación de entrada.                              |
| `src/app/globals.css`                                             | Importación de Tailwind, tokens visuales, foco y estilos globales.              |
| `next.config.ts`                                                  | Cabeceras HTTP de seguridad.                                                    |

## 5. Registro y persistencia

El productor registra producto, características, origen, fecha y organización tras iniciar sesión con su cuenta Supabase. El perfil aporta actor y organización declarados. Publicar la ficha QR es opcional y queda desactivado por defecto.

1. Se genera un identificador con `crypto.randomUUID()` y se captura `createdAt` con el reloj del dispositivo.
2. La sesión Supabase aporta `auth.uid()` como `owner_id`. El lote se guarda en `traceability_lots` y RLS limita lecturas y escrituras a esa cuenta. La migración se ejecutó; la verificación anónima deniega acceso a la tabla privada.
3. Eventos y metadatos de certificados están conectados al registro remoto. Los archivos PDF e imagen y el directorio de miembros de demostración permanecen en el navegador.
4. Si hay lotes heredados en localStorage, el panel intenta insertarlos en Supabase bajo el `owner_id` de la cuenta autenticada cuando existe la tabla remota; solo borra la copia local después de que todas las inserciones tengan éxito.

La sesión de cuenta Supabase permite volver a iniciar sesión desde otro dispositivo. `useLotRecords` publica en React el snapshot después de lecturas y escrituras remotas.

Los borradores de formularios se guardan en `traceability_work_drafts`, particionados por `auth.uid()`, perfil, producto y tipo de formulario. Esta tabla usa RLS para que cada usuario solo pueda leer y cambiar sus borradores. Aplica `supabase/migrations/202610170001_traceability_work_drafts.sql` para sincronizarlos entre navegadores. Se guardan campos de texto y selecciones; no se suben archivos, contraseñas, claves privadas ni estado de conexión de Freighter. Al cambiar de navegador, la wallet debe conectarse de nuevo.

Los avisos de anclaje se escriben en `lot_anchor_notifications` solo para el dueño Supabase del lote y se muestran únicamente en el perfil Productor. La función valida `auth.uid() = owner_id`; no comparte datos del lote ni concede acceso entre usuarios. Aplica `supabase/migrations/202610170002_lot_anchor_notifications.sql` para activar esta notificación.

La foto opcional del producto se guarda como dato del lote en el registro privado de Supabase, protegido por RLS del propietario. La migración `202610160002_public_lot_product_photo.sql` la incluye en la proyección solo cuando el dueño publica el lote; el productor también puede cambiarla o quitarla al editar. Los archivos PDF e imagen adjuntos como evidencia de eventos o certificados continúan en almacenamiento local.

La migración `202610160001_public_lot_prefix_lookup.sql`, aplicada en Supabase, añade la búsqueda por prefijo del ID y producto sobre `public_traceability_lots`; no consulta la tabla privada ni concede permisos. Los perfiles internos siguen dependiendo de RLS para recuperar lotes propios.

## 6. Flujos asociados a las historias de usuario

Al abrir `/registros`, el panel permite recorrer los siguientes perfiles de trabajo. En la demo, una misma cuenta Supabase puede seleccionar cualquiera; los perfiles son declaraciones locales de flujo, no roles de seguridad.

| Historia                      | Flujo disponible                                                                                                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Productor                     | Crea, edita o retira sus lotes; el historial separa activos y retirados. La baja lógica despublica la ficha y conserva el historial de auditoría.                                                                         |
| Actor de cadena               | Selecciona un lote y registra tipo, fecha/hora ocurrida, detalle, actor, rol y organización declarados; puede adjuntar evidencia opcional. Puede editar sus propios eventos.                                              |
| Certificador                  | Asocia nombre, emisor, número y vigencia declarados; selecciona un archivo PDF/imagen. Se captura quién lo asoció, se calcula SHA-256 y el archivo se conserva en IndexedDB local. Puede editar sus propios certificados. |
| Consumidor                    | Escanea el QR con cámara tras conceder permiso, o escribe su ID/URL. La ficha pública muestra datos declarados, cronología, certificados y huellas, sin publicar archivos.                                                |
| Administrador de organización | Busca lotes propios por prefijo QR, gestiona el directorio local declarado y consulta la última huella en Stellar Testnet. No concede acceso entre cuentas.                                               |
| Comprador B2B                 | Busca lotes y evidencia declarada; puede editar los parámetros del borrador de escrow antes de simularlo. Un contrato ya firmado/desplegado no se modifica desde el formulario.                                           |
| Auditor                       | Revisa eventos ordenados por fecha de captura y recibe alertas básicas por fechas inconsistentes, rol ausente o eventos duplicados. Puede editar sus observaciones privadas, no la evidencia fuente.                      |

Los eventos aceptan evidencia opcional con huella SHA-256. Se evita repetir el mismo evento y se rechaza asociar al lote el mismo número de certificado con la misma huella. Las alertas son comprobaciones simples de consistencia, no detección de fraude. La vigencia, identidad del certificador y legitimidad del documento son declaraciones sin verificación externa. Para usar la cámara se requiere un contexto seguro (HTTPS o localhost) y permiso explícito del navegador.

El Productor edita o retira sus lotes; el historial separa los activos de los retirados y no cuenta las bajas lógicas como activos. Actor de cadena puede editar sus eventos propios (autor, rol y organización declarados coincidentes) y Certificador los certificados que registró. Administrador edita el directorio local de la organización declarada y consulta los lotes que RLS permite a la misma cuenta Supabase. En cada lote puede leer el contador y el último hash en Stellar Testnet y compararlo con la ficha actual; esta consulta de solo lectura no publica datos ni concede acceso a lotes de otras cuentas. Auditor puede añadir y editar sus observaciones privadas, pero no reescribe la evidencia fuente. Comprador edita parámetros de escrow antes de firmar; el formulario no edita contratos ya desplegados.

La acción de anclaje solo se ofrece al Productor, al Administrador, y a un Actor de cadena o Certificador que ya haya agregado su propio registro al lote. Comprador, Auditor y Consumidor solo pueden consultar el hash. El contrato sigue exigiendo que la wallet sea admin o un actor autorizado; el selector de perfil no concede permiso on-chain. Cuando la wallet conectada es la administradora configurada, un anclaje confirmado solicita un aviso privado únicamente al dueño Supabase del lote. Aplica `supabase/migrations/202610170002_lot_anchor_notifications.sql`; el aviso aparece en el perfil Productor.

El productor puede elegir café, cacao o algodón orgánicos; completar variedad, cosecha, calidad, valor/divisa y unidad, además de otros datos manuales. El origen separa finca, ciudad, región y país. El selector de ciudad carga inicialmente las localidades del país y luego puede afinarse al elegir región; también permite ingresar localidades ausentes. Cada perfil dispone de un tour Driver.js: comienza por la wallet (opcional para consulta), continúa con el contexto del registro y termina en la acción propia del rol. El acceso incluye una guía independiente de tres pasos: perfil, producto y credenciales. Crear lote, agregar evento, asociar certificado, autorizar/revocar una wallet y preparar/simular escrow requieren confirmación antes de ejecutar la operación. La cámara solicita confirmación antes de que el navegador muestre su petición de permiso.

El historial del Productor separa lotes activos de retirados, con métricas diferentes; los retirados aparecen en una sección plegable y no se cuentan como activos. La campana se oculta al elegir Productor. Para los demás perfiles, las notificaciones son privadas por cuenta y filtradas por el cultivo seleccionado; solo se generan cuando un lote de ese cultivo se publica. Las migraciones `202610160003_product_notifications.sql` y `202610160004_cleanup_product_notifications.sql` deben aplicarse en Supabase para activar avisos y limpiar avisos obsoletos.

Las credenciales compartidas entre perfiles son solo una comodidad de demo: el selector no autentica ni autoriza un rol. Para producción, cada perfil deberá tener identidad y credenciales propias con rol verificado en servidor y políticas RLS por organización; esas membresías y restricciones aún no están implementadas.

Los campos obligatorios muestran el error junto al control que falta y lo asocian con `aria-describedby`; al corregirlo desaparece el mensaje y el foco llega al primer campo pendiente. El selector de foto oculta el control nativo del navegador: presenta acciones localizadas para seleccionar/cambiar/quitar y el nombre del archivo. La imagen de producto es opcional; la evidencia de evento también, mientras que el archivo del certificado es obligatorio. Los tres controles permiten reemplazar o quitar el archivo antes de guardar.

## 7. QR y opciones de compartir

El código del QR usa una URL con el identificador del lote, con la forma `/lote/{id}` y el origen de `NEXT_PUBLIC_SITE_URL`. El dueño debe activar explícitamente la publicación; la vista SQL proyecta campos permitidos y excluye nombres personales y nombres de archivo. El SVG de la marca se incrusta en el centro con nivel de corrección alto; el contenido sigue siendo la URL pública original. Para escanear desde un teléfono en desarrollo, configura el origen con la IP LAN del equipo en lugar de `localhost`.

El disclosure **Compartir** ofrece correo electrónico, X, LinkedIn, Instagram y copiar enlace. Las opciones de correo y redes generan sus respectivos enlaces de acción. Instagram no ofrece aquí una publicación web directa, por lo que copia la URL al portapapeles para que la persona la pegue en Instagram. Si el navegador bloquea el portapapeles, aparece un campo de solo lectura para copiarla manualmente.

`/lote/{id}` consulta `public_traceability_lots` y presenta el lote y su cronología SVG cuando la fila está publicada. La proyección excluye nombres personales y archivos. El endpoint remoto devuelve dos fichas públicas y una ruta se verificó en el navegador. El QR usa `NEXT_PUBLIC_SITE_URL`; para probarlo desde un teléfono local, configura la IP LAN del equipo en lugar de `localhost`. El escáner acepta el origen actual o el configurado y rechaza otros destinos.

## 8. Accesibilidad y experiencia adaptable

- Se usan landmarks semánticos (`header`, `main`, `section`, `footer`) y encabezados jerárquicos.
- Cada campo tiene una etiqueta asociada y conserva la validación nativa del navegador.
- El botón de compartir utiliza el elemento nativo `details/summary`; puede abrirse con teclado, se cierra al pulsar fuera, al mover el foco fuera o al seleccionar una acción.
- `Escape` cierra el menú y devuelve el foco al control que lo abrió.
- Las acciones e iconos tienen nombres accesibles; los iconos decorativos se ocultan a lectores de pantalla.
- Los resultados de copia se anuncian mediante una región `role="status"`.
- El foco visible se define globalmente y las vistas usan layouts adaptables de Tailwind.
- Los tours de Driver.js permiten cerrar con Escape, ofrecen botones de navegación y progreso, respetan el ajuste de movimiento reducido y usan popovers limitados al ancho disponible.
- El directorio del Administrador se presenta como tarjetas etiquetadas en móvil y como tabla semántica en pantallas mayores; no requiere desplazamiento horizontal en teléfonos.
- El SplashScreen y las animaciones de GSAP respetan `prefers-reduced-motion`.
- El escáner anuncia estados, permite detener la cámara y ofrece entrada manual como alternativa.
- Los diálogos se implementan con `<dialog>` modal nativo, nombre y descripción accesibles, cierre y cancelación; `Escape` cierra sin ejecutar la operación. Selectores, casillas y acciones habilitados muestran cursor de mano, mientras las tarjetas de lote no anuncian una acción que no tienen.
- Los controles de formulario mantienen 16 px para evitar el zoom de foco en móvil/tablet; los placeholders se ocultan visualmente al enfocar y la fecha tiene una referencia accesible `dd/mm/aaaa`.
- Los mensajes de validación inline usan `role="alert"`, `aria-invalid` y `aria-describedby`; los controles de archivo son accionables por teclado y anuncian el nombre y los errores.

## 9. SEO y metadatos sociales

`src/app/layout.tsx` define título, descripción, aplicación, palabras clave, canonical, robots, Open Graph y Twitter Cards. `src/app/opengraph-image.tsx` genera la imagen que usan Open Graph y Twitter como `summary_large_image`.

Configura `NEXT_PUBLIC_SITE_URL` con el dominio HTTPS público para que canonical, `og:url` e imagen Open Graph se resuelvan como URLs absolutas correctas. La imagen social se sirve en `/opengraph-image`.

## 10. Cabeceras y seguridad

`next.config.ts` configura Content Security Policy, `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy` y otras cabeceras. HSTS y `upgrade-insecure-requests` se habilitan solo en producción; `unsafe-eval` se añade únicamente en desarrollo para las herramientas de Next.

Estas cabeceras son defensa en profundidad y no sustituyen autenticación, autorización, validación del lado servidor ni controles de acceso a datos. La política CSP actual mantiene `unsafe-inline` por compatibilidad con el render e hidratación de Next; una CSP estricta con nonce requeriría una estrategia de respuesta dinámica.

`connect-src` permite el Soroban RPC de Testnet, los endpoints necesarios de WalletConnect, el origen configurado de Supabase y los websockets de Next solo en desarrollo. Los logos de wallets se limitan al host publicado por Stellar Wallets Kit; no se habilitan destinos HTTPS arbitrarios.

`TRUSTLESS_WORK_API_KEY` se lee solo en `src/app/api/stellar/escrow/route.ts`. La ruta valida el token Supabase con `auth.getUser` y la allowlist; nunca devuelve la API key al cliente. El flujo de escrow permanece deshabilitado hasta configurar esas variables. La wallet firma localmente el XDR; no se manejan ni almacenan claves privadas. La clave anon/publishable de Supabase lleva `NEXT_PUBLIC_` y no reemplaza políticas RLS.

### Revisión OWASP Top 10:2025

La referencia es [OWASP Top 10:2025](https://top10.owasp.org/2025/). Esta aplicación no está certificada ni puede garantizar ausencia de ataques. El dashboard requiere una sesión Supabase y la persistencia depende de RLS por propietario:

- **A01 Broken Access Control:** la migración actualizada está ejecutada; el endpoint privado devuelve HTTP 401 a `anon` y la vista QR responde HTTP 200 con dos filas. Aún falta probar aislamiento entre dos cuentas autenticadas. Los perfiles no son permisos organizacionales.
- **A02 Security Misconfiguration:** cabeceras CSP, HSTS en producción, `frame-ancestors`, `nosniff` y permisos de cámara limitados. CSP conserva `unsafe-inline`; debe revisarse antes de producción.
- **A03 Software Supply Chain Failures:** se conserva el lockfile y se fijó Axios en `1.20.0` tras detectar versiones vulnerables. La auditoría de producción aún reporta 4 avisos moderados (`uuid`/`stream-json`) y 1 bajo (`elliptic`) en dependencias transitivas de `@creit.tech/stellar-wallets-kit`.
- **A04 Cryptographic Failures:** SHA-256 para evidencia y anclaje; no se guarda información sensible ni archivos en cadena. Una huella no autentica el emisor.
- **A05 Injection:** React escapa texto renderizado, los filtros Supabase usan consultas parametrizadas y la migración contiene SQL estático; no se concatena entrada de usuario en SQL. No hay IA/LLM en el producto, así que prompt injection no es un vector actual.
- **A06 Insecure Design:** la ficha QR es opt-in y se explican datos declarados. No hay identidad organizacional verificada ni protección contra el problema del oráculo físico.
- **A07 Authentication Failures:** correo/contraseña y restablecimiento por enlace se gestionan con Supabase Auth; la respuesta de recuperación no confirma si una cuenta existe. Las contraseñas no se guardan en tablas de la aplicación. Confirm Email se desactiva para el flujo sin OTP; limita las URL de redirección y configura límites antiabuso antes de producción.
- **A08 Software or Data Integrity Failures:** la migración RLS está aplicada; aún falta validar el guardado autenticado y la recuperación de datos. El contrato desplegado autoriza con `require_auth` y mantiene hashes append-only. El WASM local añade extensión de TTL, pero no está desplegado. La restauración cliente de entradas archivadas requiere validación.
- **A09 Security Logging and Alerting Failures:** existe un historial de cambios por lote en Supabase, pero es un dato de aplicación modificable por el propietario, no una bitácora inmutable ni un evento de Stellar. Tampoco hay alertas propias.
- **A10 Mishandling of Exceptional Conditions:** errores de red/almacenamiento se controlan y notifican con Sonner; los errores de autenticación no exponen detalles internos.

## 11. Límites del prototipo

- `/registros` muestra el acceso y requiere una cuenta para abrir el dashboard. La migración está aplicada; falta una cuenta de prueba y un lote publicado para validar el flujo de punta a punta.
- Los perfiles de trabajo son selecciones del cliente y no constituyen autorización; la lista de miembros de demostración puede alterarse desde el navegador.
- Lotes, eventos y metadatos usan Supabase por cuenta. La migración actualizada está aplicada y se verificó el rechazo anónimo de la tabla; el guardado autenticado aún no se ha probado. El directorio de miembros y los archivos seleccionados permanecen en localStorage/IndexedDB.
- La foto opcional del producto se guarda en el registro privado; la vista pública la incluye únicamente si el dueño publica el lote y la migración `202610160002_public_lot_product_photo.sql` está aplicada. Editar o retirar un lote solicita contraseña y motivo; retirar despublica la ficha y conserva el lote. El historial se guarda dentro del JSON del registro y no es inmutable ni se ancla a Stellar.
- El QR abre la vista pública de Supabase en otros dispositivos cuando el dueño la habilita; no prueba identidad, autorización, integridad on-chain ni veracidad del lote.
- La huella SHA-256 permite detectar cambios posteriores en los bytes registrados, pero no autentica al emisor ni certifica la sostenibilidad.
- El contrato de Testnet solo acepta `record_event` de su administrador o de direcciones previamente autorizadas on-chain. La autorización de wallets no sustituye la identidad organizacional del MVP.
- El escrow de Trustless Work es una integración opcional del perfil B2B y no una condición para registrar lotes. Requiere una API key de servidor, activo SAC de Testnet, direcciones de rol válidas y XLM de prueba para la tarifa de la wallet.
- Los enlaces de redes sociales del footer son ejemplos y no perfiles oficiales.
- No se deben registrar datos personales, documentos privados ni información sensible en esta demo.

La persistencia remota y la proyección pública están definidas en SQL. Aún falta una tabla de organizaciones y membresías con autorización real; el directorio actual es local y la organización se declara en el perfil. En producción, cada perfil requerirá una identidad autenticada, rol asignado en servidor y políticas RLS que impidan cambiar de perfil para acceder a registros ajenos. Compartir correo/contraseña entre perfiles solo forma parte de esta demo.

## 12. Front construido

La portada explica el producto en lenguaje directo: seguir el origen, las etapas y la evidencia de cada lote. El enlace **Registro** y el CTA **Consultar lotes** llevan a `/registros`; **Cómo funciona** desplaza a la sección Sobre. `/registros` ofrece acceso por correo/contraseña antes del dashboard.

La pantalla principal es el panel de trazabilidad, con métricas de lotes activos y retirados, eventos y certificados, conexión de wallet Stellar y un selector de perfiles. En esta demo una cuenta de correo/contraseña puede elegir cualquiera de los perfiles; el selector cambia la interfaz, no concede permisos ni confirma identidad. RLS mantiene los lotes privados limitados a su propietario.

El flujo de productor implementa la historia prioritaria del Blueprint: registrar el origen y las características de un lote. El formulario solicita producto, características, ubicación de origen, fecha y organización responsable. Todos los campos son obligatorios; además de la validación del navegador, se rechazan los valores que contienen solamente espacios. El perfil de trabajo atribuye el actor y la organización al lote. Al guardar se genera un UUID y se almacena en Supabase; el QR se publica solo con autorización explícita del dueño.

La mejora de semana 4 amplía el formulario de productor: selector de café, cacao o algodón orgánicos; atributos de cultivo; valor/divisa y unidad; datos adicionales manuales; foto de producto opcional; y ubicación con finca, ciudad, región y país. La foto permanece privada salvo que el lote se publique y esté aplicada la migración de proyección pública. El control de carga muestra el nombre, permite cambiar o quitar la foto y muestra previsualización. El historial separa los lotes activos y retirados. Las operaciones de creación y los demás flujos que escriben datos muestran confirmación. Editar o retirar un lote requiere contraseña y motivo; el retiro es lógico y guarda la descripción, fecha, responsable y perfil.

Los demás perfiles conectan con las historias siguientes del MVP. Actor de cadena puede editar sus eventos propios y Certificador sus certificados registrados, con contraseña, motivo y auditoría en el lote; pueden cambiar la evidencia adjunta. El Administrador edita miembros del directorio local filtrado por organización declarada. Comprador B2B puede cambiar el borrador de escrow antes de firmarlo; un contrato desplegado no se edita desde el panel. Auditor puede escribir observaciones privadas por lote, pero no cambiar la fuente que revisa. Las notas de auditoría no equivalen a una auditoría ni a una detección de fraude.

El perfil consumidor incluye el escáner QR y entrada manual. La ficha `/lote/{id}` consulta la vista pública de Supabase y presenta datos declarados, la foto de producto si el dueño publicó el lote, QR para compartir, cronología SVG accesible, certificados y hashes; no publica los archivos de evidencia. La wallet de Stellar firma el anclaje de una huella SHA-256; el flujo muestra la simulación, tarifa estimada, envío y confirmación de Testnet. La cuenta debe estar financiada con XLM de prueba.

El perfil Comprador B2B incorpora un flujo de escrow opcional con Trustless Work Core API V2. La aplicación construye/simula el escrow en servidor, muestra contrato previsto y tarifa, solicita la firma de la wallet y envía el XDR firmado para confirmación. La API key permanece en el servidor. El dashboard aplica `border-beam` a las métricas y desactiva el efecto cuando `prefers-reduced-motion` está activo.

Estos flujos cubren a nivel de interfaz las historias priorizadas en el Blueprint: origen, eventos, certificados, consulta del consumidor, administración de miembros, búsqueda B2B y revisión de auditoría. Se usan etiquetas asociadas a los campos, estructura semántica, indicadores de estado accesibles, foco visible y navegación por teclado. Los errores de alta se anuncian; los formularios rechazan campos requeridos incompletos. La animación de entrada y la animación del registro nuevo se desactivan cuando el usuario prefiere movimiento reducido.

El dashboard requiere una cuenta Supabase. Los perfiles comparten la cuenta en esta demo y no son roles de seguridad. En producción cada perfil necesita identidad y rol verificados, membresías y políticas RLS por organización. Los avisos de la campana son privados por usuario y cultivo, y solo se generan con la publicación del lote; `202610160003_product_notifications.sql` y `202610160004_cleanup_product_notifications.sql` deben estar aplicadas. Miembros continúan en localStorage. La wallet firma anclajes y autorizaciones on-chain, no identifica la sesión Supabase. El contrato Testnet enlazado es anterior al WASM con TTL, aún no desplegado. El escrow sigue deshabilitado por falta de API key/allowlist. No hay despliegue público confirmado.

## 13. Decisión técnica

### Contrato de trazabilidad

Se implementó `contracts/traceability-registry` porque el MVP necesita anclar hashes de lotes/eventos, no custodiar pagos. Usa `#[contract]`, `#[contractimpl]` y `__constructor`; el administrador se fija al desplegar. `record_event` exige autenticación del actor, agrega hashes append-only y emite `LotEventRecorded`. `event_count` y `event_hash` permiten leer el historial. El administrador puede habilitar y revocar direcciones. Contadores, hashes, autorizaciones y estado de instancia extienden TTL a 500.000 ledgers al usarse; la restauración de entradas ya archivadas aún no está resuelta en el cliente. El anclaje no prueba la veracidad original ni la identidad de la organización.

Desde `frontend/soroban-TrazabiliChain`, crea una identidad de Testnet, consigue XLM de prueba para pagar el despliegue y consulta su dirección pública:

```sh
stellar keys generate --global trazabili-admin --network testnet
stellar keys address trazabili-admin
```

Compila y despliega pasando explícitamente la dirección pública que será admin del contrato. El constructor exige autenticación de esa cuenta; la llave privada permanece en el key store de Stellar CLI y no se copia a `.env`.

```sh
stellar contract build --package traceability-registry
stellar contract deploy \
	--wasm target/wasm32v1-none/release/traceability_registry.wasm \
	--source-account trazabili-admin \
	--network testnet \
	--alias trazabili_registry \
	-- --admin G_PUBLIC_KEY_DEL_ADMIN
```

Despliegue Testnet de la iteración anterior: [contrato CBOJPR4LUMXN3YMO5QAM76XPIMYHFL23OYBGB5HHYSS45WCIXREQETNZ](https://stellar.expert/explorer/testnet/contract/CBOJPR4LUMXN3YMO5QAM76XPIMYHFL23OYBGB5HHYSS45WCIXREQETNZ), inicializado con la cuenta `alice` y verificado con `event_count`. El WASM actual añade gestión de TTL, pero todavía no se despliega; su SHA-256 es `6a187a5f796587465015cef2ea9e5a544e4d9dbf6306496c1796e904d30f9154`. El ID está en `.env.example`.

Desde la interfaz, conecta la wallet pública que coincide con el administrador del constructor y usa el perfil **Administrador de organización** para autorizar wallets de actores. Cada autorización y revocación se simula y firma; la cuenta que firma necesita XLM de prueba. El actor autorizado conecta su wallet para anclar eventos.

### Escrow de pagos

No se construyó un segundo contrato de escrow propio. El Blueprint excluye pagos del MVP, y existe Trustless Work, proyecto Stellar con escrows Soroban de hitos e incorporación anunciada a SCF Integration Track. La integración opcional usa Trustless Work Core API V2 en Testnet: la API construye/simula el XDR, la wallet del rol firma y el servidor lo envía para confirmación. La clave `TRUSTLESS_WORK_API_KEY` permanece solo en el servidor. Referencias: [sitio de Trustless Work](https://trustlesswork.com/), [anuncio de SCF Integration Track](https://trustlesswork.com/escrow-times/news-scf-integration-track), [contratos Soroban](https://github.com/Trustless-Work/trustlesswork-smart-contract-stellar) y [documentación Core API V2](https://docs.trustlesswork.com/trustless-work/v2-en/escrow-js-sdk/getting-started.md).

El escrow se limita al perfil B2B y requiere direcciones de rol, contrato SAC del activo de Testnet, cuenta financiada con XLM y API key de Trustless Work. No se requiere para crear lotes, asociar evidencia ni consultar QR. No se deben usar fondos reales con esta demo.

### Proyectos similares

La decisión técnica queda acotada: contrato propio para anclar el historial; Trustless Work opcional para pagos por hitos; no se tokenizan certificados. Existen proyectos próximos como [AgTrail](https://agtrail.agrolinking.com/) y [TRAK](https://trak.id/), con distintos alcances.

## 14. Participación del equipo

| Integrante         | Usuario de GitHub                                      | Aporte o responsabilidad verificable                                       |
| ------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------- |
| Diego Marulanda B. | [@DiegoMarulandaB](https://github.com/DiegoMarulandaB) | Trabajo individual full stack: frontend, contrato Soroban y documentación. |

## 15. Bloqueos y siguiente paso

- **Supabase:** `/registros` usa correo/contraseña; Anonymous Sign-Ins permanece desactivado y Confirm Email está desactivado. La vista QR responde HTTP 200 con dos fichas y la tabla privada rechaza `anon` con HTTP 401. La ruta pública muestra datos y SVG; faltan las pruebas de guardado autenticado y recuperación.
- **Contrato:** el despliegue Testnet existente es anterior al cambio de TTL. Falta publicar el WASM actual (hash indicado arriba), autorizar wallets reales de actores y registrar una transacción de evidencia.
- **Escrow:** faltan `TRUSTLESS_WORK_API_KEY` y la lista de emails para `TRUSTLESS_WORK_ALLOWED_EMAILS`. El endpoint queda deshabilitado hasta configurar ambas variables y una sesión Supabase; no se ha desplegado ni habilitado Mainnet.
- **Participación:** el trabajo de esta revisión es individual; no se atribuyen aportes a otras personas.

El siguiente paso es configurar Supabase, autorizar wallets de actores en Testnet y completar una prueba pública de anclaje. Después se podrá pilotear el escrow opcional con contrapartes reales, primero en Testnet.
