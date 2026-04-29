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
      businesses: {
        Row: {
          address: string | null
          archived_at: string | null
          asking_price: number | null
          broker_notes: string | null
          business_type: string | null
          city: string | null
          confidential_title: string | null
          created_at: string
          created_by: string | null
          ebitda: number | null
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
          public_title: string | null
          region: string | null
          renewal_rights: string | null
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
          weekly_sales_max: number | null
          weekly_sales_min: number | null
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          asking_price?: number | null
          broker_notes?: string | null
          business_type?: string | null
          city?: string | null
          confidential_title?: string | null
          created_at?: string
          created_by?: string | null
          ebitda?: number | null
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
          public_title?: string | null
          region?: string | null
          renewal_rights?: string | null
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
          weekly_sales_max?: number | null
          weekly_sales_min?: number | null
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          asking_price?: number | null
          broker_notes?: string | null
          business_type?: string | null
          city?: string | null
          confidential_title?: string | null
          created_at?: string
          created_by?: string | null
          ebitda?: number | null
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
          public_title?: string | null
          region?: string | null
          renewal_rights?: string | null
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
          business_id: string
          created_at: string
          doc_type: Database["public"]["Enums"]["document_type"]
          file_size: number | null
          id: string
          mime_type: string | null
          storage_path: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
          visibility: Database["public"]["Enums"]["document_visibility"]
        }
        Insert: {
          business_id: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["document_type"]
          file_size?: number | null
          id?: string
          mime_type?: string | null
          storage_path?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          visibility?: Database["public"]["Enums"]["document_visibility"]
        }
        Update: {
          business_id?: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["document_type"]
          file_size?: number | null
          id?: string
          mime_type?: string | null
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
      offer_interest: {
        Row: {
          business_id: string
          buyer_id: string
          created_at: string
          disclaimer_accepted: boolean
          id: string
          indicative_amount: number | null
          status: Database["public"]["Enums"]["offer_status"]
          submitted_at: string | null
          terms: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          buyer_id: string
          created_at?: string
          disclaimer_accepted?: boolean
          id?: string
          indicative_amount?: number | null
          status?: Database["public"]["Enums"]["offer_status"]
          submitted_at?: string | null
          terms?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          buyer_id?: string
          created_at?: string
          disclaimer_accepted?: boolean
          id?: string
          indicative_amount?: number | null
          status?: Database["public"]["Enums"]["offer_status"]
          submitted_at?: string | null
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
          content: Json
          created_at: string
          id: string
          position: number
          section_type: Database["public"]["Enums"]["section_type"]
          updated_at: string
          version_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          position?: number
          section_type: Database["public"]["Enums"]["section_type"]
          updated_at?: string
          version_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          position?: number
          section_type?: Database["public"]["Enums"]["section_type"]
          updated_at?: string
          version_id?: string
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
          company: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
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
      app_role: "admin" | "buyer"
      business_status:
        | "draft"
        | "internal_review"
        | "ready_to_publish"
        | "published"
        | "archived"
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
      location_mode: "blind" | "suburb" | "exact"
      offer_status:
        | "draft"
        | "submitted"
        | "withdrawn"
        | "progressing"
        | "closed"
      presentation_status: "draft" | "published" | "archived"
      question_status: "open" | "answered" | "closed"
      request_status: "open" | "in_progress" | "closed"
      request_type: "information" | "document_access" | "call" | "other"
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
      ],
      app_role: ["admin", "buyer"],
      business_status: [
        "draft",
        "internal_review",
        "ready_to_publish",
        "published",
        "archived",
      ],
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
      location_mode: ["blind", "suburb", "exact"],
      offer_status: [
        "draft",
        "submitted",
        "withdrawn",
        "progressing",
        "closed",
      ],
      presentation_status: ["draft", "published", "archived"],
      question_status: ["open", "answered", "closed"],
      request_status: ["open", "in_progress", "closed"],
      request_type: ["information", "document_access", "call", "other"],
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
    },
  },
} as const
