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
      consultations: {
        Row: {
          address: string | null
          age: number | null
          consultation_date: string
          created_at: string
          diagnosis: string | null
          id: string
          medicine: string | null
          notes: string | null
          patient_id: string | null
          patient_name: string
          recorded_by: string | null
          status: string
          symptoms: string | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          consultation_date?: string
          created_at?: string
          diagnosis?: string | null
          id?: string
          medicine?: string | null
          notes?: string | null
          patient_id?: string | null
          patient_name: string
          recorded_by?: string | null
          status?: string
          symptoms?: string | null
        }
        Update: {
          address?: string | null
          age?: number | null
          consultation_date?: string
          created_at?: string
          diagnosis?: string | null
          id?: string
          medicine?: string | null
          notes?: string | null
          patient_id?: string | null
          patient_name?: string
          recorded_by?: string | null
          status?: string
          symptoms?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          checklist: Json | null
          created_at: string
          establishment: string
          findings: string | null
          id: string
          inspection_date: string
          inspector_id: string | null
          permit_id: string | null
        }
        Insert: {
          checklist?: Json | null
          created_at?: string
          establishment: string
          findings?: string | null
          id?: string
          inspection_date?: string
          inspector_id?: string | null
          permit_id?: string | null
        }
        Update: {
          checklist?: Json | null
          created_at?: string
          establishment?: string
          findings?: string | null
          id?: string
          inspection_date?: string
          inspector_id?: string | null
          permit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "sanitation_permits"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_records: {
        Row: {
          age: string | null
          child_name: string
          created_at: string
          height: string | null
          id: string
          purok: string | null
          recorded_by: string | null
          status: string
          weight: string | null
        }
        Insert: {
          age?: string | null
          child_name: string
          created_at?: string
          height?: string | null
          id?: string
          purok?: string | null
          recorded_by?: string | null
          status?: string
          weight?: string | null
        }
        Update: {
          age?: string | null
          child_name?: string
          created_at?: string
          height?: string | null
          id?: string
          purok?: string | null
          recorded_by?: string | null
          status?: string
          weight?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          age: number
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          age: number
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          age?: number
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resident_complaints: {
        Row: {
          complaint_date: string
          complaint_type: string
          created_at: string
          description: string | null
          id: string
          location: string | null
          status: string
          user_id: string
        }
        Insert: {
          complaint_date?: string
          complaint_type: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          status?: string
          user_id: string
        }
        Update: {
          complaint_date?: string
          complaint_type?: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      resident_health_records: {
        Row: {
          created_at: string
          diagnosis: string | null
          id: string
          medicine: string | null
          provider: string | null
          record_date: string
          record_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          diagnosis?: string | null
          id?: string
          medicine?: string | null
          provider?: string | null
          record_date?: string
          record_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          diagnosis?: string | null
          id?: string
          medicine?: string | null
          provider?: string | null
          record_date?: string
          record_type?: string
          user_id?: string
        }
        Relationships: []
      }
      resident_permits: {
        Row: {
          application_date: string
          business_name: string
          business_type: string | null
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          application_date?: string
          business_name: string
          business_type?: string | null
          created_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          application_date?: string
          business_name?: string
          business_type?: string | null
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      sanitation_permits: {
        Row: {
          address: string | null
          application_date: string
          applied_by: string | null
          business_name: string
          business_type: string | null
          created_at: string
          id: string
          inspector: string | null
          notes: string | null
          owner_name: string
          status: string
        }
        Insert: {
          address?: string | null
          application_date?: string
          applied_by?: string | null
          business_name: string
          business_type?: string | null
          created_at?: string
          id?: string
          inspector?: string | null
          notes?: string | null
          owner_name: string
          status?: string
        }
        Update: {
          address?: string | null
          application_date?: string
          applied_by?: string | null
          business_name?: string
          business_type?: string | null
          created_at?: string
          id?: string
          inspector?: string | null
          notes?: string | null
          owner_name?: string
          status?: string
        }
        Relationships: []
      }
      surveillance_cases: {
        Row: {
          case_count: number
          case_date: string
          created_at: string
          details: string | null
          disease: string
          id: string
          patient_location: string | null
          reported_by: string | null
          reporter: string | null
          status: string
        }
        Insert: {
          case_count?: number
          case_date?: string
          created_at?: string
          details?: string | null
          disease: string
          id?: string
          patient_location?: string | null
          reported_by?: string | null
          reporter?: string | null
          status?: string
        }
        Update: {
          case_count?: number
          case_date?: string
          created_at?: string
          details?: string | null
          disease?: string
          id?: string
          patient_location?: string | null
          reported_by?: string | null
          reporter?: string | null
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vaccinations: {
        Row: {
          age: string | null
          bhw_name: string | null
          child_name: string
          created_at: string
          id: string
          recorded_by: string | null
          status: string
          vaccination_date: string
          vaccine: string
        }
        Insert: {
          age?: string | null
          bhw_name?: string | null
          child_name: string
          created_at?: string
          id?: string
          recorded_by?: string | null
          status?: string
          vaccination_date?: string
          vaccine: string
        }
        Update: {
          age?: string | null
          bhw_name?: string | null
          child_name?: string
          created_at?: string
          id?: string
          recorded_by?: string | null
          status?: string
          vaccination_date?: string
          vaccine?: string
        }
        Relationships: []
      }
      wastewater_complaints: {
        Row: {
          assigned_to: string | null
          complainant: string
          complaint_date: string
          complaint_type: string
          created_at: string
          description: string | null
          filed_by: string | null
          id: string
          location: string | null
          status: string
        }
        Insert: {
          assigned_to?: string | null
          complainant: string
          complaint_date?: string
          complaint_type: string
          created_at?: string
          description?: string | null
          filed_by?: string | null
          id?: string
          location?: string | null
          status?: string
        }
        Update: {
          assigned_to?: string | null
          complainant?: string
          complaint_date?: string
          complaint_type?: string
          created_at?: string
          description?: string | null
          filed_by?: string | null
          id?: string
          location?: string | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "Resident_User"
        | "BusinessOwner_User"
        | "BHW_User"
        | "BSI_User"
        | "Clerk_User"
        | "Captain_User"
        | "SysAdmin_User"
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
      app_role: [
        "Resident_User",
        "BusinessOwner_User",
        "BHW_User",
        "BSI_User",
        "Clerk_User",
        "Captain_User",
        "SysAdmin_User",
      ],
    },
  },
} as const
