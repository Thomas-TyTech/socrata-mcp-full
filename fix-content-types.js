import fs from 'fs';
import path from 'path';

// Fix content type issues
const toolsDir = './src/tools/';
const files = fs.readdirSync(toolsDir).filter(file => file.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(toolsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Fix type: "text" to be literal type
  content = content.replace(/type: "text"/g, 'type: "text" as const');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${file}`);
}

console.log('Fixed content types in all tool files');