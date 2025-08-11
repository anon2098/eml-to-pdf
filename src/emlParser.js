import fs from 'fs-extra';
import { parseEml } from 'eml-parse-js';

export class EmlParser {
  async parseFile(emlFilePath) {
    try {
      const emlContent = await fs.readFile(emlFilePath, 'utf8');
      const parsed = await parseEml(emlContent);
      
      // Extract key information
      const emailData = {
        subject: this.cleanSubject(parsed.subject || 'No Subject'),
        from: this.extractEmail(parsed.from),
        to: this.extractEmails(parsed.to),
        cc: this.extractEmails(parsed.cc),
        bcc: this.extractEmails(parsed.bcc),
        date: parsed.date ? new Date(parsed.date) : new Date(),
        body: this.extractBody(parsed),
        attachments: this.extractAttachments(parsed),
        messageId: parsed.messageId || '',
        inReplyTo: parsed.inReplyTo || ''
      };

      return emailData;
    } catch (error) {
      throw new Error(`Failed to parse EML file: ${error.message}`);
    }
  }

  cleanSubject(subject) {
    // Remove "Subject:" prefix if it exists
    return subject.replace(/^Subject:\s*/i, '').trim();
  }

  extractEmail(emailField) {
    if (!emailField) return '';
    
    if (typeof emailField === 'string') {
      // Extract email from "Name <email@domain.com>" format
      const match = emailField.match(/<([^>]+)>/);
      return match ? match[1] : emailField.trim();
    }
    
    if (emailField.address) {
      return emailField.address;
    }
    
    return emailField.toString();
  }

  extractEmails(emailField) {
    if (!emailField) return [];
    
    if (Array.isArray(emailField)) {
      return emailField.map(email => this.extractEmail(email));
    }
    
    return [this.extractEmail(emailField)];
  }

  extractBody(parsed) {
    // Try to get HTML body first, then text body
    if (parsed.html) {
      return {
        type: 'html',
        content: parsed.html
      };
    }
    
    if (parsed.text) {
      return {
        type: 'text',
        content: parsed.text
      };
    }
    
    // Check for multipart content
    if (parsed.body && parsed.body.length > 0) {
      for (const part of parsed.body) {
        if (part.contentType && part.contentType.includes('text/html') && part.data) {
          return {
            type: 'html',
            content: part.data
          };
        }
        if (part.contentType && part.contentType.includes('text/plain') && part.data) {
          return {
            type: 'text',
            content: part.data
          };
        }
      }
    }
    
    return {
      type: 'text',
      content: 'No readable content found'
    };
  }

  extractAttachments(parsed) {
    const attachments = [];
    
    if (parsed.attachments && Array.isArray(parsed.attachments)) {
      for (const attachment of parsed.attachments) {
        attachments.push({
          filename: attachment.filename || 'unnamed_attachment',
          contentType: attachment.contentType || 'application/octet-stream',
          size: attachment.data ? attachment.data.length : 0,
          data: attachment.data
        });
      }
    }
    
    // Also check body parts for attachments
    if (parsed.body && Array.isArray(parsed.body)) {
      for (const part of parsed.body) {
        if (part.filename && part.data) {
          attachments.push({
            filename: part.filename,
            contentType: part.contentType || 'application/octet-stream',
            size: part.data.length,
            data: part.data
          });
        }
      }
    }
    
    return attachments;
  }
}