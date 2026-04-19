declare module '*?raw' {
  const content: string
  export default content
}

interface ImportMetaEnv {
  readonly VITE_QUOTA_MONITOR_MOCK_VIEW?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
