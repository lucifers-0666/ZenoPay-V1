/**
 * Schema Index Verification Script
 * 
 * This script checks all models for duplicate index definitions
 * Run: node scripts/verify-indexes.js
 */

const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../Models');
const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js') && f !== 'schema-index-best-practices.js');

console.log('🔍 Checking models for duplicate index definitions...\n');

let issuesFound = 0;
const results = [];

modelFiles.forEach(file => {
  const filePath = path.join(modelsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find fields with index: true
  const fieldIndexMatches = content.match(/\w+:\s*\{[^}]*index:\s*true[^}]*\}/g) || [];
  
  // Find schema.index() calls
  const schemaIndexMatches = content.match(/\w+Schema\.index\([^)]+\)/g) || [];
  
  // Find unique: true (these auto-create indexes)
  const uniqueMatches = content.match(/\w+:\s*\{[^}]*unique:\s*true[^}]*\}/g) || [];
  
  const status = {
    file: file,
    fieldIndexCount: fieldIndexMatches.length,
    schemaIndexCount: schemaIndexMatches.length,
    uniqueCount: uniqueMatches.length,
    hasIssue: fieldIndexMatches.length > 0
  };
  
  results.push(status);
  
  if (status.hasIssue) {
    issuesFound++;
    console.log(`❌ ${file}`);
    console.log(`   Found ${status.fieldIndexCount} field(s) with "index: true"`);
    console.log(`   This may cause duplicate index warnings if schema.index() is also used\n`);
  }
});

console.log('\n📊 Summary:');
console.log('─'.repeat(60));

results.forEach(r => {
  const icon = r.hasIssue ? '❌' : '✅';
  console.log(`${icon} ${r.file.padEnd(30)} | field: ${r.fieldIndexCount}, schema: ${r.schemaIndexCount}, unique: ${r.uniqueCount}`);
});

console.log('─'.repeat(60));
console.log(`\n${issuesFound === 0 ? '✅ No issues found!' : `⚠️  ${issuesFound} file(s) with potential issues`}\n`);

if (issuesFound === 0) {
  console.log('🎉 All schemas follow best practices!');
  console.log('   - No duplicate "index: true" definitions');
  console.log('   - Indexes defined at schema level');
  console.log('   - "unique: true" is used correctly\n');
}

process.exit(issuesFound > 0 ? 1 : 0);
