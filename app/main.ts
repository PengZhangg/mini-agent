import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import fs from 'node:fs/promises';

async function main() {
  const [, , flag, prompt] = process.argv;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL =
    process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1';

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not found');
  }
  if (flag !== '-p' || !prompt) {
    throw new Error('error: -p flag is required');
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });

  const toolList: ChatCompletionTool[] = [
    {
      type: 'function',
      function: {
        name: 'Read',
        description: 'Read and return the contents of a file',
        parameters: {
          type: 'object',
          properties: {
            file_path: {
              type: 'string',
              description: 'The path to the file to read',
            },
          },
          required: ['file_path'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'Write',
        description: 'Write content to a file',
        parameters: {
          type: 'object',
          required: ['file_path', 'content'],
          properties: {
            file_path: {
              type: 'string',
              description: 'The path of the file to write to',
            },
            content: {
              type: 'string',
              description: 'The content to write to the file',
            },
          },
        },
      },
    },
  ];

  const messageLog: ChatCompletionMessageParam[] = [
    { role: 'user', content: prompt },
  ];

  while (true) {
    const response = await client.chat.completions.create({
      model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
      messages: messageLog,
      tools: toolList,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error('no choices in response');
    }

    const message = response.choices[0].message;
    const toolCalls = message.tool_calls;

    messageLog.push(message);

    if (!toolCalls?.length) {
      console.log(message.content);
      return;
    }

    for (const call of toolCalls) {
      if (call.type !== 'function') continue;
      const functionName = call.function.name;
      const functionArguments = JSON.parse(call.function.arguments);

      let result: string = 'unknown tool';

      if (functionName === 'Read') {
        const filePath = functionArguments.file_path;

        try {
          const data = await fs.readFile(filePath, 'utf8');
          result = data;
        } catch (err) {
          result = String(err);
          console.error('Error reading file:', err);
        }
      }

      if (functionName === 'Write') {
        const filePath = functionArguments.file_path;
        const content = functionArguments.content;

        try {
          await fs.writeFile(filePath, content);
        } catch (err) {
          console.error('Error writing file:', err);
        }
      }

      messageLog.push({
        role: 'tool',
        tool_call_id: call.id,
        content: result,
      });
    }
  }
}

main();
