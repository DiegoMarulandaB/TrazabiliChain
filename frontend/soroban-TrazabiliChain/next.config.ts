import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : undefined;
const supabaseRealtimeOrigin = supabaseOrigin?.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
const sorobanRpcOrigin = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL
  ? new URL(process.env.NEXT_PUBLIC_SOROBAN_RPC_URL).origin
  : "https://soroban-testnet.stellar.org";
const connectSources = [
  "'self'",
  sorobanRpcOrigin,
  "https://api.web3modal.org",
  "https://explorer-api.walletconnect.com",
  "https://pulse.walletconnect.com",
  "https://relay.walletconnect.com",
  "https://rpc.walletconnect.com",
  "wss://relay.walletconnect.com",
  ...(supabaseOrigin ? [supabaseOrigin] : []),
  ...(supabaseRealtimeOrigin ? [supabaseRealtimeOrigin] : []),
  ...(!isProduction ? ["ws:", "wss:"] : []),
].join(" ");
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://stellar.creit.tech",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src ${connectSources}`,
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), browsing-topics=()",
  },
  ...(isProduction ? [{ key: "Strict-Transport-Security", value: "max-age=63072000" }] : []),
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
