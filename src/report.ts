export type CheckStatus = "pass" | "fail" | "warn" | "skipped";

export interface CheckItem {
  id: string;
  title: string;
  message: string;
  fix: string;
  status: CheckStatus;
  details?: string;
}

export interface Report {
  target: string;
  timestamp: string;
  checks: CheckItem[];
  summary: {
    total: number;
    pass: number;
    fail: number;
    warn: number;
    skipped: number;
  };
}

export function createEmptyReport(target: string): Report {
  return {
    target,
    timestamp: new Date().toISOString(),
    checks: [],
    summary: {
      total: 0,
      pass: 0,
      fail: 0,
      warn: 0,
      skipped: 0,
    },
  };
}
