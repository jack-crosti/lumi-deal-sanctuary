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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_edit_requests: {
        Row: {
          admin_id: string
          approval_status: Database["public"]["Enums"]["ai_edit_approval"]
          business_id: string
          created_at: string
          error_message: string | null
          id: string
          instruction: string
          proposal: Json | null
          result_preview: string | null
          status: Database["public"]["Enums"]["ai_edit_status"]
          target_block_id: string | null
          updated_at: string
          version_id: string | null
          warnings: string[]
        }
        Insert: {
          admin_id: string
          approval_status?: Database["public"]["Enums"]["ai_edit_approval"]
          business_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          instruction: string
          proposal?: Json | null
          result_preview?: string | null
          status?: Database["public"]["Enums"]["ai_edit_status"]
          target_block_id?: string | null
          updated_at?: string
          version_id?: string | null
          warnings?: string[]
        }
        Update: {
          admin_id?: string
          approval_status?: Database["public"]["Enums"]["ai_edit_approval"]
          business_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          instruction?: string
          proposal?: Json | null
          result_preview?: string | null
          status?: Database["public"]["Enums"]["ai_edit_status"]
          target_block_id?: string | null
          updated_at?: string
          version_id?: string | null
          warnings?: string[]
        }
        Relationships: []
      }
      businesses: {
        Row: {
          add_backs: number | null
          address: string | null
          archived_at: string | null
          asking_price: number | null
          asking_price_multiple: number | null
          broker_notes: string | null
          business_type: string | null
          city: string | null
          confidential_title: string | null
          created_at: string
          created_by: string | null
          ebitda: number | null
          financial_notes: string | null
          financial_review_status: Database["public"]["Enums"]["financial_review_status"]
          financial_source:
            | Database["public"]["Enums"]["financial_source"]
            | null
          gross_profit: number | null
          gross_profit_pct: number | null
          headline: string | null
          hero_image_url: string | null
          id: string
          industry: string | null
          lease_expiry: string | null
          location_mode: Database["public"]["Enums"]["location_mode"]
          name: string
          normalised_profit: number | null
          opening_hours: string | null
          owner_involvement: string | null
          owner_profit: number | null
          public_title: string | null
          region: string | null
          renewal_rights: string | null
          rent_pct_sales: number | null
          rent_per_year: number | null
          revenue: number | null
          slug: string | null
          staff_summary: string | null
          status: Database["public"]["Enums"]["business_status"]
          stock_value: number | null
          suburb: string | null
          summary: string | null
          tenure: string | null
          updated_at: string
          wage_cost: number | null
          wage_pct: number | null
          weekly_sales_max: number | null
          weekly_sales_min: number | null
        }
        Insert: {
          add_backs?: number | null
          address?: string | null
          archived_at?: string | null
          asking_price?: number | null
          asking_price_multiple?: number | null
          broker_notes?: string | null
          business_type?: string | null
          city?: string | null
          confidential_title?: string | null
          created_at?: string
          created_by?: string | null
          ebitda?: number | null
          financial_notes?: string | null
          financial_review_status?: Database["public"]["Enums"]["financial_review_status"]
          financial_source?:
            | Database["public"]["Enums"]["financial_source"]
            | null
          gross_profit?: number | null
          gross_profit_pct?: number | null
          headline?: string | null
          hero_image_url?: string | null
          id?: string
          industry?: string | null
          lease_expiry?: string | null
          location_mode?: Database["public"]["Enums"]["location_mode"]
          name: string
          normalised_profit?: number | null
          opening_hours?: string | null
          owner_involvement?: string | null
          owner_profit?: number | null
          public_title?: string | null
          region?: string | null
          renewal_rights?: string | null
          rent_pct_sales?: number | null
          rent_per_year?: number | null
          revenue?: number | null
          slug?: string | null
          staff_summary?: string | null
          status?: Database["public"]["Enums"]["business_status"]
          stock_value?: number | null
          suburb?: string | null
          summary?: string | null
          tenure?: string | null
          updated_at?: string
          wage_cost?: number | null
          wage_pct?: number | null
          weekly_sales_max?: number | null
          weekly_sales_min?: number | null
        }
        Update: {
          add_backs?: number | null
          address?: string | null
          archived_at?: string | null
          asking_price?: number | null
          asking_price_multiple?: number | null
          broker_notes?: string | null
          business_type?: string | null
          city?: string | null
          confidential_title?: string | null
          created_at?: string
          created_by?: string | null
          ebitda?: number | null
          financial_notes?: string | null
          financial_review_status?: Database["public"]["Enums"]["financial_review_status"]
          financial_source?:
            | Database["public"]["Enums"]["financial_source"]
            | null
          gross_profit?: number | null
          gross_profit_pct?: number | null
          headline?: string | null
          hero_image_url?: string | null
          id?: string
          industry?: string | null
          lease_expiry?: string | null
          location_mode?: Database["public"]["Enums"]["location_mode"]
          name?: string
          normalised_profit?: number | null
          opening_hours?: string | null
          owner_involvement?: string | null
          owner_profit?: number | null
          public_title?: string | null
          region?: string | null
          renewal_rights?: string | null
          rent_pct_sales?: number | null
          rent_per_year?: number | null
          revenue?: number | null
          slug?: string | null
          staff_summary?: string | null
          status?: Database["public"]["Enums"]["business_status"]
          stock_value?: number | null
          suburb?: string | null
          summary?: string | null
          tenure?: string | null
          updated_at?: string
          wage_cost?: number | null
          wage_pct?: number | null
          weekly_sales_max?: number | null
          weekly_sales_min?: number | null
        }
        Relationships: []
      }
      buyer_activity: {
        Row: {
          business_id: string | null
          buyer_id: string
          created_at: string
          device_type: string | null
          event_type: Database["public"]["Enums"]["activity_event"]
          id: string
          ip: string | null
          metadata: Json
          user_agent: string | null
        }
        Insert: {
          business_id?: string | null
          buyer_id: string
          created_at?: string
          device_type?: string | null
          event_type: Database["public"]["Enums"]["activity_event"]
          id?: string
          ip?: string | null
          metadata?: Json
          user_agent?: string | null
        }
        Update: {
          business_id?: string | null
          buyer_id?: string
          created_at?: string
          device_type?: string | null
          event_type?: Database["public"]["Enums"]["activity_event"]
          id?: string
          ip?: string | null
          metadata?: Json
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_activity_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_business_access: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          assigned_by: string | null
          business_id: string
          buyer_id: string
          created_at: string
          expires_at: string | null
          id: string
          updated_at: string
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"]
          assigned_by?: string | null
          business_id: string
          buyer_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          assigned_by?: string | null
          business_id?: string
          buyer_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_business_access_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          answered_by: string | null
          business_id: string
          buyer_id: string
          created_at: string
          id: string
          question: string
          status: Database["public"]["Enums"]["question_status"]
          updated_at: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          business_id: string
          buyer_id: string
          created_at?: string
          id?: string
          question: string
          status?: Database["public"]["Enums"]["question_status"]
          updated_at?: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          business_id?: string
          buyer_id?: string
          created_at?: string
          id?: string
          question?: string
          status?: Database["public"]["Enums"]["question_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_questions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_requests: {
        Row: {
          business_id: string
          buyer_id: string
          created_at: string
          id: string
          message: string | null
          preferred_call_time: string | null
          preferred_contact:
            | Database["public"]["Enums"]["contact_method"]
            | null
          priority: Database["public"]["Enums"]["request_priority"]
          request_type: Database["public"]["Enums"]["request_type"]
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          business_id: string
          buyer_id: string
          created_at?: string
          id?: string
          message?: string | null
          preferred_call_time?: string | null
          preferred_contact?:
            | Database["public"]["Enums"]["contact_method"]
            | null
          priority?: Database["public"]["Enums"]["request_priority"]
          request_type?: Database["public"]["Enums"]["request_type"]
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          buyer_id?: string
          created_at?: string
          id?: string
          message?: string | null
          preferred_call_time?: string | null
          preferred_contact?:
            | Database["public"]["Enums"]["contact_method"]
            | null
          priority?: Database["public"]["Enums"]["request_priority"]
          request_type?: Database["public"]["Enums"]["request_type"]
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      document_access: {
        Row: {
          buyer_id: string
          created_at: string
          document_id: string
          granted_by: string | null
          id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          document_id: string
          granted_by?: string | null
          id?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          document_id?: string
          granted_by?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_access_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          availability: Database["public"]["Enums"]["document_availability"]
          business_id: string
          created_at: string
          doc_type: Database["public"]["Enums"]["document_type"]
          download_allowed: boolean
          file_size: number | null
          id: string
          mime_type: string | null
          notes: string | null
          required_access_level: Database["public"]["Enums"]["access_level"]
          storage_path: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
          visibility: Database["public"]["Enums"]["document_visibility"]
        }
        Insert: {
          availability?: Database["public"]["Enums"]["document_availability"]
          business_id: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["document_type"]
          download_allowed?: boolean
          file_size?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          required_access_level?: Database["public"]["Enums"]["access_level"]
          storage_path?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          visibility?: Database["public"]["Enums"]["document_visibility"]
        }
        Update: {
          availability?: Database["public"]["Enums"]["document_availability"]
          business_id?: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["document_type"]
          download_allowed?: boolean
          file_size?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          required_access_level?: Database["public"]["Enums"]["access_level"]
          storage_path?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          visibility?: Database["public"]["Enums"]["document_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      im_imports: {
        Row: {
          admin_id: string
          admin_notes: string | null
          business_id: string
          created_at: string
          draft_version_id: string | null
          error_message: string | null
          extracted_facts: Json | null
          extracted_text: string | null
          file_name: string | null
          file_size: number | null
          generated_blocks: Json | null
          id: string
          status: Database["public"]["Enums"]["im_import_status"]
          storage_path: string
          updated_at: string
          warnings: string[]
        }
        Insert: {
          admin_id: string
          admin_notes?: string | null
          business_id: string
          created_at?: string
          draft_version_id?: string | null
          error_message?: string | null
          extracted_facts?: Json | null
          extracted_text?: string | null
          file_name?: string | null
          file_size?: number | null
          generated_blocks?: Json | null
          id?: string
          status?: Database["public"]["Enums"]["im_import_status"]
          storage_path: string
          updated_at?: string
          warnings?: string[]
        }
        Update: {
          admin_id?: string
          admin_notes?: string | null
          business_id?: string
          created_at?: string
          draft_version_id?: string | null
          error_message?: string | null
          extracted_facts?: Json | null
          extracted_text?: string | null
          file_name?: string | null
          file_size?: number | null
          generated_blocks?: Json | null
          id?: string
          status?: Database["public"]["Enums"]["im_import_status"]
          storage_path?: string
          updated_at?: string
          warnings?: string[]
        }
        Relationships: []
      }
      offer_interest: {
        Row: {
          accountant_email: string | null
          accountant_name: string | null
          additional_notes: string | null
          business_id: string
          buyer_entity: string | null
          buyer_id: string
          conditions: string[]
          created_at: string
          deposit_amount: number | null
          disclaimer_accepted: boolean
          due_diligence_period: string | null
          finance_approval_timeframe: string | null
          id: string
          indicative_amount: number | null
          other_condition_text: string | null
          price_notes: string | null
          proposed_price: number | null
          settlement_timeframe: string | null
          solicitor_email: string | null
          solicitor_name: string | null
          status: Database["public"]["Enums"]["offer_status"]
          stock_treatment: string | null
          submitted_at: string | null
          takeover_date: string | null
          terms: string | null
          updated_at: string
        }
        Insert: {
          accountant_email?: string | null
          accountant_name?: string | null
          additional_notes?: string | null
          business_id: string
          buyer_entity?: string | null
          buyer_id: string
          conditions?: string[]
          created_at?: string
          deposit_amount?: number | null
          disclaimer_accepted?: boolean
          due_diligence_period?: string | null
          finance_approval_timeframe?: string | null
          id?: string
          indicative_amount?: number | null
          other_condition_text?: string | null
          price_notes?: string | null
          proposed_price?: number | null
          settlement_timeframe?: string | null
          solicitor_email?: string | null
          solicitor_name?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          stock_treatment?: string | null
          submitted_at?: string | null
          takeover_date?: string | null
          terms?: string | null
          updated_at?: string
        }
        Update: {
          accountant_email?: string | null
          accountant_name?: string | null
          additional_notes?: string | null
          business_id?: string
          buyer_entity?: string | null
          buyer_id?: string
          conditions?: string[]
          created_at?: string
          deposit_amount?: number | null
          disclaimer_accepted?: boolean
          due_diligence_period?: string | null
          finance_approval_timeframe?: string | null
          id?: string
          indicative_amount?: number | null
          other_condition_text?: string | null
          price_notes?: string | null
          proposed_price?: number | null
          settlement_timeframe?: string | null
          solicitor_email?: string | null
          solicitor_name?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          stock_treatment?: string | null
          submitted_at?: string | null
          takeover_date?: string | null
          terms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_interest_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_sections: {
        Row: {
          body: string | null
          content: Json
          created_at: string
          id: string
          image_refs: string[]
          is_hidden: boolean
          key_points: string[]
          position: number
          required_access_level: Database["public"]["Enums"]["access_level"]
          review_status: Database["public"]["Enums"]["block_review_status"]
          section_type: Database["public"]["Enums"]["section_type"]
          subtitle: string | null
          title: string | null
          updated_at: string
          version_id: string
          visibility: Database["public"]["Enums"]["document_visibility"]
        }
        Insert: {
          body?: string | null
          content?: Json
          created_at?: string
          id?: string
          image_refs?: string[]
          is_hidden?: boolean
          key_points?: string[]
          position?: number
          required_access_level?: Database["public"]["Enums"]["access_level"]
          review_status?: Database["public"]["Enums"]["block_review_status"]
          section_type: Database["public"]["Enums"]["section_type"]
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          version_id: string
          visibility?: Database["public"]["Enums"]["document_visibility"]
        }
        Update: {
          body?: string | null
          content?: Json
          created_at?: string
          id?: string
          image_refs?: string[]
          is_hidden?: boolean
          key_points?: string[]
          position?: number
          required_access_level?: Database["public"]["Enums"]["access_level"]
          review_status?: Database["public"]["Enums"]["block_review_status"]
          section_type?: Database["public"]["Enums"]["section_type"]
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          version_id?: string
          visibility?: Database["public"]["Enums"]["document_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "presentation_sections_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "presentation_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_snapshots: {
        Row: {
          blocks: Json
          business_id: string
          change_summary: string | null
          created_at: string
          created_by: string | null
          id: string
          source_version_id: string | null
          status: Database["public"]["Enums"]["presentation_status"]
          version_number: number
        }
        Insert: {
          blocks?: Json
          business_id: string
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          source_version_id?: string | null
          status: Database["public"]["Enums"]["presentation_status"]
          version_number: number
        }
        Update: {
          blocks?: Json
          business_id?: string
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          source_version_id?: string | null
          status?: Database["public"]["Enums"]["presentation_status"]
          version_number?: number
        }
        Relationships: []
      }
      presentation_versions: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          published_at: string | null
          published_by: string | null
          status: Database["public"]["Enums"]["presentation_status"]
          updated_at: string
          version_number: number
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["presentation_status"]
          updated_at?: string
          version_number: number
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["presentation_status"]
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "presentation_versions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_notes: string | null
          budget_max: number | null
          budget_min: number | null
          buyer_status: Database["public"]["Enums"]["buyer_status"]
          buyer_type: Database["public"]["Enums"]["buyer_type"] | null
          ca_status: Database["public"]["Enums"]["ca_status"]
          company: string | null
          created_at: string
          email: string | null
          finance_status: Database["public"]["Enums"]["finance_status"] | null
          first_name: string | null
          full_name: string | null
          hospitality_experience: string | null
          id: string
          is_pending: boolean
          last_name: string | null
          owner_intent: Database["public"]["Enums"]["owner_intent"] | null
          phone: string | null
          preferred_business_type: string | null
          preferred_location: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          budget_max?: number | null
          budget_min?: number | null
          buyer_status?: Database["public"]["Enums"]["buyer_status"]
          buyer_type?: Database["public"]["Enums"]["buyer_type"] | null
          ca_status?: Database["public"]["Enums"]["ca_status"]
          company?: string | null
          created_at?: string
          email?: string | null
          finance_status?: Database["public"]["Enums"]["finance_status"] | null
          first_name?: string | null
          full_name?: string | null
          hospitality_experience?: string | null
          id: string
          is_pending?: boolean
          last_name?: string | null
          owner_intent?: Database["public"]["Enums"]["owner_intent"] | null
          phone?: string | null
          preferred_business_type?: string | null
          preferred_location?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          budget_max?: number | null
          budget_min?: number | null
          buyer_status?: Database["public"]["Enums"]["buyer_status"]
          buyer_type?: Database["public"]["Enums"]["buyer_type"] | null
          ca_status?: Database["public"]["Enums"]["ca_status"]
          company?: string | null
          created_at?: string
          email?: string | null
          finance_status?: Database["public"]["Enums"]["finance_status"] | null
          first_name?: string | null
          full_name?: string | null
          hospitality_experience?: string | null
          id?: string
          is_pending?: boolean
          last_name?: string | null
          owner_intent?: Database["public"]["Enums"]["owner_intent"] | null
          phone?: string | null
          preferred_business_type?: string | null
          preferred_location?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voiceover_scripts: {
        Row: {
          approval_status: Database["public"]["Enums"]["voiceover_approval"]
          business_id: string
          business_overview: string | null
          created_at: string
          financials: string | null
          growth: string | null
          id: string
          location: string | null
          next_steps: string | null
          opening: string | null
          preview_text: string | null
          style: Database["public"]["Enums"]["voiceover_style"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["voiceover_approval"]
          business_id: string
          business_overview?: string | null
          created_at?: string
          financials?: string | null
          growth?: string | null
          id?: string
          location?: string | null
          next_steps?: string | null
          opening?: string | null
          preview_text?: string | null
          style?: Database["public"]["Enums"]["voiceover_style"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["voiceover_approval"]
          business_id?: string
          business_overview?: string | null
          created_at?: string
          financials?: string | null
          growth?: string | null
          id?: string
          location?: string | null
          next_steps?: string | null
          opening?: string | null
          preview_text?: string | null
          style?: Database["public"]["Enums"]["voiceover_style"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      access_level_rank: {
        Args: { _level: Database["public"]["Enums"]["access_level"] }
        Returns: number
      }
      business_has_published_version: {
        Args: { _business: string }
        Returns: boolean
      }
      buyer_access_level: {
        Args: { _business: string; _user: string }
        Returns: Database["public"]["Enums"]["access_level"]
      }
      buyer_can_see_document: {
        Args: { _doc: string; _user: string }
        Returns: boolean
      }
      buyer_has_business: {
        Args: { _business: string; _user: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      restore_presentation_snapshot: {
        Args: { _snapshot_id: string }
        Returns: string
      }
      save_presentation_snapshot: {
        Args: { _change_summary?: string; _version_id: string }
        Returns: string
      }
      visibility_rank: {
        Args: { _v: Database["public"]["Enums"]["document_visibility"] }
        Returns: number
      }
    }
    Enums: {
      access_level: "teaser" | "im" | "financial" | "serious" | "full_dd"
      activity_event:
        | "login"
        | "business_view"
        | "im_view"
        | "financial_view"
        | "location_view"
        | "document_view"
        | "document_download"
        | "question_submitted"
        | "request_submitted"
        | "offer_started"
        | "offer_submitted"
        | "return_visit"
        | "document_access_request"
        | "dashboard_view"
        | "hero_view"
        | "documents_section_view"
        | "lease_view"
        | "call_request"
      ai_edit_approval: "unreviewed" | "approved" | "rejected"
      ai_edit_status:
        | "pending"
        | "processing"
        | "applied"
        | "rejected"
        | "failed"
      app_role: "admin" | "buyer"
      block_review_status: "draft" | "needs_review" | "approved"
      business_status:
        | "draft"
        | "internal_review"
        | "ready_to_publish"
        | "published"
        | "archived"
      buyer_status:
        | "new"
        | "active"
        | "warm"
        | "hot"
        | "not_suitable"
        | "archived"
      buyer_type:
        | "individual"
        | "company"
        | "investor"
        | "family_office"
        | "other"
      ca_status: "not_sent" | "sent" | "signed" | "approved"
      contact_method: "email" | "phone" | "either"
      document_availability: "hidden" | "available" | "requires_approval"
      document_type:
        | "im"
        | "financials"
        | "gst"
        | "pos"
        | "lease"
        | "chattels"
        | "staff"
        | "vendor_notes"
        | "photo"
        | "video"
        | "other"
      document_visibility:
        | "hidden"
        | "teaser"
        | "im"
        | "financial"
        | "serious"
        | "full_dd"
      finance_status:
        | "unknown"
        | "self_funded"
        | "pre_approved"
        | "needs_finance"
        | "not_disclosed"
      financial_review_status:
        | "draft"
        | "needs_verification"
        | "verified"
        | "not_available"
      financial_source:
        | "accountant"
        | "gst_returns"
        | "pos_reports"
        | "vendor_supplied"
        | "broker_estimate"
        | "other"
      im_import_status:
        | "uploading"
        | "extracting"
        | "generating"
        | "ready_for_review"
        | "applied"
        | "rejected"
        | "failed"
      location_mode: "blind" | "suburb" | "exact"
      offer_status:
        | "draft"
        | "submitted"
        | "withdrawn"
        | "progressing"
        | "closed"
        | "broker_reviewing"
        | "call_booked"
        | "spa_preparing"
        | "not_proceeding"
      owner_intent: "working_owner" | "investor" | "either"
      presentation_status:
        | "draft"
        | "published"
        | "archived"
        | "internal_review"
        | "ready_to_publish"
      question_status: "open" | "answered" | "closed"
      request_priority: "normal" | "high"
      request_status:
        | "open"
        | "in_progress"
        | "closed"
        | "waiting_vendor"
        | "replied"
      request_type:
        | "information"
        | "document_access"
        | "call"
        | "other"
        | "financial"
        | "lease"
        | "pos"
        | "chattels"
        | "vendor_meeting"
        | "dd_question"
      section_type:
        | "hero"
        | "location_advantage"
        | "business_overview"
        | "key_highlights"
        | "financial_snapshot"
        | "lease_summary"
        | "operations_staff"
        | "growth_opportunities"
        | "buyer_fit"
        | "risks_due_diligence"
        | "photo_gallery"
        | "supporting_documents"
        | "ask_question"
        | "request_information"
        | "start_offer_discussion"
        | "voiceover_script"
      voiceover_approval: "draft" | "needs_review" | "approved"
      voiceover_style:
        | "professional"
        | "calm"
        | "premium"
        | "direct"
        | "warm"
        | "investor"
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
      access_level: ["teaser", "im", "financial", "serious", "full_dd"],
      activity_event: [
        "login",
        "business_view",
        "im_view",
        "financial_view",
        "location_view",
        "document_view",
        "document_download",
        "question_submitted",
        "request_submitted",
        "offer_started",
        "offer_submitted",
        "return_visit",
        "document_access_request",
        "dashboard_view",
        "hero_view",
        "documents_section_view",
        "lease_view",
        "call_request",
      ],
      ai_edit_approval: ["unreviewed", "approved", "rejected"],
      ai_edit_status: [
        "pending",
        "processing",
        "applied",
        "rejected",
        "failed",
      ],
      app_role: ["admin", "buyer"],
      block_review_status: ["draft", "needs_review", "approved"],
      business_status: [
        "draft",
        "internal_review",
        "ready_to_publish",
        "published",
        "archived",
      ],
      buyer_status: [
        "new",
        "active",
        "warm",
        "hot",
        "not_suitable",
        "archived",
      ],
      buyer_type: [
        "individual",
        "company",
        "investor",
        "family_office",
        "other",
      ],
      ca_status: ["not_sent", "sent", "signed", "approved"],
      contact_method: ["email", "phone", "either"],
      document_availability: ["hidden", "available", "requires_approval"],
      document_type: [
        "im",
        "financials",
        "gst",
        "pos",
        "lease",
        "chattels",
        "staff",
        "vendor_notes",
        "photo",
        "video",
        "other",
      ],
      document_visibility: [
        "hidden",
        "teaser",
        "im",
        "financial",
        "serious",
        "full_dd",
      ],
      finance_status: [
        "unknown",
        "self_funded",
        "pre_approved",
        "needs_finance",
        "not_disclosed",
      ],
      financial_review_status: [
        "draft",
        "needs_verification",
        "verified",
        "not_available",
      ],
      financial_source: [
        "accountant",
        "gst_returns",
        "pos_reports",
        "vendor_supplied",
        "broker_estimate",
        "other",
      ],
      im_import_status: [
        "uploading",
        "extracting",
        "generating",
        "ready_for_review",
        "applied",
        "rejected",
        "failed",
      ],
      location_mode: ["blind", "suburb", "exact"],
      offer_status: [
        "draft",
        "submitted",
        "withdrawn",
        "progressing",
        "closed",
        "broker_reviewing",
        "call_booked",
        "spa_preparing",
        "not_proceeding",
      ],
      owner_intent: ["working_owner", "investor", "either"],
      presentation_status: [
        "draft",
        "published",
        "archived",
        "internal_review",
        "ready_to_publish",
      ],
      question_status: ["open", "answered", "closed"],
      request_priority: ["normal", "high"],
      request_status: [
        "open",
        "in_progress",
        "closed",
        "waiting_vendor",
        "replied",
      ],
      request_type: [
        "information",
        "document_access",
        "call",
        "other",
        "financial",
        "lease",
        "pos",
        "chattels",
        "vendor_meeting",
        "dd_question",
      ],
      section_type: [
        "hero",
        "location_advantage",
        "business_overview",
        "key_highlights",
        "financial_snapshot",
        "lease_summary",
        "operations_staff",
        "growth_opportunities",
        "buyer_fit",
        "risks_due_diligence",
        "photo_gallery",
        "supporting_documents",
        "ask_question",
        "request_information",
        "start_offer_discussion",
        "voiceover_script",
      ],
      voiceover_approval: ["draft", "needs_review", "approved"],
      voiceover_style: [
        "professional",
        "calm",
        "premium",
        "direct",
        "warm",
        "investor",
      ],
    },
  },
} as const
