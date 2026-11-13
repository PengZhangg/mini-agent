import type { ParsedSkill } from './types.ts';

export function buildSkillsPrompt(skills: ParsedSkill[]): string {
  const skillList = skills
    .map((s) => `- ${s.frontmatter.name}: ${s.frontmatter.description}`)
    .join('\n');

  return `You have access to the following skills:\n\n${skillList}`;
}
