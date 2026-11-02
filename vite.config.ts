import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
const requested = process.env.VITE_BASE_PATH ?? (repo && !repo.endsWith('.github.io') ? repo : '');
const base = `/${requested.replace(/^\/+|\/+$/g, '')}${requested.replace(/^\/+|\/+$/g, '') ? '/' : ''}`;
export default defineConfig({ base, plugins: [react()], test: { exclude: ['tests/e2e/**', '**/node_modules/**'] } });
