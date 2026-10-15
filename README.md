# TrazabiliChain

## Requisitos

- Node.js 20.9 o superior y Corepack.
- pnpm 8.15.9, administrado por Corepack.
- Proyecto Supabase con la migración `supabase/migrations/202610150001_traceability_lots.sql` aplicada y autenticación Email/OTP habilitada.

## Instalación

```sh
cd frontend/soroban-TrazabiliChain
corepack pnpm install
cp .env.example .env.local
```

Configura `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `NEXT_PUBLIC_SITE_URL` en `.env.local`. No uses una clave `service_role` en el frontend.

## Cómo correrlo

```sh
corepack pnpm dev
```

Abre `http://localhost:3000`.

## Estructura

```text
TrazabiliChain/
├── docs/
│   ├── semana1/                 # Problem Brief
│   ├── semana2/                 # Product Blueprint
│   ├── semana3/                 # Functional Proof
│   └── semana4/                 # MVP funcional
├── frontend/soroban-TrazabiliChain/
│   ├── contracts/               # Contratos Soroban
│   ├── packages/                # Clientes TypeScript
│   ├── src/                     # Aplicación Next.js
│   └── package.json
├── supabase/migrations/         # Esquema y políticas RLS
└── README.md
```
