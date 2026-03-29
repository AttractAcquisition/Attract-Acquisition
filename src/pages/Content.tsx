import { ExternalLink, Sparkles, Zap, Layout, Monitor, MessageSquare, Database, Workflow, Calendar, Instagram, BarChart, Settings, Search } from 'lucide-react';

const CONTENT_PLATFORMS = [
  {
    id: 'aa-studio',
    name: 'AA Studio',
    description: 'Proprietary MJR & SPOA generation engine for high-conversion assets.',
    url: 'https://studio.attractacq.com',
    isInternal: true,
    status: 'Live',
    color: '#00C9A7',
    icon: Layout
  },
  {
    id: 'ad-creative',
    name: 'AdCreative AI',
    description: 'External AI powerhouse for rapid banner and social ad scaling.',
    url: 'https://www.adcreative.ai/',
    isInternal: false,
    status: 'External',
    color: '#3b82f6',
    icon: Monitor
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Direct client communication and Proof Sprint enquiry management.',
    url: 'https://wa.me/33700000000', // Replace with your full +33 number
    isInternal: false,
    status: 'Communication',
    color: '#25D366',
    icon: MessageSquare
  },
  {
    id: 'apify',
    name: 'Apify',
    description: 'Web scraping and automation for lead extraction and market data.',
    url: 'https://console.apify.com/',
    isInternal: false,
    status: 'Data',
    color: '#FF1744',
    icon: Database
  },
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Workflow automation hub for connecting AA infrastructure to CRMs.',
    url: 'https://n8n.io/',
    isInternal: false,
    status: 'Automation',
    color: '#FF6C37',
    icon: Workflow
  },
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Booking infrastructure for 1:1 strategy calls and onboarding.',
    url: 'https://calendly.com/attractacquisition',
    isInternal: false,
    status: 'Booking',
    color: '#006BFF',
    icon: Calendar
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Primary brand distribution and community engagement channel.',
    url: 'https://instagram.com/attractacquisition',
    isInternal: false,
    status: 'Social',
    color: '#E1306C',
    icon: Instagram
  },
  {
    id: 'meta-ads',
    name: 'Ads Manager',
    description: 'Active campaign management and performance scaling.',
    url: 'https://adsmanager.facebook.com/',
    isInternal: false,
    status: 'Advertising',
    color: '#0081FB',
    icon: BarChart
  },
  {
    id: 'meta-business',
    name: 'Business Manager',
    description: 'Meta asset permissions, pixel management, and tracking.',
    url: 'https://business.facebook.com/',
    isInternal: false,
    status: 'Admin',
    color: '#0668E1',
    icon: Settings
  },
  {
    id: 'ad-library',
    name: 'Meta Ad Library',
    description: 'Competitor research and creative transparency monitoring.',
    url: 'https://www.facebook.com/ads/library/',
    isInternal: false,
    status: 'Research',
    color: '#1C1E21',
    icon: Search
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px' 
      }}>
        {CONTENT_PLATFORMS.map((platform) => {
          const Icon = platform.icon;
          return (
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
                    <Icon size={24} color={platform.color} />
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

                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{platform.name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--grey)', lineHeight: 1.5, marginBottom: '24px', minHeight: '40px' }}>
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
          );
        })}

        {/* Dynamic Placeholder */}
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
