export interface OutputAdapter {
  log(message: string): void;
  error(message: string): void;
  table(rows: Array<Record<string, unknown>>): void;
}

export class ConsoleOutput implements OutputAdapter {
  log(message: string): void {
    console.log(message);
  }

  error(message: string): void {
    console.error(message);
  }

  table(rows: Array<Record<string, unknown>>): void {
    console.table(rows);
  }
}
