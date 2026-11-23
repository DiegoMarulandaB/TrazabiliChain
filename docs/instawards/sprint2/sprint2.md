# Sprint 2 — Despliegue en Stellar Testnet y conexión del entorno de prueba

## Revisión previa

Para este sprint2 se revisaron:

- [sprint1.md](../sprint1/sprint1.md), con el detalle de revisión del contrato local, compilación, despliegue y validaciones on-chain.
- [MVPFunctional.md](../../semana4/MVPFunctional.md#evidencia), específicamente la sección **Evidencia**, que consolida el contrato vigente, las transacciones verificables, el enlace público del producto y el estado de la iteración.

## Objetivo del sprint2

1. Desplegar la versión aprobada del contrato en Stellar Testnet.
2. Guardar el ID del contrato, las transacciones y la configuración requerida.
3. Conectar un entorno de prueba del MVP al contrato desplegado en Testnet.

**Resultado esperado:** contrato actualizado desplegado y aplicación de prueba apuntando a Testnet.

## Contrato desplegado en Testnet

- **Red:** Stellar Testnet.
- **Contrato vigente:** `CDQ3KMIYUH76AVRII2CCR2CEXYRRL5HYAWSMB4VRZ6ZFHYGFU2NFDM5T`.
- **Explorador:** [CDQ3KMIYUH76AVRII2CCR2CEXYRRL5HYAWSMB4VRZ6ZFHYGFU2NFDM5T](https://stellar.expert/explorer/testnet/contract/CDQ3KMIYUH76AVRII2CCR2CEXYRRL5HYAWSMB4VRZ6ZFHYGFU2NFDM5T).
- **Cuenta administradora:** identidad local `alice`, `GATUSNRO74TQOYAVPNBPANK7RYGAVBJ4HBN65HN3BBK7RYRSE5TR5QBX`.
- **WASM desplegado:** `frontend/soroban-TrazabiliChain/target/wasm32v1-none/release/traceability_registry.wasm`.
- **Tamaño optimizado:** `3439 bytes`.
- **SHA-256 del WASM (local/desplegado):** `554eca407534c5ae22e0fd9c6bae59b977aa67d705037618d9a485f63febb253`.
- **Interfaz del contrato:** `__constructor`, `record_event`, `event_count`, `event_hash`, `authorize_actor`, `revoke_actor`.

### Contrato anterior (referencia comparativa)

- **Contrato anterior:** `CBOJPR4LUMXN3YMO5QAM76XPIMYHFL23OYBGB5HHYSS45WCIXREQETNZ`.
- **SHA-256 del WASM obtenido:** `dce43fd12375dc01cf858563c1130410e33d107601b3099e13e6b202a49598bb`.
- La diferencia de huellas documenta que el contrato vigente corresponde al WASM aprobado/local desplegado en esta iteración.

## Transacciones verificables

- **Instalación/upload del WASM:** [682fd8c7ceff9b58a711f91810af66d2523ad91c34f573f10d9b496816cf164f](https://stellar.expert/explorer/testnet/tx/682fd8c7ceff9b58a711f91810af66d2523ad91c34f573f10d9b496816cf164f).
- **Despliegue/instancia del contrato:** [bde712df97e911231cfad2c4b2e680cccc6c3cec9c821b55d82f6cc8ffbd495c](https://stellar.expert/explorer/testnet/tx/bde712df97e911231cfad2c4b2e680cccc6c3cec9c821b55d82f6cc8ffbd495c).

Evidencia adicional de flujo de autorización y registro on-chain (cuenta temporal de prueba, eliminada tras completar las pruebas), documentada en [sprint1.md](../sprint1/sprint1.md#revisión-del-flujo-de-autorización):

- Autorización temporal: [2a76c647320272af313b6f838980037f273253db7c83cd1efe96ac95f1858695](https://stellar.expert/explorer/testnet/tx/2a76c647320272af313b6f838980037f273253db7c83cd1efe96ac95f1858695).
- Registro de prueba: [dd1f332e4aa058672afb7f010238a9385928a66dc901e1735d6bfce48f9ec613](https://stellar.expert/explorer/testnet/tx/dd1f332e4aa058672afb7f010238a9385928a66dc901e1735d6bfce48f9ec613).
- Revocación temporal: [96060b1596a03dd33331d314c2bd9962224de00e1740c0a44f69e51fd2477ec5](https://stellar.expert/explorer/testnet/tx/96060b1596a03dd33331d314c2bd9962224de00e1740c0a44f69e51fd2477ec5).

## Configuración requerida

La aplicación frontend de trazabilidad (`frontend/soroban-TrazabiliChain`) requiere la siguiente configuración para apuntar al contrato desplegado en Testnet:

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_TRACEABILITY_CONTRACT_ID=CDQ3KMIYUH76AVRII2CCR2CEXYRRL5HYAWSMB4VRZ6ZFHYGFU2NFDM5T
```

- `NEXT_PUBLIC_TRACEABILITY_CONTRACT_ID` debe contener el ID del contrato desplegado en la red configurada (no reutilizar IDs entre Testnet/Mainnet).
- `NEXT_PUBLIC_STELLAR_NETWORK` y `NEXT_PUBLIC_SOROBAN_RPC_URL` deben corresponder a la misma red del contrato.
- La configuración está reflejada en `.env.example` y `.env.local` del frontend; las credenciales secretas de servidor no deben exponerse con prefijo `NEXT_PUBLIC_`.
- El cliente de lectura/escritura usa estas variables (`src/lib/stellar/read.ts`, `src/lib/stellar/write.ts`) y falla de forma controlada si falta el contrato configurado.

## Conexión del entorno de prueba del MVP

- **Entorno público de prueba/despliegue:** [https://trazabilichain.vercel.app/](https://trazabilichain.vercel.app/).
- **Red objetivo:** Stellar Testnet, con RPC `https://soroban-testnet.stellar.org`.
- **Contrato apuntado por la aplicación:** `CDQ3KMIYUH76AVRII2CCR2CEXYRRL5HYAWSMB4VRZ6ZFHYGFU2NFDM5T`.
- **Alcance de conexión:** la interfaz prepara, solicita firma y envía operaciones de trazabilidad contra el contrato configurado en Testnet; la wallet debe coincidir con la passphrase/red esperada para permitir la firma.
- **Nota:** la transacción de anclaje de esta iteración específica se documenta como pendiente de generar/enlazar desde una wallet autorizada en [MVPFunctional.md](../../semana4/MVPFunctional.md#evidencia); el contrato y la configuración de la aplicación ya apuntan a Testnet.

## Lista de verificación

- [x] Sprint 1 y sección **Evidencia** de MVPFunctional revisados.
- [x] Versión aprobada del contrato desplegada en Stellar Testnet.
- [x] ID del contrato registrado y verificable en el explorador.
- [x] Transacciones de instalación y despliegue registradas.
- [x] Configuración requerida documentada y aplicada en el frontend (`NEXT_PUBLIC_STELLAR_NETWORK`, `NEXT_PUBLIC_SOROBAN_RPC_URL`, `NEXT_PUBLIC_TRACEABILITY_CONTRACT_ID`).
- [x] Entorno de prueba del MVP conectado/apuntando a Testnet con el contrato actualizado.
- [x] Evidencia funcional y técnica consolidada en [sprint1.md](../sprint1/sprint1.md) y [MVPFunctional.md](../../semana4/MVPFunctional.md#evidencia).
