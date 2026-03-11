export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          organization_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          organization_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          organization_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      spatial_nodes: {
        Row: {
          id: string;
          project_id: string;
          parent_id: string | null;
          type: string;
          name: string;
          description: string | null;
          geometry: Json | null;
          order: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          parent_id?: string | null;
          type: string;
          name: string;
          description?: string | null;
          geometry?: Json | null;
          order: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          parent_id?: string | null;
          type?: string;
          name?: string;
          description?: string | null;
          geometry?: Json | null;
          order?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      work_items: {
        Row: {
          id: string;
          project_id: string;
          spatial_node_id: string | null;
          title: string;
          description: string | null;
          status: string;
          priority: string;
          assigned_to: string | null;
          due_date: string | null;
          progress: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          spatial_node_id?: string | null;
          title: string;
          description?: string | null;
          status: string;
          priority: string;
          assigned_to?: string | null;
          due_date?: string | null;
          progress?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          spatial_node_id?: string | null;
          title?: string;
          description?: string | null;
          status?: string;
          priority?: string;
          assigned_to?: string | null;
          due_date?: string | null;
          progress?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      inspections: {
        Row: {
          id: string;
          project_id: string;
          spatial_node_id: string | null;
          title: string;
          description: string | null;
          status: string;
          inspection_type: string;
          result: string | null;
          assigned_to: string | null;
          scheduled_date: string | null;
          inspected_date: string | null;
          completed_date: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          spatial_node_id?: string | null;
          title: string;
          description?: string | null;
          status: string;
          inspection_type?: string;
          result?: string | null;
          assigned_to?: string | null;
          scheduled_date?: string | null;
          inspected_date?: string | null;
          completed_date?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          spatial_node_id?: string | null;
          title?: string;
          description?: string | null;
          status?: string;
          inspection_type?: string;
          result?: string | null;
          assigned_to?: string | null;
          scheduled_date?: string | null;
          inspected_date?: string | null;
          completed_date?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      defects: {
        Row: {
          id: string;
          project_id: string;
          spatial_node_id: string | null;
          inspection_id: string | null;
          title: string;
          description: string | null;
          severity: string;
          status: string;
          assigned_to: string | null;
          due_date: string | null;
          closed_at: string | null;
          location_lng: number | null;
          location_lat: number | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          spatial_node_id?: string | null;
          inspection_id?: string | null;
          title: string;
          description?: string | null;
          severity: string;
          status: string;
          assigned_to?: string | null;
          due_date?: string | null;
          closed_at?: string | null;
          location_lng?: number | null;
          location_lat?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          spatial_node_id?: string | null;
          inspection_id?: string | null;
          title?: string;
          description?: string | null;
          severity?: string;
          status?: string;
          assigned_to?: string | null;
          due_date?: string | null;
          closed_at?: string | null;
          location_lng?: number | null;
          location_lat?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      evidence: {
        Row: {
          id: string;
          project_id: string;
          spatial_node_id: string | null;
          work_item_id: string | null;
          defect_id: string | null;
          type: string;
          title: string;
          description: string | null;
          file_url: string;
          thumbnail_url: string | null;
          location_lng: number | null;
          location_lat: number | null;
          captured_by: string | null;
          captured_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          spatial_node_id?: string | null;
          work_item_id?: string | null;
          defect_id?: string | null;
          type: string;
          title: string;
          description?: string | null;
          file_url: string;
          thumbnail_url?: string | null;
          location_lng?: number | null;
          location_lat?: number | null;
          captured_by?: string | null;
          captured_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          spatial_node_id?: string | null;
          work_item_id?: string | null;
          defect_id?: string | null;
          type?: string;
          title?: string;
          description?: string | null;
          file_url?: string;
          thumbnail_url?: string | null;
          location_lng?: number | null;
          location_lat?: number | null;
          captured_by?: string | null;
          captured_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      timeline_events: {
        Row: {
          id: string;
          project_id: string;
          spatial_node_id: string | null;
          type: string;
          title: string;
          description: string | null;
          timestamp: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          spatial_node_id?: string | null;
          type: string;
          title: string;
          description?: string | null;
          timestamp: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          spatial_node_id?: string | null;
          type?: string;
          title?: string;
          description?: string | null;
          timestamp?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      progress_records: {
        Row: {
          id: string;
          project_id: string;
          spatial_node_id: string | null;
          progress_percent: number;
          status: string;
          recorded_at: string;
          recorded_by: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          project_id: string;
          spatial_node_id?: string | null;
          progress_percent: number;
          status: string;
          recorded_at: string;
          recorded_by?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          project_id?: string;
          spatial_node_id?: string | null;
          progress_percent?: number;
          status?: string;
          recorded_at?: string;
          recorded_by?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };

      organizations: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      corrective_actions: {
        Row: {
          id: string;
          project_id: string;
          defect_id: string;
          spatial_node_id: string | null;
          action_text: string;
          status: string;
          assigned_to_user_id: string | null;
          due_date: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          defect_id: string;
          spatial_node_id?: string | null;
          action_text: string;
          status?: string;
          assigned_to_user_id?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          defect_id?: string;
          spatial_node_id?: string | null;
          action_text?: string;
          status?: string;
          assigned_to_user_id?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}