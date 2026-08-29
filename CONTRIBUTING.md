# Contributing

Thanks for improving Workforce Operations Console.

## Development setup

1. Install Node.js 22 and pnpm 11.
2. Copy `.env.example` to `.env` and replace the example password.
3. Start MySQL with `docker compose up -d db`.
4. Install dependencies with `pnpm install --frozen-lockfile`.
5. Run `pnpm db:migrate` and `pnpm db:seed`.
6. Verify the checkout with `pnpm check` and `pnpm smoke`.

## Change workflow

1. Open an issue for significant behavior or schema changes.
2. Create a focused branch from `main`.
3. Write a failing test before changing behavior.
4. Make the smallest implementation that passes, then refactor with tests green.
5. Add a new migration instead of editing an applied migration.
6. Run the full local verification appropriate to the change.
7. Open a pull request with operator-facing evidence.

Use focused conventional commits such as `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, and `ops:`. Do not add empty commits or split one inseparable change only to inflate activity.

## Quality gates

Before requesting review, run:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm coverage
pnpm build
pnpm audit --prod --audit-level high
```

Changes to the MySQL adapter or migrations must also pass `RUN_INTEGRATION_TESTS=true pnpm test:integration` against MySQL 8.4.

## Pull requests

Explain the outcome, database impact, rollback path, and proof. Keep generated output, credentials, personal data, and unrelated formatting out of the diff.
