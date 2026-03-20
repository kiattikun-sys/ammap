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
      corrective_actions: {
        Row: {
          action_text: string
          assigned_to_user_id: string | null
          completed_at: string | null
          created_at: string
          defect_id: string
          due_date: string | null
          id: string
          project_id: string
          spatial_node_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          action_text: string
          assigned_to_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          defect_id: string
          due_date?: string | null
          id?: string
          project_id: string
          spatial_node_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          action_text?: string
          assigned_to_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          defect_id?: string
          due_date?: string | null
          id?: string
          project_id?: string
          spatial_node_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "corrective_actions_defect_id_fkey"
            columns: ["defect_id"]
            isOneToOne: false
            referencedRelation: "defects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corrective_actions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corrective_actions_spatial_node_id_fkey"
            columns: ["spatial_node_id"]
            isOneToOne: false
            referencedRelation: "spatial_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      defects: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          inspection_id: string | null
          location_lat: number | null
          location_lng: number | null
          metadata: Json
          project_id: string
          severity: string
          spatial_node_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          inspection_id?: string | null
          location_lat?: number | null
          location_lng?: number | null
          metadata?: Json
          project_id: string
          severity?: string
          spatial_node_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          inspection_id?: string | null
          location_lat?: number | null
          location_lng?: number | null
          metadata?: Json
          project_id?: string
          severity?: string
          spatial_node_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "defects_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "defects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "defects_spatial_node_id_fkey"
            columns: ["spatial_node_id"]
            isOneToOne: false
            referencedRelation: "spatial_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence: {
        Row: {
          captured_at: string | null
          captured_by: string | null
          created_at: string
          defect_id: string | null
          description: string | null
          file_url: string
          id: string
          location_lat: number | null
          location_lng: number | null
          metadata: Json
          project_id: string
          spatial_node_id: string | null
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string
          work_item_id: string | null
        }
        Insert: {
          captured_at?: string | null
          captured_by?: string | null
          created_at?: string
          defect_id?: string | null
          description?: string | null
          file_url: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          metadata?: Json
          project_id: string
          spatial_node_id?: string | null
          thumbnail_url?: string | null
          title: string
          type: string
          updated_at?: string
          work_item_id?: string | null
        }
        Update: {
          captured_at?: string | null
          captured_by?: string | null
          created_at?: string
          defect_id?: string | null
          description?: string | null
          file_url?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          metadata?: Json
          project_id?: string
          spatial_node_id?: string | null
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string
          work_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_defect_id_fkey"
            columns: ["defect_id"]
            isOneToOne: false
            referencedRelation: "defects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_spatial_node_id_fkey"
            columns: ["spatial_node_id"]
            isOneToOne: false
            referencedRelation: "spatial_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          assigned_to: string | null
          completed_date: string | null
          created_at: string
          description: string | null
          id: string
          inspected_date: string | null
          inspection_type: string
          metadata: Json
          project_id: string
          result: string | null
          scheduled_date: string | null
          spatial_node_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          inspected_date?: string | null
          inspection_type?: string
          metadata?: Json
          project_id: string
          result?: string | null
          scheduled_date?: string | null
          spatial_node_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          inspected_date?: string | null
          inspection_type?: string
          metadata?: Json
          project_id?: string
          result?: string | null
          scheduled_date?: string | null
          spatial_node_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_spatial_node_id_fkey"
            columns: ["spatial_node_id"]
            isOneToOne: false
            referencedRelation: "spatial_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          reactivated_at: string | null
          reactivated_by: string | null
          status: string
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          reactivated_at?: string | null
          reactivated_by?: string | null
          status?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          reactivated_at?: string | null
          reactivated_by?: string | null
          status?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      progress_records: {
        Row: {
          id: string
          metadata: Json
          progress_percent: number
          project_id: string
          recorded_at: string
          recorded_by: string | null
          spatial_node_id: string | null
          status: string
        }
        Insert: {
          id?: string
          metadata?: Json
          progress_percent: number
          project_id: string
          recorded_at?: string
          recorded_by?: string | null
          spatial_node_id?: string | null
          status?: string
        }
        Update: {
          id?: string
          metadata?: Json
          progress_percent?: number
          project_id?: string
          recorded_at?: string
          recorded_by?: string | null
          spatial_node_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_records_spatial_node_id_fkey"
            columns: ["spatial_node_id"]
            isOneToOne: false
            referencedRelation: "spatial_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          metadata: Json
          name: string
          organization_id: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json
          name: string
          organization_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_request_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          performed_by: string | null
          request_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          request_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_request_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "registration_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_requests: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          invite_attempts: number
          invited_at: string | null
          last_invite_error: string | null
          notes: string | null
          phone: string | null
          requested_org_name: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          invite_attempts?: number
          invited_at?: string | null
          last_invite_error?: string | null
          notes?: string | null
          phone?: string | null
          requested_org_name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          invite_attempts?: number
          invited_at?: string | null
          last_invite_error?: string | null
          notes?: string | null
          phone?: string | null
          requested_org_name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      spatial_nodes: {
        Row: {
          created_at: string
          description: string | null
          geometry: Json | null
          id: string
          metadata: Json
          name: string
          order: number
          parent_id: string | null
          project_id: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          geometry?: Json | null
          id?: string
          metadata?: Json
          name: string
          order?: number
          parent_id?: string | null
          project_id: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          geometry?: Json | null
          id?: string
          metadata?: Json
          name?: string
          order?: number
          parent_id?: string | null
          project_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spatial_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "spatial_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spatial_nodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metadata: Json
          project_id: string
          spatial_node_id: string | null
          timestamp: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          project_id: string
          spatial_node_id?: string | null
          timestamp?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          project_id?: string
          spatial_node_id?: string | null
          timestamp?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_spatial_node_id_fkey"
            columns: ["spatial_node_id"]
            isOneToOne: false
            referencedRelation: "spatial_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      work_items: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          metadata: Json
          priority: string
          progress: number
          project_id: string
          spatial_node_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json
          priority?: string
          progress?: number
          project_id: string
          spatial_node_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json
          priority?: string
          progress?: number
          project_id?: string
          spatial_node_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_spatial_node_id_fkey"
            columns: ["spatial_node_id"]
            isOneToOne: false
            referencedRelation: "spatial_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      exec_sql: { Args: { sql_query: string }; Returns: undefined }
      get_auth_user_org_ids: { Args: never; Returns: string[] }
      is_platform_admin: { Args: { check_user_id?: string }; Returns: boolean }
      is_platform_owner: { Args: { check_user_id?: string }; Returns: boolean }
      is_user_suspended: { Args: { check_user_id: string }; Returns: boolean }
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
