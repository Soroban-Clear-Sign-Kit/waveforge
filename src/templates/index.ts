import fs from "node:fs";
import path from "node:path";

export interface ScaffoldOptions {
  force?: boolean;
}

export interface ScaffoldResult {
  created: string[];
  skipped: string[];
}

export const DEFAULT_CONFIG_YML = `blank_issues_enabled: false
contact_links:
  - name: Stellar Wave Documentation
    url: https://docs.drips.network/wave
    about: Read the Stellar Wave program guidelines and submission requirements.
`;

export const DEFAULT_BUG_YML = `name: Bug Report
description: File a bug report or regression issue
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: |
        Thank you for submitting a bug report!
  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      description: Provide a clear and concise description of what went wrong.
    validations:
      required: true
  - type: textarea
    id: expected-behaviour
    attributes:
      label: Expected behaviour
      description: What did you expect to happen instead?
    validations:
      required: true
  - type: textarea
    id: steps-to-reproduce
    attributes:
      label: Steps to reproduce
      description: Exact commands, fixtures, or instructions to reproduce the issue.
    validations:
      required: true
  - type: input
    id: version
    attributes:
      label: Version or Commit
      description: Which version or commit SHA are you running?
    validations:
      required: true
`;

export const DEFAULT_FEATURE_YML = `name: Feature Request
description: Propose a new feature, rule, or enhancement
labels: ["enhancement"]
body:
  - type: textarea
    id: problem
    attributes:
      label: Problem
      description: What architectural gap, friction, or limitation does this feature resolve?
    validations:
      required: true
  - type: textarea
    id: proposed-solution
    attributes:
      label: Proposed Solution
      description: Describe the proposed design, API, or behavioral changes.
    validations:
      required: true
  - type: checkboxes
    id: done-when
    attributes:
      label: Done when
      description: Checklist of acceptance criteria required for completion.
      options:
        - label: Implementation complete with tests added
          required: true
        - label: Documentation updated to reflect changes
          required: true
        - label: Verification checks pass cleanly
          required: true
  - type: textarea
    id: files-to-touch
    attributes:
      label: Files to touch
      description: List target files and paths expected to be created or modified.
    validations:
      required: true
`;

export const DEFAULT_SPIKE_YML = `name: Spike
description: Propose a time-boxed investigation or architectural spike
labels: ["spike"]
body:
  - type: textarea
    id: question-to-answer
    attributes:
      label: Question to Answer
      description: What is the core hypothesis or open question this spike investigates?
    validations:
      required: true
  - type: textarea
    id: what-to-investigate
    attributes:
      label: What to Investigate
      description: Describe the technical avenues, prototypes, or benchmarks to explore.
    validations:
      required: true
  - type: textarea
    id: expected-output
    attributes:
      label: Expected Output
      description: What deliverable or ADR should result from this spike?
    validations:
      required: true
`;

export async function scaffoldTemplates(
  root: string,
  options: ScaffoldOptions = {}
): Promise<ScaffoldResult> {
  const templatesDir = path.join(root, ".github", "ISSUE_TEMPLATE");
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }

  const templates: Record<string, string> = {
    "config.yml": DEFAULT_CONFIG_YML,
    "bug.yml": DEFAULT_BUG_YML,
    "feature.yml": DEFAULT_FEATURE_YML,
    "spike.yml": DEFAULT_SPIKE_YML,
  };

  const created: string[] = [];
  const skipped: string[] = [];

  for (const [filename, content] of Object.entries(templates)) {
    const targetFile = path.join(templatesDir, filename);
    if (fs.existsSync(targetFile) && !options.force) {
      skipped.push(filename);
    } else {
      fs.writeFileSync(targetFile, content, "utf-8");
      created.push(filename);
    }
  }

  return { created, skipped };
}
