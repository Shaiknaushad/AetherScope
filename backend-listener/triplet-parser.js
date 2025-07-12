import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export async function extractTriplets(logText) {
  const prompt = `Extract meaningful (subject, predicate, object) triplets from this log entry:

"${logText}"

Return them as a JSON array like this:
[["subject", "predicate", "object"], ...]

Only return valid JSON, no additional text.`;

  try {
    // Debug: Check if API key is loaded
    if (!process.env.COHERE_API_KEY) {
      console.error("❌ COHERE_API_KEY not found in environment variables");
      return [];
    }

    const response = await axios.post(
      "https://api.cohere.ai/v1/generate",
      {
        model: "command",
        prompt: prompt,
        max_tokens: 300,
        temperature: 0.3,
        k: 0,
        stop_sequences: ["--END--"]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.COHERE_API_KEY}`,
        },
      }
    );

    const rawText = response.data.generations?.[0]?.text?.trim();
    
    if (!rawText) {
      console.error("❌ No text generated from Cohere API");
      return [];
    }

    try {
      const parsed = JSON.parse(rawText);
      return Array.isArray(parsed) ? parsed : [];
    } catch (parseErr) {
      console.error("❌ Could not parse AI response as JSON:", rawText);
      // Try to extract JSON from the response if it's wrapped in text
      const jsonMatch = rawText.match(/\[.*\]/s);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return Array.isArray(parsed) ? parsed : [];
        } catch (retryErr) {
          console.error("❌ Retry parsing also failed");
        }
      }
      return [];
    }
  } catch (err) {
    console.error("❌ Cohere API request failed:", err.message);
    if (err.response?.status === 401) {
      console.error("💡 Check your COHERE_API_KEY in the .env file");
      console.error("💡 Make sure the key is valid and active in your Cohere dashboard");
    }
    return [];
  }
}