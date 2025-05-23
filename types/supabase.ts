export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      allpatients: any;
      about: {
        Row: {
          created_at: string
          id: number
          image_1: string | null
          image_2: string | null
          image_3: string | null
          image_4: string | null
          image_5: string | null
          text_1: string
          text_2: string | null
          text_3: string | null
          text_4: string | null
          text_5: string | null
          title_1: string | null
          title_2: string | null
          title_3: string | null
          title_4: string | null
          title_5: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          image_1?: string | null
          image_2?: string | null
          image_3?: string | null
          image_4?: string | null
          image_5?: string | null
          text_1?: string
          text_2?: string | null
          text_3?: string | null
          text_4?: string | null
          text_5?: string | null
          title_1?: string | null
          title_2?: string | null
          title_3?: string | null
          title_4?: string | null
          title_5?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          image_1?: string | null
          image_2?: string | null
          image_3?: string | null
          image_4?: string | null
          image_5?: string | null
          text_1?: string
          text_2?: string | null
          text_3?: string | null
          text_4?: string | null
          text_5?: string | null
          title_1?: string | null
          title_2?: string | null
          title_3?: string | null
          title_4?: string | null
          title_5?: string | null
        }
        Relationships: []
      }
      about_es: {
        Row: {
          created_at: string
          id: number
          image_1: string | null
          image_2: string | null
          image_3: string | null
          image_4: string | null
          image_5: string | null
          text_1: string
          text_2: string | null
          text_3: string | null
          text_4: string | null
          text_5: string | null
          title_1: string | null
          title_2: string | null
          title_3: string | null
          title_4: string | null
          title_5: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          image_1?: string | null
          image_2?: string | null
          image_3?: string | null
          image_4?: string | null
          image_5?: string | null
          text_1?: string
          text_2?: string | null
          text_3?: string | null
          text_4?: string | null
          text_5?: string | null
          title_1?: string | null
          title_2?: string | null
          title_3?: string | null
          title_4?: string | null
          title_5?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          image_1?: string | null
          image_2?: string | null
          image_3?: string | null
          image_4?: string | null
          image_5?: string | null
          text_1?: string
          text_2?: string | null
          text_3?: string | null
          text_4?: string | null
          text_5?: string | null
          title_1?: string | null
          title_2?: string | null
          title_3?: string | null
          title_4?: string | null
          title_5?: string | null
        }
        Relationships: []
      }
      About_Short: {
        Row: {
          content: string
          created_at: string
          id: number
        }
        Insert: {
          content?: string
          created_at?: string
          id?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      About_Short_es: {
        Row: {
          content: string
          created_at: string
          id: number
        }
        Insert: {
          content?: string
          created_at?: string
          id?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      Appoinments: {
        Row: {
          address: string | null
          created_at: string
          dob: string | null
          email_Address: string | null
          first_name: string | null
          id: number
          in_office_patient: boolean
          last_name: string | null
          location_id: number
          new_patient: boolean
          service: string | null
          sex: string | null
          isApproved: boolean
        }
        Insert: {
          address?: string | null
          created_at?: string
          dob?: string | null
          email_Address?: string | null
          first_name?: string | null
          id?: number
          in_office_patient: boolean
          last_name?: string | null
          location_id: number
          new_patient: boolean
          service?: string | null
          sex?: string | null
          isApproved: boolean
        }
        Update: {
          address?: string | null
          created_at?: string
          dob?: string | null
          email_Address?: string | null
          first_name?: string | null
          id?: number
          in_office_patient?: boolean
          last_name?: string | null
          location_id?: number
          new_patient?: boolean
          service?: string | null
          sex?: string | null
          isApproved: boolean
        }
        Relationships: [
          {
            foreignKeyName: "Appoinments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "Locations"
            referencedColumns: ["id"]
          },
        ]
      }
      Blog: {
        Row: {
          content: string | null
          created_at: string
          id: number
          image: string | null
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: number
          image?: string | null
          title?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: number
          image?: string | null
          title?: string
        }
        Relationships: []
      }
      career: {
        Row: {
          created_at: string
          id: number
          Text: string
        }
        Insert: {
          created_at?: string
          id?: number
          Text: string
        }
        Update: {
          created_at?: string
          id?: number
          Text?: string
        }
        Relationships: []
      }
      career_es: {
        Row: {
          created_at: string
          id: number
          Text: string
        }
        Insert: {
          created_at?: string
          id?: number
          Text: string
        }
        Update: {
          created_at?: string
          id?: number
          Text?: string
        }
        Relationships: []
      }
      FAQs: {
        Row: {
          answer: string
          created_at: string
          id: number
          question: string
        }
        Insert: {
          answer?: string
          created_at?: string
          id?: number
          question?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: number
          question?: string
        }
        Relationships: []
      }
      FAQs_es: {
        Row: {
          answer: string
          created_at: string
          id: number
          question: string
        }
        Insert: {
          answer?: string
          created_at?: string
          id?: number
          question?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: number
          question?: string
        }
        Relationships: []
      }
      Hero_Section: {
        Row: {
          content: string
          created_at: string
          id: number
          title: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: number
          title?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          title?: string
        }
        Relationships: []
      }
      Hero_Section_es: {
        Row: {
          content: string
          created_at: string
          id: number
          title: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: number
          title?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          title?: string
        }
        Relationships: []
      }
      Images: {
        Row: {
          created_at: string
          id: number
          image: string
          location_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          image: string
          location_id: number
        }
        Update: {
          created_at?: string
          id?: number
          image?: string
          location_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "public_Images_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "Locations"
            referencedColumns: ["id"]
          },
        ]
      }
      Locations: {
        Row: {
          address: string
          created_at: string
          direction: string
          email: string
          friday_timing: string
          Group: string | null
          id: number
          mon_timing: string
          phone: string
          saturday_timing: string
          sunday_timing: string
          thursday_timing: string
          title: string
          tuesday_timing: string
          wednesday_timing: string
        }
        Insert: {
          address?: string
          created_at?: string
          direction?: string
          email?: string
          friday_timing?: string
          Group?: string | null
          id?: number
          mon_timing?: string
          phone?: string
          saturday_timing?: string
          sunday_timing?: string
          thursday_timing?: string
          title: string
          tuesday_timing?: string
          wednesday_timing?: string
        }
        Update: {
          address?: string
          created_at?: string
          direction?: string
          email?: string
          friday_timing?: string
          Group?: string | null
          id?: number
          mon_timing?: string
          phone?: string
          saturday_timing?: string
          sunday_timing?: string
          thursday_timing?: string
          title?: string
          tuesday_timing?: string
          wednesday_timing?: string
        }
        Relationships: []
      }
      offsite_patients: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string
          icon: string | null
          id: number
          image: string
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string | null
          id?: number
          image?: string
          title?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string | null
          id?: number
          image?: string
          title?: string
        }
        Relationships: []
      }
      services_es: {
        Row: {
          created_at: string
          description: string
          icon: string | null
          id: number
          image: string
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string | null
          id?: number
          image?: string
          title?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string | null
          id?: number
          image?: string
          title?: string
        }
        Relationships: []
      }
      Specials: {
        Row: {
          created_at: string
          id: number
          image: string
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          image: string
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          image?: string
          title?: string | null
        }
        Relationships: []
      }
      Testinomial: {
        Row: {
          created_at: string
          id: number
          location_id: number
          name: string
          rating: string
          review: string
        }
        Insert: {
          created_at?: string
          id?: number
          location_id: number
          name?: string
          rating?: string
          review?: string
        }
        Update: {
          created_at?: string
          id?: number
          location_id?: number
          name?: string
          rating?: string
          review?: string
        }
        Relationships: [
          {
            foreignKeyName: "Testinomial_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "Locations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_locations: {
        Row: {
          id: number
          profile_id: string
          location_id: number
          created_at: string
        }
        Insert: {
          id?: number
          profile_id: string
          location_id: number
          created_at?: string
        }
        Update: {
          id?: number
          profile_id?: string
          location_id?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_locations_profile_id_fkey"
            columns: ["profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_locations_location_id_fkey"
            columns: ["location_id"]
            referencedRelation: "Locations"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
