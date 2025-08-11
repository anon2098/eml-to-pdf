import puppeteer from 'puppeteer-core';
import fs from 'fs-extra';
import path from 'path';
import { format } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime, format as formatTz } from 'date-fns-tz';

export class PdfGenerator {
  constructor(bravePath) {
    this.bravePath = bravePath || this.findBravePath();
    this.timeZone = 'Australia/Brisbane';
  }

  findBravePath() {
    // Common Brave browser paths for different operating systems
    const possiblePaths = [
      '/usr/bin/brave-browser',
      '/usr/bin/brave',
      '/opt/brave.com/brave/brave',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
    ];

    for (const browserPath of possiblePaths) {
      if (fs.existsSync(browserPath)) {
        return browserPath;
      }
    }

    throw new Error('Brave browser not found. Please specify the path using --brave-path option');
  }

  async generatePdf(emailData, metaData, outputFolder) {
    let browser;
    try {
      // Launch Brave browser
      browser = await puppeteer.launch({
        executablePath: this.bravePath,
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      // Generate HTML content
      const htmlContent = this.generateHtmlContent(emailData, metaData);
      
      // Set content and wait for it to load
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate filename
      const filename = this.generateFilename(emailData);
      const outputPath = path.join(outputFolder, filename);
      
      // Generate PDF with print-like settings
      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });

      return outputPath;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  generateHtmlContent(emailData, metaData) {
    // Convert date to Brisbane timezone
    const brisbaneDate = utcToZonedTime(emailData.date, this.timeZone);
    const formattedDate = formatTz(brisbaneDate, 'yyyy-MM-dd HH:mm:ss zzz', { timeZone: this.timeZone });

    // Process body content
    let bodyContent = '';
    if (emailData.body.type === 'html') {
      bodyContent = emailData.body.content;
    } else {
      // Convert plain text to HTML with line breaks
      bodyContent = emailData.body.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
    }

    // Generate attachments list
    let attachmentsList = '';
    if (emailData.attachments && emailData.attachments.length > 0) {
      attachmentsList = `
        <div class="attachments-section">
          <h3>Attachments</h3>
          <ul class="attachments-list">
            ${emailData.attachments.map(att => `
              <li>
                <strong>${att.filename}</strong>
                <span class="file-info">(${att.contentType}, ${this.formatFileSize(att.size)})</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email: ${emailData.subject}</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .email-header {
            border-bottom: 2px solid #e1e5e9;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .subject {
            font-size: 24px;
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 15px;
            word-wrap: break-word;
        }
        
        .email-meta {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 10px 20px;
            font-size: 14px;
            color: #666;
        }
        
        .meta-label {
            font-weight: bold;
            color: #444;
        }
        
        .meta-value {
            word-wrap: break-word;
        }
        
        .email-body {
            margin: 30px 0;
            line-height: 1.7;
            font-size: 16px;
        }
        
        .email-body h1, .email-body h2, .email-body h3 {
            color: #2c3e50;
            margin-top: 25px;
            margin-bottom: 15px;
        }
        
        .email-body p {
            margin-bottom: 15px;
        }
        
        .email-body blockquote {
            border-left: 4px solid #3498db;
            margin: 20px 0;
            padding-left: 20px;
            color: #666;
            font-style: italic;
        }
        
        .attachments-section {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e1e5e9;
        }
        
        .attachments-section h3 {
            color: #2c3e50;
            font-size: 18px;
            margin-bottom: 15px;
        }
        
        .attachments-list {
            list-style: none;
            padding: 0;
        }
        
        .attachments-list li {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 12px 15px;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .file-info {
            color: #666;
            font-size: 12px;
        }
        
        .date-info {
            color: #666;
            font-size: 12px;
            margin-top: 10px;
        }
        
        /* Ensure proper text wrapping */
        * {
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        
        /* Style for email addresses */
        .email-address {
            color: #0066cc;
        }
    </style>
</head>
<body>
    <div class="email-header">
        <div class="subject">${emailData.subject}</div>
        <div class="email-meta">
            <span class="meta-label">From:</span>
            <span class="meta-value email-address">${emailData.from}</span>
            
            <span class="meta-label">To:</span>
            <span class="meta-value email-address">${emailData.to.join(', ')}</span>
            
            ${emailData.cc.length > 0 ? `
            <span class="meta-label">CC:</span>
            <span class="meta-value email-address">${emailData.cc.join(', ')}</span>
            ` : ''}
            
            ${emailData.bcc.length > 0 ? `
            <span class="meta-label">BCC:</span>
            <span class="meta-value email-address">${emailData.bcc.join(', ')}</span>
            ` : ''}
            
            <span class="meta-label">Date:</span>
            <span class="meta-value">${formattedDate}</span>
        </div>
    </div>
    
    <div class="email-body">
        ${bodyContent}
    </div>
    
    ${attachmentsList}
    
    <div class="date-info">
        Generated on: ${formatTz(new Date(), 'yyyy-MM-dd HH:mm:ss zzz', { timeZone: this.timeZone })}
    </div>
</body>
</html>`;
  }

  generateFilename(emailData) {
    // Convert date to Brisbane timezone for filename
    const brisbaneDate = utcToZonedTime(emailData.date, this.timeZone);
    const dateStr = formatTz(brisbaneDate, 'yyyy_MM_dd', { timeZone: this.timeZone });
    
    // Clean email addresses for filename
    const fromEmail = this.cleanEmailForFilename(emailData.from);
    const toEmail = this.cleanEmailForFilename(emailData.to[0] || 'unknown');
    
    return `${dateStr}_${fromEmail}_to_${toEmail}.pdf`;
  }

  cleanEmailForFilename(email) {
    // Remove invalid filename characters and keep only the part before @
    return email.split('@')[0]
      .replace(/[<>:"/\\|?*\s]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}