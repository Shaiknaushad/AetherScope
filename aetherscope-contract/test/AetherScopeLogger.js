const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AetherScopeLogger", function () {
  let Logger, logger, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    Logger = await ethers.getContractFactory("AetherScopeLogger");
    logger = await Logger.deploy(); // No .deployed()
  });

  it("should emit ActionReported event when reportAction is called", async function () {
    const tx = await logger.connect(addr1).reportAction("Test summary", "QmFakeIpfsHash");

    await expect(tx)
      .to.emit(logger, "ActionReported")
      .withArgs(
        addr1.address,
        "Test summary",
        "QmFakeIpfsHash",
        await getLatestTimestamp(tx)
      );
  });
});

async function getLatestTimestamp(tx) {
  const receipt = await tx.wait();
  const block = await ethers.provider.getBlock(receipt.blockNumber);
  return block.timestamp;
}
