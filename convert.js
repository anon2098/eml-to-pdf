#!/usr/bin/env node
/*
 * EML to PDF Converter
 * Converts .eml email files to PDF and merges PDF attachments using PDFKit.
 * Usage: node convert.js <email-file-path>
 */

const fs = require('fs');
const path = require('path');
const mailparser = require('mailparser').simpleParser;
const PDFDocument = require('pdfkit');
const { PDFDocument: PDFLibDocument } = require('pdf-lib');

/**
 * Converts EML file to PDF and merges PDF attachments
 * @param {string} emlPath - Path to EML file
 * @param {string} outputPath - Path for output PDF
 * @returns {Promise} Resolves when conversion is complete
 */
async function convertEmlToPdf(emlPath, outputPath) {
  try {
    // Parse EML file
    const emlContent = await fs.promises.readFile(emlPath);
    const mail = await mailparser(emlContent);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create PDF with email content
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4'
    });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Add email header with clean formatting
    doc.fontSize(18).text(mail.subject || 'No Subject', {
      underline: true,
      align: 'left'
    });
    doc.moveDown(0.5);
    
    // Email metadata in a cleaner format
    doc.fontSize(10);
    doc.text(`From: ${mail.from ? mail.from.text : 'Unknown'}`);
    doc.text(`To: ${mail.to ? mail.to.text : 'Unknown'}`);
    if (mail.date) {
      doc.text(`Date: ${mail.date.toString()}`);
    }
    doc.moveDown();
    
    // Add a separator line
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke();
    doc.moveDown();
    
    // Add the email body content with proper formatting
    doc.fontSize(11);
    
    // Use HTML content if available, otherwise use plain text
    if (mail.html) {
      // Process HTML content with basic formatting
      addHtmlContent(doc, mail.html);
    } else if (mail.text) {
      // Process plain text with line breaks
      addPlainTextContent(doc, mail.text);
    } else {
      doc.text('No content');
    }
    
    // Handle attachments section (on same page if possible)
    if (mail.attachments && mail.attachments.length > 0) {
      doc.moveDown();
      
      // Add a note about attachments
      doc.fontSize(11).text('Attachments:', {
        underline: true
      });
      doc.moveDown(0.3);
      
      for (let i = 0; i < mail.attachments.length; i++) {
        const att = mail.attachments[i];
        const filename = att.filename || `attachment_${i + 1}`;
        
        doc.fontSize(10);
        doc.text(`${i + 1}. ${filename}`);
      }
    }

    doc.end();
    
    // Wait for the main PDF to be created
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    
    console.log(`Main PDF saved to: ${outputPath}`);
    
    // Now merge PDF attachments
    await mergePdfAttachments(outputPath, mail.attachments);
    
    console.log(`Final PDF with attachments saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error converting EML to PDF:', error);
    throw error;
  }
}

/**
 * Adds HTML content to PDF with basic formatting
 * @param {PDFDocument} doc - PDF document
 * @param {string} html - HTML content
 */
function addHtmlContent(doc, html) {
  // Simple HTML processing for basic formatting
  // This is a simplified approach - in a production environment, 
  // you might want to use a proper HTML to PDF library
  
  // Remove script and style tags
  let content = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Process line breaks
  content = content.replace(/<br\s*\/?>/gi, '\n');
  content = content.replace(/<\/p>/gi, '\n\n');
  content = content.replace(/<\/div>/gi, '\n');
  
  // Process headers
  content = content.replace(/<h[1-6]>/gi, '\n');
  content = content.replace(/<\/h[1-6]>/gi, '\n');
  
  // Process lists
  content = content.replace(/<li>/gi, '\n• ');
  content = content.replace(/<\/li>/gi, '\n');
  
  // Process formatting tags
  content = content.replace(/<b>/gi, '<BOLD>');
  content = content.replace(/<\/b>/gi, '</BOLD>');
  content = content.replace(/<strong>/gi, '<BOLD>');
  content = content.replace(/<\/strong>/gi, '</BOLD>');
  content = content.replace(/<i>/gi, '<ITALIC>');
  content = content.replace(/<\/i>/gi, '</ITALIC>');
  content = content.replace(/<em>/gi, '<ITALIC>');
  content = content.replace(/<\/em>/gi, '</ITALIC>');
  
  // Remove all remaining HTML tags
  content = content.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  content = content.replace(/&nbsp;/g, ' ');
  content = content.replace(/&amp;/g, '&');
  content = content.replace(/&lt;/g, '<');
  content = content.replace(/&gt;/g, '>');
  content = content.replace(/&quot;/g, '"');
  
  // Split by line breaks and process
  const lines = content.split(/\r?\n/);
  
  lines.forEach((line, index) => {
    line = line.trim();
    
    if (line === '') {
      // Empty line - add paragraph break
      doc.moveDown(0.3);
      return;
    }
    
    // Check for formatting markers
    if (line.includes('<BOLD>') || line.includes('<ITALIC>')) {
      // Handle formatting
      addFormattedText(doc, line);
    } else {
      // No formatting - simple text
      doc.text(line, {
        width: 500,
        align: 'left',
        lineGap: 1
      });
    }
  });
}

/**
 * Adds formatted text to PDF
 * @param {PDFDocument} doc - PDF document
 * @param {string} text - Text with formatting markers
 */
function addFormattedText(doc, text) {
  // Split text by formatting markers
  const parts = [];
  let currentIndex = 0;
  
  while (currentIndex < text.length) {
    let boldStart = text.indexOf('<BOLD>', currentIndex);
    let italicStart = text.indexOf('<ITALIC>', currentIndex);
    
    // Find the earliest marker
    let nextMarker = -1;
    let markerType = '';
    
    if (boldStart !== -1 && (italicStart === -1 || boldStart < italicStart)) {
      nextMarker = boldStart;
      markerType = 'BOLD_START';
    } else if (italicStart !== -1) {
      nextMarker = italicStart;
      markerType = 'ITALIC_START';
    }
    
    if (nextMarker === -1) {
      // No more markers - add remaining text
      if (currentIndex < text.length) {
        parts.push({ text: text.substring(currentIndex), bold: false, italic: false });
      }
      break;
    }
    
    // Add text before marker
    if (nextMarker > currentIndex) {
      parts.push({ text: text.substring(currentIndex, nextMarker), bold: false, italic: false });
    }
    
    // Process the marker
    if (markerType === 'BOLD_START') {
      let endMarker = text.indexOf('</BOLD>', nextMarker);
      if (endMarker !== -1) {
        parts.push({ text: text.substring(nextMarker + 6, endMarker), bold: true, italic: false });
        currentIndex = endMarker + 7;
      } else {
        // Malformed - treat as regular text
        parts.push({ text: text.substring(nextMarker, nextMarker + 6), bold: false, italic: false });
        currentIndex = nextMarker + 6;
      }
    } else if (markerType === 'ITALIC_START') {
      let endMarker = text.indexOf('</ITALIC>', nextMarker);
      if (endMarker !== -1) {
        parts.push({ text: text.substring(nextMarker + 8, endMarker), bold: false, italic: true });
        currentIndex = endMarker + 9;
      } else {
        // Malformed - treat as regular text
        parts.push({ text: text.substring(nextMarker, nextMarker + 8), bold: false, italic: false });
        currentIndex = nextMarker + 8;
      }
    }
  }
  
  // Add the formatted text
  parts.forEach(part => {
    if (part.bold && part.italic) {
      doc.font('Helvetica-BoldOblique').text(part.text, { continued: true });
    } else if (part.bold) {
      doc.font('Helvetica-Bold').text(part.text, { continued: true });
    } else if (part.italic) {
      doc.font('Helvetica-Oblique').text(part.text, { continued: true });
    } else {
      doc.font('Helvetica').text(part.text, { continued: true });
    }
  });
  
  doc.text(''); // End the line
}

/**
 * Adds plain text content to PDF with line breaks
 * @param {PDFDocument} doc - PDF document
 * @param {string} text - Plain text content
 */
function addPlainTextContent(doc, text) {
  // Split by line breaks and add each line separately to preserve formatting
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    doc.text(line, {
      width: 500,
      align: 'left',
      lineGap: 1,
      paragraphGap: 0
    });
    // Add extra space after paragraphs (double line breaks)
    if (index < lines.length - 1 && line === '' && lines[index + 1] === '') {
      doc.moveDown(0.5);
    }
  });
}

/**
 * Merges PDF attachments with the main PDF
 * @param {string} mainPdfPath - Path to the main PDF
 * @param {Array} attachments - Array of email attachments
 */
async function mergePdfAttachments(mainPdfPath, attachments) {
  try {
    // Load the main PDF
    const mainPdfBytes = fs.readFileSync(mainPdfPath);
    const mainPdfDoc = await PDFLibDocument.load(mainPdfBytes);
    
    let modified = false;
    
    // Process each attachment
    for (const att of attachments) {
      const contentType = att.contentType || 'application/octet-stream';
      
      // If it's a PDF attachment, merge it
      if (contentType === 'application/pdf' && att.content) {
        try {
          // Load the attachment PDF
          const attachmentPdfDoc = await PDFLibDocument.load(att.content);
          
          // Copy pages from attachment to main PDF
          const copiedPages = await mainPdfDoc.copyPages(attachmentPdfDoc, attachmentPdfDoc.getPageIndices());
          copiedPages.forEach((page) => {
            mainPdfDoc.addPage(page);
          });
          
          modified = true;
          console.log(`Merged PDF attachment: ${att.filename || 'unnamed'}`);
        } catch (error) {
          console.error(`Error merging PDF attachment: ${att.filename || 'unnamed'}`, error);
        }
      }
    }
    
    // If we modified the PDF, save it
    if (modified) {
      const updatedPdfBytes = await mainPdfDoc.save();
      fs.writeFileSync(mainPdfPath, updatedPdfBytes);
    }
  } catch (error) {
    console.error('Error merging PDF attachments:', error);
  }
}

/**
 * Generates output filename in format: yyyy_mm_dd_hh:mm_"sender"_to_"receiver"
 * @param {string} emlPath - Path to EML file
 * @returns {string} Output path
 */
async function generateOutputFilename(emlPath) {
  try {
    // Parse the EML file to get sender and receiver info
    const emlContent = await fs.promises.readFile(emlPath);
    const mail = await mailparser(emlContent);
    
    // Extract directory and create output path
    const outputDir = path.join(path.dirname(emlPath), 'output');
    
    // Create timestamp
    const date = mail.date ? new Date(mail.date) : new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    // Extract sender and receiver names/addresses
    let sender = 'unknown_sender';
    let receiver = 'unknown_receiver';
    
    if (mail.from && mail.from.value && mail.from.value.length > 0) {
      const from = mail.from.value[0];
      sender = from.name ? sanitizeFilename(from.name) : 
               from.address ? sanitizeFilename(from.address.split('@')[0]) : 
               'unknown_sender';
    }
    
    if (mail.to && mail.to.value && mail.to.value.length > 0) {
      const to = mail.to.value[0];
      receiver = to.name ? sanitizeFilename(to.name) : 
                 to.address ? sanitizeFilename(to.address.split('@')[0]) : 
                 'unknown_receiver';
    }
    
    // Create filename
    const filename = `${year}_${month}_${day}_${hours}_${minutes}_${seconds}_${sender}_to_${receiver}.pdf`;
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    return path.join(outputDir, filename);
  } catch (error) {
    console.error('Error generating filename:', error);
    // Fallback to original naming
    const outputDir = path.join(path.dirname(emlPath), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    return path.join(outputDir, path.basename(emlPath, '.eml') + '.pdf');
  }
}

/**
 * Sanitizes a string to be used in a filename
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeFilename(str) {
  return str.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

// Handle being called as a child process
if (require.main === module) {
  const emailFile = process.argv[2]; // First argument should be the file path
  if (!emailFile) {
    console.error('No email file provided');
    console.error('Usage: node convert.js <email-file-path>');
    process.exit(1);
  }
  
  console.log('Converting file:', emailFile);
  
  // Generate output filename with requested format
  generateOutputFilename(emailFile)
    .then(outputPath => {
      console.log('Output will be saved to:', outputPath);
      return convertEmlToPdf(emailFile, outputPath);
    })
    .then(() => {
      console.log('Conversion completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Conversion failed:', error);
      process.exit(1);
    });
}

// Export for module use
module.exports = { convertEmlToPdf, generateOutputFilename };
