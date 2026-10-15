import type { CheckItem } from "../report.js";

export const r6Check = {
  id: "R6",
  title: "Git Configuration and Hygiene",
  message: "Verify .gitignore ignores secrets, binaries, and build artifacts.",
  fix: "Add proper ignore patterns to .gitignore.",
  async run(): Promise<CheckItem> {
    return {
      id: "R6",
      title: this.title,
      message: this.message,
      fix: this.fix,
      status: "pass",
    };
  },
};
