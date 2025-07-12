const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // REPLACE this with your deployed address

  const logger = await ethers.getContractAt("AetherScopeLogger", contractAddress);

  const summary = "Scanned DAO Governance Proposal";
  const ipfsHash = "bafkreiewxriewse3n2cilxt3alm2vwatyvqdhcz3jcxyeewbz5cg66u7ke";

  const tx = await logger.reportAction(summary, ipfsHash);
  await tx.wait();

  console.log("✅ Action successfully reported!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});