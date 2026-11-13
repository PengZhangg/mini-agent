import YAML from 'yaml';
import type { ParsedSkill } from './types.ts';

export function parseSkill(content: string): ParsedSkill {
  const DELIM = '---';
  const start = content.indexOf(DELIM);
  const end = content.indexOf(DELIM, start + DELIM.length);

  const yamlText = YAML.parse(content.slice(start + DELIM.length, end));
  const body = content.slice(end + DELIM.length);

  return {
    frontmatter: yamlText,
    body: body,
  };
}
