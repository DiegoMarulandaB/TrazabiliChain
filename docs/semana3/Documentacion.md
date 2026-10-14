# Documentación del frontend de TrazabiliChain

## 1. Propósito

El frontend presenta el flujo del MVP de TrazabiliChain: registrar lotes, eventos y certificados; consultar una ficha mediante QR; y anclar en Stellar Testnet una huella SHA-256 del lote. El acceso de Supabase está pausado porque faltan las llaves: el formulario de registro/login se conserva comentado en `src/app/registros/page.tsx` y el dashboard abre directamente. Los lotes y archivos de evidencia permanecen locales al navegador.

La aplicación está en `frontend/soroban-TrazabiliChain`. El crate `traceability-registry` guarda hashes append-only y emite eventos; el frontend lo invoca mediante Stellar RPC. Trustless Work se integra de forma opcional para pagos B2B por hitos, fuera del flujo principal de trazabilidad.

## 2. Tecnologías

- Next.js 16 con App Router.
- React 19 y TypeScript.
- Tailwind CSS 4 mediante el plugin PostCSS.
- GSAP y `@gsap/react` para animaciones.
- `qrcode.react` para generar los códigos QR en el navegador.
- `@zxing/browser` para escanear códigos QR con la cámara.
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

| Comando             | Uso                                                           |
| ------------------- | ------------------------------------------------------------- |
| `corepack pnpm dev`          | Inicia el servidor de desarrollo.                             |
| `corepack pnpm build`        | Genera la compilación de producción.                           |
| `corepack pnpm start`        | Sirve la compilación de producción.                            |
| `corepack pnpm lint`         | Ejecuta ESLint.                                                |
| `corepack pnpm typecheck`    | Verifica los tipos de TypeScript.                              |
| `corepack pnpm format`       | Aplica Prettier a los archivos incluidos en su configuración. |
| `corepack pnpm format:check` | Comprueba el formato sin modificar archivos.                  |

El repositorio fija pnpm `8.15.9`, compatible con el lockfile v6. No instales con pnpm 9 o superior sin migrar el lockfile deliberadamente.

### Variables y servicios

1. Desde `frontend/soroban-TrazabiliChain`, crea tu archivo local: `cp .env.example .env.local`. `.env.local` está excluido por `.gitignore`. El archivo local de este entorno ya contiene el ID público del contrato Testnet; no contiene secretos.
2. Supabase no está activado ahora: faltan Project URL y publishable/anon key. Cuando el equipo las tenga, configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` desde **Project Settings > API**. Nunca uses la `service_role` key en el navegador.
3. Para reactivar el formulario conservado, descomenta el import y `<RecordsAuth />` en `src/app/registros/page.tsx`, y comenta `<RecordsPanel />`. Después configura **Authentication > Providers > Email**, confirmación/OTP y Redirect URLs para `http://localhost:3000` y el dominio HTTPS de producción.
4. `NEXT_PUBLIC_SITE_URL` debe ser `http://localhost:3000` en local y el dominio HTTPS en producción. Reinicia Next.js después de cambiar una variable `NEXT_PUBLIC_*`.
5. Para anclar hashes no hace falta desplegar otra vez en este entorno: el contrato ya está desplegado en Testnet y su ID está en `.env.local`/`.env.example`. Revisa **Contrato de trazabilidad**.
6. Trustless Work tampoco está habilitado: falta `TRUSTLESS_WORK_API_KEY` y acordar qué emails autorizar en `TRUSTLESS_WORK_ALLOWED_EMAILS`. Ambas son variables de servidor; la API key no debe compartirse ni subirse al repositorio.

`.env.example` contiene el contrato público de Testnet y placeholders para las llaves ausentes. En Vercel u otro hosting configura los secretos desde el panel del entorno; no subas `.env.local`, `.env.production` ni archivos con valores reales. La key pública de Supabase no reemplaza Row Level Security: los lotes no se guardan en Supabase.

Dominio público de ejemplo:

`NEXT_PUBLIC_SITE_URL=https://trazabilichain.vercel.app/`


El valor por defecto es `http://localhost:3000`, útil solo durante el desarrollo local.

## 4. Rutas y composición

