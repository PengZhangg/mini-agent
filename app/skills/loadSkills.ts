import fs from 'node:fs/promises';
import path from 'node:path';
import type { ParsedSkill } from './types.ts';
import { parseSkill } from './parseSkill.ts';

export async function loadSkills(): Promise<ParsedSkill[]> {
  const SKILLS_DIR = '.agents/skills';
  const skillFolders = await fs
    .readdir(SKILLS_DIR, { withFileTypes: true })
    .catch(() => []);
  const skills: ParsedSkill[] = [];

  for (const skill of skillFolders) {
    if (skill.isDirectory()) {
      const filePath = path.join(SKILLS_DIR, skill.name, 'SKILL.md');
      const content = await fs.readFile(filePath, 'utf8').catch(() => null);
      if (content === null) continue;
      const parsed = parseSkill(content);
      skills.push(parsed);
    }
  }

  return skills;
}
