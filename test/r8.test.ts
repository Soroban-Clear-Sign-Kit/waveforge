import { describe, it, expect } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { Contract, StrKey, xdr } from "@stellar/stellar-sdk";
import { r8Check, type RpcClientLike } from "../src/repo/r8.js";
import { runRepoChecks } from "../src/repo/index.js";

function makeContractId(seed = 1): string {
  const bytes = new Uint8Array(32);
  bytes.fill(seed & 0xff);
  return StrKey.encodeContract(bytes);
}

function makeContractInstanceEntry(
  contractId: string,
  executable: xdr.ContractExecutable,
): { key: xdr.LedgerKey; val: xdr.LedgerEntryData } {
  const contract = new Contract(contractId);
  const key = xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: contract.address().toScAddress(),
      key: xdr.ScVal.scvLedgerKeyContractInstance(),
      durability: xdr.ContractDataDurability.persistent,
    }),
  );

  const instance = new xdr.ScContractInstance({
    executable,
    storage: null,
  });

  const entry = new xdr.ContractDataEntry({
    ext: xdr.ExtensionPoint.v0(),
    contract: contract.address().toScAddress(),
    key: xdr.ScVal.scvLedgerKeyContractInstance(),
    durability: xdr.ContractDataDurability.persistent,
    val: xdr.ScVal.scvContractInstance(instance),
  });

  const val = xdr.LedgerEntryData.contractData(entry);
  return { key, val };
}

