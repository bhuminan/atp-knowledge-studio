export interface ProviderCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface ProviderAdapter {
  name: string;
  complete(prompt: string, options?: ProviderCompletionOptions): Promise<string>;
  embed(text: string): Promise<number[]>;
}
