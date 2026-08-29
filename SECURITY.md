# Security Policy

## Supported versions

Security fixes are applied to the latest `2.x` release line. The original `1.x` bootcamp implementation is retired and unsupported.

## Reporting a vulnerability

Do not open a public issue for suspected vulnerabilities or exposed credentials. Use [GitHub's private vulnerability reporting form](https://github.com/Rickythakar/employee-management-system/security/advisories/new) and include:

- the affected command or component;
- reproduction steps or a proof of concept;
- expected and observed impact;
- any safe mitigation already identified.

You should receive an acknowledgement within five business days. Confirmed issues will be triaged, fixed on a private branch, and disclosed after a patched release is available.

## Security assumptions

- Operators control access to the terminal and database account.
- The configured MySQL user receives only the privileges required for this database.
- `.env` files, database dumps, and real employee data are never committed.
- Demonstration names and compensation data are fictional examples.

See [the operations guide](docs/operations.md) for credential rotation, backups, and incident response.
