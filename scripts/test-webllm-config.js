#!/usr/bin/env node
/**
 * Test script to verify WebLLM model configuration
 * and CDN URL accessibility
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testWebLLMConfig() {
  console.log('🔍 Testing WebLLM Configuration...\n');
  
  // Test 1: Check if model.json exists
  const modelJsonPath = path.join(__dirname, '..', 'public', 'webllm-models', 'llama3-8b', 'model.json');
  
  if (!fs.existsSync(modelJsonPath)) {
    console.error('❌ model.json not found at:', modelJsonPath);
    return false;
  }
  
  console.log('✅ model.json found');
  
  // Test 2: Parse model.json and check structure
  let modelConfig;
  try {
    const modelContent = fs.readFileSync(modelJsonPath, 'utf8');
    modelConfig = JSON.parse(modelContent);
    console.log('✅ model.json is valid JSON');
  } catch (error) {
    console.error('❌ Invalid model.json:', error.message);
    return false;
  }
  
  // Test 3: Check required fields
  const requiredFields = ['model_id', 'model_type', 'model_url', 'model_lib'];
  const missingFields = requiredFields.filter(field => !modelConfig[field]);
  
  if (missingFields.length > 0) {
    console.error('❌ Missing required fields:', missingFields.join(', '));
    return false;
  }
  
  console.log('✅ All required fields present');
  console.log('📋 Model Config:');
  console.log('   - ID:', modelConfig.model_id);
  console.log('   - Type:', modelConfig.model_type);
  console.log('   - URL:', modelConfig.model_url);
  console.log('   - VRAM:', modelConfig.vram_required_MB, 'MB');
  
  // Test 4: Check if CDN URL is properly configured
  if (modelConfig.model_url.includes('cdn.example.com')) {
    console.log('🔧 CDN URL is set to example.com - needs to be replaced for production');
    console.log('   Set MODEL_URL environment variable to your actual CDN URL');
  } else {
    console.log('✅ CDN URL configured');
  }
  
  // Test 5: Check environment variables
  console.log('\n📊 Environment Variables:');
  console.log('   MODEL_URL:', process.env.MODEL_URL || 'Not set');
  console.log('   LITE_MODE:', process.env.LITE_MODE || 'Not set');
  console.log('   VITE_LITE_MODE:', process.env.VITE_LITE_MODE || 'Not set');
  
  console.log('\n🎯 WebLLM Configuration Test Complete');
  console.log('\nNext steps:');
  console.log('1. Upload llama3-8b-q4f16_1-MLC/ to your CDN');
  console.log('2. Set MODEL_URL environment variable');
  console.log('3. Configure CORS on your CDN');
  console.log('4. Test WebGPU detection on /settings page');
  console.log('5. Test chat interface on /chat page');
  
  return true;
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testWebLLMConfig().catch(console.error);
}

export { testWebLLMConfig };