import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Copy, Download, ArrowLeft, Check, ExternalLink } from 'lucide-react';

export default function TemplateView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileUrl = searchParams.get('url');
  const fileName = searchParams.get('name') || 'template.html';
  
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch the raw HTML content for the "Copy" and "Download" actions
  useEffect(() => {
    if (fileUrl) {
      fetch(fileUrl)
        .then(res => res.text())
        .then(text => {
          setHtmlContent(text);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching template source:", err);
          setLoading(false);
        });
    }
  }, [fileUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert("Failed to copy text");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.endsWith('.html') ? fileName : `${fileName}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (!fileUrl) return <div className="p-10 text-center">No template URL provided.</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header Toolbar */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-gray-900 truncate max-w-md">
              Preview: {fileName}
            </h1>
            <p className="text-xs text-gray-500">Attract Acquisition Template System</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy HTML'}
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm"
          >
            <Download size={16} />
            Download File
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative bg-gray-200 p-4 lg:p-8 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="w-full h-full max-w-5xl mx-auto bg-white shadow-2xl rounded-sm overflow-hidden ring-1 ring-black/5">
            <iframe
              src={fileUrl}
              className="w-full h-full border-none"
              title="Template Render"
              sandbox="allow-popups allow-scripts allow-forms allow-same-origin"
            />
          </div>
        )}
      </main>
    </div>
  );
}
