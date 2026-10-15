import path from "node:path";
import type { CheckResult } from "../report.js";
import { fileExists, readTextFile } from "../util/fs.js";

const CANDIDATE_FILES = ["LICENSE", "LICENSE.md", "COPYING", "license", "license.md", "copying"];

interface LicensePattern {
  name: string;
  pattern: RegExp;
}

const LICENSE_PATTERNS: LicensePattern[] = [
  {
    name: "Apache-2.0",
    pattern: /Apache License,?\s+Version 2\.0|http:\/\/www\.apache\.org\/licenses\/LICENSE-2\.0|Apache License/i,
  },
  {
    name: "MIT",
    pattern: /MIT License|Permission is hereby granted, free of charge, to any person obtaining a copy/i,
  },
  {
    name: "BSD-2/3",
    pattern: /BSD [23]-Clause|Redistribution and use in source and binary forms|Neither the name of/i,
  },
  {
    name: "MPL-2.0",
    pattern: /Mozilla Public License,?\s+(v(ersion)?\.?\s*)?2\.0|MPL 2\.0/i,
  },
  {
    name: "GPL-3.0",
    pattern: /GNU General Public License,?\s+version 3|GNU GENERAL PUBLIC LICENSE|GPLv3/i,
  },
  {
    name: "LGPL",
    pattern: /GNU Lesser General Public License|GNU Library General Public License|Lesser General Public License|LGPL/i,
  },
];

export async function r1Check(root: string): Promise<CheckResult> {
  let foundFile: string | null = null;
  let fileContent: string | null = null;

  for (const candidate of CANDIDATE_FILES) {
    const fullPath = path.join(root, candidate);
    if (await fileExists(fullPath)) {
      foundFile = candidate;
      fileContent = await readTextFile(fullPath);
      break;
    }
  }

  if (!foundFile || fileContent === null) {
    return {
      id: "R1",
      title: "License Specification",
      status: "fail",
      message: "Missing LICENSE, LICENSE.md, or COPYING file.",
      fix: "Add an open-source license file (e.g. Apache-2.0 or MIT) in the repository root.",
    };
  }

  for (const { name, pattern } of LICENSE_PATTERNS) {
    if (pattern.test(fileContent)) {
      return {
        id: "R1",
        title: "License Specification",
        status: "pass",
        message: `Recognized ${name} license in ${foundFile}.`,
      };
    }
  }

  return {
    id: "R1",
    title: "License Specification",
    status: "warn",
    message: `Unrecognized license in ${foundFile}.`,
    fix: "Use a standard open-source license such as Apache-2.0, MIT, BSD-2/3, MPL-2.0, GPL-3.0, or LGPL.",
  };
}

r1Check.id = "R1";
r1Check.title = "License Specification";
r1Check.run = (root = ".") => r1Check(root);

export { r1Check as checkR1 };
