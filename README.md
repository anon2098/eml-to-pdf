# EML to PDF Converter

A Node.js application that converts EML email files to PDF format using both Puppeteer (for HTML rendering) and PDFKit (for text-based PDFs).

## Features

- Converts EML files to PDF format
- Supports both HTML rendering (Puppeteer) and text-based PDFs (PDFKit)
- Extracts email metadata from corresponding `.metadata.json` files
- Handles attachments information
- Generates clean, formatted PDFs with email headers and content

## Prerequisites

- Node.js (v14 or higher)
- Brave Browser (for Puppeteer rendering)
- EML files with corresponding `.metadata.json` files

## Installation

1. Install dependencies:
```bash
npm install
```

2. Make sure Brave Browser is installed at `/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`

## Usage

Run the converter with a directory containing EML files:

```bash
node convert.js <email-directory>
```

Example:
```bash
node convert.js ./emails
```

Or run app, and select file/folders
'''bash
npm start
'''

## File Structure

The converter expects:
- `.eml` files (email content)
- `.metadata.json` files (email metadata) with the same base filename

Example:
```
emails/
├── email1.eml
├── email1.metadata.json
├── email2.eml
├── email2.metadata.json
└── output/          # Generated PDFs will be saved here
```

## Output

The converter generates two types of PDF files for each email:
- `*_puppeteer.pdf` - HTML-rendered PDF with styling
- `*_pdfkit.pdf` - Text-based PDF

Files are saved in the `output/` subdirectory of the input directory.

## Dependencies

- `puppeteer` - For HTML to PDF conversion
- `pdfkit` - For text-based PDF generation
- `node-html-parser` - For parsing HTML content
- `mime-types` - For MIME type handling
- `fs-extra` - Enhanced file system operations

## Notes

- The converter uses Brave Browser for Puppeteer rendering
- HTML content is stripped for PDFKit output
- Attachments are listed but not included in the PDF
- Timezone is set to Australia/Brisbane for date formatting 