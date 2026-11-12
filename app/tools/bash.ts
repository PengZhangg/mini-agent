import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { Tool } from './types.ts';

const execAsync = promisify(exec);
const MAX_OUTPUT = 20_000;

function truncate(text: string): string {
  return text.length > MAX_OUTPUT
    ? text.slice(0, MAX_OUTPUT) + '\n... (output truncated)'
    : text;
}

export const bashTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'Bash',
      description: 'Execute a shell command',
      parameters: {
        type: 'object',
        required: ['command'],
        properties: {
          command: {
            type: 'string',
            description: 'The command to execute',
          },
        },
      },
    },
  },
  run: async (args) => {
    try {
      const { stdout, stderr } = await execAsync(args.command, {
        timeout: 30_000,
        maxBuffer: 10 * 1024 * 1024,
      });
      return truncate(stdout + stderr || 'Done');
    } catch (err: any) {
      const status = `Exit code ${err.code ?? 'unknown'}${err.killed ? ' (timed out)' : ''}`;
      return truncate(`${status}\n${err.stdout ?? ''}${err.stderr ?? ''}`);
    }
  },
};
