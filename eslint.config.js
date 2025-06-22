import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

const rules = {
  '@typescript-eslint/naming-convention': 'warn',
  '@/semi': ['warn', 'always'],
  'curly': 'warn',
  'eqeqeq': 'warn',
  'no-throw-literal': 'warn',
  'no-unused-vars': ['error', { varsIgnorePattern: '^_' }],
  'semi': 'off',
};

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
  },
  {
    files: ['src/test/**/*.ts'],
    rules,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        suite: 'readonly',
        test: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
  },
  {
    ignores: [
      'out/**',
      'dist/**',
      '**/*.d.ts',
      'node_modules/**',
      '*.js',
      '*.mjs',
    ],
  },
];
