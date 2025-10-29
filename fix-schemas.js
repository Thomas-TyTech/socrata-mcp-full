import fs from 'fs';

// Read the file
const filePath = './src/index.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Fix all registerTool calls to use proper inputSchema format
// Replace z.object({...}).strict() with just {...}
content = content.replace(
  /inputSchema: z\.object\(\{([\s\S]*?)\}\)\.strict\(\)/g, 
  'inputSchema: {$1}'
);

// Replace z.object({...}).refine(...) with just {...} 
content = content.replace(
  /inputSchema: z\.object\(\{([\s\S]*?)\}\)\.strict\(\)\.refine\(([\s\S]*?)\)/g,
  'inputSchema: {$1}'
);

// Fix the parameter destructuring from ({...}) to (args) => { const {...} = args; 
content = content.replace(
  /}, async \(\{ ([^}]+) \}\) => \{/g, 
  '}, async (args) => {\n  const { $1 } = args;'
);

// Write the file back
fs.writeFileSync(filePath, content);

console.log('Fixed schema issues in', filePath);