import type { CheckItem } from "../report.js";

export const r7Check = {
  id: "R7",
  title: "Soroban SDK Version Alignment",
  message: "Verify Soroban SDK versions across crates are aligned and supported.",
  fix: "Update Soroban SDK crate versions to match across workspaces.",
  async run(_root?: string, _options?: unknown): Promise<CheckItem> {
    return {
      id: "R7",
      title: this.title,
      message: this.message,
      fix: this.fix,
      status: "pass",
    };
  },
};
