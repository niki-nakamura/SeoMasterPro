#!/usr/bin/env node

/**
 * Deployment verification script
 * Tests lite mode and environment configuration
 */

console.log('🔍 SeoMasterPro Deployment Verification\n');

// Check environment variables
const nodeEnv = process.env.NODE_ENV || 'development';
const liteMode = process.env.LITE_MODE === 'true';
const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

console.log('📋 Environment Configuration:');
console.log(`  NODE_ENV: ${nodeEnv}`);
console.log(`  LITE_MODE: ${liteMode}`);
console.log(`  OLLAMA_HOST: ${ollamaHost}\n`);

// Test model configuration
const recommendedModels = liteMode 
  ? ["tinymistral"]
  : ["tinymistral", "mxbai-embed-large", "llama3.2:3b"];

console.log('🤖 Model Configuration:');
console.log(`  Mode: ${liteMode ? 'Lite (Replit)' : 'Full (Self-hosted)'}`);
console.log(`  Recommended models: ${recommendedModels.join(', ')}`);

const estimatedSize = liteMode ? '~340MB' : '~3.5GB';
console.log(`  Estimated storage: ${estimatedSize}\n`);

// Test API endpoints
async function testEndpoints() {
  console.log('🌐 Testing API Endpoints:');
  
  try {
    const healthResponse = await fetch('http://localhost:5000/api/health');
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('  ✅ Health endpoint: OK');
      console.log(`     Environment: ${health.environment?.nodeEnv}`);
      console.log(`     Lite mode: ${health.environment?.liteMode}`);
    } else {
      console.log('  ❌ Health endpoint: Failed');
    }
  } catch (error) {
    console.log('  ⚠️  Health endpoint: Server not running');
  }

  try {
    const statusResponse = await fetch('http://localhost:5000/api/ollama/status');
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('  ✅ Ollama status endpoint: OK');
      console.log(`     Server running: ${status.running}`);
      console.log(`     Models available: ${status.models?.length || 0}`);
    } else {
      console.log('  ❌ Ollama status endpoint: Failed');
    }
  } catch (error) {
    console.log('  ⚠️  Ollama status endpoint: Server not running');
  }
}

// Run tests
testEndpoints().then(() => {
  console.log('\n🎯 Deployment Verification Complete');
  console.log('\nFor Replit deployment:');
  console.log('  1. Ensure LITE_MODE=true in environment');
  console.log('  2. Go to Settings → Click "サーバーを起動"');
  console.log('  3. Wait for tinymistral download (340MB)');
  console.log('  4. Navigate to /chat for testing');
  
  console.log('\nFor Docker deployment:');
  console.log('  1. Set LITE_MODE=false');
  console.log('  2. Run: docker-compose up --build');
  console.log('  3. Wait for all models download (~3.5GB)');
  console.log('  4. Access via http://localhost:5000');
});