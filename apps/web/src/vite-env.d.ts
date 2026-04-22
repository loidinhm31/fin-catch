/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GLEAN_OAK_SERVER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "@fin-catch/ui/styles";
