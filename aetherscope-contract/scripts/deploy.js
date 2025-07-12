const { ethers } = require("hardhat");

async function main() {
  const Logger = await ethers.getContractFactory("AetherScopeLogger");

  // Deploy the contract
  const logger = await Logger.deploy();

  // Wait for deployment to finish
  await logger.waitForDeployment(); // ✅ This is the correct method for Hardhat/Ethers v6+

  const deployedAddress = await logger.getAddress(); // Get the deployed address
  console.log("✅ AetherScopeLogger deployed to:", deployedAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
