import { createFileRoute } from "@tanstack/react-router";
import type { RiskLevel, TaskStatus } from "@/lib/agent-task-store";

// POST /api/command-center/action
// Accepts only predefined safe action types. Never executes shell commands,
// pushes to git, or deploys. All code-changing actions go through GitHub Actions.

const SAFE_QUEUE_ACTIONS = new Set([
  "status_update",
  "create_branch",
  "open_pr",
  "run_tests",
  "create_agent_task",
  "approve_task",
  "trigger_agent_workflow",
  "request_review",
  "add_comment",
]);

const RISK_LEVELS = new Set<string>(["low", "medium", "high"]);

interface QueueActionBody {
  type: string;
  recId?: string;
  agent?: string;
  summary?: string;
}

interface CreateTaskBody {
  type: "create_agent_task";
  title: string;
  prompt: string;
  riskLevel: RiskLevel;
  targetArea: string;
}

interface ApproveTaskBody {
  type: "approve_task";
  taskId: string;
}

interface TriggerWorkflowBody {
  type: "trigger_agent_workflow";
  taskId: string;
}

type ActionBody =
  | QueueActionBody
  | CreateTaskBody
  | ApproveTaskBody
  | TriggerWorkflowBody;

export const Route = createFileRoute("/api/command-center/action")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: ActionBody;
        try {
          body = await request.json();
        } catch {
          return jsonError(400, "Request body must be valid JSON.");
        }

        const { type } = body as { type?: string };

        if (!type || typeof type !== "string") {
          return jsonError(400, "Missing required field: type.");
        }

        if (!SAFE_QUEUE_ACTIONS.has(type)) {
          return jsonError(
            403,
            `Action type "${type}" is not in the safe allowlist.`,
          );
        }

        if (type === "create_agent_task") {
          return handleCreateAgentTask(body as CreateTaskBody);
        }

        if (type === "approve_task") {
          return handleApproveTask(body as ApproveTaskBody);
        }

        if (type === "trigger_agent_workflow") {
          return handleTriggerWorkflow(body as TriggerWorkflowBody);
        }

        // Generic safe queue action — log and acknowledge, no code execution.
        const { recId, agent, summary } = body as QueueActionBody;
        console.log("[command-center/action]", { type, recId, agent, summary });

        return jsonOk({ ok: true, type, status: "acknowledged" });
      },
    },
  },
});

// ── handlers ────────────────────────────────────────────────────────────────

async function handleCreateAgentTask(body: CreateTaskBody) {
  const { title, prompt, riskLevel, targetArea } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return jsonError(400, "Missing required field: title.");
  }
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return jsonError(400, "Missing required field: prompt.");
  }
  if (!riskLevel || !RISK_LEVELS.has(riskLevel)) {
    return jsonError(400, "riskLevel must be one of: low, medium, high.");
  }
  if (
    !targetArea ||
    typeof targetArea !== "string" ||
    targetArea.trim().length === 0
  ) {
    return jsonError(400, "Missing required field: targetArea.");
  }

  const { taskStore } = await import("@/lib/agent-task-store");
  const task = taskStore.add({
    title: title.trim(),
    prompt: prompt.trim(),
    riskLevel,
    targetArea: targetArea.trim(),
  });

  console.log("[command-center/action] created agent task", task.id, task.title);

  return jsonOk({ ok: true, type: "create_agent_task", taskId: task.id, task });
}

async function handleApproveTask(body: ApproveTaskBody) {
  const { taskId } = body;
  if (!taskId || typeof taskId !== "string") {
    return jsonError(400, "Missing required field: taskId.");
  }

  const { taskStore } = await import("@/lib/agent-task-store");
  const task = taskStore.getById(taskId);

  if (!task) {
    return jsonError(404, `Task ${taskId} not found.`);
  }
  if (task.status !== "pending") {
    return jsonError(
      409,
      `Task ${taskId} is already ${task.status} — only pending tasks can be approved.`,
    );
  }

  const updated = taskStore.updateStatus(taskId, "approved" as TaskStatus);
  console.log("[command-center/action] approved task", taskId);

  return jsonOk({ ok: true, type: "approve_task", taskId, task: updated });
}

async function handleTriggerWorkflow(body: TriggerWorkflowBody) {
  const { taskId } = body;
  if (!taskId || typeof taskId !== "string") {
    return jsonError(400, "Missing required field: taskId.");
  }

  const { taskStore } = await import("@/lib/agent-task-store");
  const task = taskStore.getById(taskId);

  if (!task) {
    return jsonError(404, `Task ${taskId} not found.`);
  }

  const triggerable = new Set<TaskStatus>(["pending", "approved"]);
  if (!triggerable.has(task.status)) {
    return jsonError(
      409,
      `Task ${taskId} is ${task.status} — only pending or approved tasks can be triggered.`,
    );
  }

  const { dispatchAgentWorkflow } = await import(
    "@/lib/github-dispatch.server"
  );
  const result = await dispatchAgentWorkflow(task);

  if (!result.ok) {
    console.error("[command-center/action] workflow dispatch failed", result.error);
    return jsonError(500, result.error ?? "Workflow dispatch failed.");
  }

  taskStore.updateStatus(taskId, "workflow_triggered", result.workflowRunUrl);
  console.log(
    "[command-center/action] triggered workflow for task",
    taskId,
    result.workflowRunUrl,
  );

  return jsonOk({
    ok: true,
    type: "trigger_agent_workflow",
    taskId,
    status: "workflow_triggered",
    workflowRunUrl: result.workflowRunUrl,
  });
}

// ── helpers ──────────────────────────────────────────────────────────────────

function jsonOk(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
