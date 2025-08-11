const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { parse } = require('node-html-parser'); // For extracting HTML content from email

// Accept path from command line arguments
const EMAL_DIR = process.argv[2]; // Read the directory path passed as an argument
const OUTPUT_DIR = path.join(EMAL_DIR, 'output'); // Output folder

// Ensure output folder exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Utility to format date in YYYY_MM_DD format
const formatDate = (date) => {
  return `${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}_${date.getDate().toString().padStart(2, '0')}`;
};

// Function to extract email data from .eml and meta.json files
async function extractEmailData(emlFile, metaJsonFile) {
  const emlData = fs.readFileSync(emlFile, 'utf8');
  const metaData = JSON.parse(fs.readFileSync(metaJsonFile, 'utf8'));
  
  const subject = metaData.subject.replace('Subject:', '').trim();
  const sender = metaData.sender_address;
  const receiver = metaData.receiver_address;
  const body = parse(emlData).querySelector('body')?.innerHTML || '';

  // Get attachments and download them
  const attachments = metaData.attachments || [];
  
  return { subject, sender, receiver, body, attachments };
}

// Function to generate PDF using Puppeteer and Brave
async function generatePDF(emailData) {
  const { subject, sender, receiver, body, attachments } = emailData;

  // Start Puppeteer with Brave browser
  const browser = await puppeteer.launch({
    headless: true, // Runs in headless mode
    executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', // Path to Brave executable
  });

  const page = await browser.newPage();
  await page.setContent(`
    <html>
      <body>
        <h1>${subject}</h1>
        <div>${body}</div>
        <h2>Attachments:</h2>
        <ul>
          ${attachments.map(att => `<li>${att.filename}</li>`).join('')}
        </ul>
      </body>
    </html>
  `);

  const outputFileName = path.join(OUTPUT_DIR, `${formatDate(new Date())}_${sender}_${receiver}.pdf`);
  await page.pdf({ path: outputFileName, format: 'A4' });

  console.log(`PDF saved as: ${outputFileName}`);
  await browser.close();
}

// Main function to batch convert emails to PDFs
async function extractEmailData(emlFile, metaJsonFile) {
    console.log(`Extracting data from: ${emlFile}`);
    
    const emlData = fs.readFileSync(emlFile, 'utf8');
    const metaData = JSON.parse(fs.readFileSync(metaJsonFile, 'utf8'));
  
    console.log(`Meta data for: ${emlFile}:`, metaData); // Log the meta data to check its structure
  
    // Subject (remove "Subject:" prefix)
    const subject = metaData.Payload.Subject.replace('Subject:', '').trim();
  
    // Sender's address and name
    const senderName = metaData.Payload.Sender.Name || 'Unknown Sender';
    const senderAddress = metaData.Payload.Sender.Address;
  
    // Receiver's address (assuming first in the list)
    const receiverName = metaData.Payload.ToList[0]?.Name || 'Unknown Receiver';
    const receiverAddress = metaData.Payload.ToList[0]?.Address;
  
    // Time (convert to readable date)
    const timeInSeconds = metaData.Payload.Time;
    const time = new Date(timeInSeconds * 1000).toLocaleString('en-AU', {
      timeZone: 'Australia/Brisbane',
    });
  
    // Body content (parse HTML)
    const body = parse(emlData).querySelector('body')?.innerHTML || 'No body content';
  
    // Attachments
    const attachments = metaData.Payload.Attachments || [];
  
    return {
      subject,
      senderName,
      senderAddress,
      receiverName,
      receiverAddress,
      time,
      body,
      attachments,
    };
  }
  
  async function generatePDF(emailData) {
    const { subject, senderName, senderAddress, receiverName, receiverAddress, time, body, attachments } = emailData;
  
    const doc = new PDFDocument();
    const pdfOutputPath = path.join(PDF_OUTPUT_DIR, `${generateFilename(emailData)}.pdf`);
    const stream = fs.createWriteStream(pdfOutputPath);
    doc.pipe(stream);
  
    // Add the subject (without the "Subject:" label)
    doc.fontSize(16).text(subject, { align: 'center' }).moveDown();
  
    // Sender and Receiver
    doc.fontSize(12).text(`From: ${senderName} <${senderAddress}>`);
    doc.text(`To: ${receiverName} <${receiverAddress}>`);
    doc.text(`Date: ${time}`).moveDown();
  
    // Add the body
    doc.fontSize(10).text(body).moveDown();
  
    // List attachments
    if (attachments.length > 0) {
      doc.text('Attachments:', { continued: true }).fontSize(12).text('');
      attachments.forEach((attachment, index) => {
        doc.text(`${index + 1}. ${attachment.FileName}`);
      });
      doc.moveDown();
    } else {
      doc.text('No attachments found.');
    }
  
    doc.end();
    console.log(`PDF saved to: ${pdfOutputPath}`);
  }
  
  async function convertEmailsToPDF() {
    const files = fs.readdirSync(EMAL_DIR);
    console.log(`Files in directory: ${files.join(', ')}`); // Log all files in the directory
  
    const emlFiles = files.filter(file => file.endsWith('.eml'));
    console.log(`Found ${emlFiles.length} .eml file(s) in the directory.`);
  
    if (emlFiles.length === 0) {
      console.log("No .eml files found in the directory.");
      return; // Exit if no .eml files
    }
  
    for (let emlFile of emlFiles) {
      const emlFilePath = path.join(EMAL_DIR, emlFile);
  
      // Ensure .metadata.json filename matches the .eml file's name
      let metaJsonFilePath = emlFile.replace('.eml', '.metadata.json');
      metaJsonFilePath = path.join(EMAL_DIR, metaJsonFilePath);
  
      console.log(`Looking for .metadata.json at: ${metaJsonFilePath}`);
  
      // Check if the metadata JSON file exists
      if (!fs.existsSync(metaJsonFilePath)) {
        console.log(`Metadata file not found for ${emlFile}. Skipping...`);
        continue; // Skip if metadata JSON doesn't exist
      }
  
      console.log(`Processing .eml file at path: ${emlFilePath}`);
      console.log(`Looking for corresponding .meta.json at: ${metaJsonFilePath}`);
  
      // Proceed with extraction and PDF generation
      try {
        const emailData = await extractEmailData(emlFilePath, metaJsonFilePath);
        await generatePDF(emailData);
      } catch (err) {
        console.log(`Error processing ${emlFile}:`, err.message);
      }
    }
  }
  
  
  
  
  

// Run the conversion
convertEmailsToPDF().catch(err => console.error(err));
