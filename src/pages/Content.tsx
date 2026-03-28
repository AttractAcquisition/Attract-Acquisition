import { ExternalLink, Sparkles, Zap, Layout, Monitor } from 'lucide-react';

const CONTENT_PLATFORMS = [
  {
    id: 'aa-studio',
    name: 'AA Studio',
    description: 'Proprietary MJR & SPOA generation engine for high-conversion assets.',
    url: '/studio', // Internal Link
    isInternal: true,
    status: 'Live',
    color: '#00C9A7'
  },
  {
    id: 'ad-creative',
    name: 'AdCreative AI',
    description: 'External AI powerhouse for rapid banner and social ad scaling.',
    url: 'https://www.adcreative.ai/', // Replace with your actual partner/referral link
    isInternal: false,
    status: 'External',
    color: '#3b82f6'
  }
];

export default function ContentPage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '32px', fontWeight: 700 }}>
          Content <span style={{ color: 'var(--teal)' }}>Hub</span>
        </h1>
        <p style={{ color: 'var(--grey)', fontSize: '14px', maxWidth: '600px' }}>
          Centralized access points for creative production. Toggle between internal proprietary tools and external AI infrastructure.
        </p>
      </div>

      {/* Grid Container */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
        gap: '24px' 
      }}>
        {CONTENT_PLATFORMS.map((platform) => (
          <div 
            key={platform.id}
            style={{
              background: 'var(--bg2)',
              border: `1px solid var(--border2)`,
              borderRadius: '12px',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.2s, border-color 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = platform.color;
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => platform.isInternal ? window.location.href = platform.url : window.open(platform.url, '_blank')}
          >
            {/* Background Glow Effect */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '100px',
              height: '100px',
              background: platform.color,
              filter: 'blur(60px)',
              opacity: 0.15,
              zIndex: 0
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  padding: '10px', 
                  borderRadius: '8px',
                  border: '1px solid var(--border2)'
                }}>
                  {platform.isInternal ? <Layout size={24} color={platform.color} /> : <Monitor size={24} color={platform.color} />}
                </div>
                <span style={{ 
                  fontSize: '10px', 
                  fontFamily: 'DM Mono', 
                  textTransform: 'uppercase', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  background: 'var(--bg)',
                  border: `1px solid ${platform.color}44`,
                  color: platform.color
                }}>
                  {platform.status}
                </span>
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>{platform.name}</h3>
              <p style={{ fontSize: '13px', color: 'var(--grey)', lineHeight: 1.6, marginBottom: '24px' }}>
                {platform.description}
              </p>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '12px', 
                fontWeight: 600,
                color: 'var(--white)'
              }}>
                {platform.isInternal ? 'Launch Tool' : 'Open Platform'}
                {platform.isInternal ? <Zap size={14} /> : <ExternalLink size={14} />}
              </div>
            </div>
          </div>
        ))}

        {/* Dynamic Placeholder for Future Tools */}
        <div style={{
          border: '2px dashed var(--border2)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          color: 'var(--grey2)',
          textAlign: 'center'
        }}>
          <Sparkles size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <div style={{ fontFamily: 'DM Mono', fontSize: '12px' }}>Request Tool Integration</div>
        </div>
      </div>
    </div>
  );
}
