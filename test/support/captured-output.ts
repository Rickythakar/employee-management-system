import type { OutputAdapter } from '../../src/cli/output-adapter.js';

export class CapturedOutput implements OutputAdapter {
  readonly messages: string[] = [];
  readonly errors: string[] = [];
  readonly tables: Array<Record<string, unknown>[]> = [];

  log(message: string): void {
    this.messages.push(message);
  }

  error(message: string): void {
    this.errors.push(message);
  }

  table(rows: Array<Record<string, unknown>>): void {
    this.tables.push(rows);
  }
}
