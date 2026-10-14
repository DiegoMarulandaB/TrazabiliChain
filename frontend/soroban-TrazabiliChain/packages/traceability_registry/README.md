# TrazabiliChain Traceability Registry Client

TypeScript bindings for `contracts/traceability-registry`, generated from the Soroban contract spec. The frontend imports this package as `@trazabilichain/traceability-registry` through the pnpm workspace.

## Regenerate

From `frontend/soroban-TrazabiliChain`, build the contract and regenerate the bindings:

```bash
stellar contract build --package traceability-registry
stellar contract bindings typescript \
  --wasm target/wasm32v1-none/release/traceability_registry.wasm \
  --output-dir packages/traceability_registry \
  --overwrite
corepack pnpm install
corepack pnpm typecheck
```

After generation, preserve this workspace package name, `rootDir` in `tsconfig.json`, and the TypeScript 6 dev dependency. Set `NEXT_PUBLIC_TRACEABILITY_CONTRACT_ID` to the deployed Testnet contract ID; never put a signing secret in this package.

## Client use

The app imports the generated `Client` class. Read methods simulate and decode a result; write methods build an invocation that is explicitly simulated, reviewed for estimated fees, signed by Stellar Wallets Kit, and submitted through Soroban RPC.

```ts
import { Networks } from "@stellar/stellar-sdk";
import { Client } from "@trazabilichain/traceability-registry";

const contractId = process.env.NEXT_PUBLIC_TRACEABILITY_CONTRACT_ID;
if (!contractId) {
  throw new Error("Missing traceability contract ID");
}

const registry = new Client({
  contractId,
  networkPassphrase: Networks.TESTNET,
  rpcUrl: "https://soroban-testnet.stellar.org",
});
const count = await registry.event_count({ lot_id: "lot-uuid" });
```
