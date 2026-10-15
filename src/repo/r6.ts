import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "yaml";
import type { CheckResult } from "../report.js";
import { dirExists, readTextFile } from "../util/fs.js";

function triggersOnPullRequest(onValue: unknown): boolean {
  if (typeof onValue === "string") {
    return onValue.toLowerCase() === "pull_request";
  }
  if (Array.isArray(onValue)) {
    return onValue.some((item) => typeof item === "string" && item.toLowerCase() === "pull_request");
  }
  if (onValue && typeof onValue === "object") {
    return Object.keys(onValue).some((key) => key.toLowerCase() === "pull_request");
  }
  return false;
}

interface WorkflowStep {
  run?: unknown;
  name?: unknown;
}

interface WorkflowJob {
  steps?: unknown;
}

function hasTestRunStep(jobs: unknown): boolean {
  if (!jobs || typeof jobs !== "object") {
    return false;
  }
  for (const job of Object.values(jobs as Record<string, WorkflowJob>)) {
    if (job && Array.isArray(job.steps)) {
      for (const step of job.steps as WorkflowStep[]) {
        if (step && typeof step.run === "string" && /\btest\b/i.test(step.run)) {
          return true;
        }
      }
    }
  }
  return false;
}

export async function r6Check(root: string, _options?: unknown): Promise<CheckResult> {
  const workflowsDir = path.join(root, ".github", "workflows");

  if (!(await dirExists(workflowsDir))) {
    return {
      id: "R6",
      title: "CI Workflow Automation",
      status: "fail",
      message: "No .github/workflows directory found.",
      fix: "Add a GitHub Actions workflow in .github/workflows/ triggering on pull_request with a test step.",
    };
  }

  let entries: string[] = [];
  try {
    entries = await fs.readdir(workflowsDir);
  } catch {
    return {
      id: "R6",
      title: "CI Workflow Automation",
      status: "fail",
      message: "Could not read .github/workflows directory.",
      fix: "Ensure .github/workflows is readable.",
    };
  }

  const workflowFiles = entries.filter((e) => /\.(ya?ml)$/i.test(e));
  let matchingWorkflow: string | null = null;

  for (const file of workflowFiles) {
    const fullPath = path.join(workflowsDir, file);
    const content = await readTextFile(fullPath);
    if (!content) continue;

    try {
      const parsed = yaml.parse(content) as Record<string, unknown> | null;
      if (!parsed || typeof parsed !== "object") continue;

      const onClause = parsed["on"] ?? (parsed as Record<string, unknown>)["true"];
      if (triggersOnPullRequest(onClause) && hasTestRunStep(parsed["jobs"])) {
        matchingWorkflow = file;
        break;
      }
    } catch {
      // ignore syntax error in one workflow
    }
  }

  if (!matchingWorkflow) {
    return {
      id: "R6",
      title: "CI Workflow Automation",
      status: "fail",
      message: "No workflow in .github/workflows/ triggers on pull_request with a test step.",
      fix: "Add a workflow in .github/workflows/ that triggers on pull_request with a run step containing 'test'.",
    };
  }

  return {
    id: "R6",
    title: "CI Workflow Automation",
    status: "pass",
    message: `Found CI workflow (${matchingWorkflow}) triggered on pull_request with automated test step.`,
  };
}

r6Check.id = "R6";
r6Check.title = "CI Workflow Automation";
r6Check.run = (root = ".") => r6Check(root);

export { r6Check as checkR6 };
