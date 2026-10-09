import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { handleIntegrationApi } from './server/apiRouter';

function integrationApiPlugin(): Plugin {
  return {
    name: 'funnel-labs-integration-api',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        next();
      });

      server.middlewares.use(async (req, res, next) => {
        if (req.url && (req.url.startsWith('/api/integrations') || req.url.startsWith('/api/experiments'))) {
          try {
            const handled = await handleIntegrationApi(req, res);
            if (handled) return;
          } catch (err) {
            console.error('Error handling integration API route:', err);
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), integrationApiPlugin()],
    server: {
      port: 5173,
      host: true,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-charts': ['recharts'],
            'vendor-icons': ['lucide-react'],
            'vendor-supabase': ['@supabase/supabase-js'],
          },
        },
      },
    },
  };
});
