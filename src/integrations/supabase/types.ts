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
      certificates: {
        Row: {
          certificate_number: string | null
          certificate_type: string
          created_at: string
          document_url: string | null
          establishment_id: string
          expiry_date: string | null
          id: string
          issued_date: string | null
          status: string
          user_id: string
        }
        Insert: {
          certificate_number?: string | null
          certificate_type?: string
          created_at?: string
          document_url?: string | null
          establishment_id: string
          expiry_date?: string | null
          id?: string
          issued_date?: string | null
          status?: string
          user_id: string
        }
        Update: {
          certificate_number?: string | null
          certificate_type?: string
          created_at?: string
          document_url?: string | null
          establishment_id?: string
          expiry_date?: string | null
          id?: string
          issued_date?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
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
      establishments: {
        Row: {
          address: string | null
          barangay: string | null
          business_name: string
          business_permit_number: string | null
          business_type: string | null
          contact_number: string | null
          created_at: string
          id: string
          issuing_lgu: string | null
          owner_name: string
          permit_document_url: string | null
          permit_expiry_date: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          barangay?: string | null
          business_name: string
          business_permit_number?: string | null
          business_type?: string | null
          contact_number?: string | null
          created_at?: string
          id?: string
          issuing_lgu?: string | null
          owner_name: string
          permit_document_url?: string | null
          permit_expiry_date?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          barangay?: string | null
          business_name?: string
          business_permit_number?: string | null
          business_type?: string | null
          contact_number?: string | null
          created_at?: string
          id?: string
          issuing_lgu?: string | null
          owner_name?: string
          permit_document_url?: string | null
          permit_expiry_date?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      establishment_notifications: {
        Row: {
          id: string
          establishment_id: string
          notified_at: string
          read_by_clerk: boolean
          read_by_bsi: boolean
        }
        Insert: {
          id?: string
          establishment_id: string
          notified_at?: string
          read_by_clerk?: boolean
          read_by_bsi?: boolean
        }
        Update: {
          id?: string
          establishment_id?: string
          notified_at?: string
          read_by_clerk?: boolean
          read_by_bsi?: boolean
        }
        Relationships: [
          { foreignKeyName: "establishment_notifications_establishment_id_fkey", columns: ["establishment_id"], isOneToOne: false, referencedRelation: "establishments", referencedColumns: ["id"] },
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
      payments: {
        Row: {
          amount: number
          created_at: string
          establishment_id: string | null
          id: string
          paid_at: string | null
          payment_type: string
          reference_number: string | null
          sanitary_application_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          establishment_id?: string | null
          id?: string
          paid_at?: string | null
          payment_type: string
          reference_number?: string | null
          sanitary_application_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          establishment_id?: string | null
          id?: string
          paid_at?: string | null
          payment_type?: string
          reference_number?: string | null
          sanitary_application_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_sanitary_application_id_fkey"
            columns: ["sanitary_application_id"]
            isOneToOne: false
            referencedRelation: "sanitary_permit_applications"
            referencedColumns: ["id"]
          },
        ]
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
      sanitation_complaints: {
        Row: {
          complaint_id: string
          citizen_id: string | null
          complaint_type: string
          barangay: string
          description: string | null
          photo_attachment: string | null
          status: string
          assigned_officer: string | null
          date_submitted: string
          created_at: string
        }
        Insert: {
          complaint_id?: string
          citizen_id?: string | null
          complaint_type: string
          barangay: string
          description?: string | null
          photo_attachment?: string | null
          status?: string
          assigned_officer?: string | null
          date_submitted?: string
          created_at?: string
        }
        Update: {
          complaint_id?: string
          citizen_id?: string | null
          complaint_type?: string
          barangay?: string
          description?: string | null
          photo_attachment?: string | null
          status?: string
          assigned_officer?: string | null
          date_submitted?: string
          created_at?: string
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
      sanitary_permit_applications: {
        Row: {
          id: string
          establishment_id: string
          user_id: string
          establishment_name: string
          business_type: string | null
          address: string | null
          barangay: string | null
          owner_name: string
          contact_number: string | null
          health_certificates_url: string | null
          water_analysis_url: string | null
          pest_control_url: string | null
          business_permit_url: string | null
          valid_id_url: string | null
          status: string
          order_of_payment_number: string | null
          payment_id: string | null
          is_provisional: boolean
          assigned_inspector_id: string | null
          inspection_scheduled_date: string | null
          inspection_notes: string | null
          permit_number: string | null
          permit_issued_at: string | null
          permit_expiry_date: string | null
          correction_notes: string | null
          reinspection_proof_url: string | null
          reinspection_requested_at: string | null
          applied_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          establishment_id: string
          user_id: string
          establishment_name: string
          business_type?: string | null
          address?: string | null
          barangay?: string | null
          owner_name: string
          contact_number?: string | null
          health_certificates_url?: string | null
          water_analysis_url?: string | null
          pest_control_url?: string | null
          business_permit_url?: string | null
          valid_id_url?: string | null
          status?: string
          order_of_payment_number?: string | null
          payment_id?: string | null
          is_provisional?: boolean
          assigned_inspector_id?: string | null
          inspection_scheduled_date?: string | null
          inspection_notes?: string | null
          permit_number?: string | null
          permit_issued_at?: string | null
          permit_expiry_date?: string | null
          correction_notes?: string | null
          reinspection_proof_url?: string | null
          reinspection_requested_at?: string | null
          applied_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          establishment_id?: string
          user_id?: string
          establishment_name?: string
          business_type?: string | null
          address?: string | null
          barangay?: string | null
          owner_name?: string
          contact_number?: string | null
          health_certificates_url?: string | null
          water_analysis_url?: string | null
          pest_control_url?: string | null
          business_permit_url?: string | null
          valid_id_url?: string | null
          status?: string
          order_of_payment_number?: string | null
          payment_id?: string | null
          is_provisional?: boolean
          assigned_inspector_id?: string | null
          inspection_scheduled_date?: string | null
          inspection_notes?: string | null
          permit_number?: string | null
          permit_issued_at?: string | null
          permit_expiry_date?: string | null
          correction_notes?: string | null
          reinspection_proof_url?: string | null
          reinspection_requested_at?: string | null
          applied_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "sanitary_permit_applications_establishment_id_fkey", columns: ["establishment_id"], isOneToOne: false, referencedRelation: "establishments", referencedColumns: ["id"] },
          { foreignKeyName: "sanitary_permit_applications_payment_id_fkey", columns: ["payment_id"], isOneToOne: false, referencedRelation: "payments", referencedColumns: ["id"] },
        ]
      }
      sanitary_inspections: {
        Row: {
          id: string
          application_id: string
          inspector_id: string | null
          scheduled_date: string | null
          status: string
          result: string | null
          checklist: Json | null
          findings: string | null
          correction_required_notes: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          inspector_id?: string | null
          scheduled_date?: string | null
          status?: string
          result?: string | null
          checklist?: Json | null
          findings?: string | null
          correction_required_notes?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          inspector_id?: string | null
          scheduled_date?: string | null
          status?: string
          result?: string | null
          checklist?: Json | null
          findings?: string | null
          correction_required_notes?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "sanitary_inspections_application_id_fkey", columns: ["application_id"], isOneToOne: false, referencedRelation: "sanitary_permit_applications", referencedColumns: ["id"] },
        ]
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
      service_requests: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          request_type: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          request_type: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          request_type?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      disease_reports: {
        Row: {
          id: string
          disease: string
          patient_location: string
          details: string | null
          reported_by: string | null
          reporter: string | null
          status: string
          case_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          disease: string
          patient_location: string
          details?: string | null
          reported_by?: string | null
          reporter?: string | null
          status?: string
          case_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          disease?: string
          patient_location?: string
          details?: string | null
          reported_by?: string | null
          reporter?: string | null
          status?: string
          case_date?: string | null
          created_at?: string
          updated_at?: string
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
      vaccination_schedules: {
        Row: {
          id: string
          barangay: string
          vaccine: string
          health_center_location: string | null
          assigned_bhw: string | null
          schedule_date: string
          schedule_time: string | null
          created_at: string
        }
        Insert: {
          id?: string
          barangay: string
          vaccine: string
          health_center_location?: string | null
          assigned_bhw?: string | null
          schedule_date: string
          schedule_time?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          barangay?: string
          vaccine?: string
          health_center_location?: string | null
          assigned_bhw?: string | null
          schedule_date?: string
          schedule_time?: string | null
          created_at?: string
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
          patient_name: string | null
          patient_type: string | null
        }
        Insert: {
          age?: string | null
          bhw_name?: string | null
          child_name?: string
          created_at?: string
          id?: string
          recorded_by?: string | null
          status?: string
          vaccination_date?: string
          vaccine: string
          patient_name?: string | null
          patient_type?: string | null
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
          patient_name?: string | null
          patient_type?: string | null
        }
        Relationships: []
      }
      septic_desludging_requests: {
        Row: {
          id: string
          user_id: string
          property_address: string
          barangay: string
          preferred_date: string | null
          property_details_url: string | null
          status: string
          reference_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_address: string
          barangay: string
          preferred_date?: string | null
          property_details_url?: string | null
          status?: string
          reference_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_address?: string
          barangay?: string
          preferred_date?: string | null
          property_details_url?: string | null
          status?: string
          reference_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      citizen_wastewater_complaints: {
        Row: {
          id: string
          user_id: string
          complaint_type: string
          location: string
          description: string | null
          photo_url: string | null
          barangay: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          complaint_type: string
          location: string
          description?: string | null
          photo_url?: string | null
          barangay: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          complaint_type?: string
          location?: string
          description?: string | null
          photo_url?: string | null
          barangay?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      waterway_cleanup_reports: {
        Row: {
          id: string
          user_id: string
          report_type: string
          location: string
          description: string | null
          photo_url: string | null
          barangay: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          report_type: string
          location: string
          description?: string | null
          photo_url?: string | null
          barangay: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          report_type?: string
          location?: string
          description?: string | null
          photo_url?: string | null
          barangay?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      environmental_compliance_requests: {
        Row: {
          id: string
          user_id: string
          business_name: string
          request_type: string
          address: string | null
          barangay: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          request_type: string
          address?: string | null
          barangay?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          request_type?: string
          address?: string | null
          barangay?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      desludging_schedules: {
        Row: {
          id: string
          barangay: string
          schedule_date: string
          schedule_time: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barangay: string
          schedule_date: string
          schedule_time?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barangay?: string
          schedule_date?: string
          schedule_time?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
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
        | "Citizen_User"
        | "BusinessOwner_User"
        | "BHW_User"
        | "BSI_User"
        | "Clerk_User"
        | "Captain_User"
        | "SysAdmin_User"
        | "LGUAdmin_User"
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
        "Citizen_User",
        "BusinessOwner_User",
        "BHW_User",
        "BSI_User",
        "Clerk_User",
        "Captain_User",
        "SysAdmin_User",
        "LGUAdmin_User",
      ],
    },
  },
} as const
