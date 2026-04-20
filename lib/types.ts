// Supabase Database Types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vehicle_profiles: {
        Row: {
          id: string
          user_id: string
          vehicle_type: string
          height_m: number
          axles: number
          total_weight_kg: number
          load_type: 'general' | 'mopp'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vehicle_type: string
          height_m: number
          axles: number
          total_weight_kg: number
          load_type: 'general' | 'mopp'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          vehicle_type?: string
          height_m?: number
          axles?: number
          total_weight_kg?: number
          load_type?: 'general' | 'mopp'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      points: {
        Row: {
          id: string
          name: string
          point_type: string
          latitude: number
          longitude: number
          notes: string | null
          status: 'active' | 'pending' | 'removed'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          point_type: string
          latitude: number
          longitude: number
          notes?: string | null
          status?: 'active' | 'pending' | 'removed'
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          point_type?: string
          latitude?: number
          longitude?: number
          notes?: string | null
          status?: 'active' | 'pending' | 'removed'
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      point_types: {
        Row: {
          id: string
          name: string
          icon: string
          color: string
        }
        Insert: {
          id?: string
          name: string
          icon: string
          color: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string
          color?: string
        }
      }
      contributions: {
        Row: {
          id: string
          point_id: string
          user_id: string
          contribution_type: 'confirmation' | 'error_report'
          details: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id?: string
          point_id: string
          user_id: string
          contribution_type: 'confirmation' | 'error_report'
          details?: Record<string, any> | null
          created_at?: string
        }
        Update: {
          id?: string
          point_id?: string
          user_id?: string
          contribution_type?: 'confirmation' | 'error_report'
          details?: Record<string, any> | null
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {
      get_nearby_points: {
        Args: {
          lat: number
          lng: number
          radius_km?: number
          height_m?: number
          load_type?: 'general' | 'mopp'
        }
        Returns: Array<{
          id: string
          name: string
          point_type: string
          latitude: number
          longitude: number
          distance_km: number
          confidence_score: number
          notes: string | null
        }>
      }
    }
  }
}

// Application Types
export interface Point {
  id: string
  name: string
  point_type: string
  latitude: number
  longitude: number
  distance_km?: number
  confidence_score: number
  notes?: string | null
}

export interface PointType {
  id: string
  name: string
  icon: string
  color: string
}

export interface VehicleProfile {
  id: string
  user_id: string
  vehicle_type: string
  height_m: number
  axles: number
  total_weight_kg: number
  load_type: 'general' | 'mopp'
  is_active: boolean
  created_at: string
  updated_at: string
}
