import OpenAI from 'openai';
import { readFile } from 'fs/promises';

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

  const response = await client.chat.completions.create({
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    messages: [{ role: 'user', content: prompt }],
    tools: [
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
    ],
  });

  if (!response.choices || response.choices.length === 0) {
    throw new Error('no choices in response');
  }

  const message = response.choices[0].message;

  if (!message.tool_calls?.length) {
    console.log(message.content);
    return;
  }

  const toolCall = message.tool_calls[0];

  if (toolCall.type !== 'function') {
    return;
  }

  const functionName = toolCall.function.name;
  const functionArguments = JSON.parse(toolCall.function.arguments);

  if (functionName === 'Read') {
    const filePath = functionArguments.file_path;

    try {
      const data = await readFile(filePath, 'utf8');
      process.stdout.write(data);
    } catch (err) {
      console.error('Error reading file:', err);
      return;
    }
  }
}

main();
