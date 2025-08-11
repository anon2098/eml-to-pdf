const { convertEmlToPdf } = require('./convert');
const path = require('path');

const emlPath = process.argv[2];
const outDir = path.join(__dirname, 'output');

(async () => {
  try {
    const outPdf = await convertEmlToPdf(
      emlPath,
      path.join(outDir, path.basename(emlPath, '.eml') + '.pdf')
    );
    console.log('PDF written to', outPdf);
  } catch (e) {
    console.error('Conversion failed:', e);
  }
})();