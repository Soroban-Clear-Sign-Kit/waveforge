import type { CheckResult } from "../report.js";

export interface IssueLintOptions {
  title?: string;
  filePath?: string;
}

export interface IssueRule {
  id: string;
  title: string;
  message: string;
  fix: string;
  validate?: (markdown: string, options?: IssueLintOptions) => CheckResult;
}

export interface ParsedSection {
  title: string;
  level: number;
  content: string;
}

export interface ParsedIssue {
  title: string;
  openingParagraph: string;
  sections: ParsedSection[];
  totalWords: number;
  totalChecklistItems: number;
  suggestedComplexity: "Trivial" | "Medium" | "High";
  statedComplexity?: "Trivial" | "Medium" | "High";
  isSoroban: boolean;
  isFrontend: boolean;
}

export function parseIssueMarkdown(markdown: string, options?: IssueLintOptions): ParsedIssue {
  const lines = markdown.split(/\r?\n/);
  let titleFromFirstHeading: string | null = null;
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;
  const openingLines: string[] = [];
  let foundFirstHeading = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      const level = headingMatch[1]!.length;
      const headingText = headingMatch[2]!.trim();

      if (!foundFirstHeading) {
        foundFirstHeading = true;
        if (level === 1) {
          titleFromFirstHeading = headingText;
          continue;
        }
      }

      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: headingText,
        level,
        content: "",
      };
    } else {
      if (!currentSection) {
        openingLines.push(line);
      } else {
        currentSection.content += `${line}\n`;
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  // Extract first opening paragraph (first non-empty continuous block of text before any section)
  const paragraphBlocks: string[] = [];
  let curBlock: string[] = [];
  for (const line of openingLines) {
    if (line.trim().length > 0) {
      curBlock.push(line.trim());
    } else if (curBlock.length > 0) {
      paragraphBlocks.push(curBlock.join(" "));
      curBlock = [];
    }
  }
  if (curBlock.length > 0) {
    paragraphBlocks.push(curBlock.join(" "));
  }
  const openingParagraph = paragraphBlocks[0] ?? "";

  const title = options?.title ?? titleFromFirstHeading ?? options?.filePath ?? "Untitled Issue";

  // Word count across entire document
  const words = markdown.trim().length === 0 ? [] : markdown.trim().split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  // Checklist items across entire document
  const checklistMatches = markdown.match(/^\s*[-*+]\s+\[[ xX]\]/gm);
  const totalChecklistItems = checklistMatches ? checklistMatches.length : 0;

  // Complexity calculation
  const hasHighKeyword = /\b(integration|architecture|refactor|contract\s+storage)\b/i.test(markdown);
  const hasTrivialKeyword = /\b(typo|docs|copy|readme)\b/i.test(markdown);

  let suggestedComplexity: "Trivial" | "Medium" | "High";
  if (totalChecklistItems > 8 || hasHighKeyword) {
    suggestedComplexity = "High";
  } else if (totalChecklistItems <= 3 && hasTrivialKeyword) {
    suggestedComplexity = "Trivial";
  } else {
    suggestedComplexity = "Medium";
  }

  // Extract stated complexity
  let statedComplexity: "Trivial" | "Medium" | "High" | undefined;
  const complexityRegexes = [
    /(?:complexity|estimate|guidelines\s+with\s+complexity)\s*[:=-]?\s*(trivial|medium|high|100|150|200)\b/i,
    /\b(100|150|200)\s*points\b/i,
    /\bComplexity:\s*(Trivial|Medium|High|100|150|200)\b/i,
  ];

  for (const reg of complexityRegexes) {
    const match = markdown.match(reg);
    if (match) {
      const val = match[1]!.toLowerCase();
      if (val === "100" || val === "trivial") {
        statedComplexity = "Trivial";
      } else if (val === "150" || val === "medium") {
        statedComplexity = "Medium";
      } else if (val === "200" || val === "high") {
        statedComplexity = "High";
      }
      break;
    }
  }

  // Check section titled with complexity if not found yet
  if (!statedComplexity) {
    const compSection = sections.find((s) => /complexity/i.test(s.title));
    if (compSection) {
      const valMatch = compSection.content.match(/\b(trivial|medium|high|100|150|200)\b/i);
      if (valMatch) {
        const val = valMatch[1]!.toLowerCase();
        if (val === "100" || val === "trivial") statedComplexity = "Trivial";
        else if (val === "150" || val === "medium") statedComplexity = "Medium";
        else if (val === "200" || val === "high") statedComplexity = "High";
      }
    }
  }

  const isSoroban = /(?:\.rs\b|contracts\/|\bsoroban\b|\brequire_auth\b|smart\s+contract)/i.test(markdown);
  const isFrontend = /(?:\.tsx\b|\bUI\b|\bpage\b|\bcomponent\b)/i.test(markdown);

  return {
    title,
    openingParagraph,
    sections,
    totalWords,
    totalChecklistItems,
    suggestedComplexity,
    statedComplexity,
    isSoroban,
    isFrontend,
  };
}

export function lintIssueRules(markdown: string, options?: IssueLintOptions): { results: CheckResult[]; parsed: ParsedIssue } {
  const parsed = parseIssueMarkdown(markdown, options);
  const results: CheckResult[] = [];

  // I1 context: a Description, Context or Background section, or a first paragraph of at least 30 words (fail if missing)
  const hasContextSection = parsed.sections.some((s) => /^(?:description|context|background)$/i.test(s.title));
  const openingWordsCount = parsed.openingParagraph.trim().length === 0 ? 0 : parsed.openingParagraph.trim().split(/\s+/).filter(Boolean).length;
  const hasOpeningParagraph = openingWordsCount >= 30;

  if (hasContextSection || hasOpeningParagraph) {
    results.push({
      id: "I1",
      title: "Context and Description",
      status: "pass",
      message: hasContextSection
        ? "Found Description, Context or Background section."
        : `Opening paragraph has ${openingWordsCount} words (>= 30 words).`,
      evidence: hasContextSection ? ["Context section detected"] : [`Opening paragraph word count: ${openingWordsCount}`],
    });
  } else {
    results.push({
      id: "I1",
      title: "Context and Description",
      status: "fail",
      message: "Missing Description, Context or Background section, and opening paragraph is under 30 words.",
      fix: "Add a ## Description, ## Context or ## Background section, or expand opening paragraph to >= 30 words.",
    });
  }

  // I2 requirements: a list under Requirements or "Requirements and context" (warn)
  const reqSection = parsed.sections.find((s) => /^(?:requirements|requirements\s+and\s+context)$/i.test(s.title));
  const hasReqList = reqSection ? /^\s*(?:[-*+]|\d+\.)\s+\S/m.test(reqSection.content) : false;

  if (reqSection && hasReqList) {
    results.push({
      id: "I2",
      title: "Requirements Specification",
      status: "pass",
      message: "Found list under Requirements section.",
      evidence: [`Section '${reqSection.title}' contains requirements list`],
    });
  } else {
    results.push({
      id: "I2",
      title: "Requirements Specification",
      status: "warn",
      message: "Missing list under Requirements or Requirements and context heading.",
      fix: "Add a ## Requirements or ## Requirements and context section containing a bulleted or numbered list.",
    });
  }

  // I3 acceptance: a "Done when" or "Acceptance criteria" heading with at least 2 "- [ ]" items (fail)
  const acceptanceSection = parsed.sections.find((s) => /^(?:done\s+when|acceptance\s+criteria)$/i.test(s.title));
  const acceptanceChecklistCount = acceptanceSection
    ? (acceptanceSection.content.match(/^\s*[-*+]\s+\[[ xX]\]/gm) ?? []).length
    : 0;

  if (acceptanceSection && acceptanceChecklistCount >= 2) {
    results.push({
      id: "I3",
      title: "Acceptance Criteria",
      status: "pass",
      message: `Found '${acceptanceSection.title}' section with ${acceptanceChecklistCount} checklist items.`,
      evidence: [`${acceptanceChecklistCount} checklist item(s) found under '${acceptanceSection.title}'`],
    });
  } else {
    results.push({
      id: "I3",
      title: "Acceptance Criteria",
      status: "fail",
      message: "Missing 'Done when' or 'Acceptance criteria' heading with at least 2 checklist items (- [ ]).",
      fix: "Add a ## Done when or ## Acceptance criteria heading with at least 2 checkbox items (- [ ]).",
    });
  }

  // I4 files: a path (contains "/" and an extension, or a trailing "/") or a "Files to touch" heading (warn)
  const hasFilesHeading = parsed.sections.some((s) => /^files\s+to\s+touch$/i.test(s.title));
  const pathRegex = /(?:^|[\s`"'(<[])([a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)+\.[a-zA-Z0-9]+|[a-zA-Z0-9_.-]+\/)(?:$|[\s`"')>\]])/;
  const hasFilePath = pathRegex.test(markdown);

  if (hasFilesHeading || hasFilePath) {
    results.push({
      id: "I4",
      title: "Files to Touch",
      status: "pass",
      message: hasFilesHeading
        ? "Found 'Files to touch' heading."
        : "Found file path with extension or trailing slash.",
      evidence: hasFilesHeading ? ["'Files to touch' section detected"] : ["File paths identified in issue text"],
    });
  } else {
    results.push({
      id: "I4",
      title: "Files to Touch",
      status: "warn",
      message: "Missing file paths (with '/' and an extension, or trailing '/') and no 'Files to touch' heading.",
      fix: "Add affected file paths (e.g. src/index.ts or src/) or a ## Files to touch section.",
    });
  }

  // I5 execution: a "Suggested execution" section or numbered steps (warn)
  const hasExecutionSection = parsed.sections.some((s) => /^suggested\s+execution$/i.test(s.title));
  const hasNumberedSteps = /^\s*\d+\.\s+\S/m.test(markdown);

  if (hasExecutionSection || hasNumberedSteps) {
    results.push({
      id: "I5",
      title: "Suggested Execution",
      status: "pass",
      message: hasExecutionSection
        ? "Found 'Suggested execution' section."
        : "Found numbered execution steps.",
      evidence: hasExecutionSection ? ["'Suggested execution' section present"] : ["Numbered steps detected"],
    });
  } else {
    results.push({
      id: "I5",
      title: "Suggested Execution",
      status: "warn",
      message: "Missing 'Suggested execution' section or numbered steps.",
      fix: "Add a ## Suggested execution section or numbered steps outlining task execution.",
    });
  }

  // I6 complexity: Trivial, Medium or High, or 100/150/200 points (warn)
  if (!parsed.statedComplexity) {
    results.push({
      id: "I6",
      title: "Complexity Estimation",
      status: "warn",
      message: "Missing complexity estimate (Trivial, Medium, High, or 100/150/200 points).",
      fix: `Specify complexity (Trivial, Medium, High). Suggested complexity: ${parsed.suggestedComplexity}.`,
    });
  } else if (parsed.statedComplexity !== parsed.suggestedComplexity) {
    results.push({
      id: "I6",
      title: "Complexity Estimation",
      status: "warn",
      message: `Stated complexity '${parsed.statedComplexity}' differs from suggested complexity '${parsed.suggestedComplexity}'.`,
      evidence: [
        `Stated complexity: ${parsed.statedComplexity}`,
        `Suggested complexity: ${parsed.suggestedComplexity}`,
      ],
      fix: `Align stated complexity with suggested complexity '${parsed.suggestedComplexity}' or adjust scope.`,
    });
  } else {
    results.push({
      id: "I6",
      title: "Complexity Estimation",
      status: "pass",
      message: `Stated complexity matches suggested complexity (${parsed.statedComplexity}).`,
      evidence: [`Complexity: ${parsed.statedComplexity}`],
    });
  }

  // I7 scope: fewer than 15 checklist items and under 1,200 words (warn)
  const checklistOk = parsed.totalChecklistItems < 15;
  const wordsOk = parsed.totalWords < 1200;

  if (checklistOk && wordsOk) {
    results.push({
      id: "I7",
      title: "Scope Limits",
      status: "pass",
      message: `Issue scope is within limits (${parsed.totalChecklistItems} checklist items, ${parsed.totalWords} words).`,
      evidence: [`Checklist items: ${parsed.totalChecklistItems}/15`, `Word count: ${parsed.totalWords}/1200`],
    });
  } else {
    results.push({
      id: "I7",
      title: "Scope Limits",
      status: "warn",
      message: `Issue scope exceeds limits (${parsed.totalChecklistItems} checklist items, ${parsed.totalWords} words).`,
      evidence: [`Checklist items: ${parsed.totalChecklistItems} (limit < 15)`, `Word count: ${parsed.totalWords} (limit < 1200)`],
      fix: "Split the issue into smaller, focused issues (< 15 checklist items and < 1,200 words).",
    });
  }

  // Soroban rules S1, S2, S3
  if (!parsed.isSoroban) {
    results.push({
      id: "S1",
      title: "State Change Authorization",
      status: "skipped",
      message: "Not a Soroban issue (does not mention .rs, contracts/, soroban, require_auth, or smart contract).",
      fix: "Document authorization requirements if Soroban contracts are modified.",
    });
    results.push({
      id: "S2",
      title: "Contract Tests",
      status: "skipped",
      message: "Not a Soroban issue (does not mention .rs, contracts/, soroban, require_auth, or smart contract).",
      fix: "Require contract tests if Soroban contracts are modified.",
    });
    results.push({
      id: "S3",
      title: "Contract Build and Size Verification",
      status: "skipped",
      message: "Not a Soroban issue (does not mention .rs, contracts/, soroban, require_auth, or smart contract).",
      fix: "Require stellar contract build or Wasm size check if Soroban contracts are modified.",
    });
  } else {
    // S1 says who must authorise state changes (fail)
    const hasAuth = /\b(require_auth(?:_admin)?|authori[sz]e|authori[sz]ation|who must authori[sz]e)\b/i.test(markdown);
    if (hasAuth) {
      results.push({
        id: "S1",
        title: "State Change Authorization",
        status: "pass",
        message: "Specifies authorization requirements for state transitions.",
        evidence: ["Authorization requirements specified in issue text"],
      });
    } else {
      results.push({
        id: "S1",
        title: "State Change Authorization",
        status: "fail",
        message: "Missing specification of who must authorize state changes.",
        fix: "Specify who must authorize state changes (e.g. using require_auth).",
      });
    }

    // S2 requires tests (fail)
    const hasTests = /\b(cargo\s+test|unit\s+tests?|integration\s+tests?|test\.rs|tests?)\b/i.test(markdown);
    if (hasTests) {
      results.push({
        id: "S2",
        title: "Contract Tests",
        status: "pass",
        message: "Specifies test requirements for contract code.",
        evidence: ["Contract testing requirements documented"],
      });
    } else {
      results.push({
        id: "S2",
        title: "Contract Tests",
        status: "fail",
        message: "Missing contract test requirements.",
        fix: "Add requirements for contract tests (e.g. cargo test or unit tests).",
      });
    }

    // S3 requires stellar contract build or a Wasm size check (warn)
    const hasBuildOrSize = /\b((?:stellar|soroban)\s+contract\s+build|wasm(?:32)?(?:\s+size|-opt|\s+optimization)?|contract\s+size|size\s+check)\b/i.test(markdown);
    if (hasBuildOrSize) {
      results.push({
        id: "S3",
        title: "Contract Build and Size Verification",
        status: "pass",
        message: "Specifies stellar contract build or Wasm size check.",
        evidence: ["Build or Wasm size verification requirement present"],
      });
    } else {
      results.push({
        id: "S3",
        title: "Contract Build and Size Verification",
        status: "warn",
        message: "Missing 'stellar contract build' or Wasm size check requirement.",
        fix: "Require 'stellar contract build' or Wasm size check in acceptance criteria.",
      });
    }
  }

  // F1 when it mentions .tsx, UI, page or component: asks for screenshots or a recording (warn)
  if (!parsed.isFrontend) {
    results.push({
      id: "F1",
      title: "UI Visual Verification",
      status: "skipped",
      message: "Not a UI/frontend issue (does not mention .tsx, UI, page, or component).",
      fix: "Ask for screenshots or screen recordings if UI changes are introduced.",
    });
  } else {
    const hasScreenshotsOrRecording = /\b(screenshots?|screen\s*recording|video|visual\s*proof|demo\s*recording|demo\s*video)\b/i.test(markdown);
    if (hasScreenshotsOrRecording) {
      results.push({
        id: "F1",
        title: "UI Visual Verification",
        status: "pass",
        message: "Requests screenshots or screen recording for visual verification.",
        evidence: ["Screenshots or recording requirement detected"],
      });
    } else {
      results.push({
        id: "F1",
        title: "UI Visual Verification",
        status: "warn",
        message: "Mentions UI or components but does not request screenshots or a recording.",
        fix: "Add a requirement to include screenshots or a screen recording in the pull request.",
      });
    }
  }

  return { results, parsed };
}

export const issueRules: IssueRule[] = [
  {
    id: "I1",
    title: "Context and Description",
    message: "Issue must contain a Description, Context or Background section, or a first paragraph of at least 30 words.",
    fix: "Add a ## Description, ## Context or ## Background section, or expand opening paragraph to at least 30 words.",
  },
  {
    id: "I2",
    title: "Requirements Specification",
    message: "Issue must contain a list under Requirements or Requirements and context heading.",
    fix: "Add a ## Requirements or ## Requirements and context section containing a bulleted or numbered list.",
  },
  {
    id: "I3",
    title: "Acceptance Criteria",
    message: "Issue must contain a 'Done when' or 'Acceptance criteria' heading with at least 2 '- [ ]' checklist items.",
    fix: "Add a ## Done when or ## Acceptance criteria heading with at least 2 checkbox items (- [ ]).",
  },
  {
    id: "I4",
    title: "Files to Touch",
    message: "Issue must mention file paths (with '/' and extension, or trailing '/') or a 'Files to touch' heading.",
    fix: "Specify affected file paths or add a ## Files to touch section.",
  },
  {
    id: "I5",
    title: "Suggested Execution",
    message: "Issue must contain a 'Suggested execution' section or numbered steps.",
    fix: "Add a ## Suggested execution section or numbered steps.",
  },
  {
    id: "I6",
    title: "Complexity Estimation",
    message: "Issue must state complexity (Trivial, Medium, High, or 100/150/200 points) matching suggested complexity.",
    fix: "Specify complexity matching the estimated scope.",
  },
  {
    id: "I7",
    title: "Scope Limits",
    message: "Issue scope must have fewer than 15 checklist items and under 1,200 words.",
    fix: "Split large issues into smaller tasks (< 15 items, < 1,200 words).",
  },
  {
    id: "S1",
    title: "State Change Authorization",
    message: "Soroban contract issues must specify who must authorize state changes.",
    fix: "Document authorization requirements (e.g. require_auth).",
  },
  {
    id: "S2",
    title: "Contract Tests",
    message: "Soroban contract issues must require tests.",
    fix: "Add test requirements (e.g. cargo test or unit tests).",
  },
  {
    id: "S3",
    title: "Contract Build and Size Verification",
    message: "Soroban contract issues should require 'stellar contract build' or a Wasm size check.",
    fix: "Require 'stellar contract build' or Wasm size check.",
  },
  {
    id: "F1",
    title: "UI Visual Verification",
    message: "UI/frontend issues should request screenshots or a recording.",
    fix: "Ask for screenshots or a screen recording in the pull request.",
  },
];
