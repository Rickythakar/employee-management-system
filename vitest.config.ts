import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        'test/**',
        'src/cli.ts',
        'src/cli/inquirer-prompt.ts',
        'src/cli/output-adapter.ts',
        'src/infrastructure/**',
      ],
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      thresholds: {
        branches: 80,
        functions: 85,
        lines: 85,
        statements: 85,
      },
    },
    environment: 'node',
    globals: true,
    restoreMocks: true,
  },
});
