# EML to PDF Converter

A Node.js package that converts EML email files to PDF format with full attachments support.

## Features

- Converts EML files to PDF format
- Preserves email metadata (subject, sender, receiver, date)
- Handles HTML and plain text email content
- Merges PDF attachments directly into the output PDF
- Provides both programmatic API and CLI interface
- Generates clean, formatted PDFs with email headers and content

## Installation

### As a dependency in your project:
```bash
npm install eml-to-pdf-converter
```

### As a global CLI tool:
```bash
npm install -g eml-to-pdf-converter
```

## Usage

### Command Line Interface (CLI)

Convert a single EML file:
```bash
eml-to-pdf email.eml
eml-to-pdf email.eml output.pdf
```

Convert all EML files in a directory:
```bash
eml-to-pdf ./emails/
eml-to-pdf ./emails/ ./output/
```

Show help:
```bash
eml-to-pdf --help
```

### Programmatic API

```javascript
const { convertEmlToPdf, generateOutputFilename } = require('eml-to-pdf-converter');

// Convert a single file
async function convertFile() {
  const outputPath = await generateOutputFilename('email.eml');
  await convertEmlToPdf('email.eml', outputPath);
  console.log('Conversion completed!');
}

convertFile();
```

## Output

The converter generates a single PDF file for each email with:
- Email headers (subject, sender, receiver, date)
- Formatted email content (HTML or plain text)
- Merged PDF attachments (when present)

Files are saved with descriptive names in the format:
`yyyy_mm_dd_hh_mm_ss_sender_to_receiver.pdf`

## Dependencies

- `mailparser` - For parsing EML files
- `pdfkit` - For PDF generation
- `pdf-lib` - For merging PDF attachments
- `fs-extra` - Enhanced file system operations

## Notes

- HTML content is processed with basic formatting preservation
- PDF attachments are automatically merged into the main PDF
- Non-PDF attachments are listed in the PDF but not included
- Works with Node.js version 14 and higher