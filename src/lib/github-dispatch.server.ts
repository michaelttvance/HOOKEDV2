// SERVER-ONLY — never import this from client code or any route that runs in the browser.
// Reads GITHUB_TOKEN from env. That token is never exposed to the frontend.

const GITHUB_OWNER = process.env.GITHUB_REPO_OWNER ?? "michaelttvance";
const GITHUB_REPO = process.env.GITHUB_REPO_NAME ?? "HOOKEDV2";
const WORKFLOW_FILE = "agent-task.yml";

export interface DispatchResult {
  ok: boolean;
  workflowRunUrl?: string;
  error?: string;
}

export async function dispatchAgentWorkflow(task: {
  id: string;
  title: string;
  targetArea: string;
  riskLevel: string;
}): Promise<DispatchResult> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return {
      ok: false,
      error:
        "GITHUB_TOKEN is not set. Add it to your Vercel environment variables (Settings → Environment Variables).",
    };
  }

  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`;

  let res: Response;
  try {
    res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: {
          task_id: task.id,
          task_title: task.title,
          target_area: task.targetArea,
          risk_level: task.riskLevel,
        },
      }),
    });
  } catch (err) {
    return { ok: false, error: `Network error reaching GitHub: ${String(err)}` };
  }

  // workflow_dispatch returns 204 No Content on success — no run ID in the response.
  // The run URL points to the workflow's run list; the user can see the triggered run there.
  if (res.status === 204) {
    const workflowRunUrl = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}`;
    return { ok: true, workflowRunUrl };
  }

  // Surface GitHub's error message for easier debugging without leaking the token.
  let detail = "";
  try {
    const body = await res.json();
    detail = body?.message ?? JSON.stringify(body).slice(0, 200);
  } catch {
    detail = await res.text().then((t) => t.slice(0, 200)).catch(() => "");
  }
  return {
    ok: false,
    error: `GitHub API returned ${res.status}: ${detail}`,
  };
}
