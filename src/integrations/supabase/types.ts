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
      announcements: {
        Row: {
          body: string
          category: Database["public"]["Enums"]["announcement_category"]
          created_at: string
          ends_at: string | null
          id: string
          is_published: boolean
          location: string | null
          priority: Database["public"]["Enums"]["announcement_priority"]
          published_at: string
          published_by: string | null
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          category?: Database["public"]["Enums"]["announcement_category"]
          created_at?: string
          ends_at?: string | null
          id?: string
          is_published?: boolean
          location?: string | null
          priority?: Database["public"]["Enums"]["announcement_priority"]
          published_at?: string
          published_by?: string | null
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: Database["public"]["Enums"]["announcement_category"]
          created_at?: string
          ends_at?: string | null
          id?: string
          is_published?: boolean
          location?: string | null
          priority?: Database["public"]["Enums"]["announcement_priority"]
          published_at?: string
          published_by?: string | null
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bills: {
        Row: {
          amount: number
          bill_image_url: string | null
          bill_month: number | null
          bill_year: number | null
          billing_month: string
          created_at: string
          district: string | null
          due_date: string
          family_members: number | null
          id: string
          meter_no: string
          meter_type: string | null
          notes: string | null
          paid_at: string | null
          provider: string | null
          receipt_url: string | null
          status: Database["public"]["Enums"]["bill_status"]
          union_name: string | null
          units_consumed: number
          upazila: string | null
          updated_at: string
          user_id: string
          village: string | null
        }
        Insert: {
          amount?: number
          bill_image_url?: string | null
          bill_month?: number | null
          bill_year?: number | null
          billing_month: string
          created_at?: string
          district?: string | null
          due_date: string
          family_members?: number | null
          id?: string
          meter_no: string
          meter_type?: string | null
          notes?: string | null
          paid_at?: string | null
          provider?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["bill_status"]
          union_name?: string | null
          units_consumed?: number
          upazila?: string | null
          updated_at?: string
          user_id: string
          village?: string | null
        }
        Update: {
          amount?: number
          bill_image_url?: string | null
          bill_month?: number | null
          bill_year?: number | null
          billing_month?: string
          created_at?: string
          district?: string | null
          due_date?: string
          family_members?: number | null
          id?: string
          meter_no?: string
          meter_type?: string | null
          notes?: string | null
          paid_at?: string | null
          provider?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["bill_status"]
          union_name?: string | null
          units_consumed?: number
          upazila?: string | null
          updated_at?: string
          user_id?: string
          village?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          meter_no: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          meter_no?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          meter_no?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_response: string | null
          category: Database["public"]["Enums"]["report_category"]
          created_at: string
          description: string
          id: string
          image_url: string | null
          reason: Database["public"]["Enums"]["complaint_reason"]
          status: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          category?: Database["public"]["Enums"]["report_category"]
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          reason?: Database["public"]["Enums"]["complaint_reason"]
          status?: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          category?: Database["public"]["Enums"]["report_category"]
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          reason?: Database["public"]["Enums"]["complaint_reason"]
          status?: Database["public"]["Enums"]["report_status"]
          title?: string
          updated_at?: string
          user_id?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      announcement_category: "notice" | "outage" | "tariff" | "general"
      announcement_priority: "low" | "normal" | "high" | "urgent"
      app_role: "user" | "admin"
      bill_status: "pending" | "paid" | "overdue"
      complaint_reason: "high_bill" | "wrong_reading" | "wrong_tariff" | "other"
      report_category: "billing" | "outage" | "meter" | "connection" | "other"
      report_status: "open" | "in_progress" | "resolved" | "rejected"
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
      announcement_category: ["notice", "outage", "tariff", "general"],
      announcement_priority: ["low", "normal", "high", "urgent"],
      app_role: ["user", "admin"],
      bill_status: ["pending", "paid", "overdue"],
      complaint_reason: ["high_bill", "wrong_reading", "wrong_tariff", "other"],
      report_category: ["billing", "outage", "meter", "connection", "other"],
      report_status: ["open", "in_progress", "resolved", "rejected"],
    },
  },
} as const
