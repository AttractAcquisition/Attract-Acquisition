import { useState } from 'react';

const MJRPdfGenerator = () => {
  const [htmlInput, setHtmlInput] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    if (!htmlInput || !businessName) {
      alert("Please provide both the HTML source and Business Name.");
      return;
    }

    setIsGenerating(true);

    try {
      console.log("[AA-OS] Attempting to connect to PDF Service...");
      
      const response = await fetch('https://ideal-doodle-4jxv9qqx6qq6cvp5-3001.app.github.dev/generate-pdf', {
        method: 'POST',
        mode: 'cors', // Force CORS mode
        referrerPolicy: 'no-referrer',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf',
        },
        body: JSON.stringify({
          html: htmlInput,
          businessName: businessName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("[AA-OS] Server Error Response:", errorData);
        throw new Error(`Server responded with ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MJR_${businessName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log("[AA-OS] PDF Generated & Downloaded.");

    } catch (error) {
      console.error('[AA-OS] Detailed Error:', error);
      // This alert now shows the actual error message to help us debug
      alert(`Error: ${error instanceof Error ? error.message : 'Check Console'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-zinc-900 text-white min-height-screen rounded-xl border border-zinc-800 mt-10">
      <h1 className="text-3xl font-bold text-teal-400 mb-6">MJR PDF Creator</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-mono text-zinc-400 mb-2">BUSINESS NAME</label>
          <input 
            type="text"
            className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded text-white focus:border-teal-500 outline-none transition-colors"
            placeholder="e.g. Line & Light Electrical"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-mono text-zinc-400 mb-2">RAW HTML SOURCE</label>
          <textarea 
            className="w-full h-96 bg-zinc-800 border border-zinc-700 p-4 rounded font-mono text-xs text-zinc-300 focus:border-teal-500 outline-none transition-colors"
            placeholder="Paste your MJR HTML here..."
            value={htmlInput}
            onChange={(e) => setHtmlInput(e.target.value)}
          />
        </div>

        <button
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          className={`w-full py-4 rounded font-bold uppercase tracking-widest transition-all ${
            isGenerating 
            ? 'bg-zinc-700 cursor-not-allowed text-zinc-500' 
            : 'bg-teal-500 hover:bg-teal-400 text-black shadow-lg shadow-teal-500/20'
          }`}
        >
          {isGenerating ? 'Processing PDF...' : 'Generate & Download MJR'}
        </button>
      </div>
    </div>
  );
};

export default MJRPdfGenerator;
