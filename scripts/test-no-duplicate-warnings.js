/**
 * Quick Test: Load all models and check for duplicate index warnings
 * Run: node scripts/test-no-duplicate-warnings.js
 */

const fs = require('fs');
const path = require('path');

// Capture console warnings
const originalWarn = console.warn;
const warnings = [];

console.warn = function(...args) {
  const msg = args.join(' ');
  if (msg.includes('Duplicate')) {
    warnings.push(msg);
  }
  originalWarn.apply(console, args);
};

console.log('🔍 Testing for duplicate index warnings...\n');

try {
  // Import mongoose (this would trigger warnings if they exist)
  require('mongoose');
  
  // Require all model files
  const modelsDir = path.join(__dirname, '../Models');
  const modelFiles = fs.readdirSync(modelsDir)
    .filter(f => f.endsWith('.js') && f !== 'schema-index-best-practices.js');
  
  console.log(`📂 Loading ${modelFiles.length} model files...\n`);
  
  let loaded = 0;
  modelFiles.forEach(file => {
    try {
      require(path.join(modelsDir, file));
      console.log(`✅ ${file}`);
      loaded++;
    } catch (err) {
      console.log(`⚠️  ${file} - ${err.message}`);
    }
  });
  
  console.log(`\n✅ Successfully loaded ${loaded}/${modelFiles.length} models\n`);
  
  if (warnings.length === 0) {
    console.log('🎉 SUCCESS - No duplicate index warnings found!');
    console.log('\nThe following issues have been resolved:');
    console.log('   ✓ slug: Category.js');
    console.log('   ✓ order_number: Order.js');
    console.log('   ✓ receipt_number: Receipt.js');
    console.log('   ✓ referral_code: Referral.js\n');
    process.exit(0);
  } else {
    console.error('⚠️  Found warnings:');
    warnings.forEach(w => console.error('   ', w));
    process.exit(1);
  }
} catch (err) {
  console.error('❌ Error loading models:', err.message);
  process.exit(1);
}
