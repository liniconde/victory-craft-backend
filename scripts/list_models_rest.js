const https = require('https');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("No GEMINI_API_KEY found in environment variables.");
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      if (res.statusCode !== 200) {
        console.error(`Error: Status Code ${res.statusCode}`);
        console.error(data);
        return;
      }

      const response = JSON.parse(data);
      if (response.models) {
        console.log("Available Models:");
        response.models.forEach(model => {
          // Filter for flash models or just print all names
          console.log(`- ${model.name} (${model.version}) [Supports: ${model.supportedGenerationMethods?.join(', ')}]`);
        });
      } else {
        console.log("No models found or unexpected format:", response);
      }
    } catch (e) {
      console.error("Error parsing response:", e.message);
    }
  });

}).on('error', (e) => {
  console.error("Request error:", e.message);
});
