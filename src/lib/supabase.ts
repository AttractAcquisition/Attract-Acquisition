import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseKey)

export type IcpTier = '★★★' | '★★' | '★' | 'unscored'

export type ProspectStatus =
  | 'new' | 'contacted' | 'mjr_sent' | 'mjr_opened'
  | 'call_booked' | 'call_completed' | 'sprint_active'
  | 'sprint_complete' | 'results_meeting'
  | 'closed_won' | 'closed_lost' | 'archived'

export interface Prospect {
  id: string
  created_at: string
  business_name: string
  owner_name?: string
  vertical?: string
  city?: string
  suburb?: string
  phone?: string
  whatsapp?: string
  email?: string
  website?: string
  instagram_handle?: string
  instagram_followers?: number
  instagram_last_post_date?: string
  google_rating?: number
  google_review_count?: number
  has_meta_ads?: boolean
  score_visual_transformability?: number
  score_ticket_size?: number
  score_owner_accessibility?: number
  score_digital_weakness?: number
  score_growth_hunger?: number
  icp_total_score?: number
  icp_tier?: IcpTier
  mjr_estimated_monthly_missed_revenue?: number
  mjr_notes?: string
  mjr_delivered_at?: string
  status: ProspectStatus
  assigned_to?: string
  priority_cohort?: string
  data_source?: string
}

export interface Client {
  id: string
  created_at: string
  prospect_id?: string
  business_name: string
  owner_name: string
  phone?: string
  whatsapp?: string
  email?: string
  tier?: 'proof_brand' | 'authority_brand'
  setup_fee?: number
  monthly_retainer?: number
  contract_start_date?: string
  contract_end_date?: string
  status: 'active' | 'paused' | 'churned' | 'upsold'
  meta_ad_account_id?: string
  monthly_ad_spend?: number
  account_manager?: string
  client_delivery_va?: string
  last_results_meeting?: string
  churn_risk_flag?: boolean
  upsell_ready_flag?: boolean
  notes?: string
}

export interface ProofSprint {
  id: string
  created_at: string
  client_id: string
  prospect_id?: string
  sprint_number?: number
  start_date: string
  status: 'setup' | 'active' | 'results_meeting' | 'closed_won' | 'closed_lost'
  client_ad_budget?: number
  actual_ad_spend?: number
  total_reach?: number
  total_impressions?: number
  link_clicks?: number
  leads_generated?: number
  cpl?: number
  bookings_from_sprint?: number
  revenue_attributed?: number
  roas?: number
  results_meeting_date?: string
  results_meeting_outcome?: string
  close_notes?: string
}

export interface Task {
  id: string
  created_at: string
  due_date: string
  month_key: string
  category: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'complete' | 'deferred' | 'dropped'
  completed_at?: string
  assigned_to?: string
  is_milestone?: boolean
  milestone_label?: string
  notes?: string
}

export interface MonthlyRevenue {
  id: string
  month: string
  active_client_count?: number
  gross_mrr?: number
  setup_fees_collected?: number
  va_costs?: number
  tool_costs?: number
  ad_infrastructure_costs?: number
  other_costs?: number
  principal_draw?: number
  trust_deployment?: number
  schedule_d_mrr_target?: number
  trust_balance_end?: number
  personal_cash_balance?: number
  notes?: string
}

export interface Sop {
  id: string
  created_at: string
  updated_at: string
  sop_number: number
  title: string
  category?: string
  status: 'draft' | 'active' | 'archived'
  version?: string
  content?: string
  last_reviewed_at?: string
  reviewed_by?: string
}

export interface OutreachMessage {
  id: string
  created_at: string
  prospect_id: string
  message_type: string
  channel: string
  message_body?: string
  sent_at?: string
  sent_by?: string
  response_received?: boolean
  response_text?: string
  response_at?: string
  outcome?: string
}
