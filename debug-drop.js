#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively find all .eml files in a directory
function findEmlFiles(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      file = path.join(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) {
        results = results.concat(findEmlFiles(file));
      } else if (path.extname(file).toLowerCase() === '.eml') {
        results.push(file);
      }
    });
  } catch (error) {
    console.error('Error reading directory:', dir, error);
  }
  return results;
}

// Test the function with a directory
const testDir = process.argv[2];
if (!testDir) {
  console.log('Please provide a directory path to test');
  process.exit(1);
}

console.log('Testing directory:', testDir);
console.log('Directory exists:', fs.existsSync(testDir));

if (fs.existsSync(testDir)) {
  const stat = fs.statSync(testDir);
  console.log('Is directory:', stat.isDirectory());
  
  if (stat.isDirectory()) {
    const emlFiles = findEmlFiles(testDir);
    console.log('Found EML files:', emlFiles);
  } else {
    console.log('Path is not a directory');
    if (path.extname(testDir).toLowerCase() === '.eml') {
      console.log('Path is an EML file');
    }
  }
}
