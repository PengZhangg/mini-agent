import fs from 'node:fs/promises';
import path from 'node:path';
import type { Tool } from './types.ts';

export const writeTool: Tool = {
  definition: {
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
  run: async (args) => {
    const filePath = args.file_path;
    const content = args.content;

    if (typeof content !== 'string') {
      return 'Error: content must be a string';
    }

    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content);
      return `Wrote to ${filePath}`;
    } catch (err) {
      console.error('Error writing file:', err);
      return String(err);
    }
  },
};
