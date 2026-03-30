import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseKey
)

/**
 * TYPES (clean + derived from schema)
 */

// Example: strongly typed rows
export type Client = Database['public']['Tables']['clients']['Row']
export type Prospect = Database['public']['Tables']['prospects']['Row']
export type AppFile = Database['public']['Tables']['app_files']['Row']
export type Deliverable = Database['public']['Tables']['client_deliverables']['Row']
export type DeliveryMetric = Database['public']['Tables']['delivery_metrics']['Row']
export type DeliveryProgress = Database['public']['Tables']['delivery_progress']['Row']
export type DistributionProgress = Database['public']['Tables']['distribution_progress']['Row']
export type DistroMetric = Database['public']['Tables']['distro_metrics']['Row']
export type Ledger = Database['public']['Tables']['ledger']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']

export type Sop = Database['public']['Tables']['sops']['Row'] & {
  files: any[]
}

// Insert types (VERY useful for forms / mutations)
export type InsertClient = Database['public']['Tables']['clients']['Insert']
export type InsertProspect = Database['public']['Tables']['prospects']['Insert']
export type InsertDeliverable = Database['public']['Tables']['client_deliverables']['Insert']

// Update types
export type UpdateClient = Database['public']['Tables']['clients']['Update']
export type UpdateDeliverable = Database['public']['Tables']['client_deliverables']['Update']
