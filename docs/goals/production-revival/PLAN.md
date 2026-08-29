# Employee Management System Production Revival Implementation Plan

**Intent:** Turn the incomplete 2022 bootcamp CLI into a secure, maintainable, production-ready employee operations tool that demonstrates reliable TypeScript, MySQL, testing, and delivery practices.
**Current Behavior:** A single untested CommonJS script connects with a hard-coded root password, contains incomplete commands, and depends on vulnerable packages. The SQL schema and seed files do not execute successfully.
**Expected Outcome:** A typed interactive CLI supports complete department, role, employee, reporting, and deletion workflows against a versioned relational schema, with safe configuration, automated tests, containers, CI, and operator documentation.
**Target-Perspective Output:** An operator can clone the repository, start MySQL, migrate and seed it, launch the CLI, complete the documented workflows, and receive clear validation and error messages.
**Truth Owner:** MySQL owns persisted workforce data; the TypeScript service layer owns domain validation and workflow rules.
**Contract Boundary:** `WorkforceRepository` is the contract between domain services and persistence. CLI prompts consume service-level view models and never issue SQL directly.
**Cutover:** `src/cli.ts` and the TypeScript application replace the root `index.js`; versioned migrations replace `db/schema.sql` and `db/seeds.sql`.
**Displaced Path:** Delete the obsolete monolithic script and invalid bootcamp SQL after equivalent tested behavior exists. Replace the misnamed and generated readmes with one canonical `README.md`.
**Value Density:** Preserve the useful employee-tracker concept while replacing every unsafe or incomplete execution path; avoid adding authentication, a web UI, or cloud infrastructure that the local operator tool does not need.
**Evidence Gate:** A clean checkout must pass formatting, linting, type checking, unit tests, integration tests, build, dependency audit, and a real MySQL smoke workflow.
**Acceptance Evidence:** Recorded commands and output prove migration, seed, summary reporting, employee creation/update/deletion, and clean shutdown against MySQL.
**Evidence Lane:** `docs/goals/production-revival/EVIDENCE.md` plus CI status on the merged pull request.
**Kill Criteria:** No hard-coded credentials, obsolete CommonJS entrypoint, duplicate schema path, incomplete menu action, placeholder documentation, or known high/critical production vulnerability remains.
**Architecture Slice:** Interactive CLI -> application service -> `WorkforceRepository` -> MySQL adapter -> versioned schema.
**Plan Review Gate:** Requires PRE review before execution.

## Architecture Map

### Files to create

- `src/` for configuration, domain types, service logic, repository contract, MySQL adapter, prompts, and entrypoint.
- `test/` for unit and integration coverage.
- `db/migrations/` and `db/seeds/` for versioned database lifecycle scripts.
- `scripts/` for migration, seed, health-check, and smoke-test commands.
- `.github/workflows/ci.yml`, `.github/dependabot.yml`, and repository health documents.
- `Dockerfile`, `compose.yaml`, `.env.example`, and tool configuration.

### Files to modify

- `package.json`, `package-lock.json`, `.gitignore`, and the canonical `README.md`.

### Files to avoid

- Git history rewriting and generated credentials.
- User-specific environment files.

### Source of truth

- MySQL tables and constraints own persisted data integrity.
- Domain validation in `WorkforceService` owns user-facing business rules.

### Read path

- CLI prompt -> service query -> repository -> joined database view -> formatted table.

### Write path

- CLI prompt -> validated service command -> repository transaction -> database constraints -> refreshed view.

### Integration points

- MySQL 8.4 through `mysql2`.
- Interactive terminal prompts through `@inquirer/prompts`.
- GitHub Actions with a MySQL service container.

### Migration and cutover

- Introduce the typed application alongside the old script.
- Prove feature parity and complete missing operations with tests.
- Delete the old script and invalid SQL in the same branch before release.

### Acceptance evidence gate

