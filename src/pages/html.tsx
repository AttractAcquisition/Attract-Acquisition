import { useState } from 'react';
import { useToast } from '../lib/toast';
import { FileText, Download, Loader2, Code } from 'lucide-react';

const MJRPdfGenerator = () => {
  const [htmlInput, setHtmlInput] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGeneratePDF = async () => {
    if (!htmlInput || !businessName) {
      toast("Please provide both HTML source and Business Name", "error");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('https://ideal-doodle-4jxv9qqx6qq6cvp5-3001.app.github.dev/generate-pdf', {
        method: 'POST',
        mode: 'cors',
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

      if (!response.ok) throw new Error(`Server responded with ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MJR_${businessName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast("MJR PDF Generated successfully");
    } catch (error) {
      console.error('[AA-OS] PDF Error:', error);
      toast(error instanceof Error ? error.message : "Generation failed", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border2)', paddingBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <FileText size={20} color="var(--teal)" />
            <span style={{ fontFamily: 'DM Mono', fontSize: '11px', color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Asset Generation Engine
            </span>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: '32px', fontWeight: 700, color: 'var(--white)' }}>
            MJR Document Creator
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'DM Mono', fontSize: '20px', color: 'var(--white)' }}>v2.4</div>
          <div style={{ fontFamily: 'DM Mono', fontSize: '9px', color: 'var(--grey2)', textTransform: 'uppercase' }}>System Status: Operational</div>
        </div>
      </div>

      <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', padding: '32px' }}>
        {/* Input: Business Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'var(--grey2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Target Business Entity
          </label>
          <input 
            type="text"
            className="input"
            style={{ fontSize: '14px', padding: '12px' }}
            placeholder="e.g. Line & Light Electrical"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>

        {/* Input: HTML Source */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontFamily: 'DM Mono', fontSize: '10px', color: 'var(--grey2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Raw HTML Payload
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--grey2)', fontSize: '10px' }}>
              <Code size={12} /> UTF-8
            </div>
          </div>
          <textarea 
            className="input"
            style={{ 
              height: '400px', 
              fontFamily: 'DM Mono', 
              fontSize: '12px', 
              lineHeight: '1.6',
              background: 'var(--bg3)',
              color: 'var(--teal-faint)',
              padding: '20px'
            }}
            placeholder="Paste exported HTML structure here..."
            value={htmlInput}
            onChange={(e) => setHtmlInput(e.target.value)}
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          className={isGenerating ? 'btn-secondary' : 'btn-primary'}
          style={{ 
            height: '56px', 
            fontSize: '13px', 
            letterSpacing: '0.1em', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px',
            marginTop: '10px'
          }}
        >
          {isGenerating ? (
            <>
              <Loader2 size={18} className="spin" />
              COMPILING ASSET...
            </>
          ) : (
            <>
              <Download size={18} />
              GENERATE & DOWNLOAD MJR
            </>
          )}
        </button>

        <p style={{ textAlign: 'center', fontFamily: 'DM Mono', fontSize: '10px', color: 'var(--grey2)', marginTop: '8px' }}>
          Note: This process triggers a headless browser instance to render the PDF.
        </p>
      </div>
    </div>
  );
};

export default MJRPdfGenerator;
