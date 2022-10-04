import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  root: 'ui',
  plugins: [solidPlugin({ hot: false })],
});
