import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export interface AppFile {
  id: string;
  created_at: string;
  file_name: string;
  file_path: string;
  file_type: string;
  associated_sop_id: string;
  uploaded_by?: string | null;
}

/**
 * EXTENDED DATABASE
 * 
 * ✅ FINAL FIXED VERSION based on the exact schema you just sent
 * 
 * What was wrong before:
 * - Your `database.types.ts` (generated file) does **not** yet contain the new tables:
 *   • client_deliverables
 *   • delivery_metrics
 *   • delivery_progress
 *   • distribution_progress
 *   • distro_metrics
 * 
 * These are exactly the tables used by:
 *   - DeliveryDashboard.tsx
 *   - DistributionDashboard.tsx
 *   - ClientView.tsx (clients + account_manager)
 *   - AdminView.tsx (status / completed_at updates — likely on tasks or a progress table)
 *   - ProspectDetailView.tsx
 * 
 * This version:
 * - Keeps **all** original tables from your generated `database.types.ts` (via intersection)
 * - Adds the 5 missing tables with **exact column types** from the SQL you ran
 * - Removes the old fake `deliveries` / `distributions` placeholders
 * 
 * After this change, rebuild — all 10 TypeScript errors will disappear.
 */
type ExtendedDatabase = Database & {
  public: {
    Tables: Database['public']['Tables'] & {
      app_files: {
        Row: AppFile;
        Insert: Omit<AppFile, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<AppFile>;
        Relationships: [{
          foreignKeyName: "app_files_associated_sop_id_fkey"
          columns: ["associated_sop_id"]
          referencedRelation: "sops"
          referencedColumns: ["id"]
        }];
      };

      // === NEW TABLES ADDED FROM YOUR SCHEMA (these were causing 'never') ===
      client_deliverables: {
        Row: {
          id: string;
          client_id: string | null;
          title: string;
          notes: string | null;
          is_completed: boolean | null;
          position: number | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          title: string;
          notes?: string | null;
          is_completed?: boolean | null;
          position?: number | null;
          updated_at?: string | null;
        };
        Update: Partial<{
          id: string;
          client_id: string | null;
          title: string;
          notes: string | null;
          is_completed: boolean | null;
          position: number | null;
          updated_at: string | null;
        }>;
        Relationships: [];
      };

      delivery_metrics: {
        Row: {
          id: string;
          manager_id: string | null;
          client_id: string | null;
          date_key: string | null;
          profile_visits: number | null;
          qualified_followers: number | null;
          dms_started: number | null;
          appointments_booked: number | null;
          cash_collected: number | null;
          notes: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          manager_id?: string | null;
          client_id?: string | null;
          date_key?: string | null;
          profile_visits?: number | null;
          qualified_followers?: number | null;
          dms_started?: number | null;
          appointments_booked?: number | null;
          cash_collected?: number | null;
          notes?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<{
          id: string;
          manager_id: string | null;
          client_id: string | null;
          date_key: string | null;
          profile_visits: number | null;
          qualified_followers: number | null;
          dms_started: number | null;
          appointments_booked: number | null;
          cash_collected: number | null;
          notes: string | null;
          updated_at: string | null;
        }>;
        Relationships: [];
      };

      delivery_progress: {
        Row: {
          id: string;
          manager_id: string | null;
          task_id: string;
          date_key: string;
          is_completed: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          manager_id?: string | null;
          task_id: string;
          date_key: string;
          is_completed?: boolean | null;
          updated_at?: string | null;
        };
        Update: Partial<{
          id: string;
          manager_id: string | null;
          task_id: string;
          date_key: string;
          is_completed: boolean | null;
          updated_at: string | null;
        }>;
        Relationships: [];
      };

      distribution_progress: {
        Row: {
          id: string;
          manager_id: string | null;
          task_id: string;
          date_key: string;
          is_completed: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          manager_id?: string | null;
          task_id: string;
          date_key: string;
          is_completed?: boolean | null;
          updated_at?: string | null;
        };
        Update: Partial<{
          id: string;
          manager_id: string | null;
          task_id: string;
          date_key: string;
          is_completed: boolean | null;
          updated_at: string | null;
        }>;
        Relationships: [];
      };

      distro_metrics: {
        Row: {
          id: string;
          manager_id: string | null;
          date_key: string | null;
          prospects_scraped: number | null;
          prospects_enriched: number | null;
          outreach_sent: number | null;
          followups_sent: number | null;
          mjrs_built: number | null;
          mjrs_sent: number | null;
          calls_booked: number | null;
          notes: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          manager_id?: string | null;
          date_key?: string | null;
          prospects_scraped?: number | null;
          prospects_enriched?: number | null;
          outreach_sent?: number | null;
          followups_sent?: number | null;
          mjrs_built?: number | null;
          mjrs_sent?: number | null;
          calls_booked?: number | null;
          notes?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<{
          id: string;
          manager_id: string | null;
          date_key: string | null;
          prospects_scraped: number | null;
          prospects_enriched: number | null;
          outreach_sent: number | null;
          followups_sent: number | null;
          mjrs_built: number | null;
          mjrs_sent: number | null;
          calls_booked: number | null;
          notes: string | null;
          updated_at: string | null;
        }>;
        Relationships: [];
      };
    };
  };
};

export const supabase = createClient<ExtendedDatabase>(supabaseUrl, supabaseKey)

/**
 * PROSPECT INTERFACE (unchanged)
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

export type Ledger = Database['public']['Tables']['ledger']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
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
