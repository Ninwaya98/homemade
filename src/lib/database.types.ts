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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      availability: {
        Row: {
          cook_id: string
          created_at: string
          date: string
          id: string
          is_open: boolean
          max_portions: number
          mode: Database["public"]["Enums"]["availability_mode"]
          portions_taken: number
        }
        Insert: {
          cook_id: string
          created_at?: string
          date: string
          id?: string
          is_open?: boolean
          max_portions?: number
          mode?: Database["public"]["Enums"]["availability_mode"]
          portions_taken?: number
        }
        Update: {
          cook_id?: string
          created_at?: string
          date?: string
          id?: string
          is_open?: boolean
          max_portions?: number
          mode?: Database["public"]["Enums"]["availability_mode"]
          portions_taken?: number
        }
        Relationships: [
          {
            foreignKeyName: "availability_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "cook_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "cook_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cook_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avg_rating: number
          bio: string | null
          certification_url: string | null
          created_at: string
          cuisine_tags: string[]
          dislike_count: number
          id: string
          is_available: boolean
          last_active_at: string
          like_count: number
          photo_url: string | null
          rating_count: number
          resolved_count: number
          score: number | null
          status: Database["public"]["Enums"]["cook_status"]
          weekly_schedule: Json | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avg_rating?: number
          bio?: string | null
          certification_url?: string | null
          created_at?: string
          cuisine_tags?: string[]
          dislike_count?: number
          id: string
          is_available?: boolean
          last_active_at?: string
          like_count?: number
          photo_url?: string | null
          rating_count?: number
          resolved_count?: number
          score?: number | null
          status?: Database["public"]["Enums"]["cook_status"]
          weekly_schedule?: Json | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avg_rating?: number
          bio?: string | null
          certification_url?: string | null
          created_at?: string
          cuisine_tags?: string[]
          dislike_count?: number
          id?: string
          is_available?: boolean
          last_active_at?: string
          like_count?: number
          photo_url?: string | null
          rating_count?: number
          resolved_count?: number
          score?: number | null
          status?: Database["public"]["Enums"]["cook_status"]
          weekly_schedule?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "cook_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cook_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          allergens: string[]
          cook_id: string
          created_at: string
          cuisine_tag: string | null
          description: string | null
          id: string
          name: string
          photo_url: string | null
          portion_size: string | null
          portion_sizes: Json | null
          price_cents: number
          status: Database["public"]["Enums"]["dish_status"]
          updated_at: string
        }
        Insert: {
          allergens?: string[]
          cook_id: string
          created_at?: string
          cuisine_tag?: string | null
          description?: string | null
          id?: string
          name: string
          photo_url?: string | null
          portion_size?: string | null
          portion_sizes?: Json | null
          price_cents: number
          status?: Database["public"]["Enums"]["dish_status"]
          updated_at?: string
        }
        Update: {
          allergens?: string[]
          cook_id?: string
          created_at?: string
          cuisine_tag?: string | null
          description?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          portion_size?: string | null
          portion_sizes?: Json | null
          price_cents?: number
          status?: Database["public"]["Enums"]["dish_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dishes_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "cook_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dishes_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "cook_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancelled_at: string | null
          commission_cents: number
          completed_at: string | null
          confirmed_at: string | null
          cook_id: string | null
          cook_payout_cents: number
          created_at: string
          customer_id: string
          delivery_address: string | null
          dish_id: string | null
          estimated_ready_time: string | null
          id: string
          notes: string | null
          portion_size: string | null
          product_id: string | null
          quantity: number
          ready_at: string | null
          scheduled_for: string | null
          seller_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_cents: number
          type: Database["public"]["Enums"]["order_type"]
          updated_at: string
          vertical: Database["public"]["Enums"]["order_vertical"]
        }
        Insert: {
          cancelled_at?: string | null
          commission_cents: number
          completed_at?: string | null
          confirmed_at?: string | null
          cook_id?: string | null
          cook_payout_cents: number
          created_at?: string
          customer_id: string
          delivery_address?: string | null
          dish_id?: string | null
          estimated_ready_time?: string | null
          id?: string
          notes?: string | null
          portion_size?: string | null
          product_id?: string | null
          quantity: number
          ready_at?: string | null
          scheduled_for?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_cents: number
          type: Database["public"]["Enums"]["order_type"]
          updated_at?: string
          vertical?: Database["public"]["Enums"]["order_vertical"]
        }
        Update: {
          cancelled_at?: string | null
          commission_cents?: number
          completed_at?: string | null
          confirmed_at?: string | null
          cook_id?: string | null
          cook_payout_cents?: number
          created_at?: string
          customer_id?: string
          delivery_address?: string | null
          dish_id?: string | null
          estimated_ready_time?: string | null
          id?: string
          notes?: string | null
          portion_size?: string | null
          product_id?: string | null
          quantity?: number
          ready_at?: string | null
          scheduled_for?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_cents?: number
          type?: Database["public"]["Enums"]["order_type"]
          updated_at?: string
          vertical?: Database["public"]["Enums"]["order_vertical"]
        }
        Relationships: [
          {
            foreignKeyName: "orders_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "cook_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "cook_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount_cents: number
          cook_id: string | null
          created_at: string
          id: string
          period_end: string
          period_start: string
          seller_id: string | null
          status: Database["public"]["Enums"]["payout_status"]
          stripe_transfer_id: string | null
        }
        Insert: {
          amount_cents: number
          cook_id?: string | null
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          seller_id?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          stripe_transfer_id?: string | null
        }
        Update: {
          amount_cents?: number
          cook_id?: string | null
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          seller_id?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "cook_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "cook_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          condition: string
          created_at: string
          description: string | null
          dimensions: string | null
          id: string
          ingredients: string | null
          materials: string | null
          name: string
          photo_urls: string[]
          price_cents: number
          seller_id: string
          status: Database["public"]["Enums"]["product_status"]
          stock_quantity: number
          subcategory: string | null
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          condition?: string
          created_at?: string
          description?: string | null
          dimensions?: string | null
          id?: string
          ingredients?: string | null
          materials?: string | null
          name: string
          photo_urls?: string[]
          price_cents: number
          seller_id: string
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number
          subcategory?: string | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          condition?: string
          created_at?: string
          description?: string | null
          dimensions?: string | null
          id?: string
          ingredients?: string | null
          materials?: string | null
          name?: string
          photo_urls?: string[]
          price_cents?: number
          seller_id?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number
          subcategory?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          location: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          location?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          location?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          ai_sentiment: string | null
          ai_summary: string | null
          created_at: string
          id: string
          order_id: string
          rating: number
          resolution_status: string
          resolved_at: string | null
          resolved_by: string | null
          response_at: string | null
          response_text: string | null
          reviewee_id: string
          reviewer_id: string
          role: Database["public"]["Enums"]["review_role"]
          sentiment: string
          text: string | null
        }
        Insert: {
          ai_sentiment?: string | null
          ai_summary?: string | null
          created_at?: string
          id?: string
          order_id: string
          rating: number
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          response_at?: string | null
          response_text?: string | null
          reviewee_id: string
          reviewer_id: string
          role: Database["public"]["Enums"]["review_role"]
          sentiment: string
          text?: string | null
        }
        Update: {
          ai_sentiment?: string | null
          ai_summary?: string | null
          created_at?: string
          id?: string
          order_id?: string
          rating?: number
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          response_at?: string | null
          response_text?: string | null
          reviewee_id?: string
          reviewer_id?: string
          role?: Database["public"]["Enums"]["review_role"]
          sentiment?: string
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avg_rating: number
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          dislike_count: number
          id: string
          last_active_at: string
          like_count: number
          photo_url: string | null
          rating_count: number
          resolved_count: number
          score: number | null
          shop_description: string | null
          shop_name: string
          status: Database["public"]["Enums"]["seller_status"]
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avg_rating?: number
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string
          dislike_count?: number
          id: string
          last_active_at?: string
          like_count?: number
          photo_url?: string | null
          rating_count?: number
          resolved_count?: number
          score?: number | null
          shop_description?: string | null
          shop_name: string
          status?: Database["public"]["Enums"]["seller_status"]
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avg_rating?: number
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          dislike_count?: number
          id?: string
          last_active_at?: string
          like_count?: number
          photo_url?: string | null
          rating_count?: number
          resolved_count?: number
          score?: number | null
          shop_description?: string | null
          shop_name?: string
          status?: Database["public"]["Enums"]["seller_status"]
        }
        Relationships: [
          {
            foreignKeyName: "seller_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      cook_health: {
        Row: {
          avg_rating: number | null
          created_at: string | null
          full_name: string | null
          health_status: string | null
          id: string | null
          last_active_at: string | null
          last_order_at: string | null
          orders_last_7d: number | null
          rating_count: number | null
          status: Database["public"]["Enums"]["cook_status"] | null
          upcoming_open_days: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cook_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_health: {
        Row: {
          active_products: number | null
          avg_rating: number | null
          category: Database["public"]["Enums"]["product_category"] | null
          created_at: string | null
          full_name: string | null
          health_status: string | null
          id: string | null
          last_active_at: string | null
          last_order_at: string | null
          orders_last_7d: number | null
          rating_count: number | null
          shop_name: string | null
          status: Database["public"]["Enums"]["seller_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      place_order:
        | {
            Args: {
              p_commission_cents: number
              p_cook_payout_cents: number
              p_dish_id: string
              p_notes?: string
              p_quantity: number
              p_scheduled_for: string
              p_total_cents: number
              p_type: Database["public"]["Enums"]["order_type"]
            }
            Returns: string
          }
        | {
            Args: {
              p_commission_cents: number
              p_cook_payout_cents: number
              p_dish_id: string
              p_notes?: string
              p_portion_size?: string
              p_quantity: number
              p_scheduled_for: string
              p_total_cents: number
              p_type: Database["public"]["Enums"]["order_type"]
            }
            Returns: string
          }
      place_product_order: {
        Args: {
          p_commission_cents: number
          p_notes?: string
          p_product_id: string
          p_quantity: number
          p_seller_payout_cents: number
          p_total_cents: number
          p_type: Database["public"]["Enums"]["order_type"]
        }
        Returns: string
      }
      update_own_profile: {
        Args: { p_location?: string; p_phone?: string }
        Returns: undefined
      }
    }
    Enums: {
      availability_mode: "preorder" | "on_demand"
      cook_status: "pending" | "approved" | "suspended"
      dish_status: "active" | "paused" | "sold_out"
      order_status:
        | "pending"
        | "confirmed"
        | "ready"
        | "completed"
        | "cancelled"
      order_type: "pickup" | "delivery"
      order_vertical: "kitchen" | "market"
      payout_status: "pending" | "paid" | "failed"
      product_category:
        | "crafts_art"
        | "clothing_accessories"
        | "home_decor"
        | "food_products"
      product_status: "active" | "paused" | "out_of_stock"
      review_role: "customer" | "cook" | "seller"
      seller_status: "pending" | "approved" | "suspended"
      user_role: "cook" | "customer" | "admin" | "seller"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      availability_mode: ["preorder", "on_demand"],
      cook_status: ["pending", "approved", "suspended"],
      dish_status: ["active", "paused", "sold_out"],
      order_status: ["pending", "confirmed", "ready", "completed", "cancelled"],
      order_type: ["pickup", "delivery"],
      order_vertical: ["kitchen", "market"],
      payout_status: ["pending", "paid", "failed"],
      product_category: [
        "crafts_art",
        "clothing_accessories",
        "home_decor",
        "food_products",
      ],
      product_status: ["active", "paused", "out_of_stock"],
      review_role: ["customer", "cook", "seller"],
      seller_status: ["pending", "approved", "suspended"],
      user_role: ["cook", "customer", "admin", "seller"],
    },
  },
} as const
