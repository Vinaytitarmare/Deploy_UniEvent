const fs = require('fs');
const path = 'node_modules/@expo/cli/build/src/start/server/metro/externals.js';

try {
  if (!fs.existsSync(path)) {
    console.log('File not found, skipping patch');
    process.exit(0);
  }

  let content = fs.readFileSync(path, 'utf8');
  
  // Check for broken patch (for(const  of) and fix it
  if (content.includes('for(const  of')) {
    console.log('Found corrupted patch, fixing...');
    // Fix the broken for loop by adding a dummy variable
    content = content.replace(
      /for\s*\(\s*const\s+of\s+/g,
      'for(const m of '
    );
  }

  // Remove any existing PATCHED_SEA markers to allow re-patching
  content = content.replace(/\/\*PATCHED_SEA\*\//g, '');

  // Replace node:sea literals
  content = content.replace(/'node:sea'/g, "'node_sea_skip'");
  content = content.replace(/"node:sea"/g, '"node_sea_skip"');

  // Filter the NODE_STDLIB_MODULES array if it contains entries with colons
  content = content.replace(
    /(const NODE_STDLIB_MODULES\s*=\s*\[)([^\]]+)(\])/g,
    (match, prefix, arrayContent, suffix) => {
      const filtered = arrayContent
        .split(',')
        .map(s => s.trim())
        .filter(item => !item.includes(':'))
        .join(', ');
      return `${prefix}${filtered}${suffix}/*PATCHED_SEA*/`;
    }
  );

  fs.writeFileSync(path, content);
  console.log('Patch applied successfully!');
} catch (e) {
  console.error('Patch error:', e.message);
  process.exit(0); // Don't fail the build
}