| Ruta o archivo                                                | Responsabilidad                                                         |
| ------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `src/app/api/stellar/escrow/route.ts`                         | Valida sesión y allowlist Supabase en servidor; la API key no sale del backend. |
| `src/app/page.tsx`                                            | Página principal; compone header, hero, sección Sobre y footer.         |
| `src/app/registros/page.tsx`                                  | Dashboard abierto en modo demo; acceso Supabase comentado, no eliminado. |
| `src/app/lote/[id]/page.tsx`                                  | Ruta dinámica de consulta de un lote por identificador.                 |
| `src/app/layout.tsx`                                          | Layout raíz, idioma, metadata general y SplashScreen.                   |
| `src/app/opengraph-image.tsx`                                 | Genera una imagen social de 1200 × 630 píxeles mediante `next/og`.      |
| `src/components/header/Header.tsx`                            | Navegación adaptable y enlace para saltar al contenido.                 |
| `src/components/records-panel/RecordsPanel.tsx`               | Dashboard, validación, historial y creación de lotes.                   |
| `src/components/records-auth/RecordsAuth.tsx`                 | Registro/login OTP conservado para reactivarlo cuando estén las llaves. |
| `src/components/organization-members/TraceabilityActorAccess.tsx` | Autoriza o revoca direcciones on-chain desde la wallet administradora. |
| `src/components/providers/StellarWalletProvider.tsx`           | Inicializa Stellar Wallets Kit en Testnet y expone firma de XDR.        |
| `src/components/wallet/WalletConnect.tsx`                      | Conexión y desconexión de wallet Stellar.                               |
| `src/components/traceability-anchor/TraceabilityAnchor.tsx`    | Ancla la huella del lote y enlaza la transacción confirmada.            |
| `src/components/escrow/TrustlessWorkEscrow.tsx`                | Flujo opcional B2B de escrow por hitos en Testnet.                       |
| `src/components/ui/feedback/Toaster.tsx`                       | Toaster global de Sonner.                                               |
| `src/components/ui/motion/BorderBeamFrame.tsx`                 | Efecto de borde del dashboard respetando movimiento reducido.           |
| `src/components/lot-sharing/LotSharing.tsx`                   | QR y opciones para compartir el enlace.                                 |
| `src/components/public-lot/PublicLotPage.tsx`                 | Consulta local del lote o aviso de que no está disponible.              |
| `src/components/event-form/EventForm.tsx`                     | Registro de hitos por parte de actores de la cadena.                    |
| `src/components/certificate-form/CertificateForm.tsx`         | Asociación de datos de certificado y huella de evidencia.               |
| `src/components/consumer-scanner/ConsumerScanner.tsx`         | Escaneo de QR con cámara y consulta manual.                             |
| `src/components/organization-members/OrganizationMembers.tsx` | Directorio local de miembros y roles de demo.                           |
| `src/components/buyer-dashboard/BuyerDashboard.tsx`           | Búsqueda de lotes y filtro por evidencia asociada.                      |
| `src/components/audit-dashboard/AuditDashboard.tsx`           | Cronología global y alertas básicas de consistencia.                    |
| `src/components/evidence-file/EvidenceFileLink.tsx`           | Descarga local de archivos de evidencia asociados a lotes o eventos.    |
| `src/lib/lots/lot-storage.ts`                                 | Modelo de lote, eventos, certificados, miembros y sincronización React. |
| `src/lib/lots/evidence-storage.ts`                            | Archivos de evidencia locales en IndexedDB.                             |
| `src/lib/stellar/read.ts`                                     | Lecturas RPC de conteo y hashes del contrato de trazabilidad.           |
| `src/lib/stellar/write.ts`                                    | Construcción, simulación, firma, envío y confirmación Soroban.          |
| `src/lib/stellar/trustless-work.ts`                           | Construye escrows y envía XDR firmado a la ruta servidor.               |
| `src/lib/supabase/client.ts`                                  | Cliente Supabase singleton para autenticación del navegador.            |
| `src/hooks/useStellarWallet.ts`                               | Hook para leer el contexto de wallet.                                   |
| `src/hooks/useLotAnchor.ts`                                   | Hash del lote, estado de escritura y notificaciones.                    |
| `src/components/about-section/AboutSection.tsx`               | Explica el propósito del producto y los límites de verificación.        |
| `src/components/site-footer/SiteFooter.tsx`                   | Footer y enlaces de demostración a redes sociales.                      |
| `src/components/splash-screen/SplashScreen.tsx`               | Pantalla inicial, progreso y animación de entrada.                      |
| `src/app/globals.css`                                         | Importación de Tailwind, tokens visuales, foco y estilos globales.      |
| `next.config.ts`                                              | Cabeceras HTTP de seguridad.                                            |

## 5. Registro y persistencia

Ejemplo de como deberia quedar ![datos de registro](image.png)

