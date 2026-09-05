// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AcademicCertificateRegistry
 * @dev Stores immutable Merkle Roots for approved academic certificate batches.
 */
contract AcademicCertificateRegistry is Ownable {
    struct Batch {
        bytes32 merkleRoot;
        string batchId;
        string institutionId;
        uint256 timestamp;
        bool exists;
        bool revoked;
    }

    // Mapping from Merkle Root -> Batch structure
    mapping(bytes32 => Batch) private _batches;
    
    // Mapping from Batch ID -> Merkle Root (for quick lookup by Batch ID)
    mapping(string => bytes32) private _batchIdToRoot;

    // Events
    event BatchRegistered(
        bytes32 indexed merkleRoot,
        string batchId,
        string institutionId,
        uint256 timestamp
    );

    event BatchRevoked(
        bytes32 indexed merkleRoot,
        uint256 timestamp
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Register an approved certificate batch Merkle Root.
     * @param _batchId Unique batch identifier
     * @param _institutionId Unique institution code/ID
     * @param _merkleRoot Merkle root computed from certificate leaf hashes
     */
    function registerBatch(
        string calldata _batchId,
        string calldata _institutionId,
        bytes32 _merkleRoot
    ) external onlyOwner {
        require(_merkleRoot != bytes32(0), "Invalid Merkle root: zero root");
        require(bytes(_batchId).length > 0, "Invalid batch ID: empty string");
        require(bytes(_institutionId).length > 0, "Invalid institution ID: empty string");
        require(!_batches[_merkleRoot].exists, "Batch with this Merkle root already registered");
        require(_batchIdToRoot[_batchId] == bytes32(0), "Batch ID already registered");

        Batch memory newBatch = Batch({
            merkleRoot: _merkleRoot,
            batchId: _batchId,
            institutionId: _institutionId,
            timestamp: block.timestamp,
            exists: true,
            revoked: false
        });

        _batches[_merkleRoot] = newBatch;
        _batchIdToRoot[_batchId] = _merkleRoot;

        emit BatchRegistered(_merkleRoot, _batchId, _institutionId, block.timestamp);
    }

    /**
     * @dev Revoke a certificate batch in case of institutional error or fraud.
     * @param _merkleRoot Merkle root of the batch to revoke
     */
    function revokeBatch(bytes32 _merkleRoot) external onlyOwner {
        require(_batches[_merkleRoot].exists, "Batch does not exist");
        require(!_batches[_merkleRoot].revoked, "Batch already revoked");

        _batches[_merkleRoot].revoked = true;

        emit BatchRevoked(_merkleRoot, block.timestamp);
    }

    /**
     * @dev Retrieve batch metadata by Merkle Root.
     */
    function getBatch(bytes32 _merkleRoot)
        external
        view
        returns (
            string memory batchId,
            string memory institutionId,
            uint256 timestamp,
            bool exists,
            bool revoked
        )
    {
        Batch memory b = _batches[_merkleRoot];
        return (b.batchId, b.institutionId, b.timestamp, b.exists, b.revoked);
    }

    /**
     * @dev Retrieve Merkle Root by Batch ID.
     */
    function getMerkleRootByBatchId(string calldata _batchId) external view returns (bytes32) {
        return _batchIdToRoot[_batchId];
    }

    /**
     * @dev Check if a Merkle Root exists on-chain.
     */
    function batchExists(bytes32 _merkleRoot) external view returns (bool) {
        return _batches[_merkleRoot].exists;
    }

    /**
     * @dev Pure helper function to verify a SHA-256 Merkle Proof on-chain.
     * @param _leaf Canonical leaf hash
     * @param _proof Array of sibling hashes in the Merkle proof
     * @param _merkleRoot Target Merkle root
     */
    function verifyLeaf(
        bytes32 _leaf,
        bytes32[] calldata _proof,
        bytes32 _merkleRoot
    ) external pure returns (bool) {
        bytes32 computedHash = _leaf;

        for (uint256 i = 0; i < _proof.length; i++) {
            bytes32 proofElement = _proof[i];

            if (computedHash <= proofElement) {
                // Hash(current + sibling)
                computedHash = sha256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Hash(sibling + current)
                computedHash = sha256(abi.encodePacked(proofElement, computedHash));
            }
        }

        return computedHash == _merkleRoot;
    }
}
