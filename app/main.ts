import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from 'openai/resources/chat/completions';
import type { ParsedSkill } from './skills/types.ts';
import { tools } from './tools/index.ts';
import { buildSkillsPrompt } from './skills/buildSkillsPrompt.ts';
import { loadSkills } from './skills/loadSkills.ts';

const DEFAULT_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';
const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';

function getConfig() {
  const [, , flag, prompt] = process.argv;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const baseURL = process.env.OPENROUTER_BASE_URL || DEFAULT_BASE_URL;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not found');
  }
  if (flag !== '-p' || !prompt) {
    throw new Error('error: -p flag is required');
  }

  return { prompt, model, apiKey, baseURL };
}

async function runToolCall(
  call: ChatCompletionMessageToolCall,
): Promise<string> {
  if (call.type !== 'function') return 'Error: unsupported tool call type';

  const functionName = call.function.name;
  let functionArguments;

  try {
    functionArguments = JSON.parse(call.function.arguments);
  } catch {
    return `Error: invalid JSON arguments: ${call.function.arguments}`;
  }

  const tool = tools.find((t) => t.definition.function.name === functionName);
  if (!tool) return `Unknown tool: ${functionName}`;

  return tool.run(functionArguments);
}

function resolveSlashCommand(prompt: string, skills: ParsedSkill[]): string {
  const trimmedPrompt = prompt.trim();

  if (!trimmedPrompt.startsWith('/')) return prompt;

  const skillName = trimmedPrompt.split(/\s+/)[0].slice(1);
  const skill = skills.find((s) => s.frontmatter.name === skillName);

  if (!skill) return prompt;

  return skill.body.trim();
}

async function main() {
  const { prompt, model, apiKey, baseURL } = getConfig();
  const client = new OpenAI({ apiKey, baseURL });
  const skills = await loadSkills();
  const systemPrompt = buildSkillsPrompt(skills);

  const messageLog: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: resolveSlashCommand(prompt, skills) },
  ];

  while (true) {
    const response = await client.chat.completions.create({
      model: model,
      messages: messageLog,
      tools: tools.map((t) => t.definition),
    });

    const message = response.choices?.[0]?.message;
    if (!message) throw new Error('no choices in response');
    const toolCalls = message.tool_calls;

    messageLog.push(message);

    if (!toolCalls?.length) {
      console.log(message.content);
      return;
    }

    for (const call of toolCalls) {
      const content = await runToolCall(call);
      messageLog.push({ role: 'tool', tool_call_id: call.id, content });
    }
  }
}

main();