El formulario de productor requiere producto, características, ubicación de origen, fecha del lote y organización responsable. Los controles HTML `required` impiden el envío normal cuando faltan campos. Al enviar:

1. Se genera un identificador con `crypto.randomUUID()`.
2. Se captura `createdAt` con la fecha y hora del dispositivo.
3. El lote se añade a `localStorage` bajo la clave `trazabilichain-demo-lots`. Los registros antiguos conservan eventos y certificados; si falta la atribución de un rol se presenta como no registrada.
4. El historial se actualiza y presenta fecha de origen y hora de creación.

`useLotRecords` usa `useSyncExternalStore` para leer el snapshot del almacenamiento y notificar cambios locales y eventos de almacenamiento entre pestañas del mismo origen.

## 6. Flujos asociados a las historias de usuario

El selector superior permite recorrer estas pantallas como perfiles de demo:

| Historia                      | Flujo disponible                                                                                                                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Productor                     | Crea el lote con origen y características; se genera ID y QR.                                                                                                                            |
| Actor de cadena               | Selecciona un lote y registra tipo, fecha/hora ocurrida, detalle, actor, rol y organización declarados; puede adjuntar evidencia opcional. La fecha de captura también queda registrada. |
| Certificador                  | Asocia nombre, emisor, número y vigencia declarados; selecciona un archivo PDF/imagen. Se captura quién lo asoció, se calcula SHA-256 y el archivo se conserva en IndexedDB local.       |
| Consumidor                    | Escanea el QR con cámara tras conceder permiso, o escribe su ID/URL. La ficha pública local muestra datos, cronología, huellas y archivos de evidencia asociados.                        |
| Administrador de organización | Añade o quita miembros de un directorio local y asigna uno de los roles de demo.                                                                                                         |
| Comprador B2B                 | Busca lotes y evidencia declarada; puede preparar un escrow opcional por hitos con Trustless Work en Testnet. La identidad del emisor no se autentica.                                  |
| Auditor                       | Revisa eventos ordenados por fecha de captura y recibe alertas básicas por fechas inconsistentes, rol ausente o eventos duplicados.                                                      |

Los eventos aceptan evidencia opcional con huella SHA-256. Se evita repetir el mismo evento y se rechaza asociar al lote el mismo número de certificado con la misma huella. Las alertas son comprobaciones simples de consistencia, no detección de fraude. La vigencia, identidad del certificador y legitimidad del documento son declaraciones sin verificación externa. Para usar la cámara se requiere un contexto seguro (HTTPS o localhost) y permiso explícito del navegador.

## 7. QR y opciones de compartir

El QR codifica únicamente una URL con el identificador del lote, con la forma `/lote/{id}`. Los campos del lote no se incluyen en el QR ni en los parámetros de compartir.

El disclosure **Compartir** ofrece correo electrónico, X, LinkedIn, Instagram y copiar enlace. Las opciones de correo y redes generan sus respectivos enlaces de acción. Instagram no ofrece aquí una publicación web directa, por lo que copia la URL al portapapeles para que la persona la pegue en Instagram. Si el navegador bloquea el portapapeles, aparece un campo de solo lectura para copiarla manualmente.

Al abrir `/lote/{id}`, la página busca el lote en el almacenamiento local. Por ello, un enlace o QR solo puede resolver un registro en el mismo navegador y origen donde fue creado. En otro dispositivo, perfil o navegador se mostrará que el registro no está disponible. El escáner acepta solo URLs del mismo origen para evitar redirecciones a dominios externos.

## 8. Accesibilidad y experiencia adaptable

- Se usan landmarks semánticos (`header`, `main`, `section`, `footer`) y encabezados jerárquicos.
- Cada campo tiene una etiqueta asociada y conserva la validación nativa del navegador.
- El botón de compartir utiliza el elemento nativo `details/summary`; puede abrirse con teclado, se cierra al pulsar fuera, al mover el foco fuera o al seleccionar una acción.
- `Escape` cierra el menú y devuelve el foco al control que lo abrió.
- Las acciones e iconos tienen nombres accesibles; los iconos decorativos se ocultan a lectores de pantalla.
- Los resultados de copia se anuncian mediante una región `role="status"`.
- El foco visible se define globalmente y las vistas usan layouts adaptables de Tailwind.
- El SplashScreen y las animaciones de GSAP respetan `prefers-reduced-motion`.
- El escáner anuncia estados, permite detener la cámara y ofrece entrada manual como alternativa.