describe("R8 - On-chain contract ID check", () => {
  it("returns skipped when no contract IDs are found and no Soroban crates present", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "waveforge-r8-none-"));
    try {
      await fs.writeFile(path.join(tmpDir, "README.md"), "# Test Repo\nNo contracts here.\n");
      const res = await r8Check(tmpDir, { sorobanCratesFound: false });
      expect(res.id).toBe("R8");
      expect(res.status).toBe("skipped");
      expect(res.message).toContain("No contract IDs found");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("returns warn when no contract IDs are found but Soroban crates are present", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "waveforge-r8-soroban-"));
    try {
      await fs.writeFile(path.join(tmpDir, "README.md"), "# Smart Contract Repo\n");
      const res = await r8Check(tmpDir, { sorobanCratesFound: true });
      expect(res.id).toBe("R8");
      expect(res.status).toBe("warn");
      expect(res.message).toContain("despite Soroban crates present");
      expect(res.fix).toBeDefined();
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("warns on candidate matching regex with invalid StrKey checksum", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "waveforge-r8-invalid-"));
    try {
      // 56 chars starting with C and base32 alphabet, but invalid checksum
      const invalidStrKey = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
      await fs.writeFile(
        path.join(tmpDir, "README.md"),
        `# Project\nContract deployed at \`${invalidStrKey}\` on testnet.\n`,
      );

      const res = await r8Check(tmpDir);
      expect(res.id).toBe("R8");
      expect(res.status).toBe("warn");
      expect(res.message).toContain("Invalid contract ID StrKey");
      expect(res.evidence).toBeDefined();
      expect(res.evidence![0]).toContain(invalidStrKey);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("returns skipped when --offline is set even if contract IDs exist", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "waveforge-r8-offline-"));
    try {
      const contractId = makeContractId(42);
      await fs.writeFile(path.join(tmpDir, "README.md"), `Contract: ${contractId}\n`);

      const res = await r8Check(tmpDir, { offline: true });
      expect(res.id).toBe("R8");
      expect(res.status).toBe("skipped");
      expect(res.message).toContain("offline mode");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("returns skipped on mainnet when no --rpc-url is provided", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "waveforge-r8-mainnet-"));
    try {
      const contractId = makeContractId(99);
      await fs.writeFile(path.join(tmpDir, "README.md"), `Contract: ${contractId}\n`);

      const res = await r8Check(tmpDir, { network: "mainnet" });
      expect(res.id).toBe("R8");
      expect(res.status).toBe("skipped");
      expect(res.message).toContain("Mainnet requires --rpc-url");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("verifies live Wasm contract via fake RPC with real XDR", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "waveforge-r8-live-wasm-"));
    try {
      const contractId = makeContractId(10);
      await fs.writeFile(
        path.join(tmpDir, "README.md"),
        `# Live Protocol\nContract address: \`${contractId}\`\n`,
      );

      const wasmHashBytes = new Uint8Array(32).fill(0xee);
      const hexHash = Buffer.from(wasmHashBytes).toString("hex");
      const exec = xdr.ContractExecutable.contractExecutableWasm(wasmHashBytes);
      const entry = makeContractInstanceEntry(contractId, exec);

      const fakeRpc: RpcClientLike = {
        async getLedgerEntries() {
          return {
            latestLedger: 10000,
            entries: [
              {
                key: entry.key,
                val: entry.val,
                liveUntilLedgerSeq: 20000,
                lastModifiedLedgerSeq: 5000,
              },
            ],
          };
        },
      };

      const res = await r8Check(tmpDir, { rpc: fakeRpc });
      expect(res.id).toBe("R8");
      expect(res.status).toBe("pass");
      expect(res.message).toContain("verified on testnet");
      expect(res.evidence).toBeDefined();
      expect(res.evidence![0]).toContain(contractId);
      expect(res.evidence![0]).toContain(`Wasm hash ${hexHash}`);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("verifies live Stellar Asset Contract (SAC) via fake RPC with real XDR", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "waveforge-r8-live-sac-"));
    try {
      const contractId = makeContractId(20);
      await fs.mkdir(path.join(tmpDir, "docs"), { recursive: true });
      await fs.writeFile(
        path.join(tmpDir, "docs", "contracts.md"),
        `SAC wrapper: ${contractId}\n`,
      );

      const exec = xdr.ContractExecutable.contractExecutableStellarAsset();
      const entry = makeContractInstanceEntry(contractId, exec);

      const fakeRpc: RpcClientLike = {
        async getLedgerEntries() {
          return {
            latestLedger: 10000,
            entries: [
              {
                key: entry.key,
                val: entry.val,
                liveUntilLedgerSeq: 20000,
              },
            ],
          };
        },
      };

      const res = await r8Check(tmpDir, { rpc: fakeRpc });
      expect(res.id).toBe("R8");
      expect(res.status).toBe("pass");
      expect(res.evidence).toBeDefined();
      expect(res.evidence![0]).toContain("Stellar Asset Contract");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("warns when contract is archived on-chain", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "waveforge-r8-archived-"));
    try {
      const contractId = makeContractId(30);
      await fs.writeFile(path.join(tmpDir, "README.md"), `Contract: ${contractId}\n`);

      const wasmHashBytes = new Uint8Array(32).fill(0x33);
      const exec = xdr.ContractExecutable.contractExecutableWasm(wasmHashBytes);
      const entry = makeContractInstanceEntry(contractId, exec);

      const fakeRpc: RpcClientLike = {
        async getLedgerEntries() {
          return {
            latestLedger: 30000,
            entries: [
              {
                key: entry.key,
                val: entry.val,
                liveUntilLedgerSeq: 25000, // expired/archived because < latestLedger
              },
            ],
          };
        },
      };

      const res = await r8Check(tmpDir, { rpc: fakeRpc });
      expect(res.id).toBe("R8");
      expect(res.status).toBe("warn");
      expect(res.message).toContain("archived on testnet");
      expect(res.evidence![0]).toContain("archived");
      expect(res.fix).toContain("Restore archived contract");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("fails when contract is not found on-chain", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "waveforge-r8-notfound-"));
    try {
      const contractId = makeContractId(40);
      await fs.writeFile(path.join(tmpDir, "README.md"), `Contract: ${contractId}\n`);

      const fakeRpc: RpcClientLike = {
        async getLedgerEntries() {
          return {
            latestLedger: 10000,
            entries: [], // not found
          };
        },
      };

      const res = await r8Check(tmpDir, { rpc: fakeRpc });
      expect(res.id).toBe("R8");
      expect(res.status).toBe("fail");
      expect(res.message).toContain("not found on testnet");
      expect(res.evidence![0]).toContain("not found on testnet");
      expect(res.fix).toContain("Deploy contracts");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("handles batch getLedgerEntries with multiple contracts across README and docs", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "waveforge-r8-batch-"));
    try {
      const id1 = makeContractId(51);
      const id2 = makeContractId(52);
      await fs.writeFile(path.join(tmpDir, "README.md"), `Core contract: ${id1}\n`);
      await fs.mkdir(path.join(tmpDir, "docs"), { recursive: true });
      await fs.writeFile(path.join(tmpDir, "docs", "deployments.md"), `Token contract: ${id2}\n`);

      const exec1 = xdr.ContractExecutable.contractExecutableWasm(new Uint8Array(32).fill(0x11));
      const entry1 = makeContractInstanceEntry(id1, exec1);

      const exec2 = xdr.ContractExecutable.contractExecutableStellarAsset();
      const entry2 = makeContractInstanceEntry(id2, exec2);

      let requestedKeysCount = 0;
      const fakeRpc: RpcClientLike = {
        async getLedgerEntries(...keys) {
          requestedKeysCount = keys.length;
          return {
            latestLedger: 10000,
            entries: [
              { key: entry1.key, val: entry1.val, liveUntilLedgerSeq: 20000 },
              { key: entry2.key, val: entry2.val, liveUntilLedgerSeq: 20000 },
            ],
          };
        },
      };

      const res = await r8Check(tmpDir, { rpc: fakeRpc });
      expect(requestedKeysCount).toBe(2);
      expect(res.status).toBe("pass");
      expect(res.message).toContain("All 2 contract ID(s) verified");
      expect(res.evidence).toHaveLength(2);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("marks check skipped when RPC call fails or times out", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "waveforge-r8-rpcfail-"));
    try {
      const contractId = makeContractId(60);
      await fs.writeFile(path.join(tmpDir, "README.md"), `Contract: ${contractId}\n`);

      const failingRpc: RpcClientLike = {
        async getLedgerEntries() {
          throw new Error("ETIMEDOUT: Connection to RPC server timed out");
        },
      };

      const res = await r8Check(tmpDir, { rpc: failingRpc });
      expect(res.id).toBe("R8");
      expect(res.status).toBe("skipped");
      expect(res.message).toContain("RPC failure: ETIMEDOUT");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("wires R8 correctly into runRepoChecks", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "waveforge-r8-runner-"));
    try {
      const contractId = makeContractId(70);
      await fs.writeFile(
        path.join(tmpDir, "README.md"),
        `# Wave Project\nStellar smart contract protocol.\n\n## Getting Started\nInstall dependencies.\nContract: ${contractId}\n`,
      );
      await fs.writeFile(
        path.join(tmpDir, "LICENSE"),
        "Apache License\nVersion 2.0, January 2004\nhttp://www.apache.org/licenses/\n",
      );

      const exec = xdr.ContractExecutable.contractExecutableWasm(new Uint8Array(32).fill(0x77));
      const entry = makeContractInstanceEntry(contractId, exec);

      const fakeRpc: RpcClientLike = {
        async getLedgerEntries() {
          return {
            latestLedger: 50000,
            entries: [
              { key: entry.key, val: entry.val, liveUntilLedgerSeq: 90000 },
            ],
          };
        },
      };

      const report = await runRepoChecks(tmpDir, { rpc: fakeRpc });
      const r8Result = report.results.find((r) => r.id === "R8");
      expect(r8Result).toBeDefined();
      expect(r8Result?.status).toBe("pass");
      expect(r8Result?.evidence![0]).toContain("Wasm hash");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  // Integration test skipped unless RUN_INTEGRATION=1
  it.skipIf(!process.env.RUN_INTEGRATION)(
    "checks TESTNET_CONTRACT_ID from environment on real Stellar testnet",
    async () => {
      const testnetContractId = process.env.TESTNET_CONTRACT_ID;
      if (!testnetContractId) {
        console.warn("RUN_INTEGRATION is enabled, but TESTNET_CONTRACT_ID is not set in env.");
        return;
      }

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "waveforge-r8-integration-"));
      try {
        await fs.writeFile(
          path.join(tmpDir, "README.md"),
          `# Integration Test\nVerified contract: ${testnetContractId}\n`,
        );

        const res = await r8Check(tmpDir, { network: "testnet" });
        expect(res.id).toBe("R8");
        expect(["pass", "warn", "skipped"]).toContain(res.status);
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    },
  );
});
