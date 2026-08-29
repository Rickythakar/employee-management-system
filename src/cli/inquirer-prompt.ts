import { confirm, input, select } from '@inquirer/prompts';

import type { Choice, PromptAdapter } from './prompt-adapter.js';

export class InquirerPrompt implements PromptAdapter {
  select<T>(message: string, choices: Choice<T>[]): Promise<T> {
    return select<T>({ message, choices });
  }

  input(message: string): Promise<string> {
    return input({ message });
  }

  confirm(message: string, defaultValue = false): Promise<boolean> {
    return confirm({ message, default: defaultValue });
  }
}
