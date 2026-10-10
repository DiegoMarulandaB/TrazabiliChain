# Soroban Project

## Next.js frontend

Install dependencies and start the frontend from this directory:

```sh
pnpm install
pnpm dev
```

Run the project checks with `pnpm lint`, `pnpm typecheck`, and `pnpm format:check`.
The generated TypeScript bindings are in `packages/hello_world` and can be built with
`pnpm --filter hello_world build`.

## Project Structure

This repository uses the recommended structure for a Soroban project:

```text
.
├── contracts
│   └── hello_world
│       ├── src
│       │   ├── lib.rs
│       │   └── test.rs
│       └── Cargo.toml
├── packages
│   └── hello_world
├── src
│   └── app
├── Cargo.toml
├── package.json
├── pnpm-workspace.yaml
├── AGENTS.md
└── README.md
```

- New Soroban contracts can be put in `contracts`, each in their own directory. There is already a `hello_world` contract in there to get you started.
- If you initialized this project with any other example contracts via `--with-example`, those contracts will be in the `contracts` directory as well.
- Contracts should have their own `Cargo.toml` files that rely on the top-level `Cargo.toml` workspace for their dependencies.
- Frontend libraries can be added to the top-level directory as well. If you initialized this project with a frontend template via `--frontend-template` you will have those files already included.
