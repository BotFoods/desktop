import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // Importante para o Electron poder carregar assets relativos
  
  // Cache de dependências
  cacheDir: '.vite',
  
  // Otimizações para desenvolvimento
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    // Pre-transform de dependências comuns
    warmup: {
      clientFiles: [
        './src/main.jsx',
        './src/App.jsx',
        './src/pages/**/*.jsx',
        './src/components/**/*.jsx',
      ]
    }
  },
  
  // Otimizações de dependências
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'lodash',
      '@stripe/stripe-js',
      '@stripe/react-stripe-js',
      '@hello-pangea/dnd'
    ]
  },
  
  // Resolver aliases para imports mais rápidos
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@assets': path.resolve(__dirname, './src/assets')
    }
  },
  
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
        404: './public/404.html'
      }
    },
    // Garante que o build inclui source maps para facilitar depuração
    sourcemap: true,
    // Chunk size warnings apenas em produção
    chunkSizeWarningLimit: 1000
  },
  
  // Define variáveis de ambiente disponíveis durante o build
  define: {
    'process.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version)
  }
});

