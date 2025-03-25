/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALPHA_VANTAGE_API_KEY: string;
  readonly VITE_OPENWEATHERMAP_API_KEY: string;
  readonly VITE_NEWS_API_KEY: string;
  readonly VITE_AIR_QUALITY_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 