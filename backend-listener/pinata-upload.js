// pinata-upload.js
import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import dotenv from "dotenv";
dotenv.config();

const uploadToPinata = async () => {
  const form = new FormData();
  const fileStream = fs.createReadStream("agent-log.json");

  form.append("file", fileStream);

  const metadata = JSON.stringify({
    name: "Agent Log",
  });

  const options = JSON.stringify({
    cidVersion: 1,
  });

  form.append("pinataMetadata", metadata);
  form.append("pinataOptions", options);

  try {
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
        maxBodyLength: Infinity,
      }
    );

    console.log("✅ File uploaded successfully!");
    console.log("📦 IPFS CID:", response.data.IpfsHash);
  } catch (error) {
    console.error("❌ Upload failed:", error.response?.data || error.message);
  }
};

uploadToPinata();
