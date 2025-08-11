#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { EmlParser } from './src/emlParser.js';
import { PdfGenerator } from './src/pdfGenerator.js';
import { AttachmentProcessor } from './src/attachmentProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

program
  .name('eml-to-pdf')
  .description('Batch convert EML files and metadata to PDFs')
  .version('1.0.0')
  .argument('<source-folder>', 'Source folder containing EML files')
  .option('-o, --output <folder>', 'Output folder for PDFs (default: source/output)')
  .option('-b, --brave-path <path>', 'Path to Brave browser executable')
  .action(async (sourceFolder, options) => {
    try {
      console.log('🚀 Starting EML to PDF conversion...');
      
      // Validate source folder
      if (!await fs.pathExists(sourceFolder)) {
        console.error(`❌ Source folder does not exist: ${sourceFolder}`);
        process.exit(1);
      }

      // Set up output folder
      const outputFolder = options.output || path.join(sourceFolder, 'output');
      await fs.ensureDir(outputFolder);
      console.log(`📁 Output folder: ${outputFolder}`);

      // Initialize processors
      const emlParser = new EmlParser();
      const pdfGenerator = new PdfGenerator(options.bravePath);
      const attachmentProcessor = new AttachmentProcessor();

      // Find all EML files
      const emlFiles = await findEmlFiles(sourceFolder);
      console.log(`📧 Found ${emlFiles.length} EML files to process`);

      let processedCount = 0;
      let errorCount = 0;

      for (const emlFile of emlFiles) {
        try {
          console.log(`\n📝 Processing: ${path.basename(emlFile)}`);
          
          // Parse EML file
          const emailData = await emlParser.parseFile(emlFile);
          
          // Look for corresponding meta.json
          const metaFile = emlFile.replace('.eml', '.meta.json');
          let metaData = {};
          if (await fs.pathExists(metaFile)) {
            metaData = await fs.readJson(metaFile);
          }

          // Generate PDF
          const pdfPath = await pdfGenerator.generatePdf(emailData, metaData, outputFolder);
          
          // Process attachments if any PDF attachments exist
          if (emailData.attachments && emailData.attachments.some(att => att.contentType === 'application/pdf')) {
            await attachmentProcessor.mergePdfAttachments(pdfPath, emailData.attachments);
          }

          console.log(`✅ Successfully converted: ${path.basename(pdfPath)}`);
          processedCount++;
        } catch (error) {
          console.error(`❌ Error processing ${path.basename(emlFile)}: ${error.message}`);
          errorCount++;
        }
      }

      console.log(`\n🎉 Conversion complete!`);
      console.log(`✅ Successfully processed: ${processedCount}`);
      console.log(`❌ Errors: ${errorCount}`);
      
    } catch (error) {
      console.error(`❌ Fatal error: ${error.message}`);
      process.exit(1);
    }
  });

async function findEmlFiles(folder) {
  const files = [];
  const items = await fs.readdir(folder);
  
  for (const item of items) {
    const fullPath = path.join(folder, item);
    const stat = await fs.stat(fullPath);
    
    if (stat.isDirectory()) {
      // Recursively search subdirectories
      const subFiles = await findEmlFiles(fullPath);
      files.push(...subFiles);
    } else if (path.extname(item).toLowerCase() === '.eml') {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

program.parse();