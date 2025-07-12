const hre = require("hardhat");

async function main() {
  const Logger = await hre.ethers.getContractFactory("AetherScopeLogger");
  const logger = await Logger.deploy();
  await logger.deployed();

  console.log(`Contract deployed at: ${logger.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
