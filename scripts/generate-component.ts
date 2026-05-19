#!/usr/bin/env node
/**
 * Component scaffolding generator.
 *
 * Usage:
 *   npx tsx scripts/generate-component.ts <category> <ComponentName>
 *
 * Examples:
 *   npx tsx scripts/generate-component.ts ui MyButton
 *   npx tsx scripts/generate-component.ts feature/quiz QuizTimer
 *   npx tsx scripts/generate-component.ts layout Sidebar
 */

import fs from 'fs';
import path from 'path';

const CATEGORY_ROOT = path.resolve(__dirname, '../components');

const componentTemplate = (name: string) => [
  "import React from 'react';",
  '',
  `export interface ${name}Props {`,
  '  /** Add documented props here. */',
  '}',
  '',
  `/**`,
  ` * ${name} component.`,
  ' *',
  ' * TODO: Add component description.',
  ' */',
  `export const ${name}: React.FC<${name}Props> = (props) => {`,
  '  return (',
  '    <div>',
  `      {/* TODO: implement ${name} */}`,
  '    </div>',
  '  );',
  '};',
  '',
].join('\n');

const indexTemplate = (name: string) => [
  `export { ${name} } from './${name}';`,
  `export type { ${name}Props } from './${name}';`,
  '',
].join('\n');

function main() {
  const [, , rawCategory, rawName] = process.argv;

  if (!rawCategory || !rawName) {
    console.error('Usage: npx tsx scripts/generate-component.ts <category> <ComponentName>');
    process.exit(1);
  }

  const category = rawCategory.toLowerCase();
  const componentName = rawName.replace(/^\w/, (c) => c.toUpperCase());
  const targetDir = path.join(CATEGORY_ROOT, category, componentName);

  if (fs.existsSync(targetDir)) {
    console.error(`Component directory already exists: ${targetDir}`);
    process.exit(1);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, `${componentName}.tsx`), componentTemplate(componentName), 'utf-8');
  fs.writeFileSync(path.join(targetDir, 'index.ts'), indexTemplate(componentName), 'utf-8');

  console.log(`Created component scaffolding at ${targetDir}`);
  console.log('Remember to update the parent index.ts exports.');
}

main();
