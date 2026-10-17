import { promises as fs } from "node:fs";
import path from "node:path";
import {
  Contract,
  StrKey,
  rpc,
  xdr,
} from "@stellar/stellar-sdk";
import type { CheckResult } from "../report.js";
import { dirExists, fileExists, readTextFile } from "../util/fs.js";
import { r7Check } from "./r7.js";

export interface RpcClientLike {
  getLedgerEntries(...keys: xdr.LedgerKey[]): Promise<{
    latestLedger: number;
    entries: Array<{
      key: xdr.LedgerKey;
      val: xdr.LedgerEntryData;
      liveUntilLedgerSeq?: number;
      lastModifiedLedgerSeq?: number;
    }>;
  }>;
}

export interface R8CheckOptions {
  offline?: boolean;
  network?: string;
  rpcUrl?: string;
  rpc?: RpcClientLike;
  sorobanCratesFound?: boolean;
}

interface CandidateContractId {
  id: string;
  file: string;
  line: number;
}

async function findCandidateContractIds(root: string): Promise<CandidateContractId[]> {
  const candidates: CandidateContractId[] = [];
  const filesToScan: string[] = [];

  const readmePath = path.join(root, "README.md");
  if (await fileExists(readmePath)) {
    filesToScan.push(readmePath);
  }

  const docsDir = path.join(root, "docs");
  if (await dirExists(docsDir)) {
    try {
      const entries = await fs.readdir(docsDir);
      for (const entry of entries) {
        if (entry.endsWith(".md")) {
          filesToScan.push(path.join(docsDir, entry));
        }
      }
    } catch {
      // ignore unreadable docs directory
    }
  }

  const regex = /\bC[A-Z2-7]{55}\b/g;

  for (const filePath of filesToScan) {
    const content = await readTextFile(filePath);
    if (!content) continue;
    const relFile = path.relative(root, filePath).replace(/\\/g, "/");
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i]!;
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(lineText)) !== null) {
        candidates.push({
          id: match[0],
          file: relFile,
          line: i + 1,
        });
      }
    }
  }

  return candidates;
}

