export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          nickname: string;
          plan: 'free' | 'premium';
          created_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          plan?: 'free' | 'premium';
          created_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string;
          plan?: 'free' | 'premium';
          created_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          name: string;
          host_id: string;
          invite_code: string;
          created_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          host_id: string;
          invite_code: string;
          created_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          host_id?: string;
          invite_code?: string;
          created_at?: string;
          is_active?: boolean;
        };
      };
      session_members: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          lat: number;
          lon: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          lat: number;
          lon: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          lat?: number;
          lon?: number;
          updated_at?: string;
        };
      };
      routes: {
        Row: {
          id: string;
          session_id: string;
          geojson: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          geojson: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          geojson?: Json;
          created_at?: string;
        };
      };
    };
  };
}
