const {
  createCanonicalString,
  createLeafHash,
  buildMerkleTree,
  getMerkleRoot,
  getMerkleProof,
  verifyMerkleProof,
} = require("../src/services/merkle.service");

describe("Merkle Service Cryptographic Unit Tests", () => {
  const dummyCertificates = [
    {
      registrationNumber: "REG-001",
      studentName: "Alice Smith",
      programme: "B.Tech Computer Science",
      semester: "8",
      grade: "A+",
      institutionId: "INST-001",
      certificateType: "Degree",
      issueDate: "2026-05-30",
    },
    {
      registrationNumber: "REG-002",
      studentName: "Bob Jones",
      programme: "B.Tech Electrical Engineering",
      semester: "8",
      grade: "A",
      institutionId: "INST-001",
      certificateType: "Degree",
      issueDate: "2026-05-30",
    },
    {
      registrationNumber: "REG-003",
      studentName: "Charlie Brown",
      programme: "M.Tech Data Science",
      semester: "4",
      grade: "O",
      institutionId: "INST-001",
      certificateType: "Degree",
      issueDate: "2026-05-30",
    },
  ];

  test("Canonical string generation is deterministic and normalized", () => {
    const cert = dummyCertificates[0];
    const canonical = createCanonicalString(cert);
    expect(canonical).toBe(
      "REG-001|Alice Smith|B.Tech Computer Science|8|A+|INST-001|Degree|2026-05-30"
    );
  });

  test("Merkle Tree generation with 1 certificate", () => {
    const leaf = createLeafHash(dummyCertificates[0]);
    const tree = buildMerkleTree([leaf]);
    const root = getMerkleRoot(tree);
    expect(root).toBe("0x" + leaf.toLowerCase());

    const proof = getMerkleProof(tree, 0);
    expect(proof).toEqual([]);
    expect(verifyMerkleProof(leaf, proof, root)).toBe(true);
  });

  test("Merkle Tree generation with 2 certificates", () => {
    const leaves = dummyCertificates.slice(0, 2).map(createLeafHash);
    const tree = buildMerkleTree(leaves);
    const root = getMerkleRoot(tree);
    expect(root).toBeDefined();

    const proof0 = getMerkleProof(tree, 0);
    const proof1 = getMerkleProof(tree, 1);

    expect(verifyMerkleProof(leaves[0], proof0, root)).toBe(true);
    expect(verifyMerkleProof(leaves[1], proof1, root)).toBe(true);
  });

  test("Merkle Tree generation with 3 certificates (odd leaf duplication handling)", () => {
    const leaves = dummyCertificates.map(createLeafHash);
    const tree = buildMerkleTree(leaves);
    const root = getMerkleRoot(tree);

    leaves.forEach((leaf, idx) => {
      const proof = getMerkleProof(tree, idx);
      expect(verifyMerkleProof(leaf, proof, root)).toBe(true);
    });
  });

  test("Merkle Tree generation with 10 certificates", () => {
    const tenCerts = Array.from({ length: 10 }, (_, i) => ({
      registrationNumber: `REG-10${i}`,
      studentName: `Student ${i}`,
      programme: "Computer Science",
      semester: "8",
      grade: "A",
      institutionId: "INST-001",
      certificateType: "Degree",
      issueDate: "2026-05-30",
    }));

    const leaves = tenCerts.map(createLeafHash);
    const tree = buildMerkleTree(leaves);
    const root = getMerkleRoot(tree);

    leaves.forEach((leaf, idx) => {
      const proof = getMerkleProof(tree, idx);
      expect(verifyMerkleProof(leaf, proof, root)).toBe(true);
    });
  });

  test("Tampered certificate leaf hash fails verification against original Merkle Root", () => {
    const leaves = dummyCertificates.map(createLeafHash);
    const tree = buildMerkleTree(leaves);
    const root = getMerkleRoot(tree);

    const tamperedCert = { ...dummyCertificates[0], studentName: "Tampered Alice" };
    const tamperedLeaf = createLeafHash(tamperedCert);

    const originalProof = getMerkleProof(tree, 0);
    expect(verifyMerkleProof(tamperedLeaf, originalProof, root)).toBe(false);
  });
});
