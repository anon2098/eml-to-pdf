# EML to PDF Converter

A Node.js script that batch converts EML email files and their metadata to PDFs using Brave browser automation. The converter formats emails like print-to-PDF with proper Brisbane timezone handling and merges PDF attachments.

## Features

- 🔄 Batch convert multiple EML files to PDFs
- 📧 Parse email headers (subject, from, to, cc, bcc, date)
- 🕐 Brisbane timezone support (AEST/AEDT)
- 📎 List and merge PDF attachments
- 🖨️ Print-style PDF formatting
- 📁 Automatic output folder creation
- 🌐 HTML email content support
- 📝 Clean subject line (removes "Subject:" prefix)
- 🗂️ Organized filename format: `yyyy_mm_dd_sender_to_receiver.pdf`

## Prerequisites

### Node.js Installation

Choose your operating system:

#### Ubuntu/Debian
```bash
# Option 1: Using NodeSource repository (recommended)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Option 2: Using package manager
sudo apt update
sudo apt install nodejs npm

# Verify installation
node --version
npm --version
```

#### CentOS/RHEL/Fedora
```bash
# Option 1: Using NodeSource repository
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo dnf install nodejs npm  # Fedora
sudo yum install nodejs npm  # CentOS/RHEL

# Option 2: Using package manager
sudo dnf install nodejs npm  # Fedora
sudo yum install nodejs npm  # CentOS/RHEL

# Verify installation
node --version
npm --version
```

#### macOS
```bash
# Option 1: Using Homebrew (recommended)
brew install node

# Option 2: Using MacPorts
sudo port install nodejs18

# Verify installation
node --version
npm --version
```

#### Windows
```bash
# Using Chocolatey
choco install nodejs

# Using Scoop
scoop install nodejs

# Or download from: https://nodejs.org/
# Verify installation in Command Prompt or PowerShell:
node --version
npm --version
```

### Brave Browser

The script requires Brave browser for PDF generation. Install from:
- **Linux**: Download from [brave.com](https://brave.com/download/) or use package manager
- **macOS**: Download from [brave.com](https://brave.com/download/) or `brew install --cask brave-browser`
- **Windows**: Download from [brave.com](https://brave.com/download/) or `choco install brave`

## Installation

1. **Clone or download this project**
```bash
cd "/Users/admin/Scripts/eml to pdf"
```

2. **Install dependencies**
```bash
npm install
```

3. **Make script executable (Linux/macOS)**
```bash
chmod +x index.js
```

## Usage

### Basic Usage
```bash
# Convert all EML files in a directory
node index.js "/path/to/eml/files"

# Or using npm script
npm run convert "/path/to/eml/files"
```

### Advanced Options
```bash
# Specify custom output folder
node index.js "/path/to/eml/files" --output "/path/to/output"

# Specify Brave browser path (if not auto-detected)
node index.js "/path/to/eml/files" --brave-path "/usr/bin/brave-browser"

# Combine options
node index.js "/path/to/eml/files" \
  --output "/custom/output" \
  --brave-path "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
```

### Help
```bash
node index.js --help
```

## File Structure

### Input Files
- **EML files**: Standard email message files (`.eml`)
- **Metadata files**: Optional JSON files (`.meta.json`) with same name as EML

### Output Files
- **PDF files**: Generated in `output/` folder within source directory
- **Filename format**: `yyyy_mm_dd_sender_to_receiver.pdf`
- **Example**: `2024_01_15_john_smith_to_jane_doe.pdf`

## PDF Output Format

The generated PDFs include:

1. **Header Section**
   - Subject (without "Subject:" prefix)
   - From, To, CC, BCC email addresses
   - Date/time in Brisbane timezone

2. **Body Section**
   - HTML or plain text email content
   - Preserved formatting and styling

3. **Attachments Section**
   - List of all attachments with file info
   - PDF attachments merged into final PDF

4. **Footer**
   - Generation timestamp

## Configuration

### Timezone
Currently set to Brisbane, Queensland (`Australia/Brisbane`). To change:

Edit `src/pdfGenerator.js`:
```javascript
this.timeZone = 'Your/Timezone'; // e.g., 'America/New_York'
```

### Browser Path Detection
The script auto-detects Brave browser in common locations. If detection fails, use `--brave-path` option.

## Troubleshooting

### Common Issues

**Browser not found**
```bash
# Specify browser path explicitly
node index.js "/path/to/files" --brave-path "/path/to/brave"
```

**Permission errors**
```bash
# Ensure read access to EML files and write access to output directory
chmod -R 755 "/path/to/eml/files"
```

**Module errors**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**PDF merging fails**
- Check PDF attachment validity
- Ensure sufficient disk space
- Verify temp directory permissions

### Debug Mode
For verbose output, run with debug flag:
```bash
DEBUG=* node index.js "/path/to/files"
```

## File Examples

### Sample EML Structure
```
emails/
├── email1.eml
├── email1.meta.json (optional)
├── email2.eml
├── subfolder/
│   ├── email3.eml
│   └── email3.meta.json
└── output/          (auto-created)
    ├── 2024_01_15_john_to_jane.pdf
    └── 2024_01_16_sales_to_support.pdf
```

### Sample meta.json
```json
{
  "messageId": "unique-message-id",
  "threadId": "conversation-thread",
  "labels": ["inbox", "important"],
  "customData": {
    "processed": true,
    "tags": ["work", "urgent"]
  }
}
```

## Dependencies

- `eml-parse-js`: EML file parsing
- `puppeteer-core`: Browser automation
- `commander`: CLI interface
- `fs-extra`: Enhanced file operations
- `pdf-merger-js`: PDF merging
- `date-fns`: Date formatting
- `date-fns-tz`: Timezone handling

## License

MIT License - see LICENSE file for details.

## Support

For issues or questions:
1. Check common issues in troubleshooting section
2. Verify all dependencies are installed
3. Test with a single EML file first
4. Check file permissions and paths