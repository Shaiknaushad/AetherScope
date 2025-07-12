import dotenv from "dotenv";
import { JsonRpcProvider, Contract } from "ethers";
import fs from "fs";
import axios from "axios";
import { extractTriplets } from "../../backend-listener/triplet-parser.js";
import supabase from "../../backend-listener/supabaseClient.js";

dotenv.config();

// Validate environment variables
if (!process.env.RPC_URL || !process.env.CONTRACT_ADDRESS) {
  console.error("❌ Missing required environment variables: RPC_URL or CONTRACT_ADDRESS");
  process.exit(1);
}

// Check if ABI file exists
if (!fs.existsSync("./AetherScopeLoggerABI.json")) {
  console.error("❌ ABI file not found: ./AetherScopeLoggerABI.json");
  process.exit(1);
}

const abi = JSON.parse(fs.readFileSync("./AetherScopeLoggerABI.json", "utf8"));
const provider = new JsonRpcProvider(process.env.RPC_URL);
const contract = new Contract(process.env.CONTRACT_ADDRESS, abi, provider);

console.log(`👂 Listening for ActionReported events on: ${process.env.CONTRACT_ADDRESS}`);

// Add connection verification
provider.getNetwork().then(network => {
  console.log(`🌐 Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
}).catch(err => {
  console.error("❌ Failed to connect to network:", err.message);
  process.exit(1);
});

contract.on("ActionReported", async (agent, summary, ipfsHash, timestamp) => {
  try {
    console.log("\n📢 Event Detected:");
    console.log("👮 Agent:", agent);
    console.log("📝 Summary:", summary);
    console.log("🧾 IPFS Hash:", ipfsHash);
    console.log("⏰ Timestamp:", new Date(Number(timestamp) * 1000).toLocaleString());

    try {
      // Add timeout to IPFS request
      const response = await axios.get(`https://w3s.link/ipfs/${ipfsHash}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'AetherScope-Listener/1.0'
        }
      });

      const logText = typeof response.data === "object" ? JSON.stringify(response.data) : response.data;

      console.log("📦 IPFS Log Data:\n", logText);

      if (logText && logText.trim().length > 0) {
        const triplets = await extractTriplets(logText);
        console.log("📚 Triplets Extracted:\n", triplets);

        // Validate triplets format
        if (!Array.isArray(triplets)) {
          console.error("❌ Triplets is not an array:", typeof triplets);
          return;
        }

        let allTriplets = [];
        if (fs.existsSync("triplets.json")) {
          try {
            const existingData = fs.readFileSync("triplets.json", "utf8");
            allTriplets = JSON.parse(existingData);
          } catch (parseErr) {
            console.warn("⚠️  Could not parse existing triplets.json, starting fresh");
            allTriplets = [];
          }
        }

        const newEntry = {
          timestamp: new Date().toISOString(),
          agent: agent,
          summary: summary,
          ipfsHash: ipfsHash,
          eventTimestamp: new Date(Number(timestamp) * 1000).toISOString(),
          triplets: triplets
        };

        allTriplets.push(newEntry);
        fs.writeFileSync("triplets.json", JSON.stringify(allTriplets, null, 2));
        console.log("📝 Triplets saved to triplets.json");

        // ✅ Fixed Supabase insert with proper error handling
        try {
          // Ensure triplets is properly formatted for JSONB
          let formattedTriplets = [];
          if (Array.isArray(triplets)) {
            formattedTriplets = triplets.map(triplet => {
              if (Array.isArray(triplet) && triplet.length >= 3) {
                return {
                  subject: triplet[0],
                  predicate: triplet[1],
                  object: triplet[2]
                };
              }
              // If it's already an object, return as-is
              if (typeof triplet === 'object' && triplet !== null) {
                return triplet;
              }
              // Fallback for malformed triplets
              return {
                subject: "unknown",
                predicate: "unknown",
                object: String(triplet)
              };
            });
          }

          const insertData = {
            timestamp: newEntry.timestamp,
            agent: newEntry.agent,
            summary: newEntry.summary,
            ipfs_hash: newEntry.ipfsHash,
            event_timestamp: newEntry.eventTimestamp,
            triplets: formattedTriplets
          };

          console.log("🔄 Inserting data:", JSON.stringify(insertData, null, 2));

          const { data, error } = await supabase
            .from("Triplets")
            .insert([insertData])
            .select();

          if (error) {
            console.error("❌ Supabase insert error:");
            console.error("   Message:", error.message || "Unknown error");
            console.error("   Code:", error.code || "No code");
            console.error("   Details:", error.details || "No details");
            console.error("   Hint:", error.hint || "No hint");
            
            // Check for specific common issues
            if (error.code === '23505') {
              console.error("💡 Duplicate key error - record may already exist");
            } else if (error.code === '42601') {
              console.error("💡 Syntax error - check data formatting");
            } else if (error.code === '22P02') {
              console.error("💡 Invalid input for UUID/timestamp format");
            } else if (error.message && error.message.includes('violates not-null constraint')) {
              console.error("💡 Missing required field");
            }
          } else {
            console.log("📤 Triplets successfully saved to Supabase");
            if (data && data.length > 0) {
              console.log("   Inserted record ID:", data[0].id || "N/A");
            }
          }
        } catch (supabaseError) {
          console.error("❌ Supabase connection error:", supabaseError.message || "Unknown connection error");
          
          // Better error handling for undefined properties
          if (supabaseError.stack) {
            console.error("   Stack:", supabaseError.stack);
          }
          
          // Handle specific connection issues
          if (supabaseError.message) {
            if (supabaseError.message.includes('fetch')) {
              console.error("💡 Network error - check your internet connection and Supabase URL");
            } else if (supabaseError.message.includes('unauthorized')) {
              console.error("💡 Authentication error - check your Supabase API key");
            }
          }
        }

      } else {
        console.warn("⚠️  No valid log data to extract triplets from");
      }
    } catch (err) {
      console.error("❌ Error fetching IPFS data or parsing triplets:", err.message || "Unknown error");
      if (err.code === "ECONNABORTED") {
        console.error("💡 IPFS request timed out. The content might be unavailable.");
      } else if (err.response?.status === 404) {
        console.error("💡 IPFS content not found. Hash might be invalid or content not pinned.");
      } else if (err.response?.status >= 500) {
        console.error("💡 IPFS gateway server error. Try again later.");
      }
    }
  } catch (eventError) {
    console.error("❌ Error processing event:", eventError.message || "Unknown event error");
    if (eventError.stack) {
      console.error("Stack:", eventError.stack);
    }
  }
});

provider.on("error", (error) => {
  console.error("❌ Provider error:", error.message || "Unknown provider error");
});

process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down listener...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down listener...");
  process.exit(0);
});

console.log("✅ Listener is ready and waiting for events...");
console.log("Press Ctrl+C to stop the listener");