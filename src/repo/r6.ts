import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "yaml";
import type { CheckResult } from "../report.js";
import { dirExists, fileExists, readTextFile } from "../util/fs.js";

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

function hasGoTestStep(jobs: unknown): boolean {
  if (!jobs || typeof jobs !== "object") return false;
  for (const job of Object.values(jobs as Record<string, WorkflowJob>)) {
    if (job && Array.isArray(job.steps)) {
      for (const step of job.steps as WorkflowStep[]) {
        if (step && typeof step.run === "string" && /\bgo\s+test\b/i.test(step.run)) {
          return true;
        }
      }
    }
  }
  return false;
}

function hasGoLintStep(jobs: unknown): boolean {
  if (!jobs || typeof jobs !== "object") return false;
  for (const job of Object.values(jobs as Record<string, WorkflowJob>)) {
    if (job && Array.isArray(job.steps)) {
      for (const step of job.steps as WorkflowStep[]) {
        if (step && typeof step.run === "string") {
          if (/\b(golangci-lint|staticcheck|go\s+vet)\b/i.test(step.run)) {
            return true;
          }
        }
        if (step && typeof step.name === "string") {
          if (/\b(golangci-lint|staticcheck|go\s+vet)\b/i.test(step.name)) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

export async function r6Check(root: string, _options?: unknown): Promise<CheckResult> {
  const isGoProject = await fileExists(path.join(root, "go.mod"));
  const workflowsDir = path.join(root, ".github", "workflows");

  if (!(await dirExists(workflowsDir))) {
    return {
      id: "R6",
      title: "CI Workflow Automation",
      status: "fail",
      message: "No .github/workflows directory found.",
      fix: isGoProject
        ? "Add a GitHub Actions workflow in .github/workflows/ triggering on pull_request with 'go test ./...'."
        : "Add a GitHub Actions workflow in .github/workflows/ triggering on pull_request with a test step.",
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
      fix: "Configure readable permissions for .github/workflows.",
    };
  }

  const workflowFiles = entries.filter((e) => /\.(ya?ml)$/i.test(e));
  let matchingWorkflow: string | null = null;
  let goWorkflowHasGoTest = false;
  let goWorkflowHasLint = false;

  for (const file of workflowFiles) {
    const fullPath = path.join(workflowsDir, file);
    const content = await readTextFile(fullPath);
    if (!content) continue;

    try {
      const parsed = yaml.parse(content) as Record<string, unknown> | null;
      if (!parsed || typeof parsed !== "object") continue;

      const onClause = parsed["on"] ?? (parsed as Record<string, unknown>)["true"];
      if (triggersOnPullRequest(onClause)) {
        if (hasTestRunStep(parsed["jobs"])) {
          matchingWorkflow = file;
        }
        if (hasGoTestStep(parsed["jobs"])) {
          goWorkflowHasGoTest = true;
        }
        if (hasGoLintStep(parsed["jobs"])) {
          goWorkflowHasLint = true;
        }
      }
    } catch {
      // ignore syntax error in one workflow
    }
  }

  // Go repository specific verification
  if (isGoProject) {
    if (!goWorkflowHasGoTest) {
      return {
        id: "R6",
        title: "CI Workflow Automation",
        status: "fail",
        message: "Go repository detected (go.mod), but no pull_request workflow runs 'go test'.",
        fix: "Add a step running 'go test ./...' in your pull_request CI workflow in .github/workflows/.",
      };
    }

    if (!goWorkflowHasLint) {
      return {
        id: "R6",
        title: "CI Workflow Automation",
        status: "warn",
        message: `Found Go CI workflow (${matchingWorkflow ?? "ci.yml"}) with 'go test', but no linter (golangci-lint or staticcheck) detected.`,
        fix: "Add a linter step using 'golangci-lint' or 'staticcheck' to your Go CI workflow.",
      };
    }

    return {
      id: "R6",
      title: "CI Workflow Automation",
      status: "pass",
      message: `Found Go CI workflow (${matchingWorkflow ?? "ci.yml"}) with 'go test' and lint verification.`,
    };
  }

  // Standard generic / Node / Rust repository verification
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
