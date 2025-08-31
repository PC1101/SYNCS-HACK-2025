// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Only set when you’re tunneling (e.g. mytunnel.trycloudflare.com or abcdef.ngrok-free.app)
const TUNNEL_HOST = process.env.VITE_TUNNEL_HOST;

export default defineConfig({
    plugins: [react()],
    server: {
        host: true,        // allow external access (needed for tunnels)
        port: 5173,
        strictPort: true,  // avoid port drift (prevents 502 with tunnels)
        proxy: {
            // forward API calls to your Express server (server/index.ts listening on 8787)
            '/api': 'http://localhost:8787',
        },
        // Fix HMR over HTTPS tunnels
        hmr: TUNNEL_HOST
            ? { host: TUNNEL_HOST, protocol: 'wss', clientPort: 443 }
            : true,
    },
    preview: {
        host: true,
        port: 4173,
        strictPort: true,
    },
    optimizeDeps: {
        exclude: ['lucide-react'],
    },
});
