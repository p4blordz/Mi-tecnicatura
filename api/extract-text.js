import JSZip from 'jszip';

export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, type } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Falta el parametro url' });
  }

  try {
    // Detect Google Slides/Docs/Drive URLs
    const google = detectGoogleUrl(url);

    if (google) {
      const text = await extractFromGoogle(google);
      if (!text) {
        return res.status(400).json({ error: 'No se pudo extraer texto. Verifica que el archivo sea publico o compartido con "cualquier persona con el link".' });
      }
      return res.status(200).json({ text: text.replace(/\n{3,}/g, '\n\n').trim(), chars: text.length });
    }

    // Regular file URL (Supabase signed URL, etc.)
    if (!type) {
      return res.status(400).json({ error: 'Falta el parametro type (pdf, ppt, doc)' });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(400).json({ error: 'No se pudo descargar el archivo' });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    let text = '';

    if (type === 'pdf') {
      text = await extractPdf(buffer);
    } else if (type === 'ppt') {
      text = await extractPptx(buffer);
    } else if (type === 'doc') {
      text = await extractDocx(buffer);
    } else {
      return res.status(400).json({ error: `Tipo no soportado: ${type}. Usa pdf, ppt o doc.` });
    }

    text = text.replace(/\n{3,}/g, '\n\n').trim();

    if (!text) {
      return res.status(400).json({ error: 'No se pudo extraer texto del archivo. El archivo puede estar vacio o ser una imagen escaneada.' });
    }

    return res.status(200).json({ text, chars: text.length });
  } catch (error) {
    return res.status(500).json({
      error: 'Error al procesar el archivo: ' + error.message,
    });
  }
}

// Detect Google Slides, Docs, Sheets, or Drive file URLs
function detectGoogleUrl(url) {
  // Google Slides: docs.google.com/presentation/d/{ID}
  let match = url.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return { type: 'slides', id: match[1] };

  // Google Docs: docs.google.com/document/d/{ID}
  match = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return { type: 'docs', id: match[1] };

  // Google Sheets: docs.google.com/spreadsheets/d/{ID}
  match = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return { type: 'sheets', id: match[1] };

  // Google Drive file: drive.google.com/file/d/{ID}
  match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return { type: 'drive', id: match[1] };

  return null;
}

async function extractFromGoogle(google) {
  let exportUrl, fileType;

  if (google.type === 'slides') {
    // Try multiple export formats for Google Slides
    const formats = [
      { url: `https://docs.google.com/presentation/d/${google.id}/export/pptx`, type: 'pptx' },
      { url: `https://docs.google.com/presentation/d/${google.id}/export/pdf`, type: 'pdf' },
      { url: `https://docs.google.com/presentation/d/${google.id}/export?format=txt`, type: 'txt' },
    ];
    for (const fmt of formats) {
      try {
        const resp = await fetch(fmt.url, { redirect: 'follow' });
        if (!resp.ok) continue;
        const ct = resp.headers.get('content-type') || '';
        if (ct.includes('text/html') && fmt.type !== 'txt') continue;
        if (fmt.type === 'txt') {
          const text = await resp.text();
          if (text && !text.includes('<!DOCTYPE') && !text.includes('<html')) return text;
          continue;
        }
        const buf = Buffer.from(await resp.arrayBuffer());
        if (fmt.type === 'pptx') return await extractPptx(buf);
        if (fmt.type === 'pdf') return await extractPdf(buf);
      } catch {
        continue;
      }
    }
    return null;
  } else if (google.type === 'docs') {
    // Export Google Docs as plain text
    exportUrl = `https://docs.google.com/document/d/${google.id}/export?format=txt`;
    fileType = 'txt';
  } else if (google.type === 'sheets') {
    // Export Google Sheets as CSV
    exportUrl = `https://docs.google.com/spreadsheets/d/${google.id}/export?format=csv`;
    fileType = 'txt';
  } else if (google.type === 'drive') {
    // Try downloading from Drive
    exportUrl = `https://drive.google.com/uc?export=download&id=${google.id}&confirm=t`;
    fileType = 'auto';
  }

  const response = await fetch(exportUrl, { redirect: 'follow' });
  if (!response.ok) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html') && fileType !== 'txt') {
    // Google returned an HTML error page = file is not accessible
    return null;
  }

  if (fileType === 'txt') {
    return await response.text();
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (fileType === 'pptx') {
    return await extractPptx(buffer);
  }

  // Auto-detect for Drive files
  if (fileType === 'auto') {
    // Try PPTX first (ZIP-based)
    try {
      const zip = await JSZip.loadAsync(buffer);
      if (zip.files['ppt/slides/slide1.xml']) {
        return await extractPptx(buffer);
      }
      if (zip.files['word/document.xml']) {
        return await extractDocx(buffer);
      }
    } catch {
      // Not a ZIP file
    }
    // Try PDF
    try {
      return await extractPdf(buffer);
    } catch {
      // Not a PDF either
    }
    return null;
  }

  return null;
}

async function extractPdf(buffer) {
  const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
  const data = await pdfParse(buffer);
  return data.text || '';
}

async function extractPptx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slides = [];

  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)[1]);
      const numB = parseInt(b.match(/slide(\d+)/)[1]);
      return numA - numB;
    });

  for (const fileName of slideFiles) {
    const xml = await zip.files[fileName].async('text');
    const slideNum = fileName.match(/slide(\d+)/)[1];
    const texts = extractXmlText(xml, 'a:t');
    if (texts.length > 0) {
      slides.push(`--- Diapositiva ${slideNum} ---\n${texts.join('\n')}`);
    }
  }

  return slides.join('\n\n');
}

async function extractDocx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const docFile = zip.files['word/document.xml'];

  if (!docFile) {
    return '';
  }

  const xml = await docFile.async('text');
  const paragraphs = [];
  const pRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  let pMatch;

  while ((pMatch = pRegex.exec(xml)) !== null) {
    const pXml = pMatch[0];
    const texts = extractXmlText(pXml, 'w:t');
    if (texts.length > 0) {
      paragraphs.push(texts.join(''));
    }
  }

  return paragraphs.join('\n');
}

function extractXmlText(xml, tagName) {
  const texts = [];
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`, 'g');
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const text = match[1].trim();
    if (text) {
      texts.push(decodeXmlEntities(text));
    }
  }

  return texts;
}

function decodeXmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
