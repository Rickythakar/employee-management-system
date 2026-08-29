# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and releases use semantic versioning.

## [Unreleased]

## [2.0.0] - 2026-08-29

### Added

- Complete interactive department, role, employee, reporting-line, deletion, budget, and summary workflows.
- Strict TypeScript service and repository architecture.
- Versioned MySQL migrations, deterministic seeds, advisory locking, and checksum verification.
- Real-MySQL integration tests and high-coverage unit tests.
- Containerized development and runtime environments.
- CI, CodeQL, Dependabot, dependency auditing, smoke checks, and repository health documentation.

### Changed

- Rebuilt the project around Node.js 22, pnpm, current MySQL, and secure environment configuration.
- Stored compensation as integer cents and enforced relational constraints.

### Removed

- Hard-coded root credentials, vulnerable legacy dependencies, incomplete menu actions, invalid SQL, and duplicate bootcamp documentation.