## 9. SEO y metadatos sociales

`src/app/layout.tsx` define título, descripción, aplicación, palabras clave, canonical, robots, Open Graph y Twitter Cards. `src/app/opengraph-image.tsx` genera la imagen que usan Open Graph y Twitter como `summary_large_image`.

Configura `NEXT_PUBLIC_SITE_URL` con el dominio HTTPS público para que canonical, `og:url` e imagen Open Graph se resuelvan como URLs absolutas correctas. La imagen social se sirve en `/opengraph-image`.

## 10. Cabeceras y seguridad

`next.config.ts` configura Content Security Policy, `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy` y otras cabeceras. HSTS y `upgrade-insecure-requests` se habilitan solo en producción; `unsafe-eval` se añade únicamente en desarrollo para las herramientas de Next.

Estas cabeceras son defensa en profundidad y no sustituyen autenticación, autorización, validación del lado servidor ni controles de acceso a datos. La política CSP actual mantiene `unsafe-inline` por compatibilidad con el render e hidratación de Next; una CSP estricta con nonce requeriría una estrategia de respuesta dinámica.

`connect-src` permite el Soroban RPC de Testnet en desarrollo y producción, los endpoints necesarios de WalletConnect y los websockets de Next solo en desarrollo. Los logos de wallets se limitan al host publicado por Stellar Wallets Kit; no se habilitan destinos HTTPS arbitrarios.

`TRUSTLESS_WORK_API_KEY` se lee solo en `src/app/api/stellar/escrow/route.ts`. La ruta valida el token Supabase con `auth.getUser` y la allowlist; nunca devuelve la API key al cliente. Como el login está comentado y aún faltan variables, el flujo de escrow permanece deshabilitado. La wallet firma localmente el XDR; no se manejan ni almacenan claves privadas. La clave anon/publishable de Supabase lleva `NEXT_PUBLIC_` y no reemplaza políticas RLS.

## 11. Límites del prototipo

- El registro/login de Supabase está conservado en `RecordsAuth.tsx`, pero su import y render están comentados en `/registros` porque faltan las llaves y no se implementará todavía. El dashboard abre directamente. No hay persistencia de lotes en Supabase: los datos continúan en `localStorage`/IndexedDB.
- Los perfiles y pantallas se simulan en el cliente. Ocultar formularios por rol no constituye autorización; cualquier persona con acceso al navegador puede cambiar de perfil o alterar `localStorage`.
- El navegador es la fuente de persistencia: lotes, eventos, metadatos de certificados y miembros usan `localStorage`; los documentos seleccionados usan IndexedDB. Borrar los datos del sitio elimina estos registros y evidencias.
- La hora de creación proviene del reloj del dispositivo y no es un sello de tiempo confiable.
- El QR permite localizar una ficha solo en el navegador local; no prueba identidad, autorización, integridad on-chain ni veracidad del lote.
- La huella SHA-256 permite detectar cambios posteriores en los bytes registrados, pero no autentica al emisor ni certifica la sostenibilidad.
- El contrato de Testnet solo acepta `record_event` de su administrador o de direcciones previamente autorizadas on-chain. La autorización de wallets no sustituye la identidad organizacional del MVP.
- El escrow de Trustless Work es una integración opcional del perfil B2B y no una condición para registrar lotes. Requiere una API key de servidor, activo SAC de Testnet, direcciones de rol válidas y XLM de prueba para la tarifa de la wallet.
- La demo usa un contrato de Testnet configurable; no se debe registrar información personal ni documentos privados en cadena.
- Los enlaces de redes sociales del footer son ejemplos y no perfiles oficiales.
- No se deben registrar datos personales, documentos privados ni información sensible en esta demo.

Para permitir consultas reales desde otros dispositivos, el siguiente paso es integrar persistencia del lado servidor, autenticación y autorización por organización. La ruta pública deberá exponer únicamente los campos autorizados; el cliente no puede ser la autoridad de seguridad.

## 12. Front construido

La portada explica el producto en lenguaje directo: seguir el origen, las etapas y la evidencia de cada lote. El enlace **Registro** y el CTA **Consultar lotes** llevan a `/registros`; **Cómo funciona** desplaza a la sección Sobre. Por ahora el dashboard abre sin iniciar sesión porque el acceso Supabase está comentado hasta recibir las llaves. El footer se adapta a pantallas estrechas y queda al pie en vistas cortas.

