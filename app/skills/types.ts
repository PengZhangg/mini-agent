export interface SkillFrontmatter {
  name: string;
  description: string;
}

export interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  body: string;
}