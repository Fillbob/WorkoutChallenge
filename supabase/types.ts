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
      admin_audit: {
        Row: {
          action: string;
          admin_user_id: string | null;
          after: Json | null;
          before: Json | null;
          created_at: string | null;
          id: string;
          target_id: string | null;
          target_table: string;
        };
        Insert: {
          action: string;
          admin_user_id?: string | null;
          after?: Json | null;
          before?: Json | null;
          created_at?: string | null;
          id?: string;
          target_id?: string | null;
          target_table: string;
        };
        Update: {
          action?: string;
          admin_user_id?: string | null;
          after?: Json | null;
          before?: Json | null;
          created_at?: string | null;
          id?: string;
          target_id?: string | null;
          target_table?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_audit_admin_user_id_fkey";
            columns: ["admin_user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      challenges: {
        Row: {
          base_points: number;
          bonus_rules: string | null;
          completion_path: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string;
          end_date: string;
          id: string;
          start_at: string;
          start_date: string;
          stretch_rules: string | null;
          title: string;
          week_index: number;
        };
        Insert: {
          base_points: number;
          bonus_rules?: string | null;
          completion_path?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description: string;
          end_date: string;
          id?: string;
          start_at: string;
          start_date: string;
          stretch_rules?: string | null;
          title: string;
          week_index: number;
        };
        Update: {
          base_points?: number;
          bonus_rules?: string | null;
          completion_path?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string;
          end_date?: string;
          id?: string;
          start_at?: string;
          start_date?: string;
          stretch_rules?: string | null;
          title?: string;
          week_index?: number;
        };
        Relationships: [
          {
            foreignKeyName: "challenges_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      points_ledger: {
        Row: {
          challenge_id: string;
          created_at: string | null;
          id: string;
          points: number;
          reason: string | null;
          submission_id: string;
          user_id: string;
        };
        Insert: {
          challenge_id: string;
          created_at?: string | null;
          id?: string;
          points: number;
          reason?: string | null;
          submission_id: string;
          user_id: string;
        };
        Update: {
          challenge_id?: string;
          created_at?: string | null;
          id?: string;
          points?: number;
          reason?: string | null;
          submission_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "points_ledger_challenge_id_fkey";
            columns: ["challenge_id"];
            referencedRelation: "challenges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "points_ledger_submission_id_fkey";
            columns: ["submission_id"];
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "points_ledger_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          created_at: string | null;
          display_name: string | null;
          id: string;
          nickname: string | null;
          role: string | null;
        };
        Insert: {
          created_at?: string | null;
          display_name?: string | null;
          id: string;
          nickname?: string | null;
          role?: string | null;
        };
        Update: {
          created_at?: string | null;
          display_name?: string | null;
          id?: string;
          nickname?: string | null;
          role?: string | null;
        };
        Relationships: [];
      };
      submission_images: {
        Row: {
          created_at: string | null;
          id: string;
          storage_path: string;
          submission_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          storage_path: string;
          submission_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          storage_path?: string;
          submission_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "submission_images_submission_id_fkey";
            columns: ["submission_id"];
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          }
        ];
      };
      submissions: {
        Row: {
          ai_confidence: number | null;
          ai_reasons: Json | null;
          ai_verdict: string | null;
          challenge_id: string;
          created_at: string | null;
          id: string;
          points_awarded: number | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          ai_confidence?: number | null;
          ai_reasons?: Json | null;
          ai_verdict?: string | null;
          challenge_id: string;
          created_at?: string | null;
          id?: string;
          points_awarded?: number | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          ai_confidence?: number | null;
          ai_reasons?: Json | null;
          ai_verdict?: string | null;
          challenge_id?: string;
          created_at?: string | null;
          id?: string;
          points_awarded?: number | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "submissions_challenge_id_fkey";
            columns: ["challenge_id"];
            referencedRelation: "challenges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submissions_reviewed_by_fkey";
            columns: ["reviewed_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submissions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      team_members: {
        Row: {
          joined_at: string | null;
          role: string | null;
          team_id: string;
          user_id: string;
        };
        Insert: {
          joined_at?: string | null;
          role?: string | null;
          team_id: string;
          user_id: string;
        };
        Update: {
          joined_at?: string | null;
          role?: string | null;
          team_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      teams: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          id: string;
          join_code: string;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          join_code: string;
          name: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          join_code?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      public_leaderboard: {
        Args: Record<string, never>;
        Returns: {
          display_name: string;
          points: number;
          team_name: string | null;
          user_id: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
