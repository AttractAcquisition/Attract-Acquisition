import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)

/**
 * PROSPECT INTERFACE
 * We Omit all manually managed fields from the base Row type first.
 * This prevents "Incompatible Types" errors when we mark them as optional (?).
 */
type BaseProspect = Database['public']['Tables']['prospects']['Row'];

export interface Prospect extends Omit<BaseProspect, 
  | 'pipeline_stage' 
  | 'icp_tier' 
  | 'icp_total_score' 
  | 'meta_ads_running' 
  | 'ig_follower_count' 
  | 'mjr_missed_revenue' 
  | 'mjr_link'
  | 'q_visual'
  | 'q_high_ticket'
  | 'q_owner_op'
  | 'q_referral'
  | 'q_weak_digital'
  | 'msg_1_sent'
  | 'msg_2_sent'
  | 'msg_3_sent'
  | 'msg_4_sent'
  | 'msg_5_sent'
> {
  // Core Pipeline (Optional for UI flexibility)
  pipeline_stage?: string | null;
  icp_tier?: string | null;
  icp_total_score?: number | null;
  
  // Digital Presence
  meta_ads_running?: boolean | null;
  ig_follower_count?: number | null;
  
  // MJR Data
  mjr_missed_revenue?: number | null;
  mjr_link?: string | null;
  
  // Qualification Checkboxes
  q_visual?: boolean | null;
  q_high_ticket?: boolean | null;
  q_owner_op?: boolean | null;
  q_referral?: boolean | null;
  q_weak_digital?: boolean | null;
  
  // Outreach Tracker
  msg_1_sent?: boolean | null;
  msg_2_sent?: boolean | null;
  msg_3_sent?: boolean | null;
  msg_4_sent?: boolean | null;
  msg_5_sent?: boolean | null;
}

export type Client = Database['public']['Tables']['clients']['Row']
export type ProofSprint = Database['public']['Tables']['proof_sprints']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type MonthlyRevenue = Database['public']['Tables']['monthly_revenue']['Row']
export type Sop = Database['public']['Tables']['sops']['Row']
export type OutreachMessage = Database['public']['Tables']['outreach_messages']['Row']

export type IcpTier = '★★★' | '★★' | '★' | 'unscored'

export type ProspectStatus =
  | 'new' | 'contacted' | 'mjr_sent' | 'mjr_opened'
  | 'call_booked' | 'call_completed' | 'sprint_active'
  | 'sprint_complete' | 'results_meeting'
  | 'closed_won' | 'closed_lost' | 'archived'