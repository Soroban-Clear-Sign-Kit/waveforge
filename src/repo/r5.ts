import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "yaml";
import type { CheckResult } from "../report.js";
import { dirExists, readTextFile } from "../util/fs.js";

export async function r5Check(root: string, _options?: unknown): Promise<CheckResult> {
  const templatesDir = path.join(root, ".github", "ISSUE_TEMPLATE");

  if (!(await dirExists(templatesDir))) {
    return {
      id: "R5",
      title: "Issue Templates Configuration",
      status: "warn",
      message: ".github/ISSUE_TEMPLATE directory does not exist.",
      fix: "Create .github/ISSUE_TEMPLATE/ with YAML form templates and config.yml.",
    };
  }

  let entries: string[] = [];
  try {
    entries = await fs.readdir(templatesDir);
  } catch {
    return {
      id: "R5",
      title: "Issue Templates Configuration",
      status: "warn",
      message: "Could not read .github/ISSUE_TEMPLATE directory.",
      fix: "Ensure .github/ISSUE_TEMPLATE is readable.",
    };
  }

  const ymlFiles = entries.filter((e) => /\.(ya?ml)$/i.test(e));
  const formFiles = ymlFiles.filter((e) => !/^config\.(ya?ml)$/i.test(e));

  let validFormsCount = 0;
  for (const formFile of formFiles) {
    const fullPath = path.join(templatesDir, formFile);
    const text = await readTextFile(fullPath);
    if (text) {
      try {
        const parsed = yaml.parse(text);
        if (parsed && typeof parsed === "object") {
          validFormsCount++;
        }
      } catch {
        // syntax error in form
      }
    }
  }

  const configFile = entries.find((e) => /^config\.(ya?ml)$/i.test(e));
  let configBlankIssuesDisabled = false;

  if (configFile) {
    const configPath = path.join(templatesDir, configFile);
    const configText = await readTextFile(configPath);
    if (configText) {
      try {
        const parsedConfig = yaml.parse(configText);
        if (parsedConfig && parsedConfig.blank_issues_enabled === false) {
          configBlankIssuesDisabled = true;
        }
      } catch {
        // syntax error in config
      }
    }
  }

  const warnings: string[] = [];
  if (validFormsCount === 0) {
    warnings.push("no valid .yml issue forms found");
  }
  if (!configFile || !configBlankIssuesDisabled) {
    warnings.push("config.yml missing or blank_issues_enabled is not false");
  }

  if (warnings.length > 0) {
    return {
      id: "R5",
      title: "Issue Templates Configuration",
      status: "warn",
      message: `Issue templates configuration warning: ${warnings.join("; ")}.`,
      fix: "Add at least one issue form (.yml) in .github/ISSUE_TEMPLATE and set blank_issues_enabled: false in config.yml.",
    };
  }

  return {
    id: "R5",
    title: "Issue Templates Configuration",
    status: "pass",
    message: `Found ${validFormsCount} issue form template(s) and config.yml with blank_issues_enabled: false.`,
  };
}

r5Check.id = "R5";
r5Check.title = "Issue Templates Configuration";
r5Check.run = (root = ".") => r5Check(root);

export { r5Check as checkR5 };
