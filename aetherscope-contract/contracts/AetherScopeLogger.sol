// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AetherScopeLogger {
    event ActionReported(
        address indexed agent,
        string summary,
        string ipfsHash,
        uint256 timestamp
    );

    function reportAction(string memory summary, string memory ipfsHash) public {
        emit ActionReported(msg.sender, summary, ipfsHash, block.timestamp);
    }
}
// This contract allows agents to report actions with a summary and an IPFS hash.
// The event ActionReported is emitted with the agent's address, summary, IPFS hash, and timestamp.
// The contract can be used to log actions in a decentralized manner, ensuring transparency and traceability.