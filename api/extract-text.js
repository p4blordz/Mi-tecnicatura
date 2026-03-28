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
    // 1. Try PPTX export (works when downloads are allowed)
    try {
      const resp = await fetch(`https://docs.google.com/presentation/d/${google.id}/export/pptx`, { redirect: 'follow' });
      if (resp.ok) {
        const ct = resp.headers.get('content-type') || '';
        if (!ct.includes('text/html')) {
          const buf = Buffer.from(await resp.arrayBuffer());
          return await extractPptx(buf);
        }
      }
    } catch {}

    // 2. Downloads blocked - scrape text from the HTML preview page
    try {
      const text = await scrapeGoogleSlidesHtml(google.id);
      if (text && text.length > 20) return text;
    } catch {}

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

async function scrapeGoogleSlidesHtml(id) {
  // Fetch the HTML embed/preview page - text is visible even when downloads are disabled
  const resp = await fetch(
    `https://docs.google.com/presentation/d/${id}/preview`,
    { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } }
  );
  if (!resp.ok) return null;

  const html = await resp.text();

  // Skip if it's a login page or error
  if (html.includes('accounts.google.com/ServiceLogin') || html.length < 1000) {
    return null;
  }

  const allTexts = [];

  // Pattern 1: aria-label attributes on slide elements (accessibility text)
  const ariaRegex = /aria-label="([^"]{3,})"/g;
  let m;
  while ((m = ariaRegex.exec(html)) !== null) {
    const t = decodeHtmlEntities(m[1]).trim();
    // Skip generic UI labels
    if (t && !t.match(/^(Slide \d|slide|menu|button|close|open|Diapositiva)/i)) {
      allTexts.push(t);
    }
  }

  // Pattern 2: Text inside <span> tags with style (slide text content)
  const spanRegex = /<span[^>]*style="[^"]*font-size[^"]*"[^>]*>([^<]+)<\/span>/g;
  while ((m = spanRegex.exec(html)) !== null) {
    const t = decodeHtmlEntities(m[1]).trim();
    if (t && t.length > 1) {
      allTexts.push(t);
    }
  }

  // Pattern 3: Text in SVG <text> elements
  const svgTextRegex = /<text[^>]*>([^<]+)<\/text>/g;
  while ((m = svgTextRegex.exec(html)) !== null) {
    const t = decodeHtmlEntities(m[1]).trim();
    if (t && t.length > 1) {
      allTexts.push(t);
    }
  }

  // Deduplicate while preserving order
  const seen = new Set();
  const unique = [];
  for (const t of allTexts) {
    if (!seen.has(t)) {
      seen.add(t);
      unique.push(t);
    }
  }

  return unique.length > 0 ? unique.join('\n') : null;
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
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
