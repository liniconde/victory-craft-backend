"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFootballPrompt = void 0;
/**
 * Generates the AI prompt for analyzing a football match video.
 * @param duration - The duration of the video/match.
 * @returns The structured prompt for Gemini.
 */
const getFootballPrompt = (duration) => {
    return `
    You are an expert football analyst. 
    Analyze this football match video which has a duration of approximately ${duration} seconds.
    
    Please provide the following statistics for the match:
    1. Pass count (for each team)
    2. Shot count (for each team)
    3. Goal count (for each team)
    4. A brief summary of the key play or overall match flow.

    IMPORTANT: You must output PURE JSON. Do not include markdown formatting (like \`\`\`json).
    
    The JSON structure must be exactly as follows:
    {
      "sportType": "football",
      "teams": [
        {
          "teamName": "Team A", 
          "stats": {
            "passes": 0,
            "shots": 0,
            "goals": 0
          }
        },
        {
          "teamName": "Team B",
          "stats": {
            "passes": 0,
            "shots": 0,
            "goals": 0
          }
        }
      ],
      "summary": "Brief summary of the match..."
    }
    
    If you cannot distinguish team names, use "Team 1" and "Team 2" (or "White", "Blue" based on jersey color).
  `;
};
exports.getFootballPrompt = getFootballPrompt;
//# sourceMappingURL=football.js.map