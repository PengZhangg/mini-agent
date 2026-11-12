import fs from 'node:fs/promises';
import type { Tool } from './types.ts';

export const readTool: Tool = {
  definition: {
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
  run: async (args) => {
    const filePath = args.file_path;

    try {
      const data = await fs.readFile(filePath, 'utf8');
      return data;
    } catch (err) {
      console.error('Error reading file:', err);
      return String(err);
    }
  },
};
