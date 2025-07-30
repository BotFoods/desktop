import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Importante para o Electron poder carregar assets relativos
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
        404: './public/404.html'
      }
    },
    // Garante que o build inclui source maps para facilitar depuração
    sourcemap: true
  },
  // Define variáveis de ambiente disponíveis durante o build
  define: {
    'process.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version)
  }
});

