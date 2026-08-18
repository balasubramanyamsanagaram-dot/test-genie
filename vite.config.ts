import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4500,
    host: true,
    proxy: {
      '/jira-proxy': {
        target: 'https://brilyant-team-ouq206ed.atlassian.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/jira-proxy/, '')
      }
    }
  }
});
