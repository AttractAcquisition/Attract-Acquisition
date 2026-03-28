import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)

/**
 * PROSPECT INTERFACE
 */
type BaseProspect = Database['public']['Tables']['prospects']['Row'];

// 1. Identify fields that cause conflicts (add any field that TypeScript complains about here)
type OverriddenFields = 
  | 'pipeline_stage' 
  | 'is_archived' 
  | 'mjr_link' 
  | 'spoa_delivered_at' 
  | 'mjr_delivered_at';

// 2. Create the Clean Interface
export interface Prospect extends Omit<BaseProspect, OverriddenFields> {
  // New Tracking Fields
  spoa_delivered_at?: string | null;
  mjr_delivered_at?: string | null;

  // Legacy & UI-only optional fields
  pipeline_stage?: string | null;
  meta_ads_running?: boolean | null;
  ig_follower_count?: number | null;
  mjr_missed_revenue?: number | null;
  mjr_link?: string | null;
  q_visual?: boolean | null;
  q_high_ticket?: boolean | null;
  q_owner_op?: boolean | null;
  q_referral?: boolean | null;
  q_weak_digital?: boolean | null;
  msg_1_sent?: boolean | null;
  msg_2_sent?: boolean | null;
  msg_3_sent?: boolean | null;
  msg_4_sent?: boolean | null;
  msg_5_sent?: boolean | null;
  is_archived?: boolean | null;
}

export type Ledger = Database['public']['Tables']['ledger']['Row']
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
