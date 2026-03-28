// ─── Document CSS Constants ─────────────────────────────────────────────────
// Injected into fullHtml wrappers so dark theme prints correctly as PDF.
// Both constants include the mandatory print-color-adjust directives.

export const SPOA_STYLES = `
  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body {
    margin: 0;
    padding: 0;
    background: #0A0C0B !important;
    color: #E8E8E8;
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    line-height: 1.6;
  }
  @page {
    size: A4;
    margin: 15mm 12mm;
  }
  @media print {
    html, body {
      background: #0A0C0B !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`

export const MJR_STYLES = `
  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body {
    margin: 0;
    padding: 0;
    background: #0A0C0B !important;
    color: #E8E8E8;
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    line-height: 1.6;
  }
  @page {
    size: A4;
    margin: 15mm 12mm;
  }
  @media print {
    html, body {
      background: #0A0C0B !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`

// ─── Utility ─────────────────────────────────────────────────────────────────

function escapeTitle(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Wraps naked HTML body content (as returned by Edge Functions) into a complete
 * HTML5 document with the given style block injected in <head>.
 */
export function wrapWithStyles(nakedHtml: string, styles: string, title = 'Document'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeTitle(title)}</title>
  <style>
${styles}
  </style>
</head>
<body>
${nakedHtml}
</body>
</html>`
}