- Unit tests use an in-memory repository fake.
- Integration tests and smoke evidence use real MySQL.
- The production dependency audit reports no high or critical findings.

## Task Board

### 1. Establish the production foundation

- **Files:** `package.json`, lockfile, TypeScript/lint/format configs, `.env.example`, `src/config.ts`
- **Allowed scope:** Runtime versions, scripts, typed environment validation, safe defaults.
- **Expected output:** Reproducible Node 22 development and build workflow with no embedded secret.
- **Verification:** `npm run check`
- **Evidence:** Invalid configuration is rejected by a focused test.
- **Parallel safe:** No.

### 2. Define domain behavior with tests

- **Files:** `src/domain/`, `src/application/`, `test/unit/`
- **Allowed scope:** Departments, roles, employees, managers, budgets, validation, not-found and conflict handling.
- **Expected output:** Repository-independent business logic expressed through a stable contract.
- **Verification:** `npm run test:unit`
- **Evidence:** Tests cover success, invalid input, missing records, and destructive-operation safeguards.
- **Parallel safe:** No.

### 3. Build the MySQL lifecycle and adapter

- **Files:** `db/`, `scripts/`, `src/infrastructure/mysql/`, `test/integration/`
- **Allowed scope:** Schema, indexes, foreign keys, migrations, deterministic seed data, transactions, repository queries.
- **Expected output:** A fresh database can be created, migrated, seeded, queried, and safely mutated.
- **Verification:** `npm run test:integration`
- **Evidence:** Real-database integration tests pass against MySQL 8.4.
- **Parallel safe:** No.

### 4. Complete the operator CLI

- **Files:** `src/cli/`, `src/cli.ts`, CLI unit tests
- **Allowed scope:** Full menu, accessible prompts, tabular output, cancellation, error recovery, graceful shutdown.
- **Expected output:** Every advertised read/write/reporting action is reachable and returns to the menu safely.
- **Verification:** `npm test` and scripted smoke run.
- **Evidence:** A deterministic smoke command prints the seeded organization summary.
- **Parallel safe:** No.

### 5. Add production operations and documentation

- **Files:** Container files, GitHub workflows, health files, `README.md`, `SECURITY.md`, `CONTRIBUTING.md`, runbooks.
- **Allowed scope:** Local production parity, CI, dependency updates, backup/restore guidance, troubleshooting, architecture.
- **Expected output:** A new maintainer can operate and safely change the project without tribal knowledge.
- **Verification:** Container config validation, markdown/link inspection, full `npm run check`.
- **Evidence:** Clean-start instructions are exercised during the smoke gate.
- **Parallel safe:** No.

### 6. Cut over and verify

- **Files:** Delete obsolete paths; update `EVIDENCE.md`.
- **Allowed scope:** Remove duplicate implementation and record final proof.
- **Expected output:** Only the production path remains.
- **Verification:** Full clean-install and acceptance workflow.
- **Evidence:** Final command output and merged CI status.
- **Parallel safe:** No.

## Non-goals

- Browser UI, multi-tenant hosting, payroll processing, authentication, or HR compliance workflows.
- Storing sensitive employee attributes beyond names, reporting lines, roles, and compensation bands used by the demonstration data.
- Artificial commits without an independently reviewable purpose.

## Risk if wrong

- Incorrect foreign-key deletion behavior could lose organization data.
- Weak transaction boundaries could leave partial updates.
- Misleading setup documentation could make a passing development build unusable to another operator.

## PRE Review

- The MySQL database is the sole persistence owner; no JSON or duplicate storage path is introduced.
- The repository boundary prevents SQL from leaking into prompts and keeps unit tests fast.
- Destructive operations require explicit service methods and database constraints.
- The cutover explicitly deletes the vulnerable monolith and invalid SQL.
- The acceptance gate includes both isolated tests and real-database proof.
- No blocking ownership, contract, cutover, or evidence ambiguity remains.
