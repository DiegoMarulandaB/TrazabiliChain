# Problem Brief

## Decisión del problema

### Problema elegido

> El problema ganador en una frase, sin mencionar blockchain, y quién lo propuso.

Las marcas éticas pierden la confianza de sus consumidores y pagan sobrecostos de auditoría debido a la imposibilidad de verificar la autenticidad de las certificaciones de origen e impacto en cadenas de suministro complejas. (Propuesto por: Equipo TrazabiliChain)

### Por qué elegimos este

> Qué inclinó al equipo por este problema frente a los demás, según los criterios de la Sesión 1.

Elegi este problema por tres razones estratégicas clave:

Doble dolor económico y de reputación: Afecta directamente los ingresos de las marcas sostenibles (pérdida de primas de precio por greenwashing) y sus márgenes (altos costos operativos en auditorías manuales).

Estructura multi-actor sin confianza central: Es un problema de coordinación entre múltiples partes independientes (productores, transportistas, certifiadoras, marcas) que no confían plenamente entre sí.

Escalabilidad y oportunidad de mercado: La regulación global (como la normativa de la UE contra el greenwashing y la directiva de debida diligencia) está forzando a las empresas a auditar sus cadenas de suministro con datos auditables.

### Propuestas descartadas

> Cada propuesta considerada, quién la propuso y el motivo del descarte.

Escriban aquí su respuesta.

### Cómo tomamos la decisión

> Cómo llegó el equipo al acuerdo: votación, consenso tras debate u otro.

Realice una investigación mediante los resultados de Google y el uso de la inteligencia artificial y me llamo la atención este tema

---

## Problem Brief

### Encabezado

> Nombre del proyecto y una frase que describa el problema. Extensión: breve.

TrazabiliChain — Incapacidad de verificar la autenticidad de las credenciales de sostenibilidad en cadenas de suministro agroindustriales.

### Equipo y roles

> Integrantes con su usuario de GitHub, rol asumido por cada persona, responsable de las entregas y canal de coordinación interna. Extensión: breve.

Full stack

### Problema y evidencia

> Enunciado del problema en una frase, sin mencionar blockchain. Contexto, frecuencia y alcance. Evidencia mínima de que el problema existe: observación directa, experiencia propia, conversaciones o fuentes consultadas, con enlace o cita cuando aplique. Extensión: 150–300 palabras.

Las marcas que comercializan productos bajo alegatos de sostenibilidad (orgánico, comercio justo, huella de carbono neutra) no tienen forma eficiente de probar la veracidad de dichas afirmaciones ante el consumidor final. Las certificaciones actuales se gestionan mediante documentos estáticos (PDFs, certificados en papel y planillas Excel) transmitidos entre múltiples intermediarios en la cadena agroindustrial. Esto genera opacidad, vulnerabilidad al fraude y propagación de greenwashing, perjudicando tanto a las marcas legítimas como a los productores que invierten en prácticas sostenibles.


### Usuario y actores

> Quién sufre el problema y qué necesita resolver. Cómo lo resuelve hoy y qué le cuesta en dinero, tiempo o esfuerzo. Demás actores que intervienen en el flujo, con el papel que cumple cada uno. Extensión: 150–300 palabras.

Usuario principal (sufre el problema): Directores de Sostenibilidad y Brand Managers de marcas B2C de café, cacao y algodón orgánico. Necesitan demostrar con evidencia irrefutable el impacto de su cadena de valor para proteger la reputación de marca y validar sus precios premium. Hoy lo resuelven contratando auditorías de terceras partes y consolidando reportes manuales, lo que les cuesta decenas de miles de dólares al año y meses de retraso operativo.
Productores / Cooperativas: Registran la cosecha, origen y peso inicial. Necesitan garantizar que su certificación no sea clonada ni alterada.

Procesadores / Transportistas: Aportan datos logísticos (condiciones de transporte, custodia, procesamiento).

