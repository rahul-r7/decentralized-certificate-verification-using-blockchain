# Core System Architecture

The **Decentralized Academic Certificate Verification System** implements a hybrid architecture separating off-chain high-capacity data storage from on-chain immutable trust anchors.

```mermaid
graph TD
    A[Examination Staff] -->|Upload CSV| B[Express Backend API]
    B -->|Canonical String SHA-256| C[Merkle Tree Service]
    B -->|Generate PDF + QR| D[PDF Service]
    D -->|Upload Final PDF| E[IPFS Storage Node / Fallback]
    E -->|Receive CID| B
    B -->|Store Metadata, Leaf Hashes, CIDs| F[(MongoDB Database)]
    
    G[Controller of Examinations] -->|Sign EIP-712 Message| B
    H[Registrar] -->|Sign EIP-712 Message| B
    
    B -->|Submit Merkle Root| I[AcademicCertificateRegistry Smart Contract]
    I -->|Store Batch & Root| J[Ethereum Blockchain]
    
    K[Public Verifier] -->|PDF / QR / RegNo| B
    B -->|Verify Proof against On-Chain Root| I
```

## Hybrid Data Responsibilities

1. **MongoDB**:
   - User credentials & RBAC roles
   - Institution onboarding records
   - Certificate metadata, registration numbers, canonical strings
   - Certificate SHA-256 leaf hashes & Merkle proof arrays
   - IPFS CIDs & local PDF paths
   - EIP-712 approval signatures
   - Immutable audit logs & public verification logs

2. **IPFS**:
   - Stores ONLY final generated certificate PDF documents (CID referenced in MongoDB).

3. **Ethereum Blockchain (Hardhat)**:
   - Stores ONLY immutable batch records (`merkleRoot`, `batchId`, `institutionId`, `timestamp`, `exists`, `revoked`).
