# Cryptographic Merkle Tree Design

## Canonical Data Format

To guarantee deterministic hashing, certificate fields are normalized before hashing:

```
canonicalString = registrationNumber | studentName | programme | semester | grade | institutionId | certificateType | issueDate
```

Example:
`REG-2026-CS001|Aarav Patel|Bachelor of Technology|Semester VIII|A+|NIT-001|Degree|2026-05-30`

## SHA-256 Hashing Process

1. `leafHash = SHA256(canonicalString)`
2. Standard 64-character lowercase hex string representation.

## Odd-Leaf Duplication Strategy

When building Merkle Tree levels:
- If a level has an odd number of leaf/branch nodes, duplicate the final node in the array before computing parent hashes.
- Sibling pairs `(left, right)` are combined deterministically:
  - If `left <= right`, `parent = SHA256(left + right)`
  - Otherwise, `parent = SHA256(right + left)`
- Matches Solidity `verifyLeaf` on-chain verification function exact behavior.
