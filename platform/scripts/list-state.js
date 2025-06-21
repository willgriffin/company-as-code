#!/usr/bin/env node
/**
 * List Terraform State Files
 *
 * This script lists all Terraform state files in the S3 backend
 * and provides detailed information about each stack's state.
 */

const { execSync } = require('child_process');

const TERRAFORM_STATE_BUCKET = process.env.TERRAFORM_STATE_BUCKET;

if (!TERRAFORM_STATE_BUCKET) {
  console.error('❌ TERRAFORM_STATE_BUCKET environment variable is required');
  process.exit(1);
}

console.log('📋 Listing Terraform state files...');
console.log(`📦 Bucket: ${TERRAFORM_STATE_BUCKET}`);

try {
  // List all objects in the bucket
  const output = execSync(
    `aws s3 ls s3://${TERRAFORM_STATE_BUCKET}/ --recursive --human-readable`,
    {
      encoding: 'utf-8',
      stdio: 'pipe',
    }
  );

  const lines = output.split('\n').filter(line => line.trim().length > 0);

  // Filter for state files
  const stateFiles = lines.filter(line => line.includes('.tfstate'));
  const lockFiles = lines.filter(line => line.includes('.tflock'));
  const backupFiles = lines.filter(line => line.includes('.backup'));

  console.log('\n📊 Summary:');
  console.log(`  State files: ${stateFiles.length}`);
  console.log(`  Lock files: ${lockFiles.length}`);
  console.log(`  Backup files: ${backupFiles.length}`);

  if (stateFiles.length > 0) {
    console.log('\n📄 State Files:');
    stateFiles.forEach(file => {
      const parts = file.trim().split(/\s+/);
      if (parts.length >= 4) {
        const date = parts[0];
        const time = parts[1];
        const size = parts[2];
        const filename = parts.slice(3).join(' ');

        // Extract stack name from filename
        const stackName = filename.split('/').pop().replace('.tfstate', '');

        console.log(`  📁 ${stackName}`);
        console.log(`     File: ${filename}`);
        console.log(`     Size: ${size}`);
        console.log(`     Modified: ${date} ${time}`);
        console.log('');
      }
    });
  }

  if (lockFiles.length > 0) {
    console.log('🔒 Lock Files (may indicate active operations):');
    lockFiles.forEach(file => {
      const filename = file.trim().split(/\s+/).slice(3).join(' ');
      console.log(`  - ${filename}`);
    });
    console.log('');
  }

  if (backupFiles.length > 0) {
    console.log('💾 Backup Files:');
    backupFiles.forEach(file => {
      const parts = file.trim().split(/\s+/);
      if (parts.length >= 4) {
        const size = parts[2];
        const filename = parts.slice(3).join(' ');
        console.log(`  - ${filename} (${size})`);
      }
    });
    console.log('');
  }

  // Show latest activity
  if (stateFiles.length > 0) {
    console.log('🕒 Latest Activity:');
    const sortedFiles = stateFiles
      .map(file => {
        const parts = file.trim().split(/\s+/);
        return {
          date: parts[0],
          time: parts[1],
          filename: parts.slice(3).join(' '),
          raw: file,
        };
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateB - dateA;
      });

    const latest = sortedFiles[0];
    const stackName = latest.filename.split('/').pop().replace('.tfstate', '');
    console.log(`  Most recent: ${stackName} (${latest.date} ${latest.time})`);
  }
} catch (error) {
  console.error('❌ Failed to list state files:', error.message);
  process.exit(1);
}