export async function r8Check(root = ".", options: R8CheckOptions = {}): Promise<CheckResult> {
  const candidates = await findCandidateContractIds(root);

  // Group candidates into valid and invalid StrKey
  const invalidCandidates: CandidateContractId[] = [];
  const validIdsMap = new Map<string, CandidateContractId[]>();

  for (const candidate of candidates) {
    if (!StrKey.isValidContract(candidate.id)) {
      invalidCandidates.push(candidate);
    } else {
      const existing = validIdsMap.get(candidate.id) ?? [];
      existing.push(candidate);
      validIdsMap.set(candidate.id, existing);
    }
  }

  // Handle case with no candidate IDs found
  if (candidates.length === 0) {
    let sorobanFound = options.sorobanCratesFound;
    if (sorobanFound === undefined) {
      const r7Result = await r7Check(root);
      sorobanFound = r7Result.status !== "skipped";
    }

    if (sorobanFound) {
      return {
        id: "R8",
        title: "On-Chain Contract Verification",
        status: "warn",
        message: "No contract IDs found in README.md or docs/*.md despite Soroban crates present.",
        fix: "Document deployed contract IDs in README.md or docs/.",
      };
    }

    return {
      id: "R8",
      title: "On-Chain Contract Verification",
      status: "skipped",
      message: "No contract IDs found in README.md or docs/*.md.",
      fix: "Document deployed contract IDs in README.md or docs/ when deployed.",
    };
  }

  // If there are only invalid StrKey candidates
  if (validIdsMap.size === 0 && invalidCandidates.length > 0) {
    return {
      id: "R8",
      title: "On-Chain Contract Verification",
      status: "warn",
      message: `Invalid contract ID StrKey checksum found: ${invalidCandidates.map((c) => `${c.id} (${c.file}:${c.line})`).join(", ")}.`,
      evidence: invalidCandidates.map((c) => `Invalid StrKey: ${c.id} at ${c.file}:${c.line}`),
      fix: "Ensure contract IDs in README.md and docs/*.md are valid StrKey-encoded Soroban contract addresses (C...).",
    };
  }

  // Offline check
  if (options.offline) {
    return {
      id: "R8",
      title: "On-Chain Contract Verification",
      status: "skipped",
      message: "On-chain contract verification skipped in offline mode.",
      fix: "Run without --offline to verify contract IDs on-chain.",
    };
  }

  const network = options.network ?? "testnet";

  // Mainnet requires explicit --rpc-url
  if (network === "mainnet" && !options.rpcUrl && !options.rpc) {
    return {
      id: "R8",
      title: "On-Chain Contract Verification",
      status: "skipped",
      message: "Mainnet requires --rpc-url (no default mainnet URL).",
      evidence: ["Stellar mainnet has no default public RPC endpoint. Specify --rpc-url <url>."],
      fix: "Pass an explicit Soroban RPC URL using --rpc-url <url> when targeting mainnet.",
    };
  }

  const rpcUrl = options.rpcUrl ?? (network === "testnet" ? "https://soroban-testnet.stellar.org" : undefined);
  if (!rpcUrl && !options.rpc) {
    return {
      id: "R8",
      title: "On-Chain Contract Verification",
      status: "skipped",
      message: `No RPC URL configured for network '${network}'.`,
      fix: "Specify an RPC endpoint using --rpc-url <url>.",
    };
  }

  // Build contract instance ledger keys
  const validIds = Array.from(validIdsMap.keys());
  const keyMap = new Map<string, xdr.LedgerKey>();
  const keys: xdr.LedgerKey[] = [];

  for (const id of validIds) {
    const contract = new Contract(id);
    const key = xdr.LedgerKey.contractData(
      new xdr.LedgerKeyContractData({
        contract: contract.address().toScAddress(),
        key: xdr.ScVal.scvLedgerKeyContractInstance(),
        durability: xdr.ContractDataDurability.persistent,
      }),
    );
    keyMap.set(id, key);
    keys.push(key);
  }

  // Call getLedgerEntries in one batch with 10s timeout
  let response: {
    latestLedger: number;
    entries: Array<{
      key: xdr.LedgerKey;
      val: xdr.LedgerEntryData;
      liveUntilLedgerSeq?: number;
      lastModifiedLedgerSeq?: number;
    }>;
  };

  try {
    if (options.rpc) {
      response = await options.rpc.getLedgerEntries(...keys);
    } else {
      const server = new rpc.Server(rpcUrl!, { timeout: 10000, allowHttp: true });
      response = await server.getLedgerEntries(...keys);
    }
  } catch (err) {
    return {
      id: "R8",
      title: "On-Chain Contract Verification",
      status: "skipped",
      message: `On-chain verification skipped due to RPC failure: ${err instanceof Error ? err.message : String(err)}`,
      evidence: [err instanceof Error ? err.message : String(err)],
      fix: "Verify RPC network connectivity and endpoint status, or rerun with --offline.",
    };
  }

  const notFoundIds: string[] = [];
  const archivedIds: string[] = [];
  const verifiedIds: string[] = [];
  const evidence: string[] = [];

  for (const id of validIds) {
    const targetKeyXdr = keyMap.get(id)!.toXdr("base64");
    const entry = response.entries?.find((e) => e.key.toXdr("base64") === targetKeyXdr);

    if (!entry) {
      notFoundIds.push(id);
      evidence.push(`${id}: not found on ${network}`);
    } else if (
      entry.liveUntilLedgerSeq !== undefined &&
      (entry.liveUntilLedgerSeq < response.latestLedger || entry.liveUntilLedgerSeq === 0)
    ) {
      archivedIds.push(id);
      evidence.push(
        `${id}: archived (liveUntilLedgerSeq: ${entry.liveUntilLedgerSeq} < latestLedger: ${response.latestLedger})`,
      );
    } else {
      let evidenceStr = "exists";
      try {
        const contractDataEntry = entry.val.value as xdr.ContractDataEntry;
        const scv = contractDataEntry.val;
        if (scv.type === "scvContractInstance") {
          const instance = scv.value as xdr.ScContractInstance;
          const exec = instance.executable;
          if (exec.type === "contractExecutableWasm") {
            const hashBytes = exec.wasmHash.value;
            const hex = Buffer.from(hashBytes).toString("hex");
            evidenceStr = `Wasm hash ${hex}`;
          } else if (exec.type === "contractExecutableStellarAsset") {
            evidenceStr = "Stellar Asset Contract";
          } else if (exec.type === "contractExecutableExternalRef") {
            evidenceStr = "External executable reference";
          }
        }
      } catch {
        evidenceStr = "Contract instance verified";
      }
      verifiedIds.push(id);
      evidence.push(`${id}: ${evidenceStr}`);
    }
  }

  if (invalidCandidates.length > 0) {
    for (const c of invalidCandidates) {
      evidence.push(`Invalid StrKey: ${c.id} (${c.file}:${c.line})`);
    }
  }

  if (notFoundIds.length > 0) {
    return {
      id: "R8",
      title: "On-Chain Contract Verification",
      status: "fail",
      message: `${notFoundIds.length} contract ID(s) not found on ${network}.`,
      evidence,
      fix: "Deploy contracts to the target network or update contract IDs in README.md and docs.",
    };
  }

  if (archivedIds.length > 0) {
    return {
      id: "R8",
      title: "On-Chain Contract Verification",
      status: "warn",
      message: `${archivedIds.length} contract ID(s) archived on ${network}.`,
      evidence,
      fix: "Restore archived contract instances with a restore transaction or bump contract TTL.",
    };
  }

  if (invalidCandidates.length > 0) {
    return {
      id: "R8",
      title: "On-Chain Contract Verification",
      status: "warn",
      message: `Found ${invalidCandidates.length} invalid contract ID StrKey(s).`,
      evidence,
      fix: "Correct invalid StrKey contract IDs in README.md and docs/*.md.",
    };
  }

  return {
    id: "R8",
    title: "On-Chain Contract Verification",
    status: "pass",
    message: `All ${verifiedIds.length} contract ID(s) verified on ${network}.`,
    evidence,
  };
}

r8Check.id = "R8";
r8Check.title = "On-Chain Contract Verification";
r8Check.run = (root = ".", options: R8CheckOptions = {}) => r8Check(root, options);

export { r8Check as checkR8 };
