import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // In production the API base URL is provided via VITE_API_BASE env variable.
});
