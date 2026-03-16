import { GoogleGenerativeAI } from "@google/generative-ai";
import { AgentPlannerProvider } from "../../domain/AgentPlannerProvider";
import { AgentPlannerProviderInput, AgentPlannerProviderOutput } from "../../domain/types";

type GeminiProviderConfig = {
  apiKey: string;
  model: string;
  temperature: number;
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  if (!timeoutMs || timeoutMs <= 0) {
    return promise;
  }

  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
};

export class GeminiAgentPlannerProvider implements AgentPlannerProvider {
  private readonly client: GoogleGenerativeAI;

  private readonly config: GeminiProviderConfig;

  constructor(config?: Partial<GeminiProviderConfig>) {
    const apiKey = config?.apiKey || process.env.GEMINI_API_KEY || "";
    const model = config?.model || process.env.AGENT_PLANNER_GEMINI_MODEL || "gemini-2.5-flash";
    const temperature = Number(config?.temperature ?? process.env.AGENT_PLANNER_GEMINI_TEMPERATURE ?? 0);

    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY for agent planner provider");
    }

    this.config = {
      apiKey,
      model,
      temperature,
    };
    this.client = new GoogleGenerativeAI(this.config.apiKey);
  }

  async plan(input: AgentPlannerProviderInput): Promise<AgentPlannerProviderOutput> {
    const model = this.client.getGenerativeModel({
      model: this.config.model,
      generationConfig: {
        temperature: this.config.temperature,
        responseMimeType: "application/json",
      },
    });

    const prompt = `${input.systemPrompt}\n\nUser request:\n${input.userPrompt}`;

    const result = await withTimeout(
      model.generateContent([{ text: prompt }]),
      input.timeoutMs || 0,
    );

    const response = await result.response;

    return {
      provider: "gemini",
      model: this.config.model,
      text: response.text(),
    };
  }
}
