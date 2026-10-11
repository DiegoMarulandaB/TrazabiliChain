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

### Records dashboard authentication

The `/registros` route uses Supabase Auth for email/password accounts and a six-digit email code
after registration and password validation at sign-in. Set `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. In Supabase, enable email confirmation and
configure both the **Confirm signup** and **Magic Link** email templates to display `{{ .Token }}`.
The project URL must allow the local and deployed app URLs.

Lot records and evidence are still stored in the browser's local storage; Supabase currently
authenticates accounts but does not provide shared or server-protected lot storage. The OTP
sequence gates this client-side demo; it is not a substitute for server-side authorization, RLS,
or a second-factor flow enforced by protected application APIs.

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
