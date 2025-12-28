const fs = require('fs');
const path = require('path');

const filePath = path.join('node_modules', '@expo', 'cli', 'build', 'src', 'start', 'server', 'metro', 'externals.js');
console.log('Target:', filePath);

try {
  let content = fs.readFileSync(filePath, 'utf8');
  console.log('Original Length:', content.length);

  // STRATEGY 1: Sanitize 'node:sea' literals
  content = content.replace(/'node:sea'/g, "'node_sea_ignored'").replace(/"node:sea"/g, '"node_sea_ignored"');
  
  // STRATEGY 2: Intercept mkdir calls
  // Pattern: await fs.promises.mkdir(PATH_VAR, OPTIONS)
  // We want to wrap PATH_VAR in a sanitation: (PATH_VAR).replace(/:/g, '_')
  
  // Regex explanation:
  // await\s+fs\.promises\.mkdir\(  -> match method call start
  // ([^,]+)                       -> capture the first argument (path variable) until comma
  // ,                             -> match comma
  const mkdirRegex = /(await\s+fs\.promises\.mkdir\()([^,]+)(,)/g;
  
  // Replacement function
  content = content.replace(mkdirRegex, (match, prefix, pathVar, suffix) => {
      console.log(`Patching mkdir call for variable: ${pathVar.trim()}`);
      // Add a safe replace check. We use `String(pathVar).replace(...)` to be ultra safe, 
      // but assuming it's a string, just .replace is fine.
      // We also verify it's not already patched.
      if (pathVar.includes('.replace')) return match;
      
      return `${prefix}${pathVar}.replace(/:/g, '_')${suffix}`;
  });

  fs.writeFileSync(filePath, content);
  console.log('Nuclear fix applied. New Length:', content.length);

} catch (e) {
  console.error('Error applying nuclear fix:', e);
}
