#!/usr/bin/env node
/**
 * Deployment preparation script for WebLLM + Ollama dual-mode system
 * This script helps prepare the final deployment to Replit
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    log(colors.green, `✅ ${description}: ${filePath}`);
    return true;
  } else {
    log(colors.red, `❌ ${description}: ${filePath} (Missing)`);
    return false;
  }
}

function checkEnvironmentVariable(varName, description) {
  const value = process.env[varName];
  if (value && value !== 'undefined') {
    log(colors.green, `✅ ${description}: ${varName}=${value}`);
    return true;
  } else {
    log(colors.yellow, `⚠️  ${description}: ${varName} (Not set)`);
    return false;
  }
}

async function prepareDeployment() {
  log(colors.bright, '🚀 WebLLM Deployment Preparation Checklist\n');
  
  let allReady = true;
  
  // Check essential files
  log(colors.cyan, '📁 Checking essential files...');
  allReady &= checkFile('public/webllm-models/llama3-8b/model.json', 'WebLLM model config');
  allReady &= checkFile('client/src/lib/webllm.ts', 'WebLLM library');
  allReady &= checkFile('client/src/pages/settings.tsx', 'Settings page');
  allReady &= checkFile('client/src/pages/chat.tsx', 'Chat page');
  allReady &= checkFile('server/services/ollama-manager.ts', 'Ollama manager');
  
  console.log();
  
  // Check model.json configuration
  log(colors.cyan, '⚙️  Checking WebLLM model configuration...');
  try {
    const modelJsonPath = path.join(__dirname, '..', 'public/webllm-models/llama3-8b/model.json');
    const modelConfig = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
    
    if (modelConfig.model_url.includes('cdn.example.com')) {
      log(colors.yellow, '⚠️  model.json still uses example CDN URL');
      log(colors.blue, '   → You need to update this to your actual CDN URL');
      allReady = false;
    } else {
      log(colors.green, `✅ Model URL configured: ${modelConfig.model_url}`);
    }
    
    log(colors.blue, `   Model ID: ${modelConfig.model_id}`);
    log(colors.blue, `   VRAM Required: ${modelConfig.vram_required_MB} MB`);
  } catch (error) {
    log(colors.red, `❌ Failed to read model.json: ${error.message}`);
    allReady = false;
  }
  
  console.log();
  
  // Check environment variables
  log(colors.cyan, '🔧 Checking environment variables...');
  checkEnvironmentVariable('DATABASE_URL', 'Database connection');
  checkEnvironmentVariable('LITE_MODE', 'Lite mode setting');
  
  // Check deployment-specific variables
  const hasModelUrl = checkEnvironmentVariable('VITE_MODEL_URL', 'WebLLM model URL (client)');
  if (!hasModelUrl) {
    log(colors.blue, '   → Set this in Replit Secrets for custom CDN URL');
  }
  
  console.log();
  
  // Print deployment instructions
  log(colors.magenta, '📋 Final Deployment Steps:');
  console.log();
  
  log(colors.bright, '1. 📦 Upload Model Files to CDN');
  log(colors.blue, '   • Upload llama3-8b-q4f16_1-MLC/ folder to Cloudflare R2');
  log(colors.blue, '   • Configure CORS: {"AllowedOrigins":["*"],"AllowedMethods":["GET","HEAD"]}');
  log(colors.blue, '   • Note your CDN URL: https://<ACCOUNT_ID>.r2.cloudflarestorage.com/');
  
  console.log();
  
  log(colors.bright, '2. 🔗 Update Model URL');
  log(colors.blue, '   • Edit public/webllm-models/llama3-8b/model.json');
  log(colors.blue, '   • Change "model_url" to your actual CDN URL');
  log(colors.blue, '   • Commit the changes');
  
  console.log();
  
  log(colors.bright, '3. 🔑 Set Replit Secrets');
  log(colors.blue, '   • Go to Replit → Secrets tab');
  log(colors.blue, '   • Add: VITE_MODEL_URL=https://your-account.r2.cloudflarestorage.com/llama3-8b-q4f16_1-MLC/');
  log(colors.blue, '   • (Optional) Add other secrets like VITE_SUPABASE_URL');
  
  console.log();
  
  log(colors.bright, '4. 🚀 Deploy to Production');
  log(colors.blue, '   • Click Deploy → New deployment in Replit');
  log(colors.blue, '   • Wait for deployment to complete');
  
  console.log();
  
  log(colors.bright, '5. ✅ Test Deployment');
  log(colors.blue, '   • Chrome/Edge: Navigate to /settings → Click "サーバーを起動"');
  log(colors.blue, '   • Should show progress: "Fetching params 0 / 1900 MB"');
  log(colors.blue, '   • Test chat at /chat → Send "Hello" message');
  log(colors.blue, '   • Firefox: Should fallback to Ollama tinymistral');
  
  console.log();
  
  if (allReady) {
    log(colors.green, '🎉 All checks passed! Ready for deployment.');
  } else {
    log(colors.yellow, '⚠️  Some issues need to be resolved before deployment.');
  }
  
  console.log();
  log(colors.cyan, 'Expected Performance:');
  log(colors.blue, '   • WebGPU (Chrome/Edge): Llama 3 8B @ 9-11 tokens/sec');
  log(colors.blue, '   • Fallback (Firefox): tinymistral @ 6 tokens/sec');
  log(colors.blue, '   • Model download: ~1.9GB (cached after first load)');
  log(colors.blue, '   • Second load: <3 seconds (IndexedDB cache)');
  
  console.log();
  log(colors.cyan, 'Cost Estimate:');
  log(colors.blue, '   • Replit hosting: ~$1.4/month');
  log(colors.blue, '   • Cloudflare R2: ~$0.20/month (1.9GB storage)');
  log(colors.blue, '   • Total: ~$1.60/month for complete local LLM system');
}

// Run the preparation check
if (import.meta.url === `file://${process.argv[1]}`) {
  prepareDeployment().catch(console.error);
}

export { prepareDeployment };