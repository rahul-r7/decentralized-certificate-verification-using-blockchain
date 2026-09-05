const request = require("supertest");
const app = require("../src/server");
const Certificate = require("../src/models/Certificate");
const CertificateBatch = require("../src/models/CertificateBatch");
const Institution = require("../src/models/Institution");
const { uploadCertificate } = require("../src/services/ipfs.service");

describe("Certificate Public Student Download & View API Tests", () => {
  let demoInst, batchConfirmed, batchPending, batchRejected;

  beforeAll(async () => {
    // Create test institution
    demoInst = await Institution.create({
      name: "Test University",
      code: "TEST-UNI",
      email: "test@uni.edu",
      address: "Test Campus",
      status: "APPROVED",
    });

    // Create mock IPFS document
    const dummyCid = await uploadCertificate(Buffer.from("%PDF-1.4 Mock Certificate PDF Data"));

    // 1. Confirmed Batch
    batchConfirmed = await CertificateBatch.create({
      batchId: "BATCH-CONFIRMED-001",
      institutionId: demoInst._id,
      uploadedBy: demoInst._id,
      totalCertificates: 1,
      merkleRoot: "0x1111111111111111111111111111111111111111111111111111111111111111",
      status: "BLOCKCHAIN_CONFIRMED",
      blockchainTxHash: "0xabcdef1234567890",
    });

    await Certificate.create({
      registrationNumber: "TEST-REG-AVAILABLE",
      studentName: "Test Available Student",
      programme: "B.Tech CS",
      semester: "VIII",
      institutionId: demoInst._id,
      batchId: batchConfirmed.batchId,
      canonicalData: "TEST-REG-AVAILABLE|Test Available Student|B.Tech CS|VIII|A|TEST-UNI|Degree|2026-05-30",
      leafHash: "0x2222222222222222222222222222222222222222222222222222222222222222",
      merkleProof: [],
      ipfsCid: dummyCid,
      verificationUrl: "http://localhost:5173/verify/TEST-REG-AVAILABLE",
      qrData: "data:image/png;base64,dummy",
      status: "AVAILABLE",
    });

    // 2. Pending Batch
    batchPending = await CertificateBatch.create({
      batchId: "BATCH-PENDING-002",
      institutionId: demoInst._id,
      uploadedBy: demoInst._id,
      totalCertificates: 1,
      merkleRoot: "0x3333333333333333333333333333333333333333333333333333333333333333",
      status: "PENDING_COE_APPROVAL",
    });

    await Certificate.create({
      registrationNumber: "TEST-REG-PENDING",
      studentName: "Test Pending Student",
      programme: "B.Tech CS",
      semester: "VIII",
      institutionId: demoInst._id,
      batchId: batchPending.batchId,
      canonicalData: "TEST-REG-PENDING|Test Pending Student|B.Tech CS|VIII|A|TEST-UNI|Degree|2026-05-30",
      leafHash: "0x4444444444444444444444444444444444444444444444444444444444444444",
      merkleProof: [],
      ipfsCid: dummyCid,
      verificationUrl: "http://localhost:5173/verify/TEST-REG-PENDING",
      qrData: "data:image/png;base64,dummy",
      status: "PENDING_APPROVAL",
    });

    // 3. Rejected Batch
    batchRejected = await CertificateBatch.create({
      batchId: "BATCH-REJECTED-003",
      institutionId: demoInst._id,
      uploadedBy: demoInst._id,
      totalCertificates: 1,
      merkleRoot: "0x5555555555555555555555555555555555555555555555555555555555555555",
      status: "REJECTED",
    });

    await Certificate.create({
      registrationNumber: "TEST-REG-REJECTED",
      studentName: "Test Rejected Student",
      programme: "B.Tech CS",
      semester: "VIII",
      institutionId: demoInst._id,
      batchId: batchRejected.batchId,
      canonicalData: "TEST-REG-REJECTED|Test Rejected Student|B.Tech CS|VIII|A|TEST-UNI|Degree|2026-05-30",
      leafHash: "0x6666666666666666666666666666666666666666666666666666666666666666",
      merkleProof: [],
      ipfsCid: dummyCid,
      verificationUrl: "http://localhost:5173/verify/TEST-REG-REJECTED",
      qrData: "data:image/png;base64,dummy",
      status: "REJECTED",
    });
  });

  afterAll(async () => {
    await Certificate.deleteMany({ registrationNumber: { $regex: /^TEST-REG-/ } });
    await CertificateBatch.deleteMany({ batchId: { $regex: /^BATCH-/ } });
    await Institution.deleteOne({ code: "TEST-UNI" });
  });

  test("Test 1: Valid registration number in confirmed batch returns available download info", async () => {
    const res = await request(app).get("/api/certificates/download-info/TEST-REG-AVAILABLE");
    expect(res.statusCode).toEqual(200);
    expect(res.body.available).toBe(true);
    expect(res.body.status).toBe("AVAILABLE");
    expect(res.body.studentName).toBe("Test Available Student");
    expect(res.body.downloadUrl).toBe("/api/certificates/download/TEST-REG-AVAILABLE");
  });

  test("Test 2: Unknown registration number returns 404 NOT_FOUND", async () => {
    const res = await request(app).get("/api/certificates/download-info/UNKNOWN-REG-999");
    expect(res.statusCode).toEqual(404);
    expect(res.body.available).toBe(false);
    expect(res.body.code).toBe("NOT_FOUND");
  });

  test("Test 3: Certificate in PENDING batch returns available: false", async () => {
    const res = await request(app).get("/api/certificates/download-info/TEST-REG-PENDING");
    expect(res.statusCode).toEqual(200);
    expect(res.body.available).toBe(false);
    expect(res.body.code).toBe("DOWNLOAD_UNAVAILABLE");
  });

  test("Test 4: Certificate in REJECTED batch returns available: false", async () => {
    const res = await request(app).get("/api/certificates/download-info/TEST-REG-REJECTED");
    expect(res.statusCode).toEqual(200);
    expect(res.body.available).toBe(false);
    expect(res.body.code).toBe("DOWNLOAD_UNAVAILABLE");
  });

  test("Test 5: Inline view endpoint streams PDF with correct Content-Type header", async () => {
    const res = await request(app).get("/api/certificates/view/TEST-REG-AVAILABLE");
    expect(res.statusCode).toEqual(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.headers["content-disposition"]).toContain("inline");
  });

  test("Test 6: Attachment download endpoint streams PDF with attachment disposition header", async () => {
    const res = await request(app).get("/api/certificates/download/TEST-REG-AVAILABLE");
    expect(res.statusCode).toEqual(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.headers["content-disposition"]).toContain("attachment");
  });
});
