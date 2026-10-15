import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";

describe("GitHub Issue Templates and Forms", () => {
  const templatesDir = path.resolve(process.cwd(), ".github/ISSUE_TEMPLATE");

  it("config.yml exists and has blank_issues_enabled: false", () => {
    const content = fs.readFileSync(path.join(templatesDir, "config.yml"), "utf-8");
    const parsed = yaml.parse(content);
    expect(parsed.blank_issues_enabled).toBe(false);
  });

  it("bug.yml parses and adheres to issue-form schema", () => {
    const content = fs.readFileSync(path.join(templatesDir, "bug.yml"), "utf-8");
    const parsed = yaml.parse(content);
    expect(parsed.name).toBe("Bug Report");
    expect(parsed.labels).toContain("bug");
    expect(Array.isArray(parsed.body)).toBe(true);

    const ids = parsed.body.map((item: { id?: string }) => item.id).filter(Boolean);
    expect(ids).toContain("what-happened");
    expect(ids).toContain("expected-behaviour");
    expect(ids).toContain("steps-to-reproduce");
    expect(ids).toContain("version");
  });

  it("feature.yml parses and adheres to issue-form schema", () => {
    const content = fs.readFileSync(path.join(templatesDir, "feature.yml"), "utf-8");
    const parsed = yaml.parse(content);
    expect(parsed.name).toBe("Feature Request");
    expect(parsed.labels).toContain("enhancement");
    expect(Array.isArray(parsed.body)).toBe(true);

    const ids = parsed.body.map((item: { id?: string }) => item.id).filter(Boolean);
    expect(ids).toContain("problem");
    expect(ids).toContain("proposed-solution");
    expect(ids).toContain("done-when");
    expect(ids).toContain("files-to-touch");

    const doneWhen = parsed.body.find((item: { id?: string }) => item.id === "done-when");
    expect(doneWhen.type).toBe("checkboxes");
    expect(doneWhen.attributes.options.every((opt: { required?: boolean }) => opt.required === true)).toBe(true);
  });

  it("spike.yml parses and adheres to issue-form schema", () => {
    const content = fs.readFileSync(path.join(templatesDir, "spike.yml"), "utf-8");
    const parsed = yaml.parse(content);
    expect(parsed.name).toBe("Spike");
    expect(parsed.labels).toContain("spike");
    expect(Array.isArray(parsed.body)).toBe(true);

    const ids = parsed.body.map((item: { id?: string }) => item.id).filter(Boolean);
    expect(ids).toContain("question-to-answer");
    expect(ids).toContain("what-to-investigate");
    expect(ids).toContain("expected-output");
  });

  it("new-check.yml parses and adheres to issue-form schema", () => {
    const content = fs.readFileSync(path.join(templatesDir, "new-check.yml"), "utf-8");
    const parsed = yaml.parse(content);
    expect(parsed.name).toBe("New Check Proposal");
    expect(parsed.labels).toContain("new-check");
    expect(Array.isArray(parsed.body)).toBe(true);

    const ids = parsed.body.map((item: { id?: string }) => item.id).filter(Boolean);
    expect(ids).toContain("check-id-proposal");
    expect(ids).toContain("what-it-detects");
    expect(ids).toContain("why-it-matters");
    expect(ids).toContain("passing-example");
    expect(ids).toContain("failing-example");
    expect(ids).toContain("done-when");
  });

  it("pull_request_template.md contains required sections", () => {
    const prPath = path.resolve(process.cwd(), ".github/pull_request_template.md");
    expect(fs.existsSync(prPath)).toBe(true);
    const content = fs.readFileSync(prPath, "utf-8");
    expect(content).toContain("Closes #");
    expect(content).toContain("Summary");
    expect(content).toContain("Test Evidence");
    expect(content).toContain("Checklist");
    expect(content).toContain("Tests added");
    expect(content).toContain("Lint clean");
    expect(content).toContain("Typecheck clean");
    expect(content).toContain("Docs updated");
  });
});
