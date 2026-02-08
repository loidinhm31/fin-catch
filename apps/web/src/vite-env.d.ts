/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_QM_CENTER_SERVER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "@fin-catch/ui/styles";
