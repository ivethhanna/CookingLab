import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@shared/types': path.resolve(__dirname, '../shared/types.ts'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 3000,
  },
});
