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
      app_files: {
        Row: {
          associated_sop_id: string
          created_at: string | null
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          uploaded_by: string | null
        }
        Insert: {
          associated_sop_id: string
          created_at?: string | null
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          associated_sop_id?: string
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      audit_claims: {
        Row: {
          business_name: string
          contact_info: string
          contact_method: string | null
          created_at: string | null
          google_reviews: string | null
          id: string
          location: string
          status: string | null
        }
        Insert: {
          business_name: string
          contact_info: string
          contact_method?: string | null
          created_at?: string | null
          google_reviews?: string | null
          id?: string
          location: string
          status?: string | null
        }
        Update: {
          business_name?: string
          contact_info?: string
          contact_method?: string | null
          created_at?: string | null
          google_reviews?: string | null
          id?: string
          location?: string
          status?: string | null
        }
        Relationships: []
      }
      client_deliverables: {
        Row: {
          client_id: string | null
          id: string
          is_completed: boolean | null
          notes: string | null
          position: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          position?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          position?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
          delivery_manager: string | null
          distribution_manager: string | null
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
          delivery_manager?: string | null
          distribution_manager?: string | null
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
          delivery_manager?: string | null
          distribution_manager?: string | null
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
      delivery_metrics: {
        Row: {
          appointments_booked: number | null
          cash_collected: number | null
          client_id: string | null
          date_key: string | null
          dms_started: number | null
          id: string
          manager_id: string | null
          notes: string | null
          profile_visits: number | null
          qualified_followers: number | null
          updated_at: string | null
        }
        Insert: {
          appointments_booked?: number | null
          cash_collected?: number | null
          client_id?: string | null
          date_key?: string | null
          dms_started?: number | null
          id?: string
          manager_id?: string | null
          notes?: string | null
          profile_visits?: number | null
          qualified_followers?: number | null
          updated_at?: string | null
        }
        Update: {
          appointments_booked?: number | null
          cash_collected?: number | null
          client_id?: string | null
          date_key?: string | null
          dms_started?: number | null
          id?: string
          manager_id?: string | null
          notes?: string | null
          profile_visits?: number | null
          qualified_followers?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_progress: {
        Row: {
          date_key: string
          id: string
          is_completed: boolean | null
          manager_id: string | null
          task_id: string
          updated_at: string | null
        }
        Insert: {
          date_key: string
          id?: string
          is_completed?: boolean | null
          manager_id?: string | null
          task_id: string
          updated_at?: string | null
        }
        Update: {
          date_key?: string
          id?: string
          is_completed?: boolean | null
          manager_id?: string | null
          task_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      distribution_progress: {
        Row: {
          date_key: string
          id: string
          is_completed: boolean | null
          manager_id: string | null
          task_id: string
          updated_at: string | null
        }
        Insert: {
          date_key: string
          id?: string
          is_completed?: boolean | null
          manager_id?: string | null
          task_id: string
          updated_at?: string | null
        }
        Update: {
          date_key?: string
          id?: string
          is_completed?: boolean | null
          manager_id?: string | null
          task_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      distro_metrics: {
        Row: {
          calls_booked: number | null
          date_key: string | null
          followups_sent: number | null
          id: string
          manager_id: string | null
          mjrs_built: number | null
          mjrs_sent: number | null
          notes: string | null
          outreach_sent: number | null
          prospects_enriched: number | null
          prospects_scraped: number | null
          updated_at: string | null
        }
        Insert: {
          calls_booked?: number | null
          date_key?: string | null
          followups_sent?: number | null
          id?: string
          manager_id?: string | null
          mjrs_built?: number | null
          mjrs_sent?: number | null
          notes?: string | null
          outreach_sent?: number | null
          prospects_enriched?: number | null
          prospects_scraped?: number | null
          updated_at?: string | null
        }
        Update: {
          calls_booked?: number | null
          date_key?: string | null
          followups_sent?: number | null
          id?: string
          manager_id?: string | null
          mjrs_built?: number | null
          mjrs_sent?: number | null
          notes?: string | null
          outreach_sent?: number | null
          prospects_enriched?: number | null
          prospects_scraped?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ledger: {
        Row: {
          amount: number
          category: string
          client_id: string | null
          client_name: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          is_recurring: boolean | null
          status: string | null
          tags: string[] | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          category: string
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          status?: string | null
          tags?: string[] | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          category?: string
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          status?: string | null
          tags?: string[] | null
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "ledger_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_reviews: {
        Row: {
          client_id: string
          comment: string | null
          created_at: string
          id: string
          manager_id: string
          rating: number
        }
        Insert: {
          client_id: string
          comment?: string | null
          created_at?: string
          id?: string
          manager_id: string
          rating: number
        }
        Update: {
          client_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          manager_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "manager_reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_revenue: {
        Row: {
          active_client_count: number | null
          ad_infrastructure_costs: number | null
          cash_reserves: number | null
          gross_mrr: number | null
          id: string
          month: string
          net_profit: number | null
          notes: string | null
          other_costs: number | null
          personal_cash_balance: number | null
          principal_draw: number | null
          profit_margin: number | null
          schedule_d_mrr_target: number | null
          setup_fees_collected: number | null
          tool_costs: number | null
          total_expenses: number | null
          trust_balance_end: number | null
          trust_balance_start: number | null
          trust_deployment: number | null
          va_costs: number | null
        }
        Insert: {
          active_client_count?: number | null
          ad_infrastructure_costs?: number | null
          cash_reserves?: number | null
          gross_mrr?: number | null
          id?: string
          month: string
          net_profit?: number | null
          notes?: string | null
          other_costs?: number | null
          personal_cash_balance?: number | null
          principal_draw?: number | null
          profit_margin?: number | null
          schedule_d_mrr_target?: number | null
          setup_fees_collected?: number | null
          tool_costs?: number | null
          total_expenses?: number | null
          trust_balance_end?: number | null
          trust_balance_start?: number | null
          trust_deployment?: number | null
          va_costs?: number | null
        }
        Update: {
          active_client_count?: number | null
          ad_infrastructure_costs?: number | null
          cash_reserves?: number | null
          gross_mrr?: number | null
          id?: string
          month?: string
          net_profit?: number | null
          notes?: string | null
          other_costs?: number | null
          personal_cash_balance?: number | null
          principal_draw?: number | null
          profit_margin?: number | null
          schedule_d_mrr_target?: number | null
          setup_fees_collected?: number | null
          tool_costs?: number | null
          total_expenses?: number | null
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
      portal_documents: {
        Row: {
          client_id: string
          created_at: string
          file_name: string
          file_path: string
          id: string
          manager_id: string
          status: string | null
          uploaded_by: string
        }
        Insert: {
          client_id: string
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          manager_id: string
          status?: string | null
          uploaded_by: string
        }
        Update: {
          client_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          manager_id?: string
          status?: string | null
          uploaded_by?: string
        }
        Relationships: []
      }
      portal_messages: {
        Row: {
          client_id: string
          created_at: string
          id: string
          manager_id: string
          message_text: string
          sender_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          manager_id: string
          message_text: string
          sender_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          manager_id?: string
          message_text?: string
          sender_id?: string
        }
        Relationships: []
      }
      portal_tasks: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          manager_id: string
          status: string | null
          title: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          manager_id: string
          status?: string | null
          title: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          manager_id?: string
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          client_id: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: []
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
          ig_follower_count: number | null
          instagram_followers: number | null
          instagram_handle: string | null
          instagram_last_post_date: string | null
          is_archived: boolean | null
          last_scraped_at: string | null
          meta_ads_running: boolean | null
          mjr_delivered_at: string | null
          mjr_estimated_monthly_missed_revenue: number | null
          mjr_link: string | null
          mjr_missed_revenue: number | null
          mjr_notes: string | null
          msg_1_sent: boolean | null
          msg_2_sent: boolean | null
          msg_3_sent: boolean | null
          msg_4_sent: boolean | null
          msg_5_sent: boolean | null
          outreach_attempted: boolean | null
          owner_name: string | null
          phone: string | null
          pipeline_stage: string | null
          priority_cohort: string | null
          q_high_ticket: boolean | null
          q_owner_op: boolean | null
          q_referral: boolean | null
          q_visual: boolean | null
          q_weak_digital: boolean | null
          score_digital_weakness: number | null
          score_growth_hunger: number | null
          score_owner_accessibility: number | null
          score_ticket_size: number | null
          score_visual_transformability: number | null
          spoa_delivered_at: string | null
          status: string | null
          suburb: string | null
          target_date: string | null
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
          ig_follower_count?: number | null
          instagram_followers?: number | null
          instagram_handle?: string | null
          instagram_last_post_date?: string | null
          is_archived?: boolean | null
          last_scraped_at?: string | null
          meta_ads_running?: boolean | null
          mjr_delivered_at?: string | null
          mjr_estimated_monthly_missed_revenue?: number | null
          mjr_link?: string | null
          mjr_missed_revenue?: number | null
          mjr_notes?: string | null
          msg_1_sent?: boolean | null
          msg_2_sent?: boolean | null
          msg_3_sent?: boolean | null
          msg_4_sent?: boolean | null
          msg_5_sent?: boolean | null
          outreach_attempted?: boolean | null
          owner_name?: string | null
          phone?: string | null
          pipeline_stage?: string | null
          priority_cohort?: string | null
          q_high_ticket?: boolean | null
          q_owner_op?: boolean | null
          q_referral?: boolean | null
          q_visual?: boolean | null
          q_weak_digital?: boolean | null
          score_digital_weakness?: number | null
          score_growth_hunger?: number | null
          score_owner_accessibility?: number | null
          score_ticket_size?: number | null
          score_visual_transformability?: number | null
          spoa_delivered_at?: string | null
          status?: string | null
          suburb?: string | null
          target_date?: string | null
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
          ig_follower_count?: number | null
          instagram_followers?: number | null
          instagram_handle?: string | null
          instagram_last_post_date?: string | null
          is_archived?: boolean | null
          last_scraped_at?: string | null
          meta_ads_running?: boolean | null
          mjr_delivered_at?: string | null
          mjr_estimated_monthly_missed_revenue?: number | null
          mjr_link?: string | null
          mjr_missed_revenue?: number | null
          mjr_notes?: string | null
          msg_1_sent?: boolean | null
          msg_2_sent?: boolean | null
          msg_3_sent?: boolean | null
          msg_4_sent?: boolean | null
          msg_5_sent?: boolean | null
          outreach_attempted?: boolean | null
          owner_name?: string | null
          phone?: string | null
          pipeline_stage?: string | null
          priority_cohort?: string | null
          q_high_ticket?: boolean | null
          q_owner_op?: boolean | null
          q_referral?: boolean | null
          q_visual?: boolean | null
          q_weak_digital?: boolean | null
          score_digital_weakness?: number | null
          score_growth_hunger?: number | null
          score_owner_accessibility?: number | null
          score_ticket_size?: number | null
          score_visual_transformability?: number | null
          spoa_delivered_at?: string | null
          status?: string | null
          suburb?: string | null
          target_date?: string | null
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
          description: string | null
          files: Json | null
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
          description?: string | null
          files?: Json | null
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
          description?: string | null
          files?: Json | null
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
      studio_assets: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          name: string
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
          url?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          is_milestone: boolean | null
          milestone_label: string | null
          month_key: string
          notes: string | null
          priority: string | null
          status: string | null
          title: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          is_milestone?: boolean | null
          milestone_label?: string | null
          month_key: string
          notes?: string | null
          priority?: string | null
          status?: string | null
          title: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          is_milestone?: boolean | null
          milestone_label?: string | null
          month_key?: string
          notes?: string | null
          priority?: string | null
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
      ops_manager_status: {
        Row: {
          last_active: string | null
          manager_id: string | null
          name: string | null
          role: string | null
          tasks_completed: number | null
          total_tasks_assigned: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      auth_role: { Args: never; Returns: string }
      get_monthly_stats: {
        Args: { month_date: string }
        Returns: {
          net_profit: number
          total_expense: number
          total_income: number
        }[]
      }
      get_my_client_id: { Args: never; Returns: string }
      get_my_role: { Args: never; Returns: string }
      get_ops_manager_status: {
        Args: never
        Returns: {
          last_active: string
          manager_id: string
          name: string
          role: string
          tasks_completed: number
          total_tasks_assigned: number
        }[]
      }
    }
    Enums: {
      transaction_type: "income" | "expense"
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
    Enums: {
      transaction_type: ["income", "expense"],
    },
  },
} as const
