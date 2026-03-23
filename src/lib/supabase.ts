import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types' // <- import supabase-generated types

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// Use type aliases from Database
export type Client = Database['public']['Tables']['clients']['Row']
export type Prospect = Database['public']['Tables']['prospects']['Row']
export type ProofSprint = Database['public']['Tables']['proof_sprints']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type MonthlyRevenue = Database['public']['Tables']['monthly_revenue']['Row']
export type Sop = Database['public']['Tables']['sops']['Row']
export type OutreachMessage = Database['public']['Tables']['outreach_messages']['Row']

// Your enums/types not in DB can stay
export type IcpTier = '★★★' | '★★' | '★' | 'unscored'

export type ProspectStatus =
  | 'new' | 'contacted' | 'mjr_sent' | 'mjr_opened'
  | 'call_booked' | 'call_completed' | 'sprint_active'
  | 'sprint_complete' | 'results_meeting'
  | 'closed_won' | 'closed_lost' | 'archived'