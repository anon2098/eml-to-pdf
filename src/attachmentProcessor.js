import fs from 'fs-extra';
import path from 'path';
import PDFMerger from 'pdf-merger-js';

export class AttachmentProcessor {
  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp_attachments');
  }

  async mergePdfAttachments(mainPdfPath, attachments) {
    const pdfAttachments = attachments.filter(att => 
      att.contentType === 'application/pdf' || 
      att.filename.toLowerCase().endsWith('.pdf')
    );

    if (pdfAttachments.length === 0) {
      return mainPdfPath;
    }

    try {
      // Ensure temp directory exists
      await fs.ensureDir(this.tempDir);

      // Save PDF attachments to temporary files
      const tempPdfPaths = [];
      for (let i = 0; i < pdfAttachments.length; i++) {
        const attachment = pdfAttachments[i];
        const tempPdfPath = path.join(this.tempDir, `attachment_${i}_${attachment.filename}`);
        
        // Convert attachment data to buffer if needed
        let buffer;
        if (Buffer.isBuffer(attachment.data)) {
          buffer = attachment.data;
        } else if (typeof attachment.data === 'string') {
          // Assume base64 encoded data
          buffer = Buffer.from(attachment.data, 'base64');
        } else {
          console.warn(`Skipping attachment ${attachment.filename}: unsupported data format`);
          continue;
        }

        await fs.writeFile(tempPdfPath, buffer);
        tempPdfPaths.push(tempPdfPath);
      }

      if (tempPdfPaths.length === 0) {
        return mainPdfPath;
      }

      // Create merged PDF
      const merger = new PDFMerger();
      
      // Add main PDF first
      await merger.add(mainPdfPath);
      
      // Add each PDF attachment
      for (const tempPdfPath of tempPdfPaths) {
        try {
          await merger.add(tempPdfPath);
        } catch (error) {
          console.warn(`Warning: Could not merge PDF attachment ${path.basename(tempPdfPath)}: ${error.message}`);
        }
      }

      // Generate output path for merged PDF
      const dir = path.dirname(mainPdfPath);
      const basename = path.basename(mainPdfPath, '.pdf');
      const mergedPdfPath = path.join(dir, `${basename}_with_attachments.pdf`);

      // Save merged PDF
      await merger.save(mergedPdfPath);

      // Clean up temporary files
      await this.cleanupTempFiles(tempPdfPaths);

      // Replace original with merged PDF
      await fs.remove(mainPdfPath);
      await fs.move(mergedPdfPath, mainPdfPath);

      console.log(`✅ Merged ${pdfAttachments.length} PDF attachment(s) with main PDF`);
      return mainPdfPath;

    } catch (error) {
      console.error(`❌ Error merging PDF attachments: ${error.message}`);
      // Clean up any temporary files that might exist
      await this.cleanupTempFiles([]);
      return mainPdfPath; // Return original PDF if merging fails
    }
  }

  async cleanupTempFiles(tempPdfPaths) {
    // Clean up specific temp files
    for (const tempPath of tempPdfPaths) {
      try {
        if (await fs.pathExists(tempPath)) {
          await fs.remove(tempPath);
        }
      } catch (error) {
        console.warn(`Warning: Could not clean up temp file ${tempPath}: ${error.message}`);
      }
    }

    // Clean up temp directory if empty
    try {
      if (await fs.pathExists(this.tempDir)) {
        const files = await fs.readdir(this.tempDir);
        if (files.length === 0) {
          await fs.remove(this.tempDir);
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  async extractAttachmentsToDisk(attachments, outputDir) {
    const savedAttachments = [];

    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      
      try {
        // Generate safe filename
        const safeFilename = this.sanitizeFilename(attachment.filename || `attachment_${i}`);
        const outputPath = path.join(outputDir, safeFilename);

        // Convert attachment data to buffer
        let buffer;
        if (Buffer.isBuffer(attachment.data)) {
          buffer = attachment.data;
        } else if (typeof attachment.data === 'string') {
          buffer = Buffer.from(attachment.data, 'base64');
        } else {
          console.warn(`Skipping attachment ${attachment.filename}: unsupported data format`);
          continue;
        }

        await fs.writeFile(outputPath, buffer);
        savedAttachments.push({
          originalName: attachment.filename,
          savedPath: outputPath,
          contentType: attachment.contentType,
          size: attachment.size
        });

        console.log(`💾 Saved attachment: ${safeFilename}`);
      } catch (error) {
        console.error(`❌ Error saving attachment ${attachment.filename}: ${error.message}`);
      }
    }

    return savedAttachments;
  }

  sanitizeFilename(filename) {
    // Remove or replace invalid filename characters
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 200); // Limit length
  }
}