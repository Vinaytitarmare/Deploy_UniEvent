const fs = require('fs');
const path = 'node_modules/@expo/cli/build/src/start/server/metro/externals.js';

try {
  if (!fs.existsSync(path)) {
    console.log('externals.js not found, skipping patch');
    process.exit(0);
  }

  // Read the FRESH file from npm (delete any cached broken versions)
  let content = fs.readFileSync(path, 'utf8');
  
  // If file is already corrupted by bad patches, we need a fresh install
  if (content.includes('PATCHED_SEA') || content.includes('for(const  of') || content.includes('["fs/promises"]/*')) {
    console.log('File has old corruption. Please run: npm ci');
    console.log('Attempting to fix anyway...');
    
    // Try to restore by removing our markers
    content = content.replace(/\/\*PATCHED_SEA\*\//g, '');
  }

  // SIMPLE FIX: Just replace the literal 'node:sea' string wherever it appears
  const originalLength = content.length;
  
  content = content.replace(/'node:sea'/g, "'node_sea_disabled'");
  content = content.replace(/"node:sea"/g, '"node_sea_disabled"');
  
  // Also handle any module that has a colon by adding a filter AFTER the array is defined
  // Add a line that filters the array after its declaration
  if (!content.includes('// SEA_FILTER_APPLIED')) {
    content = content.replace(
      /(const NODE_STDLIB_MODULES\s*=\s*[^;]+;)/,
      '$1\n// SEA_FILTER_APPLIED\nconst _ORIG_STDLIB = NODE_STDLIB_MODULES; const NODE_STDLIB_MODULES_FILTERED = _ORIG_STDLIB.filter(m => !String(m).includes(":"));'
    );
    
    // Replace usages of NODE_STDLIB_MODULES with the filtered version
    // But be careful not to replace the const declaration itself
    content = content.replace(
      /for\s*\(\s*const\s+(\w+)\s+of\s+NODE_STDLIB_MODULES\s*\)/g,
      'for (const $1 of NODE_STDLIB_MODULES_FILTERED)'
    );
  }

  if (content.length !== originalLength) {
    fs.writeFileSync(path, content);
    console.log('Patch applied successfully!');
  } else {
    console.log('No changes needed.');
  }
} catch (e) {
  console.error('Patch error:', e.message);
  // Don't fail the build
}
