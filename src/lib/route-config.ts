import * as Icons from 'lucide-react';

export interface RouteMetadata {
  path: string;
  label: string;
  section: string;
  icon: any;
  roles?: string[];
  /** Page filename (without .tsx) when it differs from the route key */
  file?: string;
}

export const ROUTE_CONFIG: Record<string, Omit<RouteMetadata, 'path'>> = {
  dashboard: { label: 'Live Pipeline', section: 'Overview', icon: Icons.LayoutDashboard, roles: ['admin', 'client'] },
  distribution: { label: 'Ops Dashboard', section: 'Overview', icon: Icons.Activity, roles: ['distribution'] },
  'delivery-dash': { label: 'Ops Dashboard', section: 'Overview', icon: Icons.Target, roles: ['delivery'] },
  'distro-tracker': { label: 'Ops Tracker', section: 'Overview', icon: Icons.CalendarCheck, roles: ['distribution'] },
  'delivery-tracker': { label: 'Ops Tracker', section: 'Overview', icon: Icons.CalendarCheck, roles: ['delivery'] },
  tracker:     { label: 'Execution Tracker', section: 'Overview', icon: Icons.ClipboardList, roles: ['admin', 'client'] },
  scraper:     { label: 'Scraper', section: 'Distribution Hub', icon: Icons.Search, roles: ['distribution', 'admin'] },
  prospects:   { label: 'Prospects', section: 'Distribution Hub', icon: Icons.Users, roles: ['admin', 'distribution'] },
  outreach:     { label: 'Outreach', section: 'Distribution Hub', icon: Icons.MessageSquare, roles: ['distribution', 'admin'] },
  crm:         { label: 'CRM Pipeline', section: 'Distribution Hub', icon: Icons.LayoutDashboard, roles: ['admin', 'distribution'] },
  clients:     { label: 'Clients', section: 'Distribution Hub', icon: Icons.Briefcase, roles: ['admin', 'delivery'] },
  studio:     { label: 'MJR Studio', section: 'Delivery Tools', icon: Icons.FileText, roles: ['distribution', 'admin', 'delivery'] },
  html:       { label: 'PDF Tool', section: 'Delivery Tools', icon: Icons.Printer, roles: ['admin', 'distribution'] },
  spoa:       { label: 'SPOA Studio', section: 'Delivery Tools', icon: Icons.Target, roles: ['admin', 'distribution'] },
  content:    { label: 'Content Hub', section: 'Delivery Tools', icon: Icons.Video, roles: ['admin', 'distribution', 'delivery'] },
  sprints:     { label: 'Proof Sprint', section: 'Delivery Engine', icon: Icons.Zap, roles: ['admin', 'delivery'] },
  proof:     { label: 'Proof Brand', section: 'Delivery Engine', icon: Icons.BookOpen, roles: ['admin', 'delivery'], file: 'ProofBrand' },
  authority: { label: 'Authority Brand', section: 'Delivery Engine', icon: Icons.Shield, roles: ['admin', 'delivery'], file: 'AuthorityBrand' },
  sops:     { label: 'SOP Library', section: 'Build', icon: Icons.BookOpen, roles: ['admin', 'distribution', 'delivery'] },
  templates: { label: 'Templates', section: 'Build', icon: Icons.FileCode, roles: ['admin', 'distribution', 'delivery'] },
  
  // ADDED: Template View Utility (Hidden from sidebar by using an empty section if needed)
  'template-view': { 
    label: 'Template Viewer', 
    section: 'System', 
    icon: Icons.Eye, 
    roles: ['admin', 'distribution', 'delivery'], 
    file: 'TemplateView' 
  },

  income: { label: 'Capital Flow', section: 'Finance', icon: Icons.Activity, roles: ['admin'], file: 'IncomeTracking' },
  finance: { label: 'MRR Dashboard', section: 'Finance', icon: Icons.BarChart3, roles: ['admin'] },
  admin: { label: 'Command Center', section: 'System', icon: Icons.Shield, roles: ['admin'], file: 'AdminControl' },
  brain: { label: 'AA Ai', section: 'System', icon: Icons.BrainIcon, roles: ['admin', 'distribution', 'delivery'] },
};
