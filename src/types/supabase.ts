export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      inventory_alerts: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          product_id: string;
          threshold_quantity: number;
          is_active: boolean;
          last_triggered_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          product_id: string;
          threshold_quantity: number;
          is_active?: boolean;
          last_triggered_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          product_id?: string;
          threshold_quantity?: number;
          is_active?: boolean;
          last_triggered_at?: string | null;
        };
      };
      inventory_alert_history: {
        Row: {
          id: string;
          created_at: string;
          alert_id: string;
          was_triggered: boolean;
          current_quantity: number;
          threshold_quantity: number;
          checked_at: string;
          acknowledged_at: string | null;
          acknowledged_by: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          alert_id: string;
          was_triggered?: boolean;
          current_quantity: number;
          threshold_quantity: number;
          checked_at?: string;
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          alert_id?: string;
          was_triggered?: boolean;
          current_quantity?: number;
          threshold_quantity?: number;
          checked_at?: string;
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
        };
      };
      products: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          category: string | null
          user_id: string
          organization_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          category?: string | null
          user_id: string
          organization_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          category?: string | null
          user_id?: string
          organization_id?: string | null
        }
      }
      suppliers: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          website: string | null
          notes: string | null
          reliabilityScore: number | null
          user_id: string
          organization_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          website?: string | null
          notes?: string | null
          reliabilityScore?: number | null
          user_id: string
          organization_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          website?: string | null
          notes?: string | null
          reliabilityScore?: number | null
          user_id?: string
          organization_id?: string | null
        }
      }
      contacts: {
        Row: {
          id: string
          firstname: string
          lastname: string
          email: string
          phone: string | null
          company: string | null
          position: string | null
          notes: string | null
          personalitytype: string | null
          personalitynotes: string | null
          status: string
          createdat: string
          updatedat: string
          lastcontact: string | null
          full_name: string | null
          user_id: string
          organization_id: string | null
        }
        Insert: {
          id?: string
          firstname: string
          lastname: string
          email: string
          phone?: string | null
          company?: string | null
          position?: string | null
          notes?: string | null
          personalitytype?: string | null
          personalitynotes?: string | null
          status?: string
          createdat?: string
          updatedat?: string
          lastcontact?: string | null
          full_name?: string | null
          user_id: string
          organization_id?: string | null
        }
        Update: {
          id?: string
          firstname?: string
          lastname?: string
          email?: string
          phone?: string | null
          company?: string | null
          position?: string | null
          notes?: string | null
          personalitytype?: string | null
          personalitynotes?: string | null
          status?: string
          createdat?: string
          updatedat?: string
          lastcontact?: string | null
          full_name?: string | null
          user_id?: string
          organization_id?: string | null
        }
      }
      supplier_documents: {
        Row: {
          id: string
          created_at: string
          supplier_id: string
          document_type: string
          document_date: string
          document_number: string | null
          file_path: string
          file_name: string
          file_size: number
          file_type: string
          status: string
          extracted_data: Json | null
          notes: string | null
          user_id: string
          review_status: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          processing_status: string | null
          processing_error: string | null
          processing_started_at: string | null
          processing_completed_at: string | null
          organization_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          supplier_id: string
          document_type: string
          document_date: string
          document_number?: string | null
          file_path: string
          file_name: string
          file_size: number
          file_type: string
          status?: string
          extracted_data?: Json | null
          notes?: string | null
          user_id: string
          review_status?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          processing_status?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_completed_at?: string | null
          organization_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          supplier_id?: string
          document_type?: string
          document_date?: string
          document_number?: string | null
          file_path?: string
          file_name?: string
          file_size?: number
          file_type?: string
          status?: string
          extracted_data?: Json | null
          notes?: string | null
          user_id?: string
          review_status?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          processing_status?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_completed_at?: string | null
          organization_id?: string | null
        }
      }
      supplier_emails: {
        Row: {
          id: string
          created_at: string
          supplier_id: string
          subject: string
          body: string
          sent_at: string | null
          user_id: string
          processed: boolean
          organization_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          supplier_id: string
          subject: string
          body: string
          sent_at?: string | null
          user_id: string
          processed?: boolean
          organization_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          supplier_id?: string
          subject?: string
          body?: string
          sent_at?: string | null
          user_id?: string
          processed?: boolean
          organization_id?: string | null
        }
      }
      supplier_pricing: {
        Row: {
          id: string
          created_at: string
          supplier_id: string
          product_id: string
          price: number
          currency: string
          unit: string | null
          user_id: string
          organization_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          supplier_id: string
          product_id: string
          price: number
          currency: string
          unit?: string | null
          user_id: string
          organization_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          supplier_id?: string
          product_id?: string
          price?: number
          currency?: string
          unit?: string | null
          user_id?: string
          organization_id?: string | null
        }
      }
      supplier_queries: {
        Row: {
          id: string
          created_at: string
          query: string
          user_id: string
          organization_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          query: string
          user_id: string
          organization_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          query?: string
          user_id?: string
          organization_id?: string | null
        }
      }
      supplier_query_results: {
        Row: {
          id: string
          created_at: string
          query_id: string
          supplier_id: string
          match_reason: string | null
          user_id: string
          organization_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          query_id: string
          supplier_id: string
          match_reason?: string | null
          user_id: string
          organization_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          query_id?: string
          supplier_id?: string
          match_reason?: string | null
          user_id?: string
          organization_id?: string | null
        }
      }
      metakocka_credentials: {
        Row: {
          id: string
          user_id: string
          company_id: string
          secret_key: string
          api_endpoint: string
          is_active: boolean
          created_at: string
          updated_at: string
          organization_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          secret_key: string
          api_endpoint?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          organization_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          secret_key?: string
          api_endpoint?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          organization_id?: string | null
        }
      }
      metakocka_product_mappings: {
        Row: {
          id: string
          user_id: string
          product_id: string
          metakocka_id: string
          metakocka_code: string | null
          last_synced_at: string
          created_at: string
          updated_at: string
          sync_status: string
          sync_error: string | null
          metadata: Json | null
          organization_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          metakocka_id: string
          metakocka_code?: string | null
          last_synced_at?: string
          created_at?: string
          updated_at?: string
          sync_status?: string
          sync_error?: string | null
          metadata?: Json | null
          organization_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          metakocka_id?: string
          metakocka_code?: string | null
          last_synced_at?: string
          created_at?: string
          updated_at?: string
          sync_status?: string
          sync_error?: string | null
          metadata?: Json | null
          organization_id?: string | null
        }
      }
      metakocka_contact_mappings: {
        Row: {
          id: string
          user_id: string
          contact_id: string
          metakocka_id: string
          metakocka_code: string | null
          last_synced_at: string
          created_at: string
          updated_at: string
          sync_status: string
          sync_error: string | null
          metadata: Json | null
          organization_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          contact_id: string
          metakocka_id: string
          metakocka_code?: string | null
          last_synced_at?: string
          created_at?: string
          updated_at?: string
          sync_status?: string
          sync_error?: string | null
          metadata?: Json | null
          organization_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string
          metakocka_id?: string
          metakocka_code?: string | null
          last_synced_at?: string
          created_at?: string
          updated_at?: string
          sync_status?: string
          sync_error?: string | null
          metadata?: Json | null
          organization_id?: string | null
        }
      }
      sales_documents: {
        Row: {
          id: string
          user_id: string
          document_type: string
          document_number: string | null
          document_date: string
          due_date: string | null
          customer_id: string | null
          customer_name: string
          customer_address: string | null
          customer_email: string | null
          total_amount: number
          tax_amount: number
          currency: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string
          metadata: Json | null
          organization_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          document_type: string
          document_number?: string | null
          document_date?: string
          due_date?: string | null
          customer_id?: string | null
          customer_name: string
          customer_address?: string | null
          customer_email?: string | null
          total_amount?: number
          tax_amount?: number
          currency?: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json | null
          organization_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          document_type?: string
          document_number?: string | null
          document_date?: string
          due_date?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_address?: string | null
          customer_email?: string | null
          total_amount?: number
          tax_amount?: number
          currency?: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json | null
          organization_id?: string | null
        }
      }
      sales_document_items: {
        Row: {
          id: string
          document_id: string
          product_id: string | null
          description: string
          quantity: number
          unit_price: number
          tax_rate: number
          total_price: number
          created_at: string
          updated_at: string
          metadata: Json | null
          organization_id: string | null
        }
        Insert: {
          id?: string
          document_id: string
          product_id?: string | null
          description: string
          quantity?: number
          unit_price?: number
          tax_rate?: number
          total_price?: number
          created_at?: string
          updated_at?: string
          metadata?: Json | null
          organization_id?: string | null
        }
        Update: {
          id?: string
          document_id?: string
          product_id?: string | null
          description?: string
          quantity?: number
          unit_price?: number
          tax_rate?: number
          total_price?: number
          created_at?: string
          updated_at?: string
          metadata?: Json | null
          organization_id?: string | null
        }
      }
      metakocka_sales_document_mappings: {
        Row: {
          id: string
          user_id: string
          document_id: string
          metakocka_id: string
          metakocka_document_type: string
          metakocka_document_number: string | null
          last_synced_at: string
          created_at: string
          updated_at: string
          sync_status: string
          sync_error: string | null
          metadata: Json | null
          organization_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          document_id: string
          metakocka_id: string
          metakocka_document_type: string
          metakocka_document_number?: string | null
          last_synced_at?: string
          created_at?: string
          updated_at?: string
          sync_status?: string
          sync_error?: string | null
          metadata?: Json | null
          organization_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          document_id?: string
          metakocka_id?: string
          metakocka_document_type?: string
          metakocka_document_number?: string | null
          last_synced_at?: string
          created_at?: string
          updated_at?: string
          sync_status?: string
          sync_error?: string | null
          metadata?: Json | null
          organization_id?: string | null
        }
      },
      organizations: {
        Row: {
          id: string
          name: string
          slug: string | null
          description: string | null
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          domain: string | null
          is_active: boolean
          subscription_tier: string
          subscription_status: string
          subscription_start_date: string | null
          subscription_end_date: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          description?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          domain?: string | null
          is_active?: boolean
          subscription_tier?: string
          subscription_status?: string
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          description?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          domain?: string | null
          is_active?: boolean
          subscription_tier?: string
          subscription_status?: string
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      },
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: string
          is_owner: boolean
          joined_at: string
          invited_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: string
          is_owner?: boolean
          joined_at?: string
          invited_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: string
          is_owner?: boolean
          joined_at?: string
          invited_by?: string | null
        }
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
  }
}
