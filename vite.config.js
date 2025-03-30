import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Set the port to 5174
    strictPort: true, // Prevent Vite from switching to another port if 5174 is in use
  },
});