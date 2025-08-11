#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively find all .eml files in a directory
function findEmlFiles(dir) {
  let results = [];
  console.log('Reading directory:', dir);
  const list = fs.readdirSync(dir);
  console.log('Files in directory:', list);
  list.forEach(file => {
    file = path.join(dir, file);
    console.log('Processing file:', file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      console.log('It is a directory');
      results = results.concat(findEmlFiles(file));
    } else {
      const ext = path.extname(file).toLowerCase();
      console.log('File extension:', ext);
      if (ext === '.eml') {
        console.log('Found EML file:', file);
        results.push(file);
      } else {
        console.log('Not an EML file:', file);
      }
    }
  });
  return results;
}

// Test with your folder
const testFolder = "/Users/admin/Desktop/Test email folder";
console.log('Testing folder:', testFolder);
console.log('Folder exists:', fs.existsSync(testFolder));

if (fs.existsSync(testFolder)) {
  const stat = fs.statSync(testFolder);
  console.log('Is directory:', stat.isDirectory());
  
  if (stat.isDirectory()) {
    const emlFiles = findEmlFiles(testFolder);
    console.log('All EML files found:', emlFiles);
  }
}
