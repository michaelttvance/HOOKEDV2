export type RiskLevel = "low" | "medium" | "high";

export type TaskStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "workflow_triggered"
  | "running"
  | "completed"
  | "failed";

export interface AgentTask {
  id: string;
  title: string;
  prompt: string;
  riskLevel: RiskLevel;
  targetArea: string;
  status: TaskStatus;
  createdAt: string;
  triggeredAt?: string;
  workflowRunUrl?: string;
}

const tasks: AgentTask[] = [];
let seq = 0;

export const taskStore = {
  add(task: Omit<AgentTask, "id" | "status" | "createdAt">): AgentTask {
    const t: AgentTask = {
      ...task,
      id: `task-${++seq}`,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    tasks.push(t);
    return t;
  },

  getAll(): AgentTask[] {
    return [...tasks];
  },

  getById(id: string): AgentTask | undefined {
    return tasks.find((t) => t.id === id);
  },

  updateStatus(
    id: string,
    status: TaskStatus,
    workflowRunUrl?: string,
  ): AgentTask | null {
    const t = tasks.find((t) => t.id === id);
    if (!t) return null;
    t.status = status;
    if (workflowRunUrl) t.workflowRunUrl = workflowRunUrl;
    if (status === "workflow_triggered") t.triggeredAt = new Date().toISOString();
    return t;
  },
};
