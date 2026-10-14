import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const connectSources = [
  "'self'",
  "https://soroban-testnet.stellar.org",
  "https://api.web3modal.org",
  "https://explorer-api.walletconnect.com",
  "https://pulse.walletconnect.com",
  "https://relay.walletconnect.com",
  "https://rpc.walletconnect.com",
  "wss://relay.walletconnect.com",
  ...(!isProduction ? ["ws:", "wss:"] : []),
].join(" ");
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://stellar.creit.tech",
  "font-src 'self' data:",
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
