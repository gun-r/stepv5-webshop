"use client";

import { FileText, FileDown } from "lucide-react";

// ─── Word-clean HTML builder ─────────────────────────────────────────────────
// Walks the live DOM and converts to clean semantic HTML with embedded CSS.
// Tailwind class names are stripped; only inline `style` attributes are kept.

const WORD_CSS = `
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #323130; margin: 0; padding: 0; }
  h1   { font-size: 20pt; font-weight: bold; color: #0078d4; margin: 0 0 6pt; }
  h2   { font-size: 14pt; font-weight: bold; color: #0078d4; border-bottom: 2pt solid #0078d4;
          padding-bottom: 4pt; margin: 24pt 0 8pt; page-break-after: avoid; }
  h3   { font-size: 11pt; font-weight: bold; color: #323130; margin: 14pt 0 4pt; page-break-after: avoid; }
  p    { font-size: 10pt; line-height: 1.5; margin: 0 0 6pt; color: #323130; }
  ul, ol { font-size: 10pt; line-height: 1.6; margin: 0 0 6pt; padding-left: 18pt; }
  li   { margin-bottom: 2pt; }
  pre  { font-family: Consolas, monospace; font-size: 8pt; background: #1e1e1e; color: #d4d4d4;
          padding: 8pt 10pt; margin: 6pt 0; white-space: pre-wrap; word-break: break-word; }
  code { font-family: Consolas, monospace; font-size: 8.5pt; background: #f3f2f1;
          color: #a4262c; padding: 1pt 3pt; }
  table { border-collapse: collapse; width: 100%; margin: 6pt 0 12pt; font-size: 9.5pt; }
  thead tr { background: #f3f2f1; }
  th   { text-align: left; padding: 5pt 8pt; font-size: 9pt; font-weight: 600;
          color: #605e5c; border: 1pt solid #edebe9; }
  td   { padding: 5pt 8pt; border: 1pt solid #edebe9; vertical-align: top; color: #323130; }
  tr:nth-child(even) td { background: #faf9f8; }
  .card { border: 1pt solid #edebe9; padding: 10pt; margin: 0 0 10pt; }
  .badge { display: inline; font-size: 8pt; font-weight: 600; padding: 1pt 4pt; }
  .section { margin-bottom: 30pt; }
  .meta { font-size: 9pt; color: #a19f9d; margin-bottom: 20pt; }
  .cover h1 { font-size: 26pt; }
  @page { margin: 2cm 2.5cm; }
`;

function nodeToCleanHtml(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  // Skip icons (svg)
  if (tag === "svg") return "";

  // Collect only inline style (drop class)
  const style = el.getAttribute("style") || "";

  const children = Array.from(el.childNodes).map(nodeToCleanHtml).join("");

  // Map elements
  if (["div", "section"].includes(tag)) {
    const id = el.id ? ` id="${el.id}"` : "";
    const cls = inferClass(el);
    return `<div${id}${cls}${style ? ` style="${style}"` : ""}>${children}</div>`;
  }
  if (["h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "strong", "em", "li", "ul", "ol"].includes(tag)) {
    return `<${tag}${style ? ` style="${style}"` : ""}>${children}</${tag}>`;
  }
  if (tag === "pre") {
    const text = (el.textContent || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<pre>${text}</pre>`;
  }
  if (tag === "code") {
    const text = (el.textContent || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<code>${text}</code>`;
  }
  if (tag === "table") return `<table>${children}</table>`;
  if (tag === "thead") return `<thead>${children}</thead>`;
  if (tag === "tbody") return `<tbody>${children}</tbody>`;
  if (tag === "tr") return `<tr>${children}</tr>`;
  if (tag === "th") return `<th>${children}</th>`;
  if (tag === "td") return `<td>${children}</td>`;
  if (tag === "a") {
    const href = el.getAttribute("href") || "#";
    return `<a href="${href}">${children}</a>`;
  }
  if (tag === "br") return "<br/>";
  if (tag === "hr") return "<hr/>";

  // Default: render children only (strip unknown wrapper tags)
  return children;
}

function inferClass(el: HTMLElement): string {
  // Map Tailwind section headings to clean class
  if (el.classList.contains("scroll-mt-6")) return ' class="section"';
  return "";
}

function buildWordDoc(inner: string): string {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40" lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>STEPv5 WC — Documentation</title>
  <xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml>
  <style>${WORD_CSS}</style>
</head>
<body>
  <div class="cover" style="margin-bottom:30pt;">
    <h1 style="font-size:26pt;color:#0078d4;">STEPv5 WC</h1>
    <h2 style="border:none;font-size:14pt;margin-top:4pt;">Project Documentation</h2>
    <p class="meta">Generated: ${date}</p>
    <hr style="border:none;border-top:2pt solid #edebe9;margin:12pt 0 24pt;"/>
  </div>
  ${inner}
</body>
</html>`;
}

// ─── PDF builder — uses Tailwind CDN so it looks exactly like the app ────────
function buildPdfWindow(inner: string): string {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>STEPv5 WC — Documentation</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      body { font-size: 10pt; }
      aside, nav, button { display: none !important; }
      .scroll-mt-6 { page-break-inside: avoid; }
      pre { white-space: pre-wrap; word-break: break-word; font-size: 7.5pt; }
      h2 { page-break-after: avoid; }
      table { page-break-inside: avoid; font-size: 9pt; }
      @page { margin: 1.8cm 2cm; }
    }
    body { font-family: 'Segoe UI', Arial, sans-serif; }
  </style>
</head>
<body class="bg-white text-gray-900 p-10 max-w-4xl mx-auto">
  <div class="mb-8">
    <h1 class="text-3xl font-bold" style="color:#0078d4;">STEPv5 WC — Documentation</h1>
    <p class="text-sm mt-1" style="color:#a19f9d;">Generated: ${date}</p>
    <hr class="mt-4" style="border-color:#edebe9;"/>
  </div>
  ${inner}
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function DocsDownloadButton() {
  function getRawInner(): string {
    return document.getElementById("docs-content")?.innerHTML ?? "";
  }

  function getCleanInner(): string {
    const el = document.getElementById("docs-content");
    if (!el) return "";
    return nodeToCleanHtml(el);
  }

  function downloadDoc() {
    const html = buildWordDoc(getCleanInner());
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stepv5-wc-docs-${new Date().toISOString().slice(0, 10)}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openPdf() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(buildPdfWindow(getRawInner()));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 800);
  }

  const btn: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: "0.75rem",
    padding: "5px 10px",
    cursor: "pointer",
    border: "1px solid #c8c6c4",
    backgroundColor: "#fff",
    color: "#323130",
    width: "100%",
    marginBottom: 4,
  };

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#605e5c" }}>
        Export
      </p>
      <button
        onClick={downloadDoc}
        style={btn}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#f3f2f1")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#fff")}
        title="Download as Word document"
      >
        <FileText size={13} style={{ color: "#0078d4" }} />
        Download .doc
      </button>
      <button
        onClick={openPdf}
        style={btn}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#f3f2f1")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#fff")}
        title="Open print view — Save as PDF from browser"
      >
        <FileDown size={13} style={{ color: "#a4262c" }} />
        Save as PDF
      </button>
    </div>
  );
}
