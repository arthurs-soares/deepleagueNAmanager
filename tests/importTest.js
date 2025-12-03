/**
 * @fileoverview Comprehensive import test for all bot modules
 * @description Tests all commands, services, utils, and models
 */

const path = require('path');
const fs = require('fs');

// Track results
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * Test a single module import
 * @param {string} modulePath - Path to module
 * @param {string} name - Display name
 */
function testImport(modulePath, name) {
  try {
    const module = require(modulePath);
    if (module) {
      results.passed++;
      console.log(`✅ ${name}`);
      return true;
    }
  } catch (error) {
    results.failed++;
    results.errors.push({ name, error: error.message });
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Get all JS files recursively from a directory
 * @param {string} dir - Directory path
 * @param {string[]} files - Accumulator array
 * @returns {string[]} Array of file paths
 */
function getAllJsFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      getAllJsFiles(fullPath, files);
    } else if (item.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Run all import tests
 */
async function runTests() {
  console.log('🔍 Starting Import Tests...\n');
  console.log('='.repeat(60));

  const srcPath = path.join(__dirname, '..', 'src');

  // Test Commands
  console.log('\n📁 COMMANDS\n' + '-'.repeat(40));
  const commandsPath = path.join(srcPath, 'commands');
  const commandFiles = getAllJsFiles(commandsPath);
  for (const file of commandFiles) {
    const relativePath = path.relative(srcPath, file);
    testImport(file, relativePath);
  }

  // Test Core
  console.log('\n📁 CORE\n' + '-'.repeat(40));
  const corePath = path.join(srcPath, 'core');
  const coreFiles = getAllJsFiles(corePath);
  for (const file of coreFiles) {
    const relativePath = path.relative(srcPath, file);
    testImport(file, relativePath);
  }

  // Test Events
  console.log('\n📁 EVENTS\n' + '-'.repeat(40));
  const eventsPath = path.join(srcPath, 'events');
  const eventFiles = getAllJsFiles(eventsPath);
  for (const file of eventFiles) {
    const relativePath = path.relative(srcPath, file);
    testImport(file, relativePath);
  }

  // Test Handlers
  console.log('\n📁 HANDLERS\n' + '-'.repeat(40));
  const handlersPath = path.join(srcPath, 'handlers');
  const handlerFiles = getAllJsFiles(handlersPath);
  for (const file of handlerFiles) {
    const relativePath = path.relative(srcPath, file);
    testImport(file, relativePath);
  }

  // Test Interactions
  console.log('\n📁 INTERACTIONS\n' + '-'.repeat(40));
  const interactionsPath = path.join(srcPath, 'interactions');
  const interactionFiles = getAllJsFiles(interactionsPath);
  for (const file of interactionFiles) {
    const relativePath = path.relative(srcPath, file);
    testImport(file, relativePath);
  }

  // Test Models
  console.log('\n📁 MODELS\n' + '-'.repeat(40));
  const modelsPath = path.join(srcPath, 'models');
  const modelFiles = getAllJsFiles(modelsPath);
  for (const file of modelFiles) {
    const relativePath = path.relative(srcPath, file);
    testImport(file, relativePath);
  }

  // Test Services
  console.log('\n📁 SERVICES\n' + '-'.repeat(40));
  const servicesPath = path.join(srcPath, 'services');
  const serviceFiles = getAllJsFiles(servicesPath);
  for (const file of serviceFiles) {
    const relativePath = path.relative(srcPath, file);
    testImport(file, relativePath);
  }

  // Test Utils
  console.log('\n📁 UTILS\n' + '-'.repeat(40));
  const utilsPath = path.join(srcPath, 'utils');
  const utilFiles = getAllJsFiles(utilsPath);
  for (const file of utilFiles) {
    const relativePath = path.relative(srcPath, file);
    testImport(file, relativePath);
  }

  // Test Config
  console.log('\n📁 CONFIG\n' + '-'.repeat(40));
  const configPath = path.join(srcPath, 'config');
  const configFiles = getAllJsFiles(configPath);
  for (const file of configFiles) {
    const relativePath = path.relative(srcPath, file);
    testImport(file, relativePath);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY\n');
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   📝 Total:  ${results.passed + results.failed}`);

  if (results.errors.length > 0) {
    console.log('\n🚨 FAILED IMPORTS:\n');
    for (const err of results.errors) {
      console.log(`   • ${err.name}`);
      console.log(`     ${err.error}\n`);
    }
  }

  console.log('='.repeat(60));

  // Exit with error code if any tests failed
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests();
