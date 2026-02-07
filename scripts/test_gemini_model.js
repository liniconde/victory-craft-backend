const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Try to see if this fails fast
    console.log("Checking available models...");
    // There isn't a direct listModels method on the client instance in some versions, 
    // but let's try to infer or at least print the error details better.
    // Actually, there is no direct client.listModels() in the node SDK readily available like in python?
    // Wait, the SDK wrapping might handle it differently.
    // Let's trying a simple generation to see if we can get more info or just use the system instruction to list.
    
    // Better yet, let's use the API directly with fetch or curl if SDK is obscure, 
    // but the error message said "Call ListModels" which implies the capability exists.
    // In node SDK, it might be tricky. Let's try to assume 'gemini-1.5-flash-001' or similar.
    
    // Actually, to list models in Node.js SDK:
    // It is often unavailable directly in the high-level `GoogleGenerativeAI` class.
    
    // Let's try 'gemini-1.5-flash-001' as a common alternative.
    // Also `gemini-pro` just to verify connectivity.
    
    const modelName = "gemini-1.5-flash-001";
    console.log(`Testing model: ${modelName}`);
    const modelInstance = genAI.getGenerativeModel({ model: modelName });
    const result = await modelInstance.generateContent("Hello");
    console.log("Success with", modelName, result.response.text());
  } catch (error) {
    console.error("Error:", error.message);
  }
}

listModels();
