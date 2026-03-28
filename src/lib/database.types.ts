export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ledger: {
        Row: {
          id: string
          created_at: string
          amount: number
          category: string
          type: string
          description: string | null
          date: string
        }
        Insert: {
          id?: string
          created_at?: string
          amount: number
          category: string
          type: string
          description?: string | null
          date: string
        }
        Update: {
          id?: string
          created_at?: string
          amount?: number
          category?: string
          type?: string
          description?: string | null
          date?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          account_manager: string | null
          business_name: string
          churn_risk_flag: boolean | null
          client_delivery_va: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string | null
          email: string | null
          id: string
          last_results_meeting: string | null
          meta_ad_account_id: string | null
          meta_pixel_id: string | null
          monthly_ad_spend: number | null
          monthly_retainer: number | null
          notes: string | null
          owner_name: string
          phone: string | null
          portal_login_email: string | null
          prospect_id: string | null
          setup_fee: number | null
          status: string | null
          tier: string | null
          updated_at: string | null
          upsell_ready_flag: boolean | null
          whatsapp: string | null
        }
        Insert: {
          account_manager?: string | null
          business_name: string
          churn_risk_flag?: boolean | null
          client_delivery_va?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_results_meeting?: string | null
          meta_ad_account_id?: string | null
          meta_pixel_id?: string | null
          monthly_ad_spend?: number | null
          monthly_retainer?: number | null
          notes?: string | null
          owner_name: string
          phone?: string | null
          portal_login_email?: string | null
          prospect_id?: string | null
          setup_fee?: number | null
          status?: string | null
          tier?: string | null
          updated_at?: string | null
          upsell_ready_flag?: boolean | null
          whatsapp?: string | null
        }
        Update: {
          account_manager?: string | null
          business_name?: string
          churn_risk_flag?: boolean | null
          client_delivery_va?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_results_meeting?: string | null
          meta_ad_account_id?: string | null
          meta_pixel_id?: string | null
          monthly_ad_spend?: number | null
          monthly_retainer?: number | null
          notes?: string | null
          owner_name?: string
          phone?: string | null
          portal_login_email?: string | null
          prospect_id?: string | null
          setup_fee?: number | null
          status?: string | null
          tier?: string | null
          updated_at?: string | null
          upsell_ready_flag?: boolean | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_revenue: {
        Row: {
          active_client_count: number | null
          ad_infrastructure_costs: number | null
          gross_mrr: number | null
          id: string
          month: string
          notes: string | null
          other_costs: number | null
          personal_cash_balance: number | null
          principal_draw: number | null
          schedule_d_mrr_target: number | null
          setup_fees_collected: number | null
          tool_costs: number | null
          trust_balance_end: number | null
          trust_balance_start: number | null
          trust_deployment: number | null
          va_costs: number | null
        }
        Insert: {
          active_client_count?: number | null
          ad_infrastructure_costs?: number | null
          gross_mrr?: number | null
          id?: string
          month: string
          notes?: string | null
          other_costs?: number | null
          personal_cash_balance?: number | null
          principal_draw?: number | null
          schedule_d_mrr_target?: number | null
          setup_fees_collected?: number | null
          tool_costs?: number | null
          trust_balance_end?: number | null
          trust_balance_start?: number | null
          trust_deployment?: number | null
          va_costs?: number | null
        }
        Update: {
          active_client_count?: number | null
          ad_infrastructure_costs?: number | null
          gross_mrr?: number | null
          id?: string
          month?: string
          notes?: string | null
          other_costs?: number | null
          personal_cash_balance?: number | null
          principal_draw?: number | null
          schedule_d_mrr_target?: number | null
          setup_fees_collected?: number | null
          tool_costs?: number | null
          trust_balance_end?: number | null
          trust_balance_start?: number | null
          trust_deployment?: number | null
          va_costs?: number | null
        }
        Relationships: []
      }
      outreach_messages: {
        Row: {
          batch_id: string | null
          channel: string | null
          created_at: string | null
          follow_up_count: number | null
          id: string
          last_contact: string | null
          message_body: string | null
          message_type: string | null
          outcome: string | null
          prospect_id: string | null
          response_at: string | null
          response_received: boolean | null
          response_text: string | null
          sent_at: string | null
          sent_by: string | null
        }
        Insert: {
          batch_id?: string | null
          channel?: string | null
          created_at?: string | null
          follow_up_count?: number | null
          id?: string
          last_contact?: string | null
          message_body?: string | null
          message_type?: string | null
          outcome?: string | null
          prospect_id?: string | null
          response_at?: string | null
          response_received?: boolean | null
          response_text?: string | null
          sent_at?: string | null
          sent_by?: string | null
        }
        Update: {
          batch_id?: string | null
          channel?: string | null
          created_at?: string | null
          follow_up_count?: number | null
          id?: string
          last_contact?: string | null
          message_body?: string | null
          message_type?: string | null
          outcome?: string | null
          prospect_id?: string | null
          response_at?: string | null
          response_received?: boolean | null
          response_text?: string | null
          sent_at?: string | null
          sent_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_messages_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      proof_sprints: {
        Row: {
          actual_ad_spend: number | null
          bookings_from_sprint: number | null
          client_ad_budget: number | null
          client_id: string | null
          client_name: string | null
          close_notes: string | null
          content_pieces: Json | null
          created_at: string | null
          day7_notes: string | null
          day7_sentiment: string | null
          id: string
          leads_generated: number | null
          link_clicks: number | null
          prospect_id: string | null
          results_meeting_date: string | null
          results_meeting_outcome: string | null
          revenue_attributed: number | null
          sprint_number: number | null
          start_date: string
          status: string | null
          talking_points: string | null
          total_impressions: number | null
          total_reach: number | null
          vertical: string | null
        }
        Insert: {
          actual_ad_spend?: number | null
          bookings_from_sprint?: number | null
          client_ad_budget?: number | null
          client_id?: string | null
          client_name?: string | null
          close_notes?: string | null
          content_pieces?: Json | null
          created_at?: string | null
          day7_notes?: string | null
          day7_sentiment?: string | null
          id?: string
          leads_generated?: number | null
          link_clicks?: number | null
          prospect_id?: string | null
          results_meeting_date?: string | null
          results_meeting_outcome?: string | null
          revenue_attributed?: number | null
          sprint_number?: number | null
          start_date: string
          status?: string | null
          talking_points?: string | null
          total_impressions?: number | null
          total_reach?: number | null
          vertical?: string | null
        }
        Update: {
          actual_ad_spend?: number | null
          bookings_from_sprint?: number | null
          client_ad_budget?: number | null
          client_id?: string | null
          client_name?: string | null
          close_notes?: string | null
          content_pieces?: Json | null
          created_at?: string | null
          day7_notes?: string | null
          day7_sentiment?: string | null
          id?: string
          leads_generated?: number | null
          link_clicks?: number | null
          prospect_id?: string | null
          results_meeting_date?: string | null
          results_meeting_outcome?: string | null
          revenue_attributed?: number | null
          sprint_number?: number | null
          start_date?: string
          status?: string | null
          talking_points?: string | null
          total_impressions?: number | null
          total_reach?: number | null
          vertical?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proof_sprints_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proof_sprints_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects: {
        Row: {
          address: string | null
          apify_run_id: string | null
          assigned_to: string | null
          business_name: string
          city: string | null
          created_at: string | null
          data_source: string | null
          email: string | null
          google_rating: number | null
          google_review_count: number | null
          has_meta_ads: boolean | null
          icp_tier: string | null
          icp_total_score: number | null
          id: string
          instagram_followers: number | null
          instagram_handle: string | null
          instagram_last_post_date: string | null
          last_scraped_at: string | null
          mjr_delivered_at: string | null
          mjr_estimated_monthly_missed_revenue: number | null
          mjr_notes: string | null
          owner_name: string | null
          phone: string | null
          priority_cohort: string | null
          score_digital_weakness: number | null
          score_growth_hunger: number | null
          score_owner_accessibility: number | null
          score_ticket_size: number | null
          score_visual_transformability: number | null
          status: string | null
          suburb: string | null
          updated_at: string | null
          vertical: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          apify_run_id?: string | null
          assigned_to?: string | null
          business_name: string
          city?: string | null
          created_at?: string | null
          data_source?: string | null
          email?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          has_meta_ads?: boolean | null
          icp_tier?: string | null
          icp_total_score?: number | null
          id?: string
          instagram_followers?: number | null
          instagram_handle?: string | null
          instagram_last_post_date?: string | null
          last_scraped_at?: string | null
          mjr_delivered_at?: string | null
          mjr_estimated_monthly_missed_revenue?: number | null
          mjr_notes?: string | null
          owner_name?: string | null
          phone?: string | null
          priority_cohort?: string | null
          score_digital_weakness?: number | null
          score_growth_hunger?: number | null
          score_owner_accessibility?: number | null
          score_ticket_size?: number | null
          score_visual_transformability?: number | null
          status?: string | null
          suburb?: string | null
          updated_at?: string | null
          vertical?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          apify_run_id?: string | null
          assigned_to?: string | null
          business_name?: string
          city?: string | null
          created_at?: string | null
          data_source?: string | null
          email?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          has_meta_ads?: boolean | null
          icp_tier?: string | null
          icp_total_score?: number | null
          id?: string
          instagram_followers?: number | null
          instagram_handle?: string | null
          instagram_last_post_date?: string | null
          last_scraped_at?: string | null
          mjr_delivered_at?: string | null
          mjr_estimated_monthly_missed_revenue?: number | null
          mjr_notes?: string | null
          owner_name?: string | null
          phone?: string | null
          priority_cohort?: string | null
          score_digital_weakness?: number | null
          score_growth_hunger?: number | null
          score_owner_accessibility?: number | null
          score_ticket_size?: number | null
          score_visual_transformability?: number | null
          status?: string | null
          suburb?: string | null
          updated_at?: string | null
          vertical?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      sops: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          id: string
          last_reviewed_at: string | null
          reviewed_by: string | null
          sop_number: number
          status: string | null
          title: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          last_reviewed_at?: string | null
          reviewed_by?: string | null
          sop_number: number
          status?: string | null
          title: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          last_reviewed_at?: string | null
          reviewed_by?: string | null
          sop_number?: number
          status?: string | null
          title?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      sprint_daily_log: {
        Row: {
          created_at: string | null
          day_number: number | null
          id: string
          impressions: number | null
          leads: number | null
          link_clicks: number | null
          log_date: string
          notes: string | null
          reach: number | null
          spend: number | null
          sprint_id: string | null
        }
        Insert: {
          created_at?: string | null
          day_number?: number | null
          id?: string
          impressions?: number | null
          leads?: number | null
          link_clicks?: number | null
          log_date: string
          notes?: string | null
          reach?: number | null
          spend?: number | null
          sprint_id?: string | null
        }
        Update: {
          created_at?: string | null
          day_number?: number | null
          id?: string
          impressions?: number | null
          leads?: number | null
          link_clicks?: number | null
          log_date?: string
          notes?: string | null
          reach?: number | null
          spend?: number | null
          sprint_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sprint_daily_log_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "proof_sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          is_milestone: boolean | null
          milestone_label: string | null
          month_key: string
          notes: string | null
          status: string | null
          title: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          is_milestone?: boolean | null
          milestone_label?: string | null
          month_key: string
          notes?: string | null
          status?: string | null
          title: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          is_milestone?: boolean | null
          milestone_label?: string | null
          month_key?: string
          notes?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          category: string | null
          char_count: number | null
          content: string | null
          created_at: string | null
          id: string
          last_edited_by: string | null
          title: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          category?: string | null
          char_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          last_edited_by?: string | null
          title: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          category?: string | null
          char_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          last_edited_by?: string | null
          title?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
