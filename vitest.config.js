import { defineConfig } from 'vitest/config';

// Solo pruebas unitarias; los flujos e2e los ejecuta Playwright (e2e/)
export default defineConfig({ test: { include: ['tests/**/*.test.js'] } });
