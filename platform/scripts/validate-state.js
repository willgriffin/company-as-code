#!/usr/bin/env node
/**
 * Validate Terraform State Storage
 * 
 * This script validates that all CDKTF stacks have their state properly
 * stored in the configured S3 backend.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TERRAFORM_STATE_BUCKET = process.env.TERRAFORM_STATE_BUCKET;
const TERRAFORM_STATE_REGION = process.env.TERRAFORM_STATE_REGION;

if (!TERRAFORM_STATE_BUCKET || !TERRAFORM_STATE_REGION) {
  console.error('❌ TERRAFORM_STATE_BUCKET and TERRAFORM_STATE_REGION environment variables are required');
  process.exit(1);
}

console.log('🔍 Validating Terraform state storage...');
console.log(`📦 Bucket: ${TERRAFORM_STATE_BUCKET}`);
console.log(`🌍 Region: ${TERRAFORM_STATE_REGION}`);

try {
  // Test S3 access
  console.log('\n🧪 Testing S3 bucket access...');
  execSync(`aws s3 ls s3://${TERRAFORM_STATE_BUCKET}`, { stdio: 'pipe' });
  console.log('✅ S3 bucket is accessible');

  // List state files
  console.log('\n📋 Listing state files...');
  const stateFiles = execSync(`aws s3 ls s3://${TERRAFORM_STATE_BUCKET}/ --recursive`, { 
    encoding: 'utf-8',
    stdio: 'pipe'
  });

  const tfstateFiles = stateFiles
    .split('\n')
    .filter(line => line.includes('.tfstate'))
    .filter(line => line.trim().length > 0);

  if (tfstateFiles.length === 0) {
    console.log('⚠️ No .tfstate files found in S3 bucket');
    console.log('This may indicate:');
    console.log('  1. No deployments have been run yet');
    console.log('  2. State is not being stored in S3');
    console.log('  3. State files are in a different location');
  } else {
    console.log(`✅ Found ${tfstateFiles.length} state file(s):`);
    tfstateFiles.forEach(file => {
      const parts = file.trim().split(/\s+/);
      const date = parts[0];
      const time = parts[1];
      const size = parts[2];
      const filename = parts[3];
      console.log(`  - ${filename} (${size} bytes, ${date} ${time})`);
    });
  }

  // Check for lock files
  console.log('\n🔒 Checking for lock files...');
  const lockFiles = stateFiles
    .split('\n')
    .filter(line => line.includes('.tflock'))
    .filter(line => line.trim().length > 0);

  if (lockFiles.length > 0) {
    console.log('⚠️ Found lock files (may indicate incomplete operations):');
    lockFiles.forEach(file => {
      const filename = file.trim().split(/\s+/)[3];
      console.log(`  - ${filename}`);
    });
  } else {
    console.log('✅ No lock files found');
  }

  // Validate bucket configuration
  console.log('\n⚙️ Checking bucket configuration...');
  try {
    const versioning = execSync(`aws s3api get-bucket-versioning --bucket ${TERRAFORM_STATE_BUCKET} --query 'Status' --output text`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    }).trim();

    if (versioning === 'Enabled') {
      console.log('✅ Bucket versioning is enabled');
    } else {
      console.log('⚠️ Bucket versioning is not enabled (recommended for state files)');
    }
  } catch (error) {
    console.log('⚠️ Could not check bucket versioning');
  }

  console.log('\n✅ State validation completed successfully');

} catch (error) {
  console.error('❌ State validation failed:', error.message);
  process.exit(1);
}