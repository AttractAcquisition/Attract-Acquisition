import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

/**
 * APP FILES INTERFACE
 * Matches the provided schema for the 'app_files' table
 */
export interface AppFile {
  id: string;
  created_at: string | null;
  file_name: string;
  file_path: string;
  file_type: string | null;
  associated_sop_id: string;
  uploaded_by: string | null;
}

/**
 * EXTENDED DATABASE
 * Augments the generated types with the specific fields identified in your schema
 * to resolve the 'never' type errors in Admin and Dashboard views.
 */
type ExtendedDatabase = Database & {
  public: {
    Tables: {
      app_files: {
        Row: AppFile;
        Insert: Omit<AppFile, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<AppFile>;
        Relationships: [
          {
            foreignKeyName: "app_files_associated_sop_id_fkey"
            columns: ["associated_sop_id"]
            referencedRelation: "sops"
            referencedColumns: ["id"]
          }
        ];
      };
      // Ensuring these tables are recognized with their specific schema columns
      clients: Database['public']['Tables']['clients'] & {
        Row: Database['public']['Tables']['clients']['Row'] & {
          account_manager: string | null;
          distribution_manager: string | null;
          delivery_manager: string | null;
        }
      };
      prospects: Database['public']['Tables']['prospects'];
      sops: Database['public']['Tables']['sops'];
    };
  };
};

export const supabase = createClient<ExtendedDatabase>(supabaseUrl, supabaseKey)

/**
 * PROSPECT INTERFACE
 * Custom frontend interface for outreach logic
 */
type BaseProspect = Database['public']['Tables']['prospects']['Row'];

type OverriddenFields = 
  | 'pipeline_stage' | 'is_archived' | 'mjr_link' 
  | 'spoa_delivered_at' | 'mjr_delivered_at' | 'target_date'
  | 'suburb' | 'vertical' | 'icp_total_score';

export interface Prospect extends Omit<BaseProspect, OverriddenFields> {
  target_date?: string | null;
  spoa_delivered_at?: string | null;
  mjr_delivered_at?: string | null;
  pipeline_stage?: string | null;
  is_archived?: boolean | null;
  suburb?: string | null;
  vertical?: string | null;
  icp_total_score?: number | null;
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
}

/**
 * SHARED TYPES
 */
export type Ledger = Database['public']['Tables']['ledger']['Row']
export type Client = ExtendedDatabase['public']['Tables']['clients']['Row']
export type ProofSprint = Database['public']['Tables']['proof_sprints']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type MonthlyRevenue = Database['public']['Tables']['monthly_revenue']['Row']
export type OutreachMessage = Database['public']['Tables']['outreach_messages']['Row']

export type Sop = Database['public']['Tables']['sops']['Row'] & {
  files?: AppFile[];
}

export type IcpTier = '★★★' | '★★' | '★' | 'unscored'

export type ProspectStatus =
  | 'new' | 'contacted' | 'mjr_sent' | 'mjr_opened'
  | 'call_booked' | 'call_completed' | 'sprint_active'
  | 'sprint_complete' | 'results_meeting'
  | 'closed_won' | 'closed_lost' | 'archived'
