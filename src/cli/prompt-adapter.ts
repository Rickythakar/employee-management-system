export interface Choice<T> {
  name: string;
  value: T;
  description?: string;
}

export interface SelectionRequest<T> {
  kind: 'select';
  message: string;
  choices: Choice<T>[];
}

export interface InputRequest {
  kind: 'input';
  message: string;
}

export interface ConfirmationRequest {
  kind: 'confirm';
  message: string;
  defaultValue: boolean;
}

export interface PromptAdapter {
  select<T>(message: string, choices: Choice<T>[]): Promise<T>;
  input(message: string): Promise<string>;
  confirm(message: string, defaultValue?: boolean): Promise<boolean>;
}
