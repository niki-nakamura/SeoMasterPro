// Test setup file
global.fetch = require('node-fetch');

// Mock console.log for cleaner test output
const originalLog = console.log;
console.log = (...args) => {
  if (!args[0]?.includes('Starting scraping') && 
      !args[0]?.includes('Scraping') &&
      !args[0]?.includes('Saved to database')) {
    originalLog(...args);
  }
};