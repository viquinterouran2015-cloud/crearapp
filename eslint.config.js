import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'dev-dist/**', 'node_modules/**', 'public/**'] },
  js.configs.recommended,
  { files: ['src/**/*.js'], languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.browser, __APP_VERSION__: 'readonly' } } },
  { files: ['e2e/**/*.js'], languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.node, ...globals.browser } } },
  { files: ['scripts/**/*.mjs', 'tests/**/*.js', 'vite.config.js', 'eslint.config.js', 'playwright.config.js'], languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: globals.node } },
  { rules: { 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }] } }
];
