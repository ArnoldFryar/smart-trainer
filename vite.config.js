import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  root: 'ui',
  plugins: [
    basicSsl(),
    solidPlugin({ hot: false })
  ],
});
