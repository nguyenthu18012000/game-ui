interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_WEBSOCKET_SERVER_URL?: string;
  readonly VITE_SOCKET_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
