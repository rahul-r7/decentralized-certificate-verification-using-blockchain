const { expect } = require("chai");
const { ethers } = require("hardhat");
const crypto = require("crypto");

describe("AcademicCertificateRegistry Contract", function () {
  let Registry;
  let registry;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    Registry = await ethers.getContractFactory("AcademicCertificateRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });
  });

  describe("Batch Registration", function () {
    it("Should allow owner to register a valid batch", async function () {
      const batchId = "BATCH-2026-001";
      const institutionId = "INST-001";
      const merkleRoot = "0x" + crypto.createHash("sha256").update("test_merkle_root").digest("hex");

      const tx = await registry.registerBatch(batchId, institutionId, merkleRoot);
      await tx.wait();

      const batch = await registry.getBatch(merkleRoot);
      expect(batch.batchId).to.equal(batchId);
      expect(batch.institutionId).to.equal(institutionId);
      expect(batch.exists).to.equal(true);
      expect(batch.revoked).to.equal(false);
      expect(batch.timestamp).to.be.gt(0);
    });

    it("Should reject registration from non-owner accounts", async function () {
      const batchId = "BATCH-2026-002";
      const institutionId = "INST-001";
      const merkleRoot = "0x" + crypto.createHash("sha256").update("test_merkle_root_2").digest("hex");

      await expect(
        registry.connect(addr1).registerBatch(batchId, institutionId, merkleRoot)
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });

    it("Should reject duplicate Merkle roots", async function () {
      const batchId1 = "BATCH-2026-003";
      const batchId2 = "BATCH-2026-004";
      const institutionId = "INST-001";
      const merkleRoot = "0x" + crypto.createHash("sha256").update("duplicate_root").digest("hex");

      await registry.registerBatch(batchId1, institutionId, merkleRoot);

      await expect(
        registry.registerBatch(batchId2, institutionId, merkleRoot)
      ).to.be.revertedWith("Batch with this Merkle root already registered");
    });

    it("Should reject duplicate Batch IDs", async function () {
      const batchId = "BATCH-DUPLICATE";
      const institutionId = "INST-001";
      const merkleRoot1 = "0x" + crypto.createHash("sha256").update("root_1").digest("hex");
      const merkleRoot2 = "0x" + crypto.createHash("sha256").update("root_2").digest("hex");

      await registry.registerBatch(batchId, institutionId, merkleRoot1);

      await expect(
        registry.registerBatch(batchId, institutionId, merkleRoot2)
      ).to.be.revertedWith("Batch ID already registered");
    });

    it("Should reject zero Merkle root", async function () {
      const zeroRoot = ethers.ZeroHash;
      await expect(
        registry.registerBatch("BATCH-000", "INST-001", zeroRoot)
      ).to.be.revertedWith("Invalid Merkle root: zero root");
    });
  });

  describe("Batch Revocation", function () {
    it("Should allow owner to revoke a batch", async function () {
      const batchId = "BATCH-REVOKE";
      const institutionId = "INST-001";
      const merkleRoot = "0x" + crypto.createHash("sha256").update("revoke_test").digest("hex");

      await registry.registerBatch(batchId, institutionId, merkleRoot);
      await registry.revokeBatch(merkleRoot);

      const batch = await registry.getBatch(merkleRoot);
      expect(batch.revoked).to.equal(true);
    });
  });
});