Certificadoras / Certificadores de Carbono: Emiten la validez de los sellos ecológicos y mediciones de impacto.

Consumidor Final: Desea verificar rápidamente (ej. vía código QR en el empaque) que la promesa del producto es real.

### Flujo actual de valor

> Recorrido paso a paso de cómo se mueve hoy el dinero, la información o el activo, desde el origen hasta el destino. Diagrama o secuencia numerada, con los intermediarios explícitos. Señalar si algún paso responde a una obligación normativa. Extensión: 150–300 palabras.

El flujo físico e informacional del producto (ej. café de especialidad) sigue la siguiente secuencia:

Origen (Finca / Cooperativa): El productor vende el lote a un acopiador local. La información de origen y el peso se anotan en remisiones físicas o planillas locales.

Certificación inicial (Obligación Normativa / Estándar voluntario): Un auditor de un organismo certificador visita la finca anualmente y emite un certificado en PDF acreditando que el lote es orgánico o Fairtrade.

Procesamiento y Transporte: El lote pasa por beneficio, trillado y empaque. Cada transportista y procesador emite sus propios manifiestos de carga independientes en sistemas de ERP aislados.

Exportación y Aduana (Obligación Normativa): La documentación de origen y cumplimiento ambiental se presenta físicamente o digitalmente ante autoridades aduaneras para autorizar el embarque internacional.

Marca B2C y Distribución: La marca recibe el grano, consolida la documentación dispersa para su archivo de debida diligencia e imprime el sello de "100% Orgánico" en el paquete.

Consumidor: Paga un sobreprecio por el producto basándose únicamente en la confianza del logo impreso en el empaque, sin acceso al historial del lote.

### Fricciones identificadas

> Puntos concretos donde el flujo falla, se encarece o se demora. Cada fricción indica en qué paso ocurre, qué la causa y a quién afecta. Extensión: 150–300 palabras.

Silos de información estática y falsificable (Paso 1 y 2): Ocurre entre el productor y el primer acopiador. La información se registra en documentos físicos o PDFs que pueden ser alterados, reutilizados para volúmenes mayores a los producidos o falsificados sin detección inmediata. Afecta a la marca B2C y al consumidor.

Duplicación de esfuerzos de auditoría y costo extremo (Pasos 2 y 5): Ocurre cuando la marca intenta conciliar los datos del lote con las certificaciones anuales. La verificación requiere revisión manual de planillas y auditorías cruzadas recurrentes, lo que encarece el producto final hasta en un 15% solo en gastos de administración e inspección. Afecta a la marca y al margen del productor.

Imposibilidad de trazabilidad inversa para el consumidor (Paso 6): Ocurre en el punto de venta. La pérdida del hilo documental a lo largo de la cadena impide que el cliente final pueda auditar el origen, resultando en desconfianza generalizada por el auge del greenwashing. Afecta a la marca (pérdida de conversión de ventas) y al consumidor.

### Oportunidad e hipótesis

> Oportunidad priorizada entre las fricciones identificadas, con el motivo de la elección. Hipótesis inicial de por qué blockchain podría mejorar ese punto, expresada en términos de qué cambiaría para el usuario. Extensión: 150–300 palabras.

Oportunidad priorizada: Eliminación de la vulnerabilidad documental y la falta de trazabilidad verificable mediante la vinculación inmutable de certificados de impacto y eventos logísticos directamente al lote físico. Se elige esta oportunidad porque resuelve simultáneamente el riesgo de greenwashing y elimina la necesidad de conciliaciones manuales de datos.

Hipótesis inicial: Si registramos cada evento de la cadena de suministro y tokenizamos los certificados de huella de carbono/origen en un libro contable inmutable, las marcas podrán probar la autenticidad de sus afirmaciones ecológicas en tiempo real a una fracción del costo actual de auditoría. Para la marca B2C, esto significa reducir el costo operativo de cumplimiento de sostenibilidad en más de un 50% y contar con una prueba digital interactiva que incrementa la confianza e intención de compra del consumidor final en el punto de venta.

