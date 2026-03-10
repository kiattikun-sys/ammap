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
        };
        Update: {
          name?: string;
          description?: string | null;
          organization_id?: string | null;
          metadata?: Json;
        };
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
        Insert: Omit<Database["public"]["Tables"]["spatial_nodes"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["spatial_nodes"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["work_items"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["work_items"]["Insert"]>;
      };
      inspections: {
        Row: {
          id: string;
          project_id: string;
          spatial_node_id: string | null;
          title: string;
          description: string | null;
          status: string;
          assigned_to: string | null;
          scheduled_date: string | null;
          completed_date: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["inspections"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["inspections"]["Insert"]>;
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
          location_lng: number | null;
          location_lat: number | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["defects"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["defects"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["evidence"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["evidence"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["timeline_events"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["timeline_events"]["Insert"]>;
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
        Insert: Database["public"]["Tables"]["progress_records"]["Row"];
        Update: Partial<Database["public"]["Tables"]["progress_records"]["Row"]>;
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
        };
        Update: {
          name?: string;
        };
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
        };
        Update: {
          role?: string;
        };
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
        };
        Update: {
          role?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
