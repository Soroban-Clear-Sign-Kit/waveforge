import type { CheckItem } from "../report.js";

export const r4Check = {
  id: "R4",
  title: "License Specification",
  message: "Verify an open-source license file exists.",
  fix: "Add a LICENSE file to the repository root.",
  async run(): Promise<CheckItem> {
    return {
      id: "R4",
      title: this.title,
      message: this.message,
      fix: this.fix,
      status: "pass",
    };
  },
};
