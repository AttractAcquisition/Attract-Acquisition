import { createClient } from '@supabase/supabase-js'
import type { Database as DatabaseSchema } from './database.types'

// 1. ADD THIS LINE: This makes the Database type visible to your entire app
export type Database = DatabaseSchema

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseKey
)

/**
 * TYPES (clean + derived from schema)
 */

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
export type PortalTask     = Database['public']['Tables']['portal_tasks']['Row']
export type PortalDocument = Database['public']['Tables']['portal_documents']['Row']
export type PortalMessage  = Database['public']['Tables']['portal_messages']['Row']

// 2. ADD THIS: Since you'll likely need it for the Ledger form later
export type LedgerInsert = Database['public']['Tables']['ledger']['Insert']

export type Sop = Database['public']['Tables']['sops']['Row'] & {
  files: any[]
}

// Insert types
export type InsertClient = Database['public']['Tables']['clients']['Insert']
export type InsertProspect = Database['public']['Tables']['prospects']['Insert']
export type InsertDeliverable = Database['public']['Tables']['client_deliverables']['Insert']

// Update types
export type UpdateClient = Database['public']['Tables']['clients']['Update']
export type UpdateDeliverable = Database['public']['Tables']['client_deliverables']['Update']
