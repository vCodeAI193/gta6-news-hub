/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANALYTICS_DOMAIN?: string
  readonly VITE_ANALYTICS_ENDPOINT?: string
  readonly VITE_SENTRY_DSN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
