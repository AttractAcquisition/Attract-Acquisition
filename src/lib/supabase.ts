import { createClient } from '@supabase/supabase-js'
import type { Database, Tables } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseKey
)

// Custom app enums (these are fine to keep)
export type IcpTier = '★★★' | '★★' | '★' | 'unscored'

// DB-backed types (source of truth)
export type Client = Tables<'clients'>
export type Prospect = Tables<'prospects'>
export type ProofSprint = Tables<'proof_sprints'>
export type Task = Tables<'tasks'>
export type MonthlyRevenue = Tables<'monthly_revenue'>
export type Sop = Tables<'sops'>
export type OutreachMessage = Tables<'outreach_messages'>