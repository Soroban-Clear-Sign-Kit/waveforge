import path from "node:path";
import type { CheckResult } from "../report.js";
import { fileExists } from "../util/fs.js";

export async function r4Check(root: string): Promise<CheckResult> {
  const candidateFiles = ["SECURITY.md", "security.md", path.join(".github", "SECURITY.md")];
  let found = false;

  for (const candidate of candidateFiles) {
    const fullPath = path.join(root, candidate);
    if (await fileExists(fullPath)) {
      found = true;
      break;
    }
  }

  if (!found) {
    return {
      id: "R4",
      title: "Security Policy",
      status: "warn",
      message: "SECURITY.md does not exist in repository root.",
      fix: "Add a SECURITY.md file detailing vulnerability reporting procedures.",
    };
  }

  return {
    id: "R4",
    title: "Security Policy",
    status: "pass",
    message: "SECURITY.md exists with vulnerability reporting policy.",
  };
}

r4Check.id = "R4";
r4Check.title = "Security Policy";
r4Check.run = (root = ".") => r4Check(root);

export { r4Check as checkR4 };