### Criterio de pertinencia

> Justificación de por qué el caso requiere un registro distribuido y no una base de datos tradicional o una integración entre sistemas existentes. Debe apoyarse en al menos uno de los criterios de la Sesión 1: varias partes que no confían entre sí necesitan compartir un mismo registro, el histórico no puede alterarse, o se elimina un intermediario que hoy concentra la confianza. Extensión: 150–300 palabras.

El uso de un registro distribuido (blockchain) es estrictamente indispensable para TrazabiliChain porque la arquitectura de datos tradicional (como un servidor cloud centralizado o APIs integradas entre ERPs) falla ante tres dilemas estructurales de la cadena de suministro:

Múltiples partes sin relación de confianza que requieren un estado compartido: La cadena involucra cooperativas agrícolas, empresas de transporte, aduanas, certificadoras independientes y marcas finales. Ningún actor aceptaría que un competidor o un tercero privado administre la base de datos centralizada, debido al riesgo de monopolización de información, manipulación de registros o sesgo comercial. Un libro mayor distribuido descentraliza la gobernanza del dato, permitiendo que todos compartan una única versión de la verdad sin ceder el control a una entidad central.

Inmutabilidad estricta del historial de datos: En bases de datos relacionales tradicionales, cualquier usuario con permisos de administrador (sysadmin) o una clave comprometida puede modificar, borrar o alterar registros históricos de forma retroactiva. Para combatir el greenwashing, se requiere garantismo criptográfico: una vez que un certificado de huella de carbono o una medición de lote se estampa en la cadena, el registro se vuelve inmutable y matemáticamente imborrable. Esto evita que los datos de origen sean "inflados" o reutilizados a mitad de camino.

Eliminación del intermediario que concentra la confianza: Actualmente, la validez del impacto recae en auditorías manuales y certificadoras que actúan como cuellos de botella costosos y vulnerables a la corrupción. La red distribuida permite ejecutar lógica de negocio programable (smart contracts) que verifican automáticamente si las condiciones del lote cumplen los estándares ecológicos, eliminando la necesidad de confiar en un tercero intermediario para validar cada transacción.

### Supuestos y riesgos

> Dos o tres supuestos que tendrían que ser ciertos para que la hipótesis funcione, y qué podría invalidarla. Extensión: 150–300 palabras.

Para que la propuesta de valor de TrazabiliChain sea viable en el mercado, deben cumplirse tres supuestos fundamentales:

Adopción en el "primer kilómetro": Se asume que los productores primarios o acopiadores rurales poseen acceso mínimo a infraestructura tecnológica (conectividad intermitente o dispositivos móviles básicos) para registrar la cosecha y digitalizar el lote en el origen.

Disposición a pagar por transparencia irrefutable: Se asume que las marcas B2C y los consumidores finales valoran la prueba criptográfica de sostenibilidad lo suficiente como para justificar el costo de integración de la solución y pagar una prima por productos auditables.

Integración fluida con la emisión de certificaciones: Se asume que los organismos certificadores aceptarán firmar digitalmente o tokenizar sus credenciales de impacto para interactuar directamente con la plataforma.

Riesgos que invalidan la hipótesis:

El Problema del Oráculo: El mayor riesgo criptoeconómico es la discrepancia entre el mundo físico y el registro digital. Si un actor malintencionado adjunta el hash de un lote orgánico verificado a un saco de café convencional no certificado, la blockchain registrará una mentira de forma inmutable. La hipótesis quedaría invalidada si no se implementan salvaguardas en el mundo físico (como precintos IoT criptográficos, pruebas de ubicación geográfica o incentivos de reputación cruzada).

Falta de incentivos económicos en los eslabones intermedios: Si los transportistas u operadores logísticos perciben el registro de eventos en cadena como un proceso burocrático adicional sin un beneficio directo para sus márgenes, omitirán el escaneo de datos, rompiendo la continuidad de la trazabilidad.
