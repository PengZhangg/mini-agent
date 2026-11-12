import type { ChatCompletionFunctionTool } from 'openai/resources/chat/completions';

export interface Tool {
  definition: ChatCompletionFunctionTool;
  run: (args: any) => Promise<string>;
}
