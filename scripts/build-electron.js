#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building Next.js app for Electron...');

// Set environment variable to skip static export pre-rendering
process.env.NEXT_SKIP_STATIC_EXPORT = 'true';

try {
  // Build Next.js
  console.log('📦 Running Next.js build...');
  execSync('next build', { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
