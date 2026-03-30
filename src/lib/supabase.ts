import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

/**
 * DATABASE TYPE AUGMENTATION
 * Manually adding 'app_files' to the Database type until types are re-generated.
 */

export interface AppFile {
  id: string;
  created_at: string;
  file_name: string;
  file_path: string;
  file_type: string;
  associated_sop_id: string;
  uploaded_by?: string | null;
}

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
    };
  };
};

export const supabase = createClient<ExtendedDatabase>(supabaseUrl, supabaseKey)

/**

 * PROSPECT INTERFACE

 */

type BaseProspect = Database['public']['Tables']['prospects']['Row'];



// 1. Identify fields that cause conflicts or are missing from base types

type OverriddenFields = 

  | 'pipeline_stage' 

  | 'is_archived' 

  | 'mjr_link' 

  | 'spoa_delivered_at' 

  | 'mjr_delivered_at'

  | 'target_date'

  | 'suburb'

  | 'vertical'

  | 'icp_total_score';



// 2. Create the Clean Interface

export interface Prospect extends Omit<BaseProspect, OverriddenFields> {

  // New Tracking & Daily Logic Fields

  target_date?: string | null;

  spoa_delivered_at?: string | null;

  mjr_delivered_at?: string | null;

  

  // Pipeline & Status

  pipeline_stage?: string | null;

  is_archived?: boolean | null;

  

  // Data Fields used in Outreach/CRM

  suburb?: string | null;

  vertical?: string | null;

  icp_total_score?: number | null;



  // Legacy & UI-only optional fields

  meta_ads_running?: boolean | null;

  ig_follower_count?: number | null;

  mjr_missed_revenue?: number | null;

  mjr_link?: string | null;

  q_visual?: boolean | null;

  q_high_ticket?: boolean | null;

  q_owner_op?: boolean | null;

  q_referral?: boolean | null;

  q_weak_digital?: boolean | null;

  

  // Sequence Tracking

  msg_1_sent?: boolean | null;

  msg_2_sent?: boolean | null;

  msg_3_sent?: boolean | null;

  msg_4_sent?: boolean | null;

  msg_5_sent?: boolean | null;

}



// NEW: AppFile Interface

// This represents a row in your new 'app_files' Supabase table

export type AppFile = {

  id: string;

  created_at: string;

  file_name: string;

  file_path: string; // This will store the public URL from Supabase Storage

  file_type: string;

  associated_sop_id: string; // Foreign key linking to the 'sops' table

  uploaded_by?: string; // Optional: UUID of the user who uploaded the file

};



export type Ledger = Database['public']['Tables']['ledger']['Row']

export type Client = Database['public']['Tables']['clients']['Row']

export type ProofSprint = Database['public']['Tables']['proof_sprints']['Row']

export type Task = Database['public']['Tables']['tasks']['Row']

export type MonthlyRevenue = Database['public']['Tables']['monthly_revenue']['Row']



// Updated Sop type to include the files array

export type Sop = Database['public']['Tables']['sops']['Row'] & {

  files?: AppFile[]; // Attach associated files to the SOP

}



export type OutreachMessage = Database['public']['Tables']['outreach_messages']['Row']



export type IcpTier = '★★★' | '★★' | '★' | 'unscored'



export type ProspectStatus =

  | 'new' | 'contacted' | 'mjr_sent' | 'mjr_opened'

  | 'call_booked' | 'call_completed' | 'sprint_active'

  | 'sprint_complete' | 'results_meeting'

  | 'closed_won' | 'closed_lost' | 'archived'
