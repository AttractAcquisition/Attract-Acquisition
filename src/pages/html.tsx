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
      // 1. Hit your Repo B endpoint
      const response = await fetch('http://localhost:3001/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: htmlInput,
          businessName: businessName,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      // 2. IMPORTANT: Get the response as a BLOB (Binary Large Object)
      const blob = await response.blob();

      // 3. Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // 4. Create a hidden link and click it to trigger the browser download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MJR_${businessName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();

      // 5. Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error generating PDF. Check if Repo B is running.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-zinc-900 text-white min-height-screen">
      <h1 className="text-3xl font-bold text-teal-400 mb-6">MJR PDF Creator</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-mono text-zinc-400 mb-2">BUSINESS NAME</label>
          <input 
            type="text"
            className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded text-white focus:border-teal-500 outline-none"
            placeholder="e.g. Line & Light Electrical"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-mono text-zinc-400 mb-2">RAW HTML SOURCE</label>
          <textarea 
            className="w-full h-96 bg-zinc-800 border border-zinc-700 p-4 rounded font-mono text-xs text-zinc-300 focus:border-teal-500 outline-none"
            placeholder="Paste <!DOCTYPE html> ... </html> here"
            value={htmlInput}
            onChange={(e) => setHtmlInput(e.target.value)}
          />
        </div>

        <button
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          className={`w-full py-4 rounded font-bold uppercase tracking-widest transition-all ${
            isGenerating 
            ? 'bg-zinc-700 cursor-not-allowed' 
            : 'bg-teal-500 hover:bg-teal-400 text-black'
          }`}
        >
          {isGenerating ? 'Processing PDF...' : 'Generate & Download MJR'}
        </button>
      </div>
    </div>
  );
};

export default MJRPdfGenerator;
