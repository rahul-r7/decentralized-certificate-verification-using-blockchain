# REST API Documentation

Base URL: `http://localhost:5000/api`

## Authentication (`/api/auth`)
- `POST /api/auth/login`: Authenticate user and receive JWT access token.
- `GET /api/auth/me`: Get current authenticated user profile.
- `POST /api/auth/logout`: Logout session.
- `POST /api/auth/change-password`: Change password.

## Institutions (`/api/institutions`)
- `POST /api/institutions/onboard`: Submit public university onboarding request.
- `GET /api/institutions`: List institutions (Super Admin).
- `GET /api/institutions/:id`: Get institution details.
- `PATCH /api/institutions/:id/approve`: Approve onboarding request (Super Admin).
- `PATCH /api/institutions/:id/reject`: Reject onboarding request.

## Users (`/api/users`)
- `POST /api/users`: Create authorized user (Super Admin).
- `GET /api/users`: List users.
- `PATCH /api/users/:id`: Update user role or wallet address.

## Batches (`/api/batches`)
- `POST /api/batches/upload`: Upload CSV dataset, generate PDFs, IPFS upload, Merkle tree construction.
- `GET /api/batches`: List certificate batches.
- `GET /api/batches/:batchId`: Retrieve batch details + certificate list.
- `POST /api/batches/:batchId/reject`: Reject batch.

## Approvals (`/api/batches/:batchId/approvals`)
- `GET /api/batches/:batchId/approvals`: Get batch approvals.
- `POST /api/batches/:batchId/signature`: Submit EIP-712 signature (CoE / Registrar).

## Public Verification (`/api/verify`) - NO LOGIN REQUIRED
- `GET /api/verify/registration/:registrationNumber`: Public verification by registration number.
- `GET /api/verify/qr/:registrationNumber`: QR scan verification.
- `POST /api/verify/pdf`: Upload PDF certificate for cryptographic & on-chain verification.

## Audit Logs (`/api/audit-logs`)
- `GET /api/audit-logs`: Query system activity audit log entries (Super Admin).
