import { google } from "@ai-sdk/google"
import { groq } from "@ai-sdk/groq"

const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite"
const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b"

export class LLMConfigurationError extends Error {
  constructor(message) {
    super(message)
    this.name = "LLMConfigurationError"
  }
}

export function getModelConfig(task, provider = process.env.LLM_PROVIDER || "1") {
  if (provider === "1") {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()) {
      throw new LLMConfigurationError("GOOGLE_GENERATIVE_AI_API_KEY가 설정되지 않았습니다.")
    }

    return {
      model: google(process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL),
    }
  }

  if (provider === "2") {
    if (!process.env.GROQ_API_KEY?.trim()) {
      throw new LLMConfigurationError("GROQ_API_KEY가 설정되지 않았습니다.")
    }

    const modelName = process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL
    return {
      model: groq(modelName),
      // These settings are supported by the default GPT-OSS model. Leave
      // overrides unset for custom Groq models with unknown capabilities.
      ...(modelName === DEFAULT_GROQ_MODEL
        ? {
            temperature: task === "summary" ? 0.2 : 0.35,
            providerOptions: { groq: { reasoningEffort: "low" } },
          }
        : {}),
    }
  }

  throw new LLMConfigurationError("LLM_PROVIDER는 1(Gemini) 또는 2(Groq)여야 합니다.")
}
