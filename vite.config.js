import { defineConfig } from 'vite';
export default defineConfig({
  // Automatic JSX keeps component files focused on their explicit dependencies.
  esbuild: { jsx: 'automatic' },
});
