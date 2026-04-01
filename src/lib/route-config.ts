import * as Icons from 'lucide-react';

export interface RouteMetadata {
  path: string;
  label: string;
  section: string;
  icon: any;
  roles?: string[];
  /** Hides route from sidebar nav but keeps it routable */
  hidden?: boolean;
  /** Page filename (without .tsx) when it differs from the route key */
  file?: string;
}

export const ROUTE_CONFIG: Record<string, Omit<RouteMetadata, 'path'>> = {
  // Unified traffic-controller routes — Dashboard.tsx and Tracker.tsx switch on role internally
  dashboard: { label: 'Dashboard', section: 'Overview', icon: Icons.LayoutDashboard, roles: ['admin', 'distribution', 'delivery', 'client'] },
  tracker:   { label: 'Execution Tracker', section: 'Overview', icon: Icons.ClipboardList, roles: ['admin', 'distribution', 'delivery', 'client'] },
  scraper:     { label: 'Scraper', section: 'Distribution Hub', icon: Icons.Search, roles: ['distribution', 'admin'] },
  prospects:   { label: 'Prospects', section: 'Distribution Hub', icon: Icons.Users, roles: ['admin', 'distribution'] },
  outreach:     { label: 'Outreach', section: 'Distribution Hub', icon: Icons.MessageSquare, roles: ['distribution', 'admin'] },
  crm:         { label: 'CRM Pipeline', section: 'Distribution Hub', icon: Icons.LayoutDashboard, roles: ['admin', 'distribution'] },
  clients:     { label: 'Clients', section: 'Distribution Hub', icon: Icons.Briefcase, roles: ['admin', 'delivery'] },
  deliveryportal: { label: 'Client Portal', section: 'Delivery Tools', icon: Icons.FolderOpen, roles: ['admin', 'delivery'], file: 'DeliveryPortal' },
  studio:     { label: 'MJR Studio', section: 'Delivery Tools', icon: Icons.FileText, roles: ['distribution', 'admin', 'delivery'] },
  html:       { label: 'PDF Tool', section: 'Delivery Tools', icon: Icons.Printer, roles: ['admin', 'distribution'] },
  spoa:       { label: 'SPOA Studio', section: 'Delivery Tools', icon: Icons.Target, roles: ['admin', 'distribution'] },
  content:    { label: 'Content Hub', section: 'Delivery Tools', icon: Icons.Video, roles: ['admin', 'distribution', 'delivery'] },
  sprints:     { label: 'Proof Sprint', section: 'Delivery Engine', icon: Icons.Zap, roles: ['admin', 'delivery'] },
  proof:     { label: 'Proof Brand', section: 'Delivery Engine', icon: Icons.BookOpen, roles: ['admin', 'delivery'], file: 'ProofBrand' },
  authority: { label: 'Authority Brand', section: 'Delivery Engine', icon: Icons.Shield, roles: ['admin', 'delivery'], file: 'AuthorityBrand' },
  sops:     { label: 'SOP Library', section: 'Build', icon: Icons.BookOpen, roles: ['admin', 'distribution', 'delivery'] },
  templates: { label: 'Templates', section: 'Build', icon: Icons.FileCode, roles: ['admin', 'distribution', 'delivery'] },
  
  'template-view': {
    label: 'Template Viewer',
    section: 'System',
    icon: Icons.Eye,
    roles: ['admin', 'distribution', 'delivery'],
    hidden: true,
    file: 'TemplateView'
  },

  income: { label: 'Capital Flow', section: 'Finance', icon: Icons.Activity, roles: ['admin'], file: 'IncomeTracking' },
  finance: { label: 'MRR Dashboard', section: 'Finance', icon: Icons.BarChart3, roles: ['admin'] },
  admin: { label: 'Command Center', section: 'System', icon: Icons.Shield, roles: ['admin'], file: 'AdminControl' },
  brain: { label: 'AA Ai', section: 'System', icon: Icons.BrainIcon, roles: ['admin', 'distribution', 'delivery'] },
};
