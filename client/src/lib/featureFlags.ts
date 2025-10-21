// Centralized feature flags for the client (Vite)
// Usage:
//   import { isProd, enableProdWidget } from "@/lib/featureFlags";
//   if (enableProdWidget) { /* render prod-only UI */ }
//
// Define values per-environment using .env files (client-side only):
//   .env.development -> VITE_ENABLE_PROD_WIDGET=false
//   .env.production  -> VITE_ENABLE_PROD_WIDGET=true
//
// Note: Only variables prefixed with VITE_ are exposed to the client bundle.

export const isDev = import.meta.env.DEV;
export const isProd = import.meta.env.PROD;

// Example flags
export const enableProdWidget = isProd && import.meta.env.VITE_ENABLE_PROD_WIDGET === "true";
export const enableDebugTools = isDev && import.meta.env.VITE_ENABLE_DEBUG_TOOLS !== "false";
