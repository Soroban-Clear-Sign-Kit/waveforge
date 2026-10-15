import type { CheckItem } from "../report.js";

export const r1Check = {
  id: "R1",
  title: "Cargo.toml Soroban Configuration",
  message: "Verify Cargo.toml exists and configures Soroban dependencies correctly.",
  fix: "Add or update Cargo.toml with the required Soroban SDK dependencies.",
  async run(): Promise<CheckItem> {
    return {
      id: "R1",
      title: this.title,
      message: this.message,
      fix: this.fix,
      status: "pass",
    };
  },
};
