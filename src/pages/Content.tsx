import { useState } from 'react';
import { 
  ExternalLink, Sparkles, Zap, Layout, Monitor, MessageSquare, 
  Database, Workflow, Calendar, Instagram, BarChart, Settings, Plus, Trash2, Edit3,
  Library, Briefcase, Code, Github, Facebook, Bot, Cpu, BrainCircuit
} from 'lucide-react';

const INITIAL_PLATFORMS = [
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
    id: 'supabase',
    name: 'Supabase',
    description: 'Backend infrastructure, SQL database, and real-time prospect storage.',
    url: 'https://supabase.com/dashboard',
    isInternal: false,
    status: 'Backend',
    color: '#3ECF8E',
    icon: Database
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Direct client communication via +31 6 28960405.',
    url: 'https://wa.me/31628960405',
    isInternal: false,
    status: 'Communication',
    color: '#25D366',
    icon: MessageSquare
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Primary brand distribution for @attractacq.',
    url: 'https://instagram.com/attractacq',
    isInternal: false,
    status: 'Social',
    color: '#E1306C',
    icon: Instagram
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
    id: 'n8n',
    name: 'n8n',
    description: 'Workflow automation hub for connecting AA infrastructure.',
    url: 'https://n8n.io/',
    isInternal: false,
    status: 'Automation',
    color: '#FF6C37',
    icon: Workflow
  },
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Booking infrastructure for 1:1 strategy calls.',
    url: 'https://calendly.com/attractacquisition',
    isInternal: false,
    status: 'Booking',
    color: '#006BFF',
    icon: Calendar
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
    id: 'ads-library',
    name: 'Ads Library',
    description: 'Competitor ad research and creative inspiration.',
    url: 'https://www.facebook.com/ads/library/',
    isInternal: false,
    status: 'Research',
    color: '#0081FB',
    icon: Library
  },
  {
    id: 'meta-business-suite',
    name: 'Meta Business Suite',
    description: 'Central hub for Meta business assets and pages.',
    url: 'https://business.facebook.com/',
    isInternal: false,
    status: 'Management',
    color: '#0081FB',
    icon: Briefcase
  },
  {
    id: 'apify',
    name: 'Apify',
    description: 'Web scraping and data extraction automation.',
    url: 'https://console.apify.com/',
    isInternal: false,
    status: 'Scraping',
    color: '#97E754',
    icon: Code
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Source code management and version control.',
    url: 'https://github.com/',
    isInternal: false,
    status: 'Development',
    color: '#ffffff',
    icon: Github
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Primary social network platform.',
    url: 'https://facebook.com/',
    isInternal: false,
    status: 'Social',
    color: '#1877F2',
    icon: Facebook
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    description: 'Conversational AI for content and strategy.',
    url: 'https://chat.openai.com/',
    isInternal: false,
    status: 'AI',
    color: '#10A37F',
    icon: Bot
  },
  {
    id: 'openai-platform',
    name: 'OpenAI Platform',
    description: 'API access and model management for OpenAI.',
    url: 'https://platform.openai.com/',
    isInternal: false,
    status: 'API',
    color: '#ffffff',
    icon: Cpu
  },
  {
    id: 'grok',
    name: 'Grok',
    description: 'Real-time AI research and data analysis.',
    url: 'https://grok.x.ai/',
    isInternal: false,
    status: 'AI',
    color: '#ffffff',
    icon: BrainCircuit
  },
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Google AI for advanced reasoning and multimodal tasks.',
    url: 'https://gemini.google.com/',
    isInternal: false,
    status: 'AI',
    color: '#8E24AA',
    icon: Sparkles
  },
  {
    id: 'claude-ai',
    name: 'Claude AI',
    description: 'Anthropic AI for detailed analysis and writing.',
    url: 'https://claude.ai/',
    isInternal: false,
    status: 'AI',
    color: '#D97757',
    icon: Bot
  },
  {
    id: 'claude-platform',
    name: 'Claude Platform',
    description: 'API access and developer tools for Anthropic models.',
    url: 'https://console.anthropic.com/',
    isInternal: false,
    status: 'API',
    color: '#D97757',
    icon: Cpu
  }
];

export default function ContentPage() {
  const [platforms, setPlatforms] = useState(INITIAL_PLATFORMS);
  const [isEditMode, setIsEditMode] = useState(false);

  const deletePlatform = (id: string) => {
    setPlatforms(platforms.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: '32px', fontWeight: 700 }}>
            Content <span style={{ color: 'var(--teal)' }}>Hub</span>
          </h1>
          <p style={{ color: 'var(--grey)', fontSize: '14px', maxWidth: '600px' }}>
            Centralized access points for your ecosystem.
          </p>
        </div>
        
        {/* Subtle Toggle Button */}
        <button 
          onClick={() => setIsEditMode(!isEditMode)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            background: isEditMode ? 'var(--teal)' : 'rgba(255,255,255,0.05)',
            color: isEditMode ? '#000' : 'var(--grey)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Settings size={14} className={isEditMode ? 'animate-spin-slow' : ''} />
          {isEditMode ? 'Finish Editing' : 'Manage Links'}
        </button>
      </div>

      {/* Grid Container */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px' 
      }}>
        {platforms.map((platform) => {
          const Icon = platform.icon || Monitor;
          return (
            <div 
              key={platform.id}
              style={{
                background: 'var(--bg2)',
                border: `1px solid ${isEditMode ? 'rgba(255,255,255,0.1)' : 'var(--border2)'}`,
                borderRadius: '12px',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s',
                cursor: isEditMode ? 'default' : 'pointer'
              }}
              onClick={() => {
                if (!isEditMode) {
                  platform.isInternal ? window.location.href = platform.url : window.open(platform.url, '_blank')
                }
              }}
            >
              {/* Edit Actions Overlay */}
              {isEditMode && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(2px)',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}>
                  <button style={{ background: 'var(--bg3)', padding: '10px', borderRadius: '50%' }} title="Edit">
                    <Edit3 size={18} color="var(--white)" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deletePlatform(platform.id); }}
                    style={{ background: '#ff4d4d', padding: '10px', borderRadius: '50%' }} 
                    title="Delete"
                  >
                    <Trash2 size={18} color="white" />
                  </button>
                </div>
              )}

              {/* Background Glow */}
              <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '100px',
                height: '100px',
                background: platform.color,
                filter: 'blur(60px)',
                opacity: 0.12,
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
                    fontSize: '9px', 
                    fontFamily: 'DM Mono', 
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
                  color: 'var(--white)',
                  opacity: isEditMode ? 0.3 : 1
                }}>
                  {platform.isInternal ? 'Launch Tool' : 'Open Platform'}
                  {platform.isInternal ? <Zap size={14} /> : <ExternalLink size={14} />}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Connection Placeholder */}
        <div 
          onClick={() => isEditMode && alert('Open Add Modal')}
          style={{
            border: `2px dashed ${isEditMode ? 'var(--teal)' : 'var(--border2)'}`,
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            color: isEditMode ? 'var(--teal)' : 'var(--grey2)',
            textAlign: 'center',
            cursor: isEditMode ? 'pointer' : 'default',
            transition: 'all 0.2s'
          }}>
          {isEditMode ? <Plus size={32} /> : <Sparkles size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />}
          <div style={{ fontFamily: 'DM Mono', fontSize: '12px', marginTop: '8px' }}>
            {isEditMode ? 'Add New Connection' : 'Request Tool Integration'}
          </div>
        </div>
      </div>
    </div>
  );
}
