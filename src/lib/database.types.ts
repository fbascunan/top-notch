export type ProjectStatus = "Active" | "Planned" | "On Hold" | "Done";
export type MilestoneStatus = "Planned" | "In Progress" | "Done" | "Blocked";
export type RunStatus = "queued" | "running" | "completed" | "failed";

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: number;
          name: string;
          folder: string;
          domain: string | null;
          status: ProjectStatus;
          priority: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          folder: string;
          domain?: string | null;
          status?: ProjectStatus;
          priority?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          folder?: string;
          domain?: string | null;
          status?: ProjectStatus;
          priority?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      milestones: {
        Row: {
          id: number;
          project_id: number;
          number: number;
          title: string;
          description: string | null;
          status: MilestoneStatus;
          blocking: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: number;
          project_id: number;
          number: number;
          title: string;
          description?: string | null;
          status?: MilestoneStatus;
          blocking?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: number;
          project_id?: number;
          number?: number;
          title?: string;
          description?: string | null;
          status?: MilestoneStatus;
          blocking?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      milestone_tasks: {
        Row: {
          id: number;
          milestone_id: number;
          description: string;
          done: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          milestone_id: number;
          description: string;
          done?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          milestone_id?: number;
          description?: string;
          done?: boolean;
          created_at?: string;
        };
      };
      run_history: {
        Row: {
          id: number;
          project_id: number;
          milestone_id: number;
          status: RunStatus;
          triggered_by: string | null;
          started_at: string;
          finished_at: string | null;
          logs: string | null;
          commit_sha: string | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          project_id: number;
          milestone_id: number;
          status?: RunStatus;
          triggered_by?: string | null;
          started_at?: string;
          finished_at?: string | null;
          logs?: string | null;
          commit_sha?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          project_id?: number;
          milestone_id?: number;
          status?: RunStatus;
          triggered_by?: string | null;
          started_at?: string;
          finished_at?: string | null;
          logs?: string | null;
          commit_sha?: string | null;
          error?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      project_status: ProjectStatus;
      milestone_status: MilestoneStatus;
      run_status: RunStatus;
    };
  };
}
