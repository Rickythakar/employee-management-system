# ADR 001: Service and repository boundary

- **Status:** Accepted
- **Date:** 2026-08-29

## Context

The original implementation mixed prompts, validation, SQL, output, connection ownership, and process exit behavior in one file. That structure made business rules difficult to test and allowed incomplete commands to leave the operator in an unknown state.

## Decision

MySQL owns persisted workforce truth and relational integrity. `WorkforceService` owns normalization, validation, dependency checks, and reporting-line rules. `WorkforceRepository` defines the only boundary between the two. Prompt and output adapters isolate the interactive terminal.

The production adapter uses parameterized MySQL queries. Unit tests use an in-memory repository fake to prove domain behavior without I/O; integration tests run the same service against MySQL to prove the contract.

## Consequences

- Business behavior is fast and deterministic to test.
- CLI changes cannot silently alter SQL behavior.
- Persistence changes must satisfy the repository contract and integration test.
- Some service checks are duplicated by database constraints intentionally: operators receive useful messages while MySQL remains the final integrity guard.
- A future web or API interface may reuse the service, but no second persistence path should be introduced.
