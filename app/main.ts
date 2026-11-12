import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { tools } from './tools/index.ts';

async function main() {
  const [, , flag, prompt] = process.argv;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model =
    process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b:free';
  const baseURL =
    process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

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

  const messageLog: ChatCompletionMessageParam[] = [
    { role: 'user', content: prompt },
  ];

  while (true) {
    const response = await client.chat.completions.create({
      model: model,
      messages: messageLog,
      tools: tools.map((t) => t.definition),
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
      if (call.type !== 'function') {
        messageLog.push({
          role: 'tool',
          tool_call_id: call.id,
          content: 'Error: unsupported tool call type',
        });
        continue;
      }

      const functionName = call.function.name;
      let functionArguments;

      try {
        functionArguments = JSON.parse(call.function.arguments);
      } catch {
        messageLog.push({
          role: 'tool',
          tool_call_id: call.id,
          content: `Error: invalid JSON arguments: ${call.function.arguments}`,
        });
        continue;
      }

      const tool = tools.find(
        (t) => t.definition.function.name === functionName,
      );
      const result = tool
        ? await tool.run(functionArguments)
        : `Unknown tool: ${functionName}`;

      messageLog.push({
        role: 'tool',
        tool_call_id: call.id,
        content: result,
      });
    }
  }
}

main();
