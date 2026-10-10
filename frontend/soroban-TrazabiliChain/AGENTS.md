# Agent instructions

This is a Stellar smart-contract workspace (Soroban). Each contract is a workspace member under `contracts/<name>/`.

## Layout

- `Cargo.toml` — workspace root; contract crates inherit `soroban-sdk` from here
- `contracts/<name>/src/lib.rs` — contract implementation (`#![no_std]`)
- `contracts/<name>/src/test.rs` — host-side unit tests

## Build

From the workspace root:

```sh
stellar contract build
```

That compiles every `cdylib` member to WASM. Artifacts land in `target/wasm32v1-none/release/*.wasm`. Build one crate with `stellar contract build --package <name>`.

Do not substitute this with `cargo build --target wasm32v1-none`. `stellar contract build` applies the flags and metadata the network expects.

The `wasm32v1-none` Rust target must be installed (`rustup target add wasm32v1-none`). Rust 1.84 or newer is required for that target. Rust 1.82 and 1.83 cannot build contracts.

## Test

Host tests run with the normal Cargo test harness (not on-chain):

```sh
cargo test
```

A single crate: `cargo test -p <name>`.

## Deploy and invoke

On testnet, after a successful build:

```sh
stellar contract deploy \
  --wasm target/wasm32v1-none/release/<name>.wasm \
  --source-account <identity> \
  --network testnet \
  --alias <alias>

stellar contract invoke \
  --id <alias> \
  --network testnet \
  --source-account <identity> \
  -- hello --to world
```

The sample `hello_world` contract exposes `hello(to: String) -> Vec<String>`. Replace that with your own functions; `stellar contract invoke --id <id> -- -h` prints the generated CLI for the deployed contract.

## Further reading

- https://developers.stellar.org/docs/build/smart-contracts/overview
- https://github.com/stellar/soroban-examples

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
