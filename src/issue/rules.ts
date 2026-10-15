import type { CheckItem } from "../report.js";

export interface IssueRule {
  id: string;
  title: string;
  message: string;
  fix: string;
  validate?: (content: string) => Promise<CheckItem> | CheckItem;
}

export const issueRules: IssueRule[] = [
  {
    id: "I1",
    title: "Issue Title Format",
    message: "Issue title must follow the standard naming convention.",
    fix: "Update issue title to follow the expected prefix and structure.",
  },
  {
    id: "I2",
    title: "Problem Statement",
    message: "Issue must contain a clear problem statement section.",
    fix: "Add a ## Problem Statement section describing the motivation.",
  },
  {
    id: "I3",
    title: "Proposed Solution",
    message: "Issue must outline proposed changes or solution approach.",
    fix: "Add a ## Proposed Solution section.",
  },
  {
    id: "I4",
    title: "Acceptance Criteria",
    message: "Issue must specify verifiable acceptance criteria.",
    fix: "Add a checklist under ## Acceptance Criteria.",
  },
  {
    id: "I5",
    title: "Scope and Boundaries",
    message: "Issue must declare explicit in-scope and out-of-scope boundaries.",
    fix: "Add ## Scope with in-scope and out-of-scope items.",
  },
  {
    id: "I6",
    title: "Testing Plan",
    message: "Issue must define how changes will be tested and verified.",
    fix: "Add a ## Testing Plan section.",
  },
  {
    id: "I7",
    title: "Dependencies and Blockers",
    message: "Issue must list upstream dependencies or state 'None'.",
    fix: "Add a ## Dependencies section.",
  },
  {
    id: "S1",
    title: "Stellar Ecosystem Alignment",
    message: "Issue must identify relevance to Stellar/Soroban ecosystem.",
    fix: "Specify Stellar Wave track or milestone alignment.",
  },
  {
    id: "S2",
    title: "Smart Contract Architecture",
    message: "Contract changes must specify interfaces and storage considerations.",
    fix: "Document Soroban contract storage types and authorizations.",
  },
  {
    id: "S3",
    title: "Security and Audit Impact",
    message: "Issue must state whether security or audit review is required.",
    fix: "Include a security impact assessment note.",
  },
  {
    id: "F1",
    title: "Frontmatter Validity",
    message: "Frontmatter metadata must be valid YAML if present.",
    fix: "Fix frontmatter YAML formatting.",
  },
];
