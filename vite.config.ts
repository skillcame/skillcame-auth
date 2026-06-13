import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react({
        jsxRuntime: 'automatic',
        jsxImportSource: 'react',
      })
    ],
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: 'all',
      hmr: process.env.DISABLE_HMR === 'true' ? false : {},
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        usePolling: false,
        ignored: ['**/node_modules/**', '**/.git/**']
      }
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-router-dom',
        'framer-motion',
        'react-intersection-observer',
        'gsap',
        'lucide-react',
        'firebase/app',
        'firebase/auth',
        'firebase/database',
        'firebase/storage',
        'firebase/messaging',
      ],
      esbuildOptions: {
        target: 'es2020',
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      minify: 'esbuild',
      commonjsOptions: {
        include: [/firebase/, /node_modules/],
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['lucide-react', 'recharts', 'framer-motion'],
            'animation-vendor': ['gsap', 'react-intersection-observer'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    }
  };
});

