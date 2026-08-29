import type {
  Choice,
  ConfirmationRequest,
  InputRequest,
  PromptAdapter,
  SelectionRequest,
} from '../../src/cli/prompt-adapter.js';

export class ScriptedPrompt implements PromptAdapter {
  private readonly responses: unknown[];
  readonly requests: Array<SelectionRequest<unknown> | InputRequest | ConfirmationRequest> = [];

  constructor(responses: unknown[]) {
    this.responses = [...responses];
  }

  async select<T>(message: string, choices: Choice<T>[]): Promise<T> {
    this.requests.push({ kind: 'select', message, choices });
    return this.next<T>();
  }

  async input(message: string): Promise<string> {
    this.requests.push({ kind: 'input', message });
    return this.next<string>();
  }

  async confirm(message: string, defaultValue = false): Promise<boolean> {
    this.requests.push({ kind: 'confirm', message, defaultValue });
    return this.next<boolean>();
  }

  private next<T>(): T {
    if (this.responses.length === 0) throw new Error('No scripted prompt response remains.');
    return this.responses.shift() as T;
  }
}
