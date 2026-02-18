/*
 * EJS Template Syntax Checker
 * Compiles all .ejs templates to catch syntax issues before runtime.
 */

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const rootDir = path.resolve(__dirname, '..');
const templateRoots = [
  path.join(rootDir, 'views'),
  path.join(rootDir, 'Admin', 'Views')
];

function collectEjsFiles(dirPath, files = []) {
  if (!fs.existsSync(dirPath)) return files;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      collectEjsFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.ejs')) {
      files.push(fullPath);
    }
  }

  return files;
}

function compileTemplate(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');

  // filename is required so EJS can resolve relative includes correctly.
  ejs.compile(source, {
    filename: filePath,
    rmWhitespace: false
  });
}

function run() {
  const files = templateRoots.flatMap((dir) => collectEjsFiles(dir));

  if (files.length === 0) {
    console.log('⚠️  No .ejs files found to check.');
    process.exit(0);
  }

  const failures = [];

  for (const file of files) {
    try {
      compileTemplate(file);
    } catch (error) {
      failures.push({ file, error });
    }
  }

  if (failures.length > 0) {
    console.error(`❌ EJS syntax check failed (${failures.length} file(s)):\n`);

    for (const failure of failures) {
      const relative = path.relative(rootDir, failure.file);
      console.error(`• ${relative}`);
      console.error(`  ${failure.error.message}`);
      console.error('');
    }

    process.exit(1);
  }

  console.log(`✅ EJS syntax check passed (${files.length} file(s) compiled).`);
}

run();
