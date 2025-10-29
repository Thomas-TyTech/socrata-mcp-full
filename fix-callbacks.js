import fs from 'fs';

// Read the file
const filePath = './src/index.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Fix all callback functions to accept extra parameter
content = content.replace(
  /}, async \(args\) => \{/g, 
  '}, async (args, extra) => {'
);

// Write the file back
fs.writeFileSync(filePath, content);

console.log('Fixed callback signatures in', filePath);