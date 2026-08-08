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
      advocates: {
        Row: {
          availability: string | null
          bio: string | null
          chamber_address: string | null
          created_at: string
          email: string | null
          experience_years: number | null
          full_name: string
          id: string
          is_active: boolean
          is_verified: boolean
          languages: string[]
          phone: string | null
          photo_url: string | null
          practice_areas: string[]
          slug: string | null
          sort_order: number
          updated_at: string
          whatsapp: string
        }
        Insert: {
          availability?: string | null
          bio?: string | null
          chamber_address?: string | null
          created_at?: string
          email?: string | null
          experience_years?: number | null
          full_name: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          languages?: string[]
          phone?: string | null
          photo_url?: string | null
          practice_areas?: string[]
          slug?: string | null
          sort_order?: number
          updated_at?: string
          whatsapp: string
        }
        Update: {
          availability?: string | null
          bio?: string | null
          chamber_address?: string | null
          created_at?: string
          email?: string | null
          experience_years?: number | null
          full_name?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          languages?: string[]
          phone?: string | null
          photo_url?: string | null
          practice_areas?: string[]
          slug?: string | null
          sort_order?: number
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
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
      blood_donors: {
        Row: {
          address: string | null
          age: number | null
          available: boolean
          blood_group: Database["public"]["Enums"]["blood_group"]
          created_at: string
          full_name: string
          gender: Database["public"]["Enums"]["donor_gender"] | null
          id: string
          is_active: boolean
          last_donation_date: string | null
          notes: string | null
          phone: string
          photo_url: string | null
          status: Database["public"]["Enums"]["donor_status"]
          union_name: string | null
          updated_at: string
          user_id: string | null
          village: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          available?: boolean
          blood_group: Database["public"]["Enums"]["blood_group"]
          created_at?: string
          full_name: string
          gender?: Database["public"]["Enums"]["donor_gender"] | null
          id?: string
          is_active?: boolean
          last_donation_date?: string | null
          notes?: string | null
          phone: string
          photo_url?: string | null
          status?: Database["public"]["Enums"]["donor_status"]
          union_name?: string | null
          updated_at?: string
          user_id?: string | null
          village?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          age?: number | null
          available?: boolean
          blood_group?: Database["public"]["Enums"]["blood_group"]
          created_at?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["donor_gender"] | null
          id?: string
          is_active?: boolean
          last_donation_date?: string | null
          notes?: string | null
          phone?: string
          photo_url?: string | null
          status?: Database["public"]["Enums"]["donor_status"]
          union_name?: string | null
          updated_at?: string
          user_id?: string | null
          village?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      blood_requests: {
        Row: {
          bags_needed: number
          blood_group: Database["public"]["Enums"]["blood_group"]
          contact_person: string
          created_at: string
          hospital_location: string | null
          hospital_name: string
          id: string
          notes: string | null
          patient_name: string
          phone: string
          requester_id: string | null
          required_date: string
          required_time: string | null
          status: Database["public"]["Enums"]["blood_request_status"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          bags_needed?: number
          blood_group: Database["public"]["Enums"]["blood_group"]
          contact_person: string
          created_at?: string
          hospital_location?: string | null
          hospital_name: string
          id?: string
          notes?: string | null
          patient_name: string
          phone: string
          requester_id?: string | null
          required_date: string
          required_time?: string | null
          status?: Database["public"]["Enums"]["blood_request_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          bags_needed?: number
          blood_group?: Database["public"]["Enums"]["blood_group"]
          contact_person?: string
          created_at?: string
          hospital_location?: string | null
          hospital_name?: string
          id?: string
          notes?: string | null
          patient_name?: string
          phone?: string
          requester_id?: string | null
          required_date?: string
          required_time?: string | null
          status?: Database["public"]["Enums"]["blood_request_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      business_categories: {
        Row: {
          created_at: string
          group_bn: string
          icon: string | null
          id: string
          is_active: boolean
          name_bn: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_bn: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name_bn: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_bn?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name_bn?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      business_gallery: {
        Row: {
          business_id: string
          caption: string | null
          created_at: string
          id: string
          image_url: string
          sort_order: number
        }
        Insert: {
          business_id: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number
        }
        Update: {
          business_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_gallery_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          business_id: string
          close_time: string | null
          created_at: string
          day: Database["public"]["Enums"]["business_day"]
          id: string
          is_closed: boolean
          open_time: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          close_time?: string | null
          created_at?: string
          day: Database["public"]["Enums"]["business_day"]
          id?: string
          is_closed?: boolean
          open_time?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          close_time?: string | null
          created_at?: string
          day?: Database["public"]["Enums"]["business_day"]
          id?: string
          is_closed?: boolean
          open_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_reviews: {
        Row: {
          business_id: string
          comment: string | null
          created_at: string
          id: string
          is_hidden: boolean
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          comment?: string | null
          created_at?: string
          id?: string
          is_hidden?: boolean
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          is_hidden?: boolean
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          area: string | null
          avg_rating: number
          category_id: string | null
          cover_url: string | null
          created_at: string
          district: string
          email: string | null
          established_year: number | null
          facebook_url: string | null
          full_description: string | null
          id: string
          is_featured: boolean
          is_sponsored: boolean
          is_verified: boolean
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          owner_designation: string | null
          owner_id: string | null
          owner_name: string | null
          owner_photo_url: string | null
          owner_verified: boolean
          phone: string
          products: string[]
          review_count: number
          short_description: string | null
          slug: string | null
          sponsor_until: string | null
          status: Database["public"]["Enums"]["business_status"]
          union_name: string | null
          upazila: string
          updated_at: string
          view_count: number
          website_url: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          avg_rating?: number
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          district?: string
          email?: string | null
          established_year?: number | null
          facebook_url?: string | null
          full_description?: string | null
          id?: string
          is_featured?: boolean
          is_sponsored?: boolean
          is_verified?: boolean
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          owner_designation?: string | null
          owner_id?: string | null
          owner_name?: string | null
          owner_photo_url?: string | null
          owner_verified?: boolean
          phone: string
          products?: string[]
          review_count?: number
          short_description?: string | null
          slug?: string | null
          sponsor_until?: string | null
          status?: Database["public"]["Enums"]["business_status"]
          union_name?: string | null
          upazila?: string
          updated_at?: string
          view_count?: number
          website_url?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          area?: string | null
          avg_rating?: number
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          district?: string
          email?: string | null
          established_year?: number | null
          facebook_url?: string | null
          full_description?: string | null
          id?: string
          is_featured?: boolean
          is_sponsored?: boolean
          is_verified?: boolean
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          owner_designation?: string | null
          owner_id?: string | null
          owner_name?: string | null
          owner_photo_url?: string | null
          owner_verified?: boolean
          phone?: string
          products?: string[]
          review_count?: number
          short_description?: string | null
          slug?: string | null
          sponsor_until?: string | null
          status?: Database["public"]["Enums"]["business_status"]
          union_name?: string | null
          upazila?: string
          updated_at?: string
          view_count?: number
          website_url?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "business_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      communities: {
        Row: {
          area: string | null
          cover_url: string | null
          created_at: string
          created_by: string
          description: string | null
          group_type: Database["public"]["Enums"]["community_group_type"] | null
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["community_kind"]
          logo_url: string | null
          member_count: number
          name: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          cover_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          group_type?:
            | Database["public"]["Enums"]["community_group_type"]
            | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["community_kind"]
          logo_url?: string | null
          member_count?: number
          name: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          group_type?:
            | Database["public"]["Enums"]["community_group_type"]
            | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["community_kind"]
          logo_url?: string | null
          member_count?: number
          name?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      community_activities: {
        Row: {
          activity_date: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_hidden: boolean
          location: string | null
          mosque_id: string
          name: string
          organizer: string | null
          photos: string[]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activity_date?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_hidden?: boolean
          location?: string | null
          mosque_id: string
          name: string
          organizer?: string | null
          photos?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activity_date?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_hidden?: boolean
          location?: string | null
          mosque_id?: string
          name?: string
          organizer?: string | null
          photos?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_activities_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      community_events: {
        Row: {
          area: string | null
          category: Database["public"]["Enums"]["community_event_category"]
          community_id: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          id: string
          is_hidden: boolean
          like_count: number
          organizer_id: string
          report_count: number
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["community_visibility"]
        }
        Insert: {
          area?: string | null
          category?: Database["public"]["Enums"]["community_event_category"]
          community_id?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          is_hidden?: boolean
          like_count?: number
          organizer_id: string
          report_count?: number
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["community_visibility"]
        }
        Update: {
          area?: string | null
          category?: Database["public"]["Enums"]["community_event_category"]
          community_id?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          is_hidden?: boolean
          like_count?: number
          organizer_id?: string
          report_count?: number
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["community_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "community_events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_likes: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["community_reaction_kind"]
          reason: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["community_target_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["community_reaction_kind"]
          reason?: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["community_target_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["community_reaction_kind"]
          reason?: string | null
          target_id?: string
          target_type?: Database["public"]["Enums"]["community_target_type"]
          user_id?: string
        }
        Relationships: []
      }
      community_member_badges: {
        Row: {
          badge: Database["public"]["Enums"]["community_badge"]
          community_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge: Database["public"]["Enums"]["community_badge"]
          community_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge?: Database["public"]["Enums"]["community_badge"]
          community_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_member_badges_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          created_at: string
          custom_title: string | null
          id: string
          phone_visibility: Database["public"]["Enums"]["community_phone_visibility"]
          position_id: string | null
          role: Database["public"]["Enums"]["community_member_role"]
          status: Database["public"]["Enums"]["community_member_status"]
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          custom_title?: string | null
          id?: string
          phone_visibility?: Database["public"]["Enums"]["community_phone_visibility"]
          position_id?: string | null
          role?: Database["public"]["Enums"]["community_member_role"]
          status?: Database["public"]["Enums"]["community_member_status"]
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          custom_title?: string | null
          id?: string
          phone_visibility?: Database["public"]["Enums"]["community_phone_visibility"]
          position_id?: string | null
          role?: Database["public"]["Enums"]["community_member_role"]
          status?: Database["public"]["Enums"]["community_member_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "community_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      community_notices: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          is_hidden: boolean
          mosque_id: string
          notice_date: string
          priority: Database["public"]["Enums"]["mosque_notice_priority"]
          published_by: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          mosque_id: string
          notice_date?: string
          priority?: Database["public"]["Enums"]["mosque_notice_priority"]
          published_by?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          mosque_id?: string
          notice_date?: string
          priority?: Database["public"]["Enums"]["mosque_notice_priority"]
          published_by?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_notices_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      community_positions: {
        Row: {
          community_id: string
          created_at: string
          id: string
          name_bn: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          name_bn: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          name_bn?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_positions_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          community_id: string | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_hidden: boolean
          like_count: number
          report_count: number
          updated_at: string
        }
        Insert: {
          author_id: string
          community_id?: string | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          like_count?: number
          report_count?: number
          updated_at?: string
        }
        Update: {
          author_id?: string
          community_id?: string | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          like_count?: number
          report_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_submissions: {
        Row: {
          admin_notes: string | null
          client_cv_id: string
          completion: number
          created_at: string
          cv_name: string
          data: Json
          edit_token: string
          email: string
          full_name: string
          id: string
          ip_address: string | null
          job_title: string
          language: string
          phone: string
          reviewed_at: string | null
          status: string
          template: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          admin_notes?: string | null
          client_cv_id: string
          completion?: number
          created_at?: string
          cv_name?: string
          data?: Json
          edit_token: string
          email?: string
          full_name?: string
          id?: string
          ip_address?: string | null
          job_title?: string
          language?: string
          phone?: string
          reviewed_at?: string | null
          status?: string
          template?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          admin_notes?: string | null
          client_cv_id?: string
          completion?: number
          created_at?: string
          cv_name?: string
          data?: Json
          edit_token?: string
          email?: string
          full_name?: string
          id?: string
          ip_address?: string | null
          job_title?: string
          language?: string
          phone?: string
          reviewed_at?: string | null
          status?: string
          template?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      development_projects: {
        Row: {
          collected_amount: number
          created_at: string
          created_by: string | null
          description: string | null
          expected_completion_date: string | null
          id: string
          mosque_id: string
          name: string
          photos: string[]
          spent_amount: number
          start_date: string | null
          status: Database["public"]["Enums"]["mosque_project_status"]
          target_amount: number
          updated_at: string
          updated_by: string | null
          updates: string | null
        }
        Insert: {
          collected_amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_completion_date?: string | null
          id?: string
          mosque_id: string
          name: string
          photos?: string[]
          spent_amount?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["mosque_project_status"]
          target_amount?: number
          updated_at?: string
          updated_by?: string | null
          updates?: string | null
        }
        Update: {
          collected_amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_completion_date?: string | null
          id?: string
          mosque_id?: string
          name?: string
          photos?: string[]
          spent_amount?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["mosque_project_status"]
          target_amount?: number
          updated_at?: string
          updated_by?: string | null
          updates?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "development_projects_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      education_news: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          publish_date: string
          slug: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          publish_date?: string
          slug?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          publish_date?: string
          slug?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      exchange_rate_logs: {
        Row: {
          created_at: string
          id: string
          message: string | null
          provider: string | null
          success: boolean
          updated_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          provider?: string | null
          success: boolean
          updated_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          provider?: string | null
          success?: boolean
          updated_count?: number
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          country_name: string
          country_name_bn: string
          created_at: string
          currency_code: string
          currency_name: string
          exchange_rate_to_bdt: number
          flag_emoji: string
          flag_url: string | null
          id: string
          last_updated: string
          previous_rate: number
          rate_status: Database["public"]["Enums"]["rate_status"]
          sort_order: number
        }
        Insert: {
          country_name: string
          country_name_bn: string
          created_at?: string
          currency_code: string
          currency_name: string
          exchange_rate_to_bdt?: number
          flag_emoji?: string
          flag_url?: string | null
          id?: string
          last_updated?: string
          previous_rate?: number
          rate_status?: Database["public"]["Enums"]["rate_status"]
          sort_order?: number
        }
        Update: {
          country_name?: string
          country_name_bn?: string
          created_at?: string
          currency_code?: string
          currency_name?: string
          exchange_rate_to_bdt?: number
          flag_emoji?: string
          flag_url?: string | null
          id?: string
          last_updated?: string
          previous_rate?: number
          rate_status?: Database["public"]["Enums"]["rate_status"]
          sort_order?: number
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          mosque_id: string
          project_id: string | null
          txn_date: string
          txn_type: Database["public"]["Enums"]["mosque_txn_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          mosque_id: string
          project_id?: string | null
          txn_date?: string
          txn_type: Database["public"]["Enums"]["mosque_txn_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          mosque_id?: string
          project_id?: string | null
          txn_date?: string
          txn_type?: Database["public"]["Enums"]["mosque_txn_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "development_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_leads: {
        Row: {
          admin_note: string | null
          advocate_id: string | null
          category: string
          created_at: string
          description: string | null
          full_name: string
          id: string
          phone: string
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          advocate_id?: string | null
          category: string
          created_at?: string
          description?: string | null
          full_name: string
          id?: string
          phone: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          advocate_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          full_name?: string
          id?: string
          phone?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_leads_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          listing_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          listing_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          listing_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string | null
          category_id: string | null
          created_at: string
          description: string | null
          featured: boolean
          id: string
          latitude: number | null
          longitude: number | null
          owner_id: string
          phone: string | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          latitude?: number | null
          longitude?: number | null
          owner_id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          latitude?: number | null
          longitude?: number | null
          owner_id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      mosque_committee_members: {
        Row: {
          bio: string | null
          created_at: string
          created_by: string | null
          custom_title: string | null
          full_name: string
          id: string
          mosque_id: string
          phone: string | null
          phone_visibility: Database["public"]["Enums"]["mosque_visibility"]
          photo_url: string | null
          position: Database["public"]["Enums"]["mosque_committee_position"]
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          created_by?: string | null
          custom_title?: string | null
          full_name: string
          id?: string
          mosque_id: string
          phone?: string | null
          phone_visibility?: Database["public"]["Enums"]["mosque_visibility"]
          photo_url?: string | null
          position?: Database["public"]["Enums"]["mosque_committee_position"]
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          created_by?: string | null
          custom_title?: string | null
          full_name?: string
          id?: string
          mosque_id?: string
          phone?: string | null
          phone_visibility?: Database["public"]["Enums"]["mosque_visibility"]
          photo_url?: string | null
          position?: Database["public"]["Enums"]["mosque_committee_position"]
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mosque_committee_members_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      mosque_donors: {
        Row: {
          amount: number | null
          amount_visibility: Database["public"]["Enums"]["mosque_visibility"]
          created_at: string
          created_by: string | null
          donated_on: string | null
          full_name: string
          id: string
          is_anonymous: boolean
          location: string | null
          mosque_id: string
          photo_url: string | null
          project_id: string | null
          purpose: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount?: number | null
          amount_visibility?: Database["public"]["Enums"]["mosque_visibility"]
          created_at?: string
          created_by?: string | null
          donated_on?: string | null
          full_name: string
          id?: string
          is_anonymous?: boolean
          location?: string | null
          mosque_id: string
          photo_url?: string | null
          project_id?: string | null
          purpose?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number | null
          amount_visibility?: Database["public"]["Enums"]["mosque_visibility"]
          created_at?: string
          created_by?: string | null
          donated_on?: string | null
          full_name?: string
          id?: string
          is_anonymous?: boolean
          location?: string | null
          mosque_id?: string
          photo_url?: string | null
          project_id?: string | null
          purpose?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mosque_donors_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mosque_donors_project_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "development_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      mosque_managers: {
        Row: {
          created_at: string
          id: string
          mosque_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mosque_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mosque_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mosque_managers_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      mosque_reports: {
        Row: {
          contact: string | null
          created_at: string
          id: string
          mosque_id: string
          reason: string
          reporter_id: string | null
          status: string
          target_id: string | null
          target_kind: string
          updated_at: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          id?: string
          mosque_id: string
          reason: string
          reporter_id?: string | null
          status?: string
          target_id?: string | null
          target_kind?: string
          updated_at?: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          id?: string
          mosque_id?: string
          reason?: string
          reporter_id?: string | null
          status?: string
          target_id?: string | null
          target_kind?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mosque_reports_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      mosques: {
        Row: {
          area: string | null
          created_at: string
          created_by: string
          description: string | null
          district: string
          established_year: number | null
          finance_public: boolean
          id: string
          imam_name: string | null
          map_url: string | null
          muazzin_name: string | null
          name: string
          phone: string | null
          phone_visibility: Database["public"]["Enums"]["mosque_visibility"]
          photo_url: string | null
          rejection_reason: string | null
          slug: string | null
          status: Database["public"]["Enums"]["mosque_verification_status"]
          union_name: string | null
          upazila: string
          updated_at: string
          updated_by: string | null
          verified_at: string | null
          verified_by: string | null
          ward: string | null
        }
        Insert: {
          area?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          district: string
          established_year?: number | null
          finance_public?: boolean
          id?: string
          imam_name?: string | null
          map_url?: string | null
          muazzin_name?: string | null
          name: string
          phone?: string | null
          phone_visibility?: Database["public"]["Enums"]["mosque_visibility"]
          photo_url?: string | null
          rejection_reason?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["mosque_verification_status"]
          union_name?: string | null
          upazila: string
          updated_at?: string
          updated_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
          ward?: string | null
        }
        Update: {
          area?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          district?: string
          established_year?: number | null
          finance_public?: boolean
          id?: string
          imam_name?: string | null
          map_url?: string | null
          muazzin_name?: string | null
          name?: string
          phone?: string | null
          phone_visibility?: Database["public"]["Enums"]["mosque_visibility"]
          photo_url?: string | null
          rejection_reason?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["mosque_verification_status"]
          union_name?: string | null
          upazila?: string
          updated_at?: string
          updated_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
          ward?: string | null
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
      probashi_notification_log: {
        Row: {
          created_at: string
          id: string
          kind: string
          profile_id: string
          sent_on: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          profile_id: string
          sent_on?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          profile_id?: string
          sent_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "probashi_notification_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "probashi_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      probashi_profiles: {
        Row: {
          birth_date: string | null
          city: string | null
          community_message: string | null
          country: string
          country_code: string | null
          created_at: string
          expected_return_date: string | null
          facebook_url: string | null
          full_name: string
          id: string
          is_verified: boolean
          moved_abroad_date: string | null
          phone: string | null
          photo_url: string | null
          profession: string | null
          show_contact: boolean
          slug: string | null
          status: Database["public"]["Enums"]["probashi_status"]
          updated_at: string
          user_id: string | null
          village: string | null
          whatsapp: string | null
        }
        Insert: {
          birth_date?: string | null
          city?: string | null
          community_message?: string | null
          country: string
          country_code?: string | null
          created_at?: string
          expected_return_date?: string | null
          facebook_url?: string | null
          full_name: string
          id?: string
          is_verified?: boolean
          moved_abroad_date?: string | null
          phone?: string | null
          photo_url?: string | null
          profession?: string | null
          show_contact?: boolean
          slug?: string | null
          status?: Database["public"]["Enums"]["probashi_status"]
          updated_at?: string
          user_id?: string | null
          village?: string | null
          whatsapp?: string | null
        }
        Update: {
          birth_date?: string | null
          city?: string | null
          community_message?: string | null
          country?: string
          country_code?: string | null
          created_at?: string
          expected_return_date?: string | null
          facebook_url?: string | null
          full_name?: string
          id?: string
          is_verified?: boolean
          moved_abroad_date?: string | null
          phone?: string | null
          photo_url?: string | null
          profession?: string | null
          show_contact?: boolean
          slug?: string | null
          status?: Database["public"]["Enums"]["probashi_status"]
          updated_at?: string
          user_id?: string | null
          village?: string | null
          whatsapp?: string | null
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
          latitude: number | null
          location_confirmed: boolean
          longitude: number | null
          meter_no: string | null
          phone: string | null
          place_id: string | null
          plus_code: string | null
          role: Database["public"]["Enums"]["profile_role"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          latitude?: number | null
          location_confirmed?: boolean
          longitude?: number | null
          meter_no?: string | null
          phone?: string | null
          place_id?: string | null
          plus_code?: string | null
          role?: Database["public"]["Enums"]["profile_role"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          latitude?: number | null
          location_confirmed?: boolean
          longitude?: number | null
          meter_no?: string | null
          phone?: string | null
          place_id?: string | null
          plus_code?: string | null
          role?: Database["public"]["Enums"]["profile_role"]
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
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          listing_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      society_leaders: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          full_name: string
          id: string
          mosque_id: string
          phone: string | null
          phone_visibility: Database["public"]["Enums"]["mosque_visibility"]
          photo_url: string | null
          role_title: string | null
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          full_name: string
          id?: string
          mosque_id: string
          phone?: string | null
          phone_visibility?: Database["public"]["Enums"]["mosque_visibility"]
          photo_url?: string | null
          role_title?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          full_name?: string
          id?: string
          mosque_id?: string
          phone?: string | null
          phone_visibility?: Database["public"]["Enums"]["mosque_visibility"]
          photo_url?: string | null
          role_title?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "society_leaders_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      society_members: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          family_name: string | null
          full_name: string
          id: string
          mosque_id: string
          phone: string | null
          phone_visibility: Database["public"]["Enums"]["mosque_visibility"]
          photo_url: string | null
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          family_name?: string | null
          full_name: string
          id?: string
          mosque_id: string
          phone?: string | null
          phone_visibility?: Database["public"]["Enums"]["mosque_visibility"]
          photo_url?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          family_name?: string | null
          full_name?: string
          id?: string
          mosque_id?: string
          phone?: string | null
          phone_visibility?: Database["public"]["Enums"]["mosque_visibility"]
          photo_url?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "society_members_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      student_achievements: {
        Row: {
          achievement: string
          area: string | null
          created_at: string
          id: string
          institution: string | null
          is_published: boolean
          photo_url: string | null
          story: string | null
          student_name: string
          updated_at: string
        }
        Insert: {
          achievement: string
          area?: string | null
          created_at?: string
          id?: string
          institution?: string | null
          is_published?: boolean
          photo_url?: string | null
          story?: string | null
          student_name: string
          updated_at?: string
        }
        Update: {
          achievement?: string
          area?: string | null
          created_at?: string
          id?: string
          institution?: string | null
          is_published?: boolean
          photo_url?: string | null
          story?: string | null
          student_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      study_resources: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          external_url: string
          id: string
          is_published: boolean
          resource_type: Database["public"]["Enums"]["resource_type"]
          sort_order: number
          student_class: string | null
          subject: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          external_url: string
          id?: string
          is_published?: boolean
          resource_type?: Database["public"]["Enums"]["resource_type"]
          sort_order?: number
          student_class?: string | null
          subject?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          external_url?: string
          id?: string
          is_published?: boolean
          resource_type?: Database["public"]["Enums"]["resource_type"]
          sort_order?: number
          student_class?: string | null
          subject?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tariff_slabs: {
        Row: {
          created_at: string
          effective_from: string
          id: string
          is_active: boolean
          meter_type: string
          provider: string
          rate_per_unit: number
          slab_max: number | null
          slab_min: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_from?: string
          id?: string
          is_active?: boolean
          meter_type?: string
          provider?: string
          rate_per_unit: number
          slab_max?: number | null
          slab_min: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          id?: string
          is_active?: boolean
          meter_type?: string
          provider?: string
          rate_per_unit?: number
          slab_max?: number | null
          slab_min?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      teacher_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name_bn: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_bn: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_bn?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          area: string | null
          bio: string | null
          category_id: string | null
          created_at: string
          description: string | null
          district: string
          email: string | null
          experience_years: number | null
          full_name: string
          gender: Database["public"]["Enums"]["tutor_gender"] | null
          id: string
          is_available: boolean
          is_verified: boolean
          phone: string
          photo_url: string | null
          qualification: string | null
          slug: string | null
          status: Database["public"]["Enums"]["teacher_status"]
          student_class: string | null
          subjects: string | null
          submitted_by: string | null
          upazila: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          area?: string | null
          bio?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          district?: string
          email?: string | null
          experience_years?: number | null
          full_name: string
          gender?: Database["public"]["Enums"]["tutor_gender"] | null
          id?: string
          is_available?: boolean
          is_verified?: boolean
          phone: string
          photo_url?: string | null
          qualification?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["teacher_status"]
          student_class?: string | null
          subjects?: string | null
          submitted_by?: string | null
          upazila?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          area?: string | null
          bio?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          district?: string
          email?: string | null
          experience_years?: number | null
          full_name?: string
          gender?: Database["public"]["Enums"]["tutor_gender"] | null
          id?: string
          is_available?: boolean
          is_verified?: boolean
          phone?: string
          photo_url?: string | null
          qualification?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["teacher_status"]
          student_class?: string | null
          subjects?: string | null
          submitted_by?: string | null
          upazila?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "teacher_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tuition_applications: {
        Row: {
          applied_by: string
          created_at: string
          id: string
          message: string | null
          request_id: string
          status: Database["public"]["Enums"]["tuition_app_status"]
          tutor_id: string
          updated_at: string
        }
        Insert: {
          applied_by: string
          created_at?: string
          id?: string
          message?: string | null
          request_id: string
          status?: Database["public"]["Enums"]["tuition_app_status"]
          tutor_id: string
          updated_at?: string
        }
        Update: {
          applied_by?: string
          created_at?: string
          id?: string
          message?: string | null
          request_id?: string
          status?: Database["public"]["Enums"]["tuition_app_status"]
          tutor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tuition_applications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "public_tuition_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tuition_applications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "tuition_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tuition_applications_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      tuition_requests: {
        Row: {
          area: string | null
          budget: number | null
          created_at: string
          days_per_week: number | null
          district: string
          id: string
          matched_tutor_id: string | null
          mode: Database["public"]["Enums"]["tuition_mode"]
          notes: string | null
          parent_name: string
          phone: string
          preferred_gender: Database["public"]["Enums"]["tutor_gender"]
          preferred_time: string | null
          status: Database["public"]["Enums"]["tuition_status"]
          student_class: string
          subject: string
          submitted_by: string | null
          upazila: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          budget?: number | null
          created_at?: string
          days_per_week?: number | null
          district?: string
          id?: string
          matched_tutor_id?: string | null
          mode?: Database["public"]["Enums"]["tuition_mode"]
          notes?: string | null
          parent_name: string
          phone: string
          preferred_gender?: Database["public"]["Enums"]["tutor_gender"]
          preferred_time?: string | null
          status?: Database["public"]["Enums"]["tuition_status"]
          student_class: string
          subject: string
          submitted_by?: string | null
          upazila?: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          budget?: number | null
          created_at?: string
          days_per_week?: number | null
          district?: string
          id?: string
          matched_tutor_id?: string | null
          mode?: Database["public"]["Enums"]["tuition_mode"]
          notes?: string | null
          parent_name?: string
          phone?: string
          preferred_gender?: Database["public"]["Enums"]["tutor_gender"]
          preferred_time?: string | null
          status?: Database["public"]["Enums"]["tuition_status"]
          student_class?: string
          subject?: string
          submitted_by?: string | null
          upazila?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tuition_requests_matched_tutor_id_fkey"
            columns: ["matched_tutor_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
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
      verification_records: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          mosque_id: string
          note: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          mosque_id: string
          note?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          mosque_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_records_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name_bn: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_bn: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_bn?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      worker_gallery: {
        Row: {
          created_at: string
          id: string
          image_url: string
          sort_order: number
          worker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number
          worker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_gallery_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          area: string | null
          category_id: string | null
          created_at: string
          description: string | null
          district: string
          experience_years: number | null
          full_name: string
          id: string
          is_available: boolean
          is_verified: boolean
          phone: string
          photo_url: string | null
          skills: string | null
          slug: string | null
          status: Database["public"]["Enums"]["worker_status"]
          submitted_by: string | null
          upazila: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          area?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          district?: string
          experience_years?: number | null
          full_name: string
          id?: string
          is_available?: boolean
          is_verified?: boolean
          phone: string
          photo_url?: string | null
          skills?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["worker_status"]
          submitted_by?: string | null
          upazila?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          area?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          district?: string
          experience_years?: number | null
          full_name?: string
          id?: string
          is_available?: boolean
          is_verified?: boolean
          phone?: string
          photo_url?: string | null
          skills?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["worker_status"]
          submitted_by?: string | null
          upazila?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "worker_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_tuition_requests: {
        Row: {
          area: string | null
          budget: number | null
          created_at: string | null
          days_per_week: number | null
          district: string | null
          id: string | null
          mode: Database["public"]["Enums"]["tuition_mode"] | null
          notes: string | null
          preferred_gender: Database["public"]["Enums"]["tutor_gender"] | null
          preferred_time: string | null
          status: Database["public"]["Enums"]["tuition_status"] | null
          student_class: string | null
          subject: string | null
          upazila: string | null
        }
        Insert: {
          area?: string | null
          budget?: number | null
          created_at?: string | null
          days_per_week?: number | null
          district?: string | null
          id?: string | null
          mode?: Database["public"]["Enums"]["tuition_mode"] | null
          notes?: string | null
          preferred_gender?: Database["public"]["Enums"]["tutor_gender"] | null
          preferred_time?: string | null
          status?: Database["public"]["Enums"]["tuition_status"] | null
          student_class?: string | null
          subject?: string | null
          upazila?: string | null
        }
        Update: {
          area?: string | null
          budget?: number | null
          created_at?: string | null
          days_per_week?: number | null
          district?: string | null
          id?: string | null
          mode?: Database["public"]["Enums"]["tuition_mode"] | null
          notes?: string | null
          preferred_gender?: Database["public"]["Enums"]["tutor_gender"] | null
          preferred_time?: string | null
          status?: Database["public"]["Enums"]["tuition_status"] | null
          student_class?: string | null
          subject?: string | null
          upazila?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_view_member_phone: {
        Args: { _target: string; _viewer: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_community_manager: {
        Args: { _community_id: string; _user_id: string }
        Returns: boolean
      }
      is_community_member: {
        Args: { _community_id: string; _user_id: string }
        Returns: boolean
      }
      is_mosque_manager: {
        Args: { _mosque_id: string; _user_id: string }
        Returns: boolean
      }
      is_public_community: { Args: { _community_id: string }; Returns: boolean }
      slugify_name: { Args: { input: string }; Returns: string }
    }
    Enums: {
      announcement_category: "notice" | "outage" | "tariff" | "general"
      announcement_priority: "low" | "normal" | "high" | "urgent"
      app_role: "user" | "admin"
      bill_status: "pending" | "paid" | "overdue"
      blood_group: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"
      blood_request_status:
        | "pending"
        | "approved"
        | "fulfilled"
        | "closed"
        | "rejected"
      business_day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"
      business_status: "pending" | "approved" | "rejected" | "suspended"
      community_badge:
        | "founder"
        | "lifetime"
        | "executive"
        | "advisor"
        | "volunteer"
      community_event_category:
        | "walima"
        | "akika"
        | "milad"
        | "iftar"
        | "khela"
        | "mela"
        | "social"
        | "other"
      community_group_type:
        | "school_batch"
        | "college_batch"
        | "university_batch"
        | "friends"
        | "sports_team"
        | "neighborhood"
        | "other"
      community_kind: "community" | "club" | "group"
      community_member_role: "owner" | "admin" | "member"
      community_member_status: "active" | "inactive"
      community_phone_visibility: "public" | "members" | "managers" | "hidden"
      community_reaction_kind: "like" | "report"
      community_target_type: "post" | "event"
      community_visibility: "public" | "members"
      complaint_reason: "high_bill" | "wrong_reading" | "wrong_tariff" | "other"
      donor_gender: "male" | "female" | "other"
      donor_status: "pending" | "approved" | "rejected"
      lead_status: "new" | "contacted" | "closed"
      listing_status: "pending" | "approved" | "rejected"
      mosque_committee_position:
        | "president"
        | "vice_president"
        | "secretary"
        | "treasurer"
        | "member"
      mosque_notice_priority: "normal" | "important" | "urgent"
      mosque_project_status: "planned" | "ongoing" | "completed" | "paused"
      mosque_txn_type: "income" | "expense"
      mosque_verification_status: "pending" | "verified" | "rejected"
      mosque_visibility: "public" | "private"
      probashi_status: "pending" | "approved" | "rejected" | "suspended"
      profile_role: "user" | "business" | "admin"
      rate_status: "increased" | "decreased" | "stable"
      report_category: "billing" | "outage" | "meter" | "connection" | "other"
      report_status: "open" | "in_progress" | "resolved" | "rejected"
      resource_type: "website" | "gdrive" | "youtube" | "pdf" | "link"
      teacher_status: "pending" | "approved" | "rejected" | "inactive"
      tuition_app_status: "pending" | "accepted" | "rejected" | "withdrawn"
      tuition_mode: "online" | "offline" | "both"
      tuition_status:
        | "pending"
        | "approved"
        | "rejected"
        | "matched"
        | "filled"
        | "closed"
      tutor_gender: "male" | "female" | "any"
      worker_status: "pending" | "approved" | "rejected" | "inactive"
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
      blood_group: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      blood_request_status: [
        "pending",
        "approved",
        "fulfilled",
        "closed",
        "rejected",
      ],
      business_day: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      business_status: ["pending", "approved", "rejected", "suspended"],
      community_badge: [
        "founder",
        "lifetime",
        "executive",
        "advisor",
        "volunteer",
      ],
      community_event_category: [
        "walima",
        "akika",
        "milad",
        "iftar",
        "khela",
        "mela",
        "social",
        "other",
      ],
      community_group_type: [
        "school_batch",
        "college_batch",
        "university_batch",
        "friends",
        "sports_team",
        "neighborhood",
        "other",
      ],
      community_kind: ["community", "club", "group"],
      community_member_role: ["owner", "admin", "member"],
      community_member_status: ["active", "inactive"],
      community_phone_visibility: ["public", "members", "managers", "hidden"],
      community_reaction_kind: ["like", "report"],
      community_target_type: ["post", "event"],
      community_visibility: ["public", "members"],
      complaint_reason: ["high_bill", "wrong_reading", "wrong_tariff", "other"],
      donor_gender: ["male", "female", "other"],
      donor_status: ["pending", "approved", "rejected"],
      lead_status: ["new", "contacted", "closed"],
      listing_status: ["pending", "approved", "rejected"],
      mosque_committee_position: [
        "president",
        "vice_president",
        "secretary",
        "treasurer",
        "member",
      ],
      mosque_notice_priority: ["normal", "important", "urgent"],
      mosque_project_status: ["planned", "ongoing", "completed", "paused"],
      mosque_txn_type: ["income", "expense"],
      mosque_verification_status: ["pending", "verified", "rejected"],
      mosque_visibility: ["public", "private"],
      probashi_status: ["pending", "approved", "rejected", "suspended"],
      profile_role: ["user", "business", "admin"],
      rate_status: ["increased", "decreased", "stable"],
      report_category: ["billing", "outage", "meter", "connection", "other"],
      report_status: ["open", "in_progress", "resolved", "rejected"],
      resource_type: ["website", "gdrive", "youtube", "pdf", "link"],
      teacher_status: ["pending", "approved", "rejected", "inactive"],
      tuition_app_status: ["pending", "accepted", "rejected", "withdrawn"],
      tuition_mode: ["online", "offline", "both"],
      tuition_status: [
        "pending",
        "approved",
        "rejected",
        "matched",
        "filled",
        "closed",
      ],
      tutor_gender: ["male", "female", "any"],
      worker_status: ["pending", "approved", "rejected", "inactive"],
    },
  },
} as const
