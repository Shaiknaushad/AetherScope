require("dotenv").config();
const { JsonRpcProvider } = require("ethers");
const { Contract } = require("ethers");
const fs = require("fs");
const axios = require("axios");

// Load ABI
const abi = require("./AetherScopeLoggerABI.json");

// Load env variables
const provider = new JsonRpcProvider(process.env.RPC_URL);
const contract = new Contract(process.env.CONTRACT_ADDRESS, abi, provider);

// Listen for ActionReported events
contract.on("ActionReported", async (agent, summary, ipfsHash, timestamp) => {
  console.log("👂 Listening for ActionReported events on:", process.env.CONTRACT_ADDRESS);
  console.log("\n📢 Event Detected:");
  console.log("👮 Agent:", agent);
  console.log("📝 Summary:", summary);
  console.log("🧾 IPFS Hash:", ipfsHash);
  console.log("⏰ Timestamp:", new Date(Number(timestamp) * 1000).toLocaleString());

  try {
    const response = await axios.get(`https://w3s.link/ipfs/${ipfsHash}`);
    console.log("📦 IPFS Log Data:\n", response.data);
  } catch (err) {
    console.error("❌ Error fetching IPFS data:", err.message);
  }
});
