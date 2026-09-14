export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      lands: {
        Row: {
          id: string;
          name: string;
          location: string | null;
          area_sqm: number | null;
          description: string | null;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location?: string | null;
          area_sqm?: number | null;
          description?: string | null;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location?: string | null;
          area_sqm?: number | null;
          description?: string | null;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      plots: {
        Row: {
          id: string;
          land_id: string;
          plot_number: string;
          area_sqm: number | null;
          description: string | null;
          status: "AVAILABLE" | "RENTED" | "SOLD";
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          land_id: string;
          plot_number: string;
          area_sqm?: number | null;
          description?: string | null;
          status?: "AVAILABLE" | "RENTED" | "SOLD";
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          land_id?: string;
          plot_number?: string;
          area_sqm?: number | null;
          description?: string | null;
          status?: "AVAILABLE" | "RENTED" | "SOLD";
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "plots_land_id_fkey";
            columns: ["land_id"];
            isOneToOne: false;
            referencedRelation: "lands";
            referencedColumns: ["id"];
          },
        ];
      };
      land_images: {
        Row: {
          id: string;
          land_id: string | null;
          plot_id: string | null;
          storage_path: string;
          caption: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          land_id?: string | null;
          plot_id?: string | null;
          storage_path: string;
          caption?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          land_id?: string | null;
          plot_id?: string | null;
          storage_path?: string;
          caption?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "land_images_land_id_fkey";
            columns: ["land_id"];
            isOneToOne: false;
            referencedRelation: "lands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "land_images_plot_id_fkey";
            columns: ["plot_id"];
            isOneToOne: false;
            referencedRelation: "plots";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contracts: {
        Row: {
          id: string;
          customer_id: string;
          land_id: string | null;
          plot_id: string | null;
          plot_ids: string[];
          deposit_amount: number;
          rent_amount: number;
          due_day: number;
          lease_duration_months: number | null;
          payment_frequency: "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";
          payment_due_day: number | null;
          next_payment_due_date: string | null;
          start_date: string;
          end_date: string | null;
          status: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          land_id?: string | null;
          plot_id?: string | null;
          plot_ids?: string[];
          deposit_amount?: number;
          rent_amount: number;
          due_day: number;
          lease_duration_months?: number | null;
          payment_frequency?: "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";
          payment_due_day?: number | null;
          next_payment_due_date?: string | null;
          start_date: string;
          end_date?: string | null;
          status?: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          land_id?: string | null;
          plot_id?: string | null;
          plot_ids?: string[];
          deposit_amount?: number;
          rent_amount?: number;
          due_day?: number;
          lease_duration_months?: number | null;
          payment_frequency?: "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";
          payment_due_day?: number | null;
          next_payment_due_date?: string | null;
          start_date?: string;
          end_date?: string | null;
          status?: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contracts_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contracts_land_id_fkey";
            columns: ["land_id"];
            isOneToOne: false;
            referencedRelation: "lands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contracts_plot_id_fkey";
            columns: ["plot_id"];
            isOneToOne: false;
            referencedRelation: "plots";
            referencedColumns: ["id"];
          },
        ];
      };
      contract_plots: {
        Row: {contract_id: string; plot_id: string};
        Insert: {contract_id: string; plot_id: string};
        Update: {contract_id?: string; plot_id?: string};
        Relationships: [
          {foreignKeyName: "contract_plots_contract_id_fkey"; columns: ["contract_id"]; isOneToOne: false; referencedRelation: "contracts"; referencedColumns: ["id"]},
          {foreignKeyName: "contract_plots_plot_id_fkey"; columns: ["plot_id"]; isOneToOne: false; referencedRelation: "plots"; referencedColumns: ["id"]},
        ];
      };
      contract_payments: {
        Row: {
          id: string;
          contract_id: string;
          due_date: string;
          amount: number;
          paid_at: string | null;
          status: "PENDING" | "PAID" | "OVERDUE";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          due_date: string;
          amount: number;
          paid_at?: string | null;
          status?: "PENDING" | "PAID" | "OVERDUE";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          due_date?: string;
          amount?: number;
          paid_at?: string | null;
          status?: "PENDING" | "PAID" | "OVERDUE";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contract_payments_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_integrations: {
        Row: {
          id: string;
          provider: "google";
          account_email: string | null;
          external_account_id: string | null;
          calendar_id: string | null;
          sync_token: string | null;
          status: "ACTIVE" | "PAUSED" | "REVOKED";
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider?: "google";
          account_email?: string | null;
          external_account_id?: string | null;
          calendar_id?: string | null;
          sync_token?: string | null;
          status?: "ACTIVE" | "PAUSED" | "REVOKED";
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider?: "google";
          account_email?: string | null;
          external_account_id?: string | null;
          calendar_id?: string | null;
          sync_token?: string | null;
          status?: "ACTIVE" | "PAUSED" | "REVOKED";
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      calendar_oauth_tokens: {
        Row: {
          id: string;
          integration_id: string;
          access_token: string;
          refresh_token: string | null;
          token_type: string | null;
          scope: string | null;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          integration_id: string;
          access_token: string;
          refresh_token?: string | null;
          token_type?: string | null;
          scope?: string | null;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          integration_id?: string;
          access_token?: string;
          refresh_token?: string | null;
          token_type?: string | null;
          scope?: string | null;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_oauth_tokens_integration_id_fkey";
            columns: ["integration_id"];
            isOneToOne: true;
            referencedRelation: "calendar_integrations";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_sync_events: {
        Row: {
          id: string;
          integration_id: string;
          contract_payment_id: string | null;
          contract_id: string | null;
          local_event_key: string | null;
          due_date: string | null;
          external_event_id: string | null;
          external_event_url: string | null;
          status: "PENDING" | "SYNCED" | "FAILED" | "DELETED";
          last_error: string | null;
          synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          integration_id: string;
          contract_payment_id?: string | null;
          contract_id?: string | null;
          local_event_key?: string | null;
          due_date?: string | null;
          external_event_id?: string | null;
          external_event_url?: string | null;
          status?: "PENDING" | "SYNCED" | "FAILED" | "DELETED";
          last_error?: string | null;
          synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          integration_id?: string;
          contract_payment_id?: string | null;
          contract_id?: string | null;
          local_event_key?: string | null;
          due_date?: string | null;
          external_event_id?: string | null;
          external_event_url?: string | null;
          status?: "PENDING" | "SYNCED" | "FAILED" | "DELETED";
          last_error?: string | null;
          synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_sync_events_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calendar_sync_events_contract_payment_id_fkey";
            columns: ["contract_payment_id"];
            isOneToOne: false;
            referencedRelation: "contract_payments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calendar_sync_events_integration_id_fkey";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "calendar_integrations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      record_contract_payment: {
        Args: {p_contract_id: string; p_due_date: string; p_paid: boolean};
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Land = Tables<"lands">;
export type Plot = Tables<"plots">;
export type LandImage = Tables<"land_images">;
export type Customer = Tables<"customers">;
export type Contract = Tables<"contracts">;
export type ContractPayment = Tables<"contract_payments">;
export type CalendarIntegration = Tables<"calendar_integrations">;
export type CalendarOauthToken = Tables<"calendar_oauth_tokens">;
export type CalendarSyncEvent = Tables<"calendar_sync_events">;

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  contractId: string;
  customerName: string;
  landId?: string | null;
  plotId?: string | null;
  amount: number;
  status: ContractPayment["status"];
};
