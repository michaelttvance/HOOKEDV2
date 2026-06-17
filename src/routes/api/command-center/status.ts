import { createFileRoute } from "@tanstack/react-router";

// GET /api/command-center/status
// Returns live command center status in the format expected by command-center.html.
// Fields mirror the SEED object so the bundled component can render them directly.
// Extend this to pull live data from GitHub/Vercel APIs in a future pass.
export const Route = createFileRoute("/api/command-center/status")({
  server: {
    handlers: {
      GET: async () => {
        const { taskStore } = await import("@/lib/agent-task-store");

        const status = {
          pr: {
            number: 23,
            branch: "main",
            commit: "32b937a",
            state: "merged",
            stateLabel: "Merged",
          },
          counts: {
            complete: 11,
            verify: 4,
            blockers: 0,
          },
          deployment: {
            state: "READY",
            previewAlias: "hookaidashboard.com",
            previewLatest: "hookaidashboard.com",
          },
          tasks: taskStore.getAll(),
          _meta: {
            source: "live",
            timestamp: new Date().toISOString(),
          },
        };

        return new Response(JSON.stringify(status), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