La pantalla principal es el panel de trazabilidad, con métricas locales de lotes, eventos y certificados, conexión de wallet Stellar y un selector de perfiles. Los perfiles de productor, actor, certificador, administrador, comprador, auditor y consumidor siguen siendo demostrativos: cambiar el selector no concede permisos ni confirma la identidad.

El flujo de productor implementa la historia prioritaria del Blueprint: registrar el origen y las características de un lote. El formulario solicita producto, características, ubicación de origen, fecha y organización responsable. Todos los campos son obligatorios; además de la validación del navegador, se rechazan los valores que contienen solamente espacios. Al guardar se genera un UUID, se captura la hora del dispositivo y el lote se añade al historial local. La lista presenta su origen, fechas y organización; también permite consultar eventos y certificados asociados y compartir una URL mediante código QR.

Los demás perfiles conectan con las historias siguientes del MVP. El actor de cadena selecciona un lote y registra un tipo de evento, fecha y detalle, con un archivo de evidencia opcional. El certificador asocia nombre, emisor, número, fechas y archivo; se calcula una huella SHA-256 para comparar la evidencia, sin afirmar que el emisor o certificado sean legítimos. El administrador gestiona un directorio de miembros de demostración. El comprador B2B busca lotes y puede filtrar certificados según su vigencia declarada. El auditor revisa eventos ordenados y alertas básicas de consistencia, que no equivalen a una auditoría ni a una detección de fraude.

El perfil consumidor incluye el escáner QR y entrada manual. La ficha `/lote/{id}` presenta el registro local solo si existe en ese navegador. La wallet de Stellar puede firmar el anclaje de una huella SHA-256; el flujo muestra la simulación, tarifa estimada, envío y confirmación de Testnet. La cuenta debe estar financiada con XLM de prueba.

El perfil Comprador B2B incorpora un flujo de escrow opcional con Trustless Work Core API V2. La aplicación construye/simula el escrow en servidor, muestra contrato previsto y tarifa, solicita la firma de la wallet y envía el XDR firmado para confirmación. La API key permanece en el servidor. El dashboard aplica `border-beam` a las métricas y desactiva el efecto cuando `prefers-reduced-motion` está activo.

Estos flujos cubren a nivel de interfaz las historias priorizadas en el Blueprint: origen, eventos, certificados, consulta del consumidor, administración de miembros, búsqueda B2B y revisión de auditoría. Se usan etiquetas asociadas a los campos, estructura semántica, indicadores de estado accesibles, foco visible y navegación por teclado. Los errores de alta se anuncian; los formularios rechazan campos requeridos incompletos. La animación de entrada y la animación del registro nuevo se desactivan cuando el usuario prefiere movimiento reducido.

La persistencia aún no alcanza el MVP multiusuario del Blueprint: lotes y miembros usan `localStorage`; los archivos de evidencia usan IndexedDB. No hay sincronización entre dispositivos ni RLS. El login Supabase está comentado y no protege el contenido local. El contrato sí está desplegado en Testnet; el escrow sigue deshabilitado por falta de API key/allowlist. No hay despliegue público confirmado. Para desarrollo, ejecuta `corepack pnpm dev` desde `frontend/soroban-TrazabiliChain`; el puerto puede variar si 3000 está ocupado.

## 13. Decisión técnica

### Contrato de trazabilidad

Se implementó `contracts/traceability-registry` porque el MVP necesita anclar hashes de lotes/eventos, no custodiar pagos. Usa `#[contract]`, `#[contractimpl]` y `__constructor`; el administrador se fija al desplegar. `record_event` agrega una huella SHA-256 append-only y emite `LotEventRecorded`. `event_count` y `event_hash` permiten leer el historial. El administrador puede habilitar y revocar direcciones para escritura. La consulta puede detectar cambios desde el anclaje, pero no prueba la veracidad original, la identidad de la organización ni la legitimidad del certificado.

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

