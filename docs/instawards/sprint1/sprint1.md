# Sprint 1 — Contrato actualizado en Stellar Testnet

## Alcance documentado

Este entregable cubre el primer punto del Sprint 1:

1. Revisar el contrato local y la instancia desplegada.
2. Confirmar compilación y huella SHA-256 del WASM.
3. Preparar y ejecutar el despliegue en Stellar Testnet con aprobación.
4. Registrar el ID del contrato y las transacciones verificables.
5. Validar el flujo de administración y autorización.

La evidencia técnica completa y el contexto del MVP están vinculados en [MVPFunctional.md](../../semana4/MVPFunctional.md)

## Estado final

- Red: Stellar Testnet.
- Contrato vigente configurado en la aplicación: `CDQ3KMIYUH76AVRII2CCR2CEXYRRL5HYAWSMB4VRZ6ZFHYGFU2NFDM5T`.
- Cuenta administradora: identidad local `alice`, `GATUSNRO74TQOYAVPNBPANK7RYGAVBJ4HBN65HN3BBK7RYRSE5TR5QBX`.
- WASM desplegado: SHA-256 `554eca407534c5ae22e0fd9c6bae59b977aa67d705037618d9a485f63febb253`.
- Explorador del contrato: [CDQ3KMIYUH76AVRII2CCR2CEXYRRL5HYAWSMB4VRZ6ZFHYGFU2NFDM5T](https://stellar.expert/explorer/testnet/contract/CDQ3KMIYUH76AVRII2CCR2CEXYRRL5HYAWSMB4VRZ6ZFHYGFU2NFDM5T).
- Configuración: `NEXT_PUBLIC_TRACEABILITY_CONTRACT_ID` actualizado en `.env.local` y `.env.example`.

El contrato anterior era `CBOJPR4LUMXN3YMO5QAM76XPIMYHFL23OYBGB5HHYSS45WCIXREQETNZ`. Su WASM obtenido tenía SHA-256 `dce43fd12375dc01cf858563c1130410e33d107601b3099e13e6b202a49598bb`. Esta diferencia queda documentada como comparación verificable de bytecode: el nuevo contrato usa el WASM local con SHA-256 `554eca407534c5ae22e0fd9c6bae59b977aa67d705037618d9a485f63febb253`.

## Artefacto verificable

- Archivo local: `frontend/soroban-TrazabiliChain/target/wasm32v1-none/release/traceability_registry.wasm`.
- Tamaño optimizado: `3439 bytes`.
- SHA-256 local: `554eca407534c5ae22e0fd9c6bae59b977aa67d705037618d9a485f63febb253`.
- SHA-256 obtenido del contrato nuevo: `554eca407534c5ae22e0fd9c6bae59b977aa67d705037618d9a485f63febb253`.
- Resultado: los bytecodes coinciden.

## Validaciones ejecutadas

- `cargo test --package traceability-registry`: 3 pruebas aprobadas.
- `stellar contract build --package traceability-registry`: compilación reproducible completada.
- `pnpm typecheck`: validación de TypeScript aprobada.
- Interfaz del contrato nuevo: comprobada.
- Funciones disponibles: `__constructor`, `record_event`, `event_count`, `event_hash`, `authorize_actor` y `revoke_actor`.

## Despliegue realizado

- Aprobación del responsable de la cuenta administradora: recibida.
- Transacción de instalación/upload: [682fd8c7ceff9b58a711f91810af66d2523ad91c34f573f10d9b496816cf164f](https://stellar.expert/explorer/testnet/tx/682fd8c7ceff9b58a711f91810af66d2523ad91c34f573f10d9b496816cf164f).
- Transacción de despliegue/instancia: [bde712df97e911231cfad2c4b2e680cccc6c3cec9c821b55d82f6cc8ffbd495c](https://stellar.expert/explorer/testnet/tx/bde712df97e911231cfad2c4b2e680cccc6c3cec9c821b55d82f6cc8ffbd495c).

## Revisión del flujo de autorización

Se creó una cuenta temporal en Testnet únicamente para las pruebas y fue eliminada después de completarlas:

- Cuenta temporal: `GDLW67Z6X4VRACIQLHUVJCKD5MAR4R5NGK6OSPTDLEF7XYX6B2H47Y7P`.
- Lote de prueba: `semana4-test-001`.
- Hash registrado: `1111111111111111111111111111111111111111111111111111111111111111`.
- Autorización temporal: [2a76c647320272af313b6f838980037f273253db7c83cd1efe96ac95f1858695](https://stellar.expert/explorer/testnet/tx/2a76c647320272af313b6f838980037f273253db7c83cd1efe96ac95f1858695).
- Registro de prueba: [dd1f332e4aa058672afb7f010238a9385928a66dc901e1735d6bfce48f9ec613](https://stellar.expert/explorer/testnet/tx/dd1f332e4aa058672afb7f010238a9385928a66dc901e1735d6bfce48f9ec613).
- Revocación temporal: [96060b1596a03dd33331d314c2bd9962224de00e1740c0a44f69e51fd2477ec5](https://stellar.expert/explorer/testnet/tx/96060b1596a03dd33331d314c2bd9962224de00e1740c0a44f69e51fd2477ec5).

Resultados comprobados:

- El conteo del lote quedó en `1`.
- El índice `0` devolvió el hash esperado.
- El actor autorizado pudo registrar el evento.
- Después de la revocación, el mismo actor recibió `HostError: Error(Contract, #1)` al intentar registrar otro evento.

## Lista de verificación del Sprint

- [x] Herramientas Stellar y Rust disponibles.
- [x] Red Testnet confirmada.
- [x] Contrato local revisado y compilado.
- [x] SHA-256 local registrado.
- [x] Cuenta administradora identificada.
- [x] Fondos suficientes revisados.
- [x] Diferencia con el contrato desplegado anterior comprobada.
- [x] Aprobación explícita del responsable obtenida.
- [x] WASM instalado en Testnet.
- [x] Instancia creada y administrada por `alice`.
- [x] Nuevo ID registrado.
- [x] Transacciones de instalación y despliegue registradas.
- [x] Prueba on-chain de autorización, registro, lectura y revocación completada.
- [x] `NEXT_PUBLIC_TRACEABILITY_CONTRACT_ID` actualizado.
- [x] Documentación vinculada con el MVP.

## Evidencia del MVP

El detalle funcional, el alcance de Stellar, las limitaciones de verificación y el estado del despliegue se mantienen en [MVPFunctional.md](../../semana4/MVPFunctional.md).
