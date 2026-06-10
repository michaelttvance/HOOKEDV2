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
      applications: {
        Row: {
          biggest_challenge: string | null
          billing_preference: string
          business_name: string
          city_state: string
          created_at: string
          current_software: string
          email: string
          full_name: string
          heard_from: string
          id: string
          invited_at: string | null
          landing_path: string | null
          phone: string
          referrer: string | null
          software_complaints: string | null
          status: string
          truck_count: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          biggest_challenge?: string | null
          billing_preference: string
          business_name: string
          city_state: string
          created_at?: string
          current_software: string
          email: string
          full_name: string
          heard_from: string
          id?: string
          invited_at?: string | null
          landing_path?: string | null
          phone: string
          referrer?: string | null
          software_complaints?: string | null
          status?: string
          truck_count: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          biggest_challenge?: string | null
          billing_preference?: string
          business_name?: string
          city_state?: string
          created_at?: string
          current_software?: string
          email?: string
          full_name?: string
          heard_from?: string
          id?: string
          invited_at?: string | null
          landing_path?: string | null
          phone?: string
          referrer?: string | null
          software_complaints?: string | null
          status?: string
          truck_count?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      approval_tokens: {
        Row: {
          created_at: string
          expires_at: string
          profile_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          profile_id: string
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          profile_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_tokens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          google_review_url: string | null
          id: string
          inbound_email_code: string | null
          invoice_prefix: string
          name: string
          pricing: Json
          sms_templates: Json
          tax_enabled_default: boolean
          tax_rate: number
        }
        Insert: {
          created_at?: string
          google_review_url?: string | null
          id?: string
          inbound_email_code?: string | null
          invoice_prefix?: string
          name: string
          pricing?: Json
          sms_templates?: Json
          tax_enabled_default?: boolean
          tax_rate?: number
        }
        Update: {
          created_at?: string
          google_review_url?: string | null
          id?: string
          inbound_email_code?: string | null
          invoice_prefix?: string
          name?: string
          pricing?: Json
          sms_templates?: Json
          tax_enabled_default?: boolean
          tax_rate?: number
        }
        Relationships: []
      }
      completed_jobs: {
        Row: {
          account_id: string | null
          company_id: string
          completed_at: string
          customer_name: string
          driver_id: string | null
          driver_name: string | null
          duration_minutes: number
          id: string
          invoice_number: string | null
          job_type: Database["public"]["Enums"]["job_type"]
          motor_club_id: string | null
          paid_at: string | null
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["billing_status"]
          price: number
          response_minutes: number
          tax_amount: number
          tax_enabled: boolean
        }
        Insert: {
          account_id?: string | null
          company_id: string
          completed_at?: string
          customer_name: string
          driver_id?: string | null
          driver_name?: string | null
          duration_minutes?: number
          id?: string
          invoice_number?: string | null
          job_type: Database["public"]["Enums"]["job_type"]
          motor_club_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["billing_status"]
          price?: number
          response_minutes?: number
          tax_amount?: number
          tax_enabled?: boolean
        }
        Update: {
          account_id?: string | null
          company_id?: string
          completed_at?: string
          customer_name?: string
          driver_id?: string | null
          driver_name?: string | null
          duration_minutes?: number
          id?: string
          invoice_number?: string | null
          job_type?: Database["public"]["Enums"]["job_type"]
          motor_club_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["billing_status"]
          price?: number
          response_minutes?: number
          tax_amount?: number
          tax_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "completed_jobs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "customer_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completed_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completed_jobs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completed_jobs_motor_club_id_fkey"
            columns: ["motor_club_id"]
            isOneToOne: false
            referencedRelation: "motor_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_accounts: {
        Row: {
          active: boolean
          address: string | null
          company_id: string
          contact_name: string | null
          created_at: string
          credit_limit: number
          custom_pricing: Json
          email: string | null
          id: string
          name: string
          net_terms_days: number
          notes: string | null
          phone: string | null
          type: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          company_id: string
          contact_name?: string | null
          created_at?: string
          credit_limit?: number
          custom_pricing?: Json
          email?: string | null
          id?: string
          name: string
          net_terms_days?: number
          notes?: string | null
          phone?: string | null
          type?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          company_id?: string
          contact_name?: string | null
          created_at?: string
          credit_limit?: number
          custom_pricing?: Json
          email?: string | null
          id?: string
          name?: string
          net_terms_days?: number
          notes?: string | null
          phone?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          certifications: string[]
          company_id: string
          created_at: string
          current_job_id: string | null
          distance_mi: number
          eta_min: number
          id: string
          location_lat: number
          location_lng: number
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["driver_status"]
          truck_number: string
          user_id: string | null
        }
        Insert: {
          certifications?: string[]
          company_id: string
          created_at?: string
          current_job_id?: string | null
          distance_mi?: number
          eta_min?: number
          id?: string
          location_lat?: number
          location_lng?: number
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          truck_number: string
          user_id?: string | null
        }
        Update: {
          certifications?: string[]
          company_id?: string
          created_at?: string
          current_job_id?: string | null
          distance_mi?: number
          eta_min?: number
          id?: string
          location_lat?: number
          location_lng?: number
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          truck_number?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      impound_vehicles: {
        Row: {
          auction_date: string | null
          company_id: string
          created_at: string
          daily_rate: number
          date_in: string
          date_out: string | null
          id: string
          initial_tow_fee: number
          license_plate: string | null
          lien_notice_sent_at: string | null
          notes: string | null
          owner_address: string | null
          owner_name: string | null
          owner_phone: string | null
          plate_state: string | null
          released_to: string | null
          status: string
          total_paid: number
          tow_location: string | null
          tow_reason: string | null
          towed_by: string | null
          updated_at: string
          vehicle_color: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
          vin: string | null
        }
        Insert: {
          auction_date?: string | null
          company_id: string
          created_at?: string
          daily_rate?: number
          date_in?: string
          date_out?: string | null
          id?: string
          initial_tow_fee?: number
          license_plate?: string | null
          lien_notice_sent_at?: string | null
          notes?: string | null
          owner_address?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          plate_state?: string | null
          released_to?: string | null
          status?: string
          total_paid?: number
          tow_location?: string | null
          tow_reason?: string | null
          towed_by?: string | null
          updated_at?: string
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          vin?: string | null
        }
        Update: {
          auction_date?: string | null
          company_id?: string
          created_at?: string
          daily_rate?: number
          date_in?: string
          date_out?: string | null
          id?: string
          initial_tow_fee?: number
          license_plate?: string | null
          lien_notice_sent_at?: string | null
          notes?: string | null
          owner_address?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          plate_state?: string | null
          released_to?: string | null
          status?: string
          total_paid?: number
          tow_location?: string | null
          tow_reason?: string | null
          towed_by?: string | null
          updated_at?: string
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impound_vehicles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      inbound_emails: {
        Row: {
          body_html: string | null
          body_text: string | null
          company_id: string | null
          error: string | null
          from_address: string
          id: string
          job_id: string | null
          parsed_json: Json | null
          received_at: string
          status: string
          subject: string | null
          to_address: string
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          company_id?: string | null
          error?: string | null
          from_address: string
          id?: string
          job_id?: string | null
          parsed_json?: Json | null
          received_at?: string
          status?: string
          subject?: string | null
          to_address: string
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          company_id?: string | null
          error?: string | null
          from_address?: string
          id?: string
          job_id?: string | null
          parsed_json?: Json | null
          received_at?: string
          status?: string
          subject?: string | null
          to_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbound_emails_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbound_emails_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string
          email: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_counters: {
        Row: {
          company_id: string
          next_number: number
        }
        Insert: {
          company_id: string
          next_number?: number
        }
        Update: {
          company_id?: string
          next_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_counters_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          assigned_at: string | null
          assigned_driver_id: string | null
          company_id: string
          created_at: string
          customer_name: string
          customer_phone: string | null
          en_route_at: string | null
          estimated_duration: number
          estimated_price: number
          eta_code: string | null
          id: string
          is_incoming: boolean
          job_type: Database["public"]["Enums"]["job_type"]
          lat: number
          lng: number
          location: string
          motor_club_id: string | null
          notes: string | null
          on_scene_at: string | null
          priority: Database["public"]["Enums"]["job_priority"]
          rotation_pd_id: string | null
          status: Database["public"]["Enums"]["job_status"]
          status_sent_at: string | null
          vehicle_color: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
          vin: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_driver_id?: string | null
          company_id: string
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          en_route_at?: string | null
          estimated_duration?: number
          estimated_price?: number
          eta_code?: string | null
          id?: string
          is_incoming?: boolean
          job_type: Database["public"]["Enums"]["job_type"]
          lat?: number
          lng?: number
          location: string
          motor_club_id?: string | null
          notes?: string | null
          on_scene_at?: string | null
          priority?: Database["public"]["Enums"]["job_priority"]
          rotation_pd_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          status_sent_at?: string | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          vin?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_driver_id?: string | null
          company_id?: string
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          en_route_at?: string | null
          estimated_duration?: number
          estimated_price?: number
          eta_code?: string | null
          id?: string
          is_incoming?: boolean
          job_type?: Database["public"]["Enums"]["job_type"]
          lat?: number
          lng?: number
          location?: string
          motor_club_id?: string | null
          notes?: string | null
          on_scene_at?: string | null
          priority?: Database["public"]["Enums"]["job_priority"]
          rotation_pd_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          status_sent_at?: string | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_assigned_driver_id_fkey"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_motor_club_id_fkey"
            columns: ["motor_club_id"]
            isOneToOne: false
            referencedRelation: "motor_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_rotation_pd_id_fkey"
            columns: ["rotation_pd_id"]
            isOneToOne: false
            referencedRelation: "police_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      motor_clubs: {
        Row: {
          accept_count: number | null
          account_number: string | null
          avg_payout: number | null
          company_id: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          enabled: boolean
          eta_codes: Json | null
          id: string
          jobs_this_month: number | null
          name: string
          provider: string
          total_offered: number | null
          updated_at: string
        }
        Insert: {
          accept_count?: number | null
          account_number?: string | null
          avg_payout?: number | null
          company_id: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          enabled?: boolean
          eta_codes?: Json | null
          id?: string
          jobs_this_month?: number | null
          name: string
          provider: string
          total_offered?: number | null
          updated_at?: string
        }
        Update: {
          accept_count?: number | null
          account_number?: string | null
          avg_payout?: number | null
          company_id?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          enabled?: boolean
          eta_codes?: Json | null
          id?: string
          jobs_this_month?: number | null
          name?: string
          provider?: string
          total_offered?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "motor_clubs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      police_departments: {
        Row: {
          company_id: string
          contact_name: string | null
          coverage_zone: string | null
          created_at: string
          email: string | null
          enabled: boolean
          id: string
          name: string
          phone: string | null
          rotation_position: number
          schedule_days: string[] | null
          schedule_end: string | null
          schedule_start: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          contact_name?: string | null
          coverage_zone?: string | null
          created_at?: string
          email?: string | null
          enabled?: boolean
          id?: string
          name: string
          phone?: string | null
          rotation_position?: number
          schedule_days?: string[] | null
          schedule_end?: string | null
          schedule_start?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          contact_name?: string | null
          coverage_zone?: string | null
          created_at?: string
          email?: string | null
          enabled?: boolean
          id?: string
          name?: string
          phone?: string | null
          rotation_position?: number
          schedule_days?: string[] | null
          schedule_end?: string | null
          schedule_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "police_departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          status: Database["public"]["Enums"]["approval_status"]
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      rotation_history: {
        Row: {
          accepted: boolean
          company_id: string
          decline_reason: string | null
          id: string
          job_type: string | null
          occurred_at: string
          pd_id: string | null
          pd_name: string
          response_minutes: number | null
        }
        Insert: {
          accepted?: boolean
          company_id: string
          decline_reason?: string | null
          id?: string
          job_type?: string | null
          occurred_at?: string
          pd_id?: string | null
          pd_name: string
          response_minutes?: number | null
        }
        Update: {
          accepted?: boolean
          company_id?: string
          decline_reason?: string | null
          id?: string
          job_type?: string | null
          occurred_at?: string
          pd_id?: string | null
          pd_name?: string
          response_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rotation_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotation_history_pd_id_fkey"
            columns: ["pd_id"]
            isOneToOne: false
            referencedRelation: "police_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_messages: {
        Row: {
          body: string
          company_id: string
          created_at: string
          error: string | null
          id: string
          job_id: string | null
          kind: string
          sent_at: string | null
          status: string
          to_phone: string
        }
        Insert: {
          body: string
          company_id: string
          created_at?: string
          error?: string | null
          id?: string
          job_id?: string | null
          kind: string
          sent_at?: string | null
          status?: string
          to_phone: string
        }
        Update: {
          body?: string
          company_id?: string
          created_at?: string
          error?: string | null
          id?: string
          job_id?: string | null
          kind?: string
          sent_at?: string | null
          status?: string
          to_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_rotation: { Args: { _pd_id: string }; Returns: undefined }
      complete_job: { Args: { _job_id: string }; Returns: string }
      create_public_job: {
        Args: {
          _company_id: string
          _customer_name: string
          _customer_phone: string
          _job_type: Database["public"]["Enums"]["job_type"]
          _location: string
          _notes: string
          _vehicle_make: string
          _vehicle_model: string
          _vehicle_year: number
        }
        Returns: string
      }
      current_company_id: { Args: never; Returns: string }
      current_driver_id: { Args: never; Returns: string }
      get_invite_preview: {
        Args: { _token: string }
        Returns: {
          company_name: string
          email: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      get_public_company: { Args: { _id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      next_invoice_number: { Args: never; Returns: string }
      next_rotation_pd: { Args: never; Returns: string }
      seed_company: { Args: { _company_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "dispatcher" | "driver"
      approval_status: "pending" | "approved" | "rejected"
      billing_status: "paid" | "invoiced" | "pending"
      driver_status: "available" | "en_route" | "on_scene" | "off"
      job_priority: "Urgent" | "Standard" | "Low"
      job_status:
        | "unassigned"
        | "assigned"
        | "en_route"
        | "on_scene"
        | "complete"
      job_type: "Tow" | "Lockout" | "Jumpstart" | "Tire" | "Winch"
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
      app_role: ["admin", "dispatcher", "driver"],
      approval_status: ["pending", "approved", "rejected"],
      billing_status: ["paid", "invoiced", "pending"],
      driver_status: ["available", "en_route", "on_scene", "off"],
      job_priority: ["Urgent", "Standard", "Low"],
      job_status: [
        "unassigned",
        "assigned",
        "en_route",
        "on_scene",
        "complete",
      ],
      job_type: ["Tow", "Lockout", "Jumpstart", "Tire", "Winch"],
    },
  },
} as const