Despliegue de esta iteración: [contrato CBOJPR4LUMXN3YMO5QAM76XPIMYHFL23OYBGB5HHYSS45WCIXREQETNZ](https://stellar.expert/explorer/testnet/contract/CBOJPR4LUMXN3YMO5QAM76XPIMYHFL23OYBGB5HHYSS45WCIXREQETNZ), inicializado con la cuenta `alice`. El contrato respondió a una lectura `event_count` en Testnet. Su ID público ya está en `.env.local` de este workspace y en `.env.example`.

Para otros despliegues, copia el `C...` resultante en `NEXT_PUBLIC_TRACEABILITY_CONTRACT_ID`. Para regenerar el client con el spec más reciente del WASM:

```sh
stellar contract bindings typescript \
	--wasm target/wasm32v1-none/release/traceability_registry.wasm \
	--output-dir packages/traceability_registry \
	--overwrite
```

Después del codegen, conserva el nombre del paquete `@trazabilichain/traceability-registry`, el `rootDir` de TypeScript y la versión de TS 6 del workspace; ejecuta `corepack pnpm install` y `corepack pnpm typecheck`.

Desde la interfaz, conecta la wallet pública que coincide con el administrador del constructor y usa el perfil **Administrador de organización** para autorizar wallets de actores. Cada autorización y revocación se simula y firma; la cuenta que firma necesita XLM de prueba. El actor autorizado conecta su wallet para anclar eventos.

### Escrow de pagos

No se construyó un segundo contrato de escrow propio. El Blueprint excluye pagos del MVP, y existe Trustless Work, proyecto Stellar con escrows Soroban de hitos e incorporación anunciada a SCF Integration Track. La integración opcional usa Trustless Work Core API V2 en Testnet: la API construye/simula el XDR, la wallet del rol firma y el servidor lo envía para confirmación. La clave `TRUSTLESS_WORK_API_KEY` permanece solo en el servidor. Referencias: [sitio de Trustless Work](https://trustlesswork.com/), [anuncio de SCF Integration Track](https://trustlesswork.com/escrow-times/news-scf-integration-track), [contratos Soroban](https://github.com/Trustless-Work/trustlesswork-smart-contract-stellar) y [documentación Core API V2](https://docs.trustlesswork.com/trustless-work/v2-en/escrow-js-sdk/getting-started.md).

El escrow se limita al perfil B2B y requiere direcciones de rol, contrato SAC del activo de Testnet, cuenta financiada con XLM y API key de Trustless Work. No se requiere para crear lotes, asociar evidencia ni consultar QR. No se deben usar fondos reales con esta demo.

### Proyectos similares

La revisión del ecosistema Stellar del 14 de octubre de 2026 encontró proyectos y prototipos cercanos, así que TrazabiliChain no es único: [AgTrail](https://agtrail.agrolinking.com/) ofrece trazabilidad alimentaria con IoT y QR; [Autify](https://autifynetwork.com/) y [reBlue](https://reblue.io/) trabajan en transparencia/cadena de suministro; [TRAK](https://trak.id/) registra recorridos de producto. En hackathons aparecen [EcoTracer](https://github.com/AngelMUGIWARA/EcocChain) y [Mineral Gateway](https://github.com/zan-maker/stellar-Metal-and-mineral-traceability-and-tokenization-platform). Son comparables por partes del problema, con distintos sectores y alcances; no se afirma que tengan el mismo usuario o producto.

La decisión técnica queda acotada: contrato propio para las reglas mínimas de anclaje e historial; Trustless Work como integración opcional si un flujo piloto necesita pago condicionado por hitos. No se tokenizan certificados. Deben probarse tarifas, autorización de actores, recuperación de estado y política de datos antes de pasar de Testnet.

## 14. Participación del equipo

| Integrante                                | Usuario de GitHub                                      | Aporte o responsabilidad verificable                                                            |
| ----------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Diego Marulanda B.                        | [@DiegoMarulandaB](https://github.com/DiegoMarulandaB) | Implementación del frontend de trazabilidad y actualización de la documentación del entregable.

 Rol general “Full stack”, sin distribuir responsabilidades individuales.

## 15. Bloqueos y siguiente paso

- **Supabase:** faltan Project URL, publishable/anon key y configuración Email/OTP. El acceso permanece comentado; no intentes registrar/iniciar sesión hasta recibir las llaves y reactivarlo. Los lotes siguen locales y requieren migración con RLS para convertirse en multiusuario.
- **Contrato:** desplegado en Stellar Testnet con admin `alice`; falta autorizar on-chain las wallets reales de cada actor desde el perfil administrador.
- **Escrow:** faltan `TRUSTLESS_WORK_API_KEY` y la lista de emails para `TRUSTLESS_WORK_ALLOWED_EMAILS`. El endpoint queda deshabilitado hasta contar con ambas y reactivar la sesión Supabase; no se ha desplegado ni habilitado Mainnet.
- **Participación:** faltan los usuarios de GitHub y aportes individuales del resto del equipo.

El siguiente paso es autorizar wallets de actores en Testnet y, cuando estén disponibles las credenciales, habilitar Supabase. Después se podrá pilotear el escrow opcional con contrapartes reales, primero en Testnet.
