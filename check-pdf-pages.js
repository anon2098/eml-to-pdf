#!/usr/bin/env node

const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function checkPdfPages(pdfPath) {
  try {
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    console.log(`PDF file: ${pdfPath}`);
    console.log(`Number of pages: ${pageCount}`);
    return pageCount;
  } catch (error) {
    console.error('Error reading PDF:', error);
  }
}

if (require.main === module) {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error('Please provide a PDF file path');
    process.exit(1);
  }
  
  checkPdfPages(pdfPath);
}
